
import { statusMessage, messageType, messageStartTime, displayStatusMessage, editorBorderTopColor, editorBorderBottomColor, editorBorderLeftColor, editorBorderRightColor, statusBarBorderTopColor, statusBarBorderBottomColor, statusBarBorderLeftColor, statusBarBorderRightColor } from './styling.mjs';
import { color, gradient, strip, box, line, title } from './adclours.mjs';
import path from 'path';
import { saveFile } from './fileOperations.mjs'; // Import saveFile

// --- Global Variables (Editor State) ---
export let fileContent = ['']; // Start with an empty line for editing
export let currentFilePath = { value: 'untitled.txt' }; // Use an object to pass by reference
export let originalUserProvidedPath = { value: '' }; // Store the original path provided by the user
export let currentLineIndex = 0; // Current line being edited/viewed
export let currentColumnIndex = 0; // Current column in the line
export let terminalHeight = process.stdout.rows;
export let terminalWidth = process.stdout.columns;
export let editorScrollTop = 0; // For vertical scrolling

// Custom cursor blinking
let cursorVisible = true;
let blinkingEnabled = true; // New: Control if blinking is enabled
let blinkInterval = null; // To store the interval ID

// Function to start blinking
export function startBlinking() {
    if (blinkInterval) clearInterval(blinkInterval); // Clear any existing interval
    if (blinkingEnabled) { // Only start blinking if enabled
        blinkInterval = setInterval(() => {
            cursorVisible = !cursorVisible;
            drawEditor(); // Redraw the editor to show/hide cursor
        }, 500); // Blink every 500ms
    } else {
        cursorVisible = true; // Ensure cursor is always visible if blinking is disabled
        drawEditor(); // Redraw to show cursor
    }
}

// Function to stop blinking (e.g., on exit)
function stopBlinking() {
    if (blinkInterval) {
        clearInterval(blinkInterval);
        blinkInterval = null;
    }
}

// --- Terminal Control Functions ---
function clearScreen() {
    process.stdout.write('\x1Bc'); // Clear screen and move cursor to home
}

function moveCursor(row, col) {
    process.stdout.write(`\x1B[${row};${col}H`);
}

function hideCursor() {
    process.stdout.write('\x1B[?25l');
}

function showCursor() {
    process.stdout.write('\x1B[?25h');
}

// Helper to get visual width of a string (approximation for terminal display)
function getVisualWidth(str) {
    let width = 0;
    for (let i = 0; i < str.length; i++) {
        const charCode = str.charCodeAt(i);
        // Basic check for common full-width characters (e.g., CJK, some symbols)
        if (charCode >= 0x1100 && (charCode <= 0x115F || // Hangul Jamo
                                   charCode == 0x2329 || charCode == 0x232A || // < >
                                   (charCode >= 0x2E80 && charCode <= 0xA4C6 && charCode != 0x303F) || // CJK, etc.
                                   (charCode >= 0xAC00 && charCode <= 0xD7A3) || // Hangul Syllables
                                   (charCode >= 0xF900 && charCode <= 0xFAFF) || // CJK Compatibility Ideographs
                                   (charCode >= 0xFE10 && charCode <= 0xFE19) || // Vertical forms
                                   (charCode >= 0xFE30 && charCode <= 0xFE6B) || // CJK Compatibility Forms
                                   (charCode >= 0xFF01 && charCode <= 0xFF60) || // Full-width ASCII, half-width Katakana
                                   (charCode >= 0xFFE0 && charCode <= 0xFFE6))) { // Full-width symbols
            width += 2;
        } else {
            width += 1;
        }
    }
    return width;
}

