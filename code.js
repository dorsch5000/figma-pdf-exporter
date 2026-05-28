"use strict";
figma.showUI(__html__, { width: 420, height: 640 });
// ==========================================================================
// Initialization
// ==========================================================================
async function init() {
    // Load saved quality settings
    let savedSettings = null;
    try {
        savedSettings = await figma.clientStorage.getAsync('pdf-export-settings');
    }
    catch (_) { /* ignore */ }
    // Scan current page for top-level frames
    const frames = [];
    for (const child of figma.currentPage.children) {
        if (child.type === 'FRAME') {
            frames.push({
                id: child.id,
                name: child.name,
                width: child.width,
                height: child.height,
                x: child.x,
                y: child.y,
            });
        }
    }
    // Sort by position: top-to-bottom (row tolerance 100px), then left-to-right
    frames.sort((a, b) => {
        const rowA = Math.round(a.y / 100);
        const rowB = Math.round(b.y / 100);
        if (rowA !== rowB)
            return rowA - rowB;
        return a.x - b.x;
    });
    // Collect IDs of frames currently selected on canvas
    const selectedIds = figma.currentPage.selection
        .filter(node => node.type === 'FRAME' && node.parent === figma.currentPage)
        .map(node => node.id);
    // Send frame list and settings to UI
    figma.ui.postMessage({
        type: 'init',
        frames: frames,
        selectedIds: selectedIds,
        savedSettings: savedSettings || null,
        fileName: figma.root.name,
    });
    // Generate thumbnails sequentially (avoid memory pressure)
    for (const frame of frames) {
        try {
            const node = figma.getNodeById(frame.id);
            if (node && node.type === 'FRAME') {
                const bytes = await node.exportAsync({
                    format: 'PNG',
                    constraint: { type: 'WIDTH', value: 200 },
                });
                figma.ui.postMessage({
                    type: 'thumbnail',
                    frameId: frame.id,
                    data: figma.base64Encode(bytes),
                });
            }
        }
        catch (err) {
            console.warn('Could not generate thumbnail for ' + frame.name + ':', err);
        }
    }
}
init();
// ==========================================================================
// Message handler
// ==========================================================================
figma.ui.onmessage = async (msg) => {
    // Export a single frame at requested scale
    if (msg.type === 'export-frame') {
        const frameId = msg.frameId;
        const scale = msg.scale || 2;
        try {
            const node = figma.getNodeById(frameId);
            if (!node || node.type !== 'FRAME') {
                figma.ui.postMessage({
                    type: 'export-error',
                    frameId: frameId,
                    message: 'Frame not found: ' + frameId,
                });
                return;
            }
            const frame = node;
            const bytes = await frame.exportAsync({
                format: 'PNG',
                constraint: { type: 'SCALE', value: scale },
            });
            figma.ui.postMessage({
                type: 'frame-exported',
                frameId: frameId,
                data: figma.base64Encode(bytes),
                width: frame.width,
                height: frame.height,
                index: msg.index,
                total: msg.total,
            });
        }
        catch (err) {
            figma.ui.postMessage({
                type: 'export-error',
                frameId: frameId,
                message: err.message || String(err),
            });
        }
    }
    // Save quality settings
    if (msg.type === 'save-settings') {
        try {
            await figma.clientStorage.setAsync('pdf-export-settings', msg.settings);
        }
        catch (_) { /* ignore */ }
    }
    // Refresh frame list (user switched pages)
    if (msg.type === 'refresh-frames') {
        await init();
    }
    // Close plugin
    if (msg.type === 'close') {
        figma.closePlugin();
    }
};
