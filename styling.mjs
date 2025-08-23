import { color, gradient, strip } from './adclours.mjs';

export { color, gradient, strip };

export let statusMessage = '';
export let messageType = 'info'; // 'info', 'success', 'warn', 'error'
export let messageStartTime = 0; // Timestamp when message was displayed
let messageTimer = null;

export function displayStatusMessage(message, type = 'info') {
    statusMessage = strip(message); // Ensure message is stripped of ANSI codes when stored
    messageType = type;
    messageStartTime = Date.now(); // Set start time

    if (messageTimer) {
        clearTimeout(messageTimer);
    }

    messageTimer = setTimeout(() => {
        statusMessage = '';
        messageType = 'info';
        messageStartTime = 0; // Reset start time
        // drawEditor needs to be called here, but it creates a circular dependency.
        // The main editor loop will call drawEditor, so we rely on that.
        // For immediate redraw, we'll call it from the caller.
    }, 3000); // Message disappears after 3 seconds
}

// Border colors for gradient (blue tones)
// Single colors for main editor borders
export const editorBorderTopColor = '#FF00FF'; // Magenta
export const editorBorderBottomColor = '#FFFF00'; // Yellow
export const editorBorderLeftColor = '#00FF00'; // Green
export const editorBorderRightColor = '#FFA500'; // Orange

// Single colors for status bar box borders
export const statusBarBorderTopColor = '#8A2BE2'; // BlueViolet
export const statusBarBorderBottomColor = '#00CED1'; // DarkTurquoise
export const statusBarBorderLeftColor = '#3CB371'; // MediumSeaGreen
export const statusBarBorderRightColor = '#FF69B4'; // HotPink