// --- Editor Drawing ---
export function drawEditor() {
    clearScreen();
    hideCursor();

    // Display title at the very top
    const editorTitle = `SmartEdit - ${path.basename(currentFilePath.value)}`;
    process.stdout.write(title(gradient(editorTitle, '#8A2BE2', '#FF1493'), '', terminalWidth) + '\n'); // Purple to DeepPink gradient

    const editorHeight = terminalHeight - 7; // Title + Border + line separator + status bar
    const editorWidth = terminalWidth - 2; // Border

    // Draw gradient border
    const borderChars = '─│┌┐└┘'; // Horizontal, Vertical, Top-Left, Top-Right, Bottom-Left, Bottom-Right

    // Top border (below title)
    // Top border with single color
    let topBorder = color.hex(editorBorderTopColor)(borderChars[2]); // Top-left corner
    for (let i = 0; i < editorWidth; i++) {
        topBorder += color.hex(editorBorderTopColor)(borderChars[0]);
    }
    topBorder += color.hex(editorBorderTopColor)(borderChars[3]); // Top-right corner
    process.stdout.write(topBorder + '\n');

    // Content area with vertical borders
    const startLine = editorScrollTop;
    const endLine = Math.min(fileContent.length, editorScrollTop + editorHeight);

    for (let i = 0; i < editorHeight; i++) {
        const lineNumber = startLine + i;
        const lineToDisplay = fileContent[lineNumber] || '';
        let displayedLineContent = lineToDisplay; // Content of the line without cursor yet

        const lineNumberStr = String(lineNumber + 1).padStart(3, ' ');
        let linePrefix;

        // Apply gradient to line numbers
        const gradientStartColor = '#808080';   // Gray
        const gradientEndColor = '#C0C0C0';     // Light Gray
        const currentLineGradientStart = '#00FFFF'; // Cyan
        const currentLineGradientEnd = '#FF00FF';   // Magenta

        if (lineNumber === currentLineIndex) {
            linePrefix = gradient(lineNumberStr + ' ', currentLineGradientStart, currentLineGradientEnd);
        } else {
            linePrefix = gradient(lineNumberStr + ' ', gradientStartColor, gradientEndColor);
        }

        const leftBorderChar = color.hex(editorBorderLeftColor)(borderChars[1]);
        const rightBorderChar = color.hex(editorBorderRightColor)(borderChars[1]);

        const contentWidth = editorWidth - getVisualWidth(strip(linePrefix));

        // Calculate visual position of cursor
        const cursorVisualCol = getVisualWidth(displayedLineContent.substring(0, currentColumnIndex));

        // Construct the line to display, inserting the cursor if on current line and visible
        let finalDisplayedLine = '';
        if (lineNumber === currentLineIndex && cursorVisible) {
            // Insert cursor character
            const beforeCursor = displayedLineContent.substring(0, currentColumnIndex);
            const afterCursor = displayedLineContent.substring(currentColumnIndex);
            finalDisplayedLine = beforeCursor + '|' + afterCursor;
        } else {
            finalDisplayedLine = displayedLineContent;
        }

        // Truncate finalDisplayedLine based on visual width
        let visualDisplayedLine = '';
        let currentVisualWidth = 0;
        for (let charIndex = 0; charIndex < finalDisplayedLine.length; charIndex++) {
            const char = finalDisplayedLine[charIndex];
            const charWidth = getVisualWidth(char);
            if (currentVisualWidth + charWidth <= contentWidth) {
                visualDisplayedLine += char;
                currentVisualWidth += charWidth;
            } else {
                break;
            }
        }
        const paddingNeeded = contentWidth - currentVisualWidth;
        const paddingString = ' '.repeat(Math.max(0, paddingNeeded));

        process.stdout.write(`${leftBorderChar}${linePrefix}${visualDisplayedLine}${paddingString}${rightBorderChar}\n`);
    }

    // Bottom border
    // Bottom border with single color
    let bottomBorder = color.hex(editorBorderBottomColor)(borderChars[4]); // Bottom-left corner
    for (let i = 0; i < editorWidth; i++) {
        bottomBorder += color.hex(editorBorderBottomColor)(borderChars[0]);
    }
    bottomBorder += color.hex(editorBorderBottomColor)(borderChars[5]); // Bottom-right corner
    process.stdout.write(bottomBorder + '\n');

    // Separator line before status bar
    process.stdout.write(gradient(line(terminalWidth, '═'.repeat(3)), editorBorderBottomColor, statusBarBorderTopColor) + '\n'); // Add a separator line

    // Status bar
    // Status bar
    let statusBarGradientStart = '#007bff'; // Default blue
    let statusBarGradientEnd = '#00c8ff';   // Lighter blue

    if (statusMessage) {
        switch (messageType) {
            case 'success':
                statusBarGradientStart = '#28a745'; // Green
                statusBarGradientEnd = '#218838';   // Darker green
                break;
            case 'error':
                statusBarGradientStart = '#dc3545'; // Red
                statusBarGradientEnd = '#c82333';   // Darker red
                break;
            case 'warn':
                statusBarGradientStart = '#ffc107'; // Yellow
                statusBarGradientEnd = '#e0a800';   // Darker yellow
                break;
            case 'info':
            default:
                statusBarGradientStart = '#007bff'; // Blue
                statusBarGradientEnd = '#00c8ff';   // Lighter blue
                break;
        }
    }

    const mainStatusText = `${color.bold.rgb(255, 255, 0)(path.basename(currentFilePath.value))} | ${color.rgb(0, 255, 0)(`Line: ${currentLineIndex + 1}/${fileContent.length} | Col: ${currentColumnIndex + 1}`)} | ${color.rgb(255, 0, 255)('Ctrl+S Save | Ctrl+C Exit')}`;
    const messageText = statusMessage ? ` ${statusMessage} ` : '';

    let contentToPad;
    let contentVisualWidth;

    if (statusMessage) {
        const elapsedTime = Date.now() - messageStartTime;
        contentToPad = messageText; // messageText is already stripped
        contentVisualWidth = getVisualWidth(contentToPad);
        if (elapsedTime < 1000) {
            // Removed bold and underline styling to prevent raw ASCII output on some terminals.
            // contentToPad = color.bold.underline(contentToPad); // Apply styling here
        }
    } else {
        contentToPad = strip(mainStatusText); // Strip ANSI codes from mainStatusText
        contentVisualWidth = getVisualWidth(contentToPad);
    }

    const padding = 1; // Padding for the status bar box
    const innerWidth = terminalWidth - 2 - (padding * 2); // Account for outer borders and inner padding
    const paddedContent = gradient(contentToPad + ' '.repeat(Math.max(0, innerWidth - contentVisualWidth)), statusBarGradientStart, statusBarGradientEnd);

    // Box characters for status bar (using double line style)
    const statusBarBoxChars = ['╔', '═', '╗', '║', '╚', '╝'];

    // Top border of status bar box
    let statusBarTopBorder = color.hex(statusBarBorderTopColor)(statusBarBoxChars[0]); // Top-left
    for (let i = 0; i < innerWidth + (padding * 2); i++) {
        statusBarTopBorder += color.hex(statusBarBorderTopColor)(statusBarBoxChars[1]);
    }
    statusBarTopBorder += color.hex(statusBarBorderTopColor)(statusBarBoxChars[2]); // Top-right
    process.stdout.write(statusBarTopBorder + '\n');

    // Content line of status bar box
    const statusBarLeftBorder = color.hex(statusBarBorderLeftColor)(statusBarBoxChars[3]);
    const statusBarRightBorder = color.hex(statusBarBorderRightColor)(statusBarBoxChars[3]);
    const innerPadding = ' '.repeat(padding);

    process.stdout.write(`${statusBarLeftBorder}${innerPadding}${paddedContent}${innerPadding}${statusBarRightBorder}\n`);

    // Bottom border of status bar box
    let statusBarBottomBorder = color.hex(statusBarBorderBottomColor)(statusBarBoxChars[4]); // Bottom-left
    for (let i = 0; i < innerWidth + (padding * 2); i++) {
        statusBarBottomBorder += color.hex(statusBarBorderBottomColor)(statusBarBoxChars[1]);
    }
    statusBarBottomBorder += color.hex(statusBarBorderBottomColor)(statusBarBoxChars[5]); // Bottom-right
    process.stdout.write(statusBarBottomBorder + '\n');

    

    // Position cursor for editing
    moveCursor(currentLineIndex - editorScrollTop + 1, getVisualWidth(strip(String(currentLineIndex + 1).padStart(3, ' ') + ' ')) + 1 + getVisualWidth(fileContent[currentLineIndex].substring(0, currentColumnIndex)));
}

// --- Editor Logic ---
export function updateTerminalSize() {
    terminalHeight = process.stdout.rows;
    terminalWidth = process.stdout.columns;
    drawEditor();
}

export function handleKeypress(key) {
    const currentLine = fileContent[currentLineIndex];

    // Handle special keys
    if (key === '\x1b[A') { // Up arrow
        if (currentLineIndex > 0) {
            currentLineIndex--;
            currentColumnIndex = Math.min(currentColumnIndex, fileContent[currentLineIndex].length);
            if (currentLineIndex < editorScrollTop) {
                editorScrollTop--;
            }
        }
    } else if (key === '\x1b[B') { // Down arrow
        if (currentLineIndex < fileContent.length - 1) {
            currentLineIndex++;
            currentColumnIndex = Math.min(currentColumnIndex, fileContent[currentLineIndex].length);
            if (currentLineIndex >= editorScrollTop + (terminalHeight - 3)) {
                editorScrollTop++;
            }
        }
    } else if (key === '\x1b[C') { // Right arrow
        if (currentColumnIndex < currentLine.length) {
            currentColumnIndex++;
        }
    } else if (key === '\x1b[D') { // Left arrow
        if (currentColumnIndex > 0) {
            currentColumnIndex--;
        }
    } else if (key === '\x03') { // Ctrl+C
        displayStatusMessage('Exiting SmartEdit. Goodbye!', 'info');
        stopBlinking();
        showCursor();
        clearScreen();
        process.exit(0);
    } else if (key === '\x13') { // Ctrl+S
        displayStatusMessage('Saving...', 'info');
        saveFile();
        return; // Don't redraw immediately, saveFile will redraw
    } else if (key === '\x12') { // Ctrl+R
        blinkingEnabled = !blinkingEnabled;
        if (!blinkingEnabled) {
            cursorVisible = true; // Ensure cursor is visible when blinking is disabled
            clearInterval(blinkInterval); // Stop blinking immediately
            blinkInterval = null;
        } else {
            startBlinking(); // Restart blinking
        }
        drawEditor();
    } else if (key === '\r') { // Enter key
        const newLine = currentLine.substring(currentColumnIndex);
        fileContent[currentLineIndex] = currentLine.substring(0, currentColumnIndex);
        fileContent.splice(currentLineIndex + 1, 0, newLine);
        currentLineIndex++;
        currentColumnIndex = 0;
        if (currentLineIndex >= editorScrollTop + (terminalHeight - 3)) {
            editorScrollTop++;
        }
    } else if (key === '\x7f') { // Backspace
        const currentLine = fileContent[currentLineIndex];
        if (currentColumnIndex > 0) {
            const chars = [...currentLine]; // Spread operator to handle Unicode characters better
            let visualPos = 0;
            let charIndexToDelete = -1;

            for (let i = 0; i < chars.length; i++) {
                const char = chars[i];
                const charWidth = getVisualWidth(char);
                if (visualPos + charWidth > currentColumnIndex - 1) {
                    charIndexToDelete = i;
                    break;
                }
                visualPos += charWidth;
            }

            if (charIndexToDelete !== -1) {
                chars.splice(charIndexToDelete, 1);
                fileContent[currentLineIndex] = chars.join('');
                currentColumnIndex--;
            }
        } else if (currentLineIndex > 0) {
            const prevLine = fileContent[currentLineIndex - 1];
            fileContent[currentLineIndex - 1] += currentLine;
            fileContent.splice(currentLineIndex, 1);
            currentLineIndex--;
            currentColumnIndex = getVisualWidth(prevLine); // Use getVisualWidth for consistency
        }
    } else { // Handle printable characters and pasted content (including multi-line)
        const lines = key.split(/\r?\n/); // Split by \n or \r\n
        // Insert the first part into the current line
        const currentLine = fileContent[currentLineIndex];
        fileContent[currentLineIndex] = currentLine.substring(0, currentColumnIndex) + lines[0] + currentLine.substring(currentColumnIndex);
        currentColumnIndex += lines[0].length; // Cursor moves to the end of the inserted text

        // Insert subsequent lines
        for (let i = 1; i < lines.length; i++) {
            fileContent.splice(currentLineIndex + 1, 0, lines[i]);
            currentLineIndex++;
            currentColumnIndex = getVisualWidth(lines[i]); // Cursor moves to the end of the new line
        }

        // Adjust scroll if necessary
        if (currentLineIndex >= editorScrollTop + (terminalHeight - 3)) {
            editorScrollTop = currentLineIndex - (terminalHeight - 4); // Adjust to show the new line
        }
    }

    drawEditor();
}
