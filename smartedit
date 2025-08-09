#!/usr/bin/env node
// This shebang line allows the script to be executed directly if made executable.

// Required Node.js built-in modules
const readline = require('readline'); // For reading input and managing prompts
const fs = require('fs');             // For file system operations (read/write files)
const path = require('path');           // For handling file paths

// --- ANSI Color Codes ---
// These constants make it easier to apply and manage terminal colors.
const Colors = {
    Reset: "\x1b[0m",
    Bright: "\x1b[1m",
    Dim: "\x1b[2m",
    Underscore: "\x1b[4m",
    Blink: "\x1b[5m",
    Reverse: "\x1b[7m",
    Hidden: "\x1b[8m",

    FgBlack: "\x1b[30m",
    FgRed: "\x1b[31m",
    FgGreen: "\x1b[32m",
    FgYellow: "\x1b[33m",
    FgBlue: "\x1b[34m",
    FgMagenta: "\x1b[35m",
    FgCyan: "\x1b[36m",
    FgWhite: "\x1b[37m",
    FgGray: "\x1b[90m", // Lighter black/dark gray

    BgBlack: "\x1b[40m",
    BgRed: "\x1b[41m",
    BgGreen: "\x1b[42m",
    BgYellow: "\x1b[43m",
    BgBlue: "\x1b[44m", // Using this for the dominant blue theme
    BgMagenta: "\x1b[45m",
    BgCyan: "\x1b[46m",
    BgWhite: "\x1b[47m",
    BgGray: "\x1b[100m", // Lighter black/dark gray background
};

// --- Global State Variables ---
let lines = [''];                // Stores the content as an array of lines (The main content state)
let unsavedChanges = false;      // Flag to track if there are unsaved changes
let currentFilename = 'untitled.txt'; // Default filename for new content
let lastSaveContent = '';        // Stores content state at the last successful save

// History for Undo/Redo functionality
let history = [['']];            // Stores snapshots of content for undo/redo
let historyIndex = 0;            // Current position in the history array
const MAX_HISTORY_SIZE = 100;    // Limit history size to prevent excessive memory usage

// Cursor position
let cursorY = 0; // Current logical line index (0-based)
let cursorX = 0; // Current logical column index (0-based) within cursorY line

// Viewport scrolling
let viewOffsetY = 0; // Top-most logical line displayed on screen (0-based)

// Prompt state
let isPromptActive = false; // Flag to indicate if a prompt is active
let promptResolve = null;   // Function to resolve the promise from getUserInput
let promptBuffer = '';      // Buffer to store input for the current prompt

// Readline Interface (used only for rl.close() on exit, not for input)
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '' // No visible prompt, we manage display manually
});

// --- Utility Functions ---

/**
 * Clears the terminal screen using ANSI escape codes.
 * \x1B[2J: Clears the entire screen.
 * \x1B[0f: Moves the cursor to the home position (top-left corner).
 */
function clearScreen() {
    process.stdout.write('\x1B[2J\x1B[0f');
}

/**
 * Calculates the visual width of a string, ignoring ANSI escape codes.
 * @param {string} text - The string to measure.
 * @returns {number} The visual width.
 */
function getVisualWidth(text) {
    // Regex to remove ANSI escape codes
    return text.replace(/\x1b\[[0-9;]*m/g, '').length;
}

/**
 * Splits a logical line (potentially with ANSI codes) into an array of visual lines
 * based on the available terminal width.
 * @param {string} lineContent - The content of a single logical line (can be highlighted).
 * @param {number} availableWidth - The maximum visual width for content on a line.
 * @returns {string[]} An array of visual line segments.
 */
function getVisualLineSegments(lineContent, availableWidth) {
    const segments = [];
    let currentSegment = '';
    let currentVisualWidth = 0;
    let inEscapeCode = false;

    for (let i = 0; i < lineContent.length; i++) {
        const char = lineContent[i];

        if (char === '\x1b') { // Start of an ANSI escape code
            inEscapeCode = true;
            currentSegment += char;
            continue;
        }

        if (inEscapeCode) {
            currentSegment += char;
            if (char === 'm') { // End of an ANSI escape code
                inEscapeCode = false;
            }
            continue;
        }

        // Regular character
        if (currentVisualWidth >= availableWidth) {
            segments.push(currentSegment);
            currentSegment = '';
            currentVisualWidth = 0;
        }
        currentSegment += char;
        currentVisualWidth++;
    }

    if (currentSegment.length > 0) {
        segments.push(currentSegment);
    }
    // Ensure even an empty logical line results in one visual segment
    if (segments.length === 0 && lineContent === '') {
        segments.push('');
    }
    return segments;
}

/**
 * Calculates the screen (row, column) coordinates for a given logical (Y, X) cursor position,
 * taking into account line wrapping and view offset.
 * @param {number} logicalY - The logical line index (0-based).
 * @param {number} logicalX - The logical column index (0-based) within that line.
 * @param {number} viewOffsetY - The top-most logical line displayed on screen.
 * @param {number} terminalWidth - The current terminal width.
 * @param {number} linePrefixWidth - The width of the line number prefix.
 * @returns {{screenY: number, screenX: number}} The screen coordinates (1-based).
 */
function getScreenCoordinates(logicalY, logicalX, viewOffsetY, terminalWidth, linePrefixWidth) {
    let screenY = 0; // Relative to content area start
    let screenX = 0;

    const availableContentWidth = terminalWidth - linePrefixWidth;

    // Calculate screenY by summing up visual lines from viewOffsetY to logicalY
    for (let i = viewOffsetY; i < logicalY; i++) {
        if (i < lines.length) {
            const highlightedLine = highlightContent(lines[i], currentFilename);
            const visualSegments = getVisualLineSegments(highlightedLine, availableContentWidth);
            screenY += visualSegments.length;
        }
    }

    // Calculate screenX within the current logical line (logicalY)
    const currentLogicalLineContent = lines[logicalY] || '';
    const highlightedCurrentLogicalLine = highlightContent(currentLogicalLineContent, currentFilename);

    let currentVisualX = 0;
    let currentVisualLineOffset = 0;
    let inEscapeCode = false;

    for (let i = 0; i < logicalX; i++) {
        const char = highlightedCurrentLogicalLine[i]; // Use highlighted line to skip ANSI codes for visual width

        if (char === '\x1b') {
            inEscapeCode = true;
            continue;
        }
        if (inEscapeCode) {
            if (char === 'm') {
                inEscapeCode = false;
            }
            continue;
        }

        // Regular character
        if (currentVisualX >= availableContentWidth) {
            currentVisualX = 0;
            currentVisualLineOffset++;
        }
        currentVisualX++;
    }

    screenY += currentVisualLineOffset;
    screenX = currentVisualX;

    // Add header height and 1 for 1-based terminal coordinates
    const finalScreenY = screenY + 3 + 1;
    const finalScreenX = screenX + linePrefixWidth + 1;

    return { screenY: finalScreenY, screenX: finalScreenX };
}


/**
 * Updates the display and history after a change.
 * This is called after every modification to the `lines` array.
 */
const updateStateAndDisplay = () => {
    unsavedChanges = true; // Mark as unsaved on any content change
    addToHistory(); // Add to history
    displayContent(); // Update display
};

/**
 * Adds the current content state to the history stack.
 * This is called after every modification to enable undo/redo.
 */
function addToHistory() {
    const currentContentString = lines.join('\n');
    if (currentContentString !== history[historyIndex].join('\n')) {
        if (historyIndex < history.length - 1) {
            history = history.slice(0, historyIndex + 1);
        }
        history.push([...lines]); // Push a new copy of the lines array
        historyIndex = history.length - 1;

        if (history.length > MAX_HISTORY_SIZE) {
            history.shift(); // Remove the oldest state
            historyIndex--;
        }
    }
}

/**
 * Reverts the content to a previous state from history (Undo).
 */
function undo() {
    if (historyIndex > 0) {
        historyIndex--;
        lines = [...history[historyIndex]]; // Restore from history
        unsavedChanges = (lines.join('\n') !== lastSaveContent);
        resetCursorPosition(); // Move cursor to end after undo/redo for simplicity
        displayContent();
    }
}

/**
 * Reapplies a previously undone state from history (Redo).
 */
function redo() {
    if (historyIndex < history.length - 1) {
        historyIndex++;
        lines = [...history[historyIndex]]; // Restore from history
        unsavedChanges = (lines.join('\n') !== lastSaveContent);
        resetCursorPosition(); // Move cursor to end after undo/redo for simplicity
        displayContent();
    }
}

/**
 * Inserts text (single char or pasted content) at the current cursor position.
 * Efficiently handles multi-line pasted content.
 * @param {string} text - The text to insert.
 */
function insertText(text) {
    const textLines = text.split('\n');
    const currentLineContent = lines[cursorY];

    if (textLines.length === 1) {
        // Single line insertion
        lines[cursorY] = currentLineContent.substring(0, cursorX) + text + currentLineContent.substring(cursorX);
        cursorX += text.length;
    } else {
        // Multi-line insertion (paste)
        const firstPart = currentLineContent.substring(0, cursorX) + textLines[0];
        const lastPart = textLines[textLines.length - 1] + currentLineContent.substring(cursorX);

        lines[cursorY] = firstPart;
        lines.splice(cursorY + 1, 0, ...textLines.slice(1, textLines.length - 1), lastPart);

        cursorY += textLines.length - 1;
        cursorX = lastPart.length;
    }
    updateStateAndDisplay();
    adjustViewOffset(); // Adjust view after insertion
}

/**
 * Deletes a character at the current cursor position (backspace).
 */
function deleteChar() {
    if (lines.length === 1 && lines[0] === '' && cursorX === 0 && cursorY === 0) {
        return; // Nothing to delete
    }

    if (cursorX > 0) {
        // Delete char on current line
        let currentLine = lines[cursorY];
        let newLine = currentLine.substring(0, cursorX - 1) + currentLine.substring(cursorX);
        lines[cursorY] = newLine;
        cursorX--;
    } else if (cursorY > 0) {
        // At beginning of line, merge with previous line
        let prevLine = lines[cursorY - 1];
        let currentLine = lines[cursorY];
        lines.splice(cursorY - 1, 2, prevLine + currentLine);
        cursorY--;
        cursorX = prevLine.length;
    }
    updateStateAndDisplay();
    adjustViewOffset(); // Adjust view after deletion
}

/**
 * Adjusts the viewOffsetY to keep the cursor visible.
 * Ensures the cursor is within the visible screen area.
 */
function adjustViewOffset() {
    const headerHeight = 3; // Lines for "---", "File:", "---"
    const footerHeight = 5; // Lines for "---", "Lines:", "---", "Shortcuts:", empty line for prompt
    const availableContentHeight = process.stdout.rows - headerHeight - footerHeight;

    // Calculate the screen Y position of the cursor
    const { screenY: cursorScreenYWithinContent } = getScreenCoordinates(cursorY, cursorX, viewOffsetY, process.stdout.columns, String(lines.length).length + 3);

    // If cursor is above the visible area, scroll up
    if (cursorScreenYWithinContent < headerHeight + 1) { // +1 for 1-based index
        viewOffsetY = cursorY; // Set view top to cursor line
    }
    // If cursor is below the visible area, scroll down
    else if (cursorScreenYWithinContent >= headerHeight + availableContentHeight + 1) {
        viewOffsetY = cursorY - availableContentHeight + 1; // Set view top so cursor is at bottom
    }

    // Ensure viewOffsetY doesn't go below 0
    viewOffsetY = Math.max(0, viewOffsetY);
    // Ensure viewOffsetY doesn't go past the end of content
    viewOffsetY = Math.min(viewOffsetY, Math.max(0, lines.length - availableContentHeight));
}


/**
 * Applies syntax highlighting to the given content based on the file extension.
 * This is a manual, regex-based highlighting implementation.
 * @param {string} content - The text content to highlight.
 * @param {string} filename - The filename to determine the highlighting rules.
 * @returns {string} - The highlighted content with ANSI escape codes.
 */
function highlightContent(content, filename) {
    const ext = path.extname(filename).toLowerCase();
    let highlighted = content;

    // Helper to apply color and reset
    const colorize = (text, color) => color + text + Colors.Reset;

    // Function to apply common highlighting patterns (comments, strings)
    // This is applied first to prevent keywords/operators from being highlighted inside them.
    const applyBaseHighlighting = (text) => {
        // Multi-line comments (e.g., /* ... */)
        text = text.replace(/(\/\*[\s\S]*?\*\/)/g, colorize('$1', Colors.FgGray));
        // Single-line comments (e.g., // ...)
        text = text.replace(/(\/\/.*)/g, colorize('$1', Colors.FgGray));
        // Strings (double quotes)
        text = text.replace(/(".*?")/g, colorize('$1', Colors.FgGreen));
        // Strings (single quotes)
        text = text.replace(/('.*?')/g, colorize('$1', Colors.FgGreen));
        return text;
    };

    // Function to apply general delimiters and operators
    const applyGeneralSyntax = (text) => {
        // Delimiters: {}, (), [], ; , .
        // Escaping `[` `]` `(` `)` `{` `}` `.` `\`
        text = text.replace(/([{}()[\];,.\\])/g, colorize('$1', Colors.FgCyan));

        // Operators:
        // Order matters for multi-character operators: longest first.
        // Escape special regex characters for literal matching.
        const operators = [
            '===', '!==', '==', '!=', '<=', '>=', '+=', '-=', '*=' ,'/=', '%=', '&&', '||', '...',
            '<<', '>>', '>>>', // Bitwise shifts
            '+', '-', '*', '/', '%', '=', '&', '|', '!', '<', '>', '?', ':', '~', '^'
        ];
        const escapedOperators = operators.map(op => {
            return op.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        });
        escapedOperators.sort((a, b) => b.length - a.length); // Sort by length descending
        const operatorRegex = new RegExp(`(${escapedOperators.join('|')})`, 'g');
        text = text.replace(operatorRegex, colorize('$&', Colors.FgMagenta));

        // Numbers
        text = text.replace(/\b(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?\b/g, colorize('$&', Colors.FgYellow));
        return text;
    };

    // Apply base highlighting first (comments and strings)
    highlighted = applyBaseHighlighting(highlighted);

    switch (ext) {
        case '.js': // JavaScript highlighting
            highlighted = applyGeneralSyntax(highlighted); // Apply general syntax after base
            // Template literals (backticks)
            highlighted = highlighted.replace(/(`.*?`)/g, colorize('$1', Colors.FgGreen));

            // Keywords (common JS keywords including ES6+)
            const jsKeywords = /\b(function|var|let|const|if|else|for|while|do|switch|case|break|continue|return|new|this|class|extends|super|import|export|default|try|catch|finally|throw|async|await|of|in|typeof|instanceof|debugger|void|with|yield|null|undefined|true|false)\b/g;
            highlighted = highlighted.replace(jsKeywords, colorize('$&', Colors.FgBlue));

            // Built-in objects/globals (simple heuristic)
            const jsBuiltIns = /\b(console|document|window|Math|Date|Array|Object|String|Number|Boolean|Promise|Set|Map|JSON|RegExp)\b/g;
            highlighted = highlighted.replace(jsBuiltIns, colorize('$&', Colors.FgCyan));

            // Function names (simple heuristic: word followed by parenthesis)
            highlighted = highlighted.replace(/(\b[a-zA-Z_$][0-9a-zA-Z_$]*)\s*\(/g, colorize('$1', Colors.FgYellow) + '(');
            break;

        case '.html': // HTML highlighting
            // HTML comments are distinct, so handle separately if not already covered by general comments
            highlighted = highlighted.replace(/(<!--[\s\S]*?-->)/g, colorize('$1', Colors.FgGray));

            // Tags (<tag> or </tag>)
            // This regex captures the opening/closing angle brackets, the tag name, and any attributes within.
            // It applies cyan to the brackets and tag name.
            highlighted = highlighted.replace(/(&lt;\/?)([a-zA-Z0-9:]+)([^&]*?)(&gt;)/g, (match, p1, p2, p3, p4) => {
                let attributes = p3;
                // Highlight attributes: name="value"
                attributes = attributes.replace(/([a-zA-Z-]+)=(".*?"|'.*?')/g, colorize('$1', Colors.FgYellow) + '=' + colorize('$2', Colors.FgGreen));
                return colorize(p1, Colors.FgCyan) + colorize(p2, Colors.FgCyan) + attributes + colorize(p4, Colors.FgCyan);
            });
            // Self-closing tags
            highlighted = highlighted.replace(/(&lt;)([a-zA-Z0-9:]+)([^&]*?)(\/&gt;)/g, (match, p1, p2, p3, p4) => {
                let attributes = p3;
                attributes = attributes.replace(/([a-zA-Z-]+)=(".*?"|'.*?')/g, colorize('$1', Colors.FgYellow) + '=' + colorize('$2', Colors.FgGreen));
                return colorize(p1, Colors.FgCyan) + colorize(p2, Colors.FgCyan) + attributes + colorize(p4, Colors.FgCyan);
            });
            // Doctypes and special entities
            highlighted = highlighted.replace(/(&lt;!DOCTYPE[^&]*?&gt;)/g, colorize('$1', Colors.FgBlue));
            highlighted = highlighted.replace(/(&amp;[a-zA-Z0-9#]+;)/g, colorize('$1', Colors.FgMagenta));
            break;

        case '.css': // CSS highlighting
            highlighted = applyGeneralSyntax(highlighted);
            highlighted = highlighted.replace(/([.#]?[a-zA-Z0-9_-]+|\*|\[.*?\])(:\w+)?(::\w+)?(\s*[+>~]\s*)?/g, colorize('$&', Colors.FgRed));
            highlighted = highlighted.replace(/([a-zA-Z-]+)(:\s*)/g, colorize('$1', Colors.FgCyan) + '$2');
            highlighted = highlighted.replace(/:\s*([^;]+)(;)/g, (match, p1, p2) => {
                let value = p1;
                value = value.replace(/(\b\d+(\.\d*)?(px|em|rem|%|vh|vw|deg|s|ms)?\b)/g, colorize('$&', Colors.FgMagenta));
                value = value.replace(/(url\(['"]?.*?['"]?\))/g, colorize('$&', Colors.FgYellow));
                value = value.replace(/(!important)/g, colorize('$&', Colors.FgRed));
                return ': ' + value + p2;
            });
            break;

        case '.json': // JSON highlighting
            highlighted = applyGeneralSyntax(highlighted);
            highlighted = highlighted.replace(/(")([^"]+)(")(:)/g, colorize('$1', Colors.FgCyan) + colorize('$2', Colors.FgCyan) + colorize('$3', Colors.FgCyan) + '$4');
            highlighted = highlighted.replace(/(:\s*)(true|false|null)([,\}\]])/g, '$1' + colorize('$2', Colors.FgMagenta) + '$3');
            break;

        case '.cpp': // C++ highlighting
            highlighted = applyGeneralSyntax(highlighted);
            const cppKeywords = /\b(alignas|alignof|and|and_eq|asm|auto|bitand|bitor|bool|break|case|catch|char|char8_t|char16_t|char32_t|class|const|consteval|constexpr|constinit|const_cast|continue|co_await|co_return|co_yield|decltype|default|delete|do|double|dynamic_cast|else|enum|explicit|export|extern|false|float|for|friend|goto|if|inline|int|long|mutable|namespace|new|noexcept|not|not_eq|nullptr|operator|or|or_eq|private|protected|public|reflexpr|register|reinterpret_cast|requires|return|short|signed|sizeof|static|static_assert|static_cast|struct|switch|synchronized|template|this|thread_local|throw|true|try|typedef|typeid|typename|union|unsigned|using|virtual|void|volatile|wchar_t|while|xor|xor_eq)\b/g;
            highlighted = highlighted.replace(cppKeywords, colorize('$&', Colors.FgBlue));
            highlighted = highlighted.replace(/(#include|#define|#ifdef|#ifndef|#endif|#pragma)\b/g, colorize('$&', Colors.FgYellow));
            const cppStdLib = /\b(std|cout|cin|endl|vector|string|map|set|ifstream|ofstream)\b/g;
            highlighted = highlighted.replace(cppStdLib, colorize('$&', Colors.FgCyan));
            break;

        case '.py': // Python highlighting
            highlighted = highlighted.replace(/(#.*)/g, colorize('$1', Colors.FgGray));
            highlighted = highlighted.replace(/("""[\s\S]*?""")|('''(?:.|\n)*?''')/g, colorize('$1$2', Colors.FgGreen));
            highlighted = applyGeneralSyntax(highlighted);
            const pyKeywords = /\b(and|as|assert|async|await|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield)\b/g;
            highlighted = highlighted.replace(pyKeywords, colorize('$&', Colors.FgBlue));
            const pyBuiltIns = /\b(print|input|len|range|list|dict|set|tuple|str|int|float|bool|True|False|None)\b/g;
            highlighted = highlighted.replace(pyBuiltIns, colorize('$&', Colors.FgCyan));
            break;

        case '.java': // Java highlighting
            highlighted = applyGeneralSyntax(highlighted);
            const javaKeywords = /\b(abstract|continue|for|new|switch|assert|default|goto|package|synchronized|boolean|do|if|private|this|break|double|implements|protected|throw|byte|else|import|public|throws|case|enum|instanceof|return|transient|catch|extends|int|short|try|char|final|interface|static|void|class|finally|long|strictfp|volatile|const|float|native|super|while)\b/g;
            highlighted = highlighted.replace(javaKeywords, colorize('$&', Colors.FgBlue));
            highlighted = highlighted.replace(/(\b[A-Z][a-zA-Z0-9_]*)\s+([a-zA-Z_][a-zA-Z0-9_]*)/g, colorize('$1', Colors.FgCyan) + ' $2');
            break;

        default:
            highlighted = content;
            break;
    }

    return highlighted;
}

/**
 * Displays the current content of the editor on the terminal,
 * including header, line numbers, content, and a status bar with colors.
 * Also positions the cursor.
 */
function displayContent() {
    clearScreen();

    const terminalWidth = process.stdout.columns;
    const terminalHeight = process.stdout.rows;

    const headerHeight = 3; // Lines for "---", "File:", "---"
    const footerHeight = 5; // Lines for "---", "Lines:", "---", "Shortcuts:", empty line for prompt
    const availableContentHeight = terminalHeight - headerHeight - footerHeight;

    // --- Header ---
    const headerTitle = '--- SMART CLI EDITOR ---';
    const headerTitlePadded = headerTitle.padStart(Math.floor((terminalWidth + headerTitle.length) / 2), ' ').padEnd(terminalWidth, ' ');
    process.stdout.write(Colors.BgBlue + Colors.FgWhite + Colors.Bright + headerTitlePadded + Colors.Reset + '\n'); // Blue theme

    const fileNameInfo = `File: ${currentFilename} ${unsavedChanges ? Colors.FgYellow + '*' : ''}`;
    const fileNameInfoPadded = fileNameInfo.padEnd(terminalWidth, ' ');
    process.stdout.write(Colors.FgWhite + fileNameInfoPadded + Colors.Reset + '\n'); // White text on default background

    const separator = '-'.repeat(terminalWidth);
    process.stdout.write(Colors.BgBlue + Colors.FgWhite + separator + Colors.Reset + '\n'); // Blue theme

    // --- Content with Line Numbers and Highlighting ---
    const maxLineNumWidth = String(lines.length).length; // Use raw lines length for number width
    const linePrefixWidth = maxLineNumWidth + 3; // e.g., " 1 | "
    const availableContentWidth = terminalWidth - linePrefixWidth;

    // Adjust viewOffsetY to ensure cursor is visible
    adjustViewOffset();

    let currentScreenLine = 0; // Tracks the current screen row being drawn (relative to content area)

    for (let i = viewOffsetY; i < lines.length && currentScreenLine < availableContentHeight; i++) {
        const lineContent = lines[i];
        const highlightedLine = highlightContent(lineContent, currentFilename);
        const visualSegments = getVisualLineSegments(highlightedLine, availableContentWidth);

        // Ensure even an empty logical line gets at least one visual segment for display
        if (visualSegments.length === 0 && lineContent === '') {
            visualSegments.push('');
        }

        for (let j = 0; j < visualSegments.length; j++) {
            if (currentScreenLine >= availableContentHeight) break; // Stop if we exceed screen height

            const segment = visualSegments[j];
            const lineNumber = String(i + 1).padStart(maxLineNumWidth, ' ');
            const linePrefix = `${Colors.FgGray}${lineNumber}${Colors.Reset} ${Colors.FgWhite}|${Colors.Reset} `;

            // If it's a wrapped line, don't show line number, just padding
            const displayPrefix = (j === 0) ? linePrefix : ' '.repeat(linePrefixWidth);

            // Ensure segment doesn't overflow terminal width
            const contentToDisplay = segment.substring(0, terminalWidth - getVisualWidth(displayPrefix));

            process.stdout.write(`${displayPrefix}${contentToDisplay}${Colors.Reset}\n`);
            currentScreenLine++;
        }
    }

    // Fill remaining lines if content is shorter than available height
    while (currentScreenLine < availableContentHeight) {
        process.stdout.write('\n');
        currentScreenLine++;
    }


    // --- Status Bar ---
    process.stdout.write(Colors.BgBlue + Colors.FgWhite + separator + Colors.Reset + '\n'); // Blue theme
    const totalLines = lines.length;
    const totalChars = lines.join('\n').length;
    const statusText = `${Colors.FgWhite}Lines: ${totalLines}${Colors.Reset}, ${Colors.FgWhite}Chars: ${totalChars}${Colors.Reset} | Cursor: ${cursorY + 1}:${cursorX + 1}`;
    const statusTextPadded = statusText.padEnd(terminalWidth + Colors.Reset.length * 5, ' '); // Adjust padding for color codes
    process.stdout.write(Colors.BgBlue + Colors.FgWhite + statusTextPadded + Colors.Reset + '\n'); // Blue theme
    process.stdout.write(Colors.BgBlue + Colors.FgWhite + separator + Colors.Reset + '\n'); // Blue theme

    // --- Footer with Key Shortcuts ---
    const shortcutsText = Colors.FgMagenta + 'Shortcuts:' + Colors.Reset + ' ' +
                          Colors.FgYellow + 'CTRL+S:' + Colors.Reset + ' Save | ' +
                          Colors.FgYellow + 'CTRL+L:' + Colors.Reset + ' Save As | ' +
                          Colors.FgYellow + 'CTRL+Z:' + Colors.Reset + ' Undo | ' +
                          Colors.FgYellow + 'CTRL+Y:' + Colors.Reset + ' Redo | ' +
                          Colors.FgRed + 'CTRL+X:' + Colors.Reset + ' Exit';
    const shortcutsTextPadded = shortcutsText.padEnd(terminalWidth + Colors.Reset.length * 6, ' '); // Adjust padding for color codes
    process.stdout.write(Colors.BgBlack + Colors.FgWhite + shortcutsTextPadded + Colors.Reset + '\n'); // Black background for footer

    // Position the actual terminal cursor
    const { screenY: finalScreenY, screenX: finalScreenX } = getScreenCoordinates(cursorY, cursorX, viewOffsetY, terminalWidth, linePrefixWidth);
    process.stdout.write(`\x1b[${finalScreenY};${finalScreenX}H`);
}

/**
 * Prompts the user for input by displaying the query and capturing direct raw mode input.
 * This function blocks until Enter is pressed.
 * @param {string} query - The question to ask the user.
 * @returns {Promise<string>} - A promise that resolves with the user's answer.
 */
async function getUserInput(query) {
    isPromptActive = true;
    promptBuffer = '';

    clearScreen();
    displayContent(); // Display editor content above the prompt

    // Move cursor to the prompt line (last row of the terminal)
    const promptLineY = process.stdout.rows;
    process.stdout.write(`\x1b[${promptLineY};1H`);
    process.stdout.write(Colors.FgYellow + query + Colors.Reset + promptBuffer); // Display query and current buffer
    process.stdout.write(`\x1b[${promptLineY};${query.length + promptBuffer.length + Colors.FgYellow.length + 1}H`); // Position cursor after buffer

    return new Promise(resolve => {
        promptResolve = resolve;
    });
}

/**
 * Saves the current content to a file.
 * @param {object} options - Options for saving.
 * @param {boolean} options.exitAfterSave - If true, the tool will exit after saving.
 * @param {boolean} options.forcePromptFilename - If true, always ask for a filename, even if one is set.
 */
async function saveFile({ exitAfterSave = false, forcePromptFilename = false } = {}) {
    let filenameToSave = currentFilename;
    const currentContentString = lines.join('\n');

    if (forcePromptFilename || currentFilename === 'untitled.txt') {
        const answer = await getUserInput(`Save as (${currentFilename}): `);
        if (answer.trim() !== '') {
            filenameToSave = answer.trim();
        } else {
            // User cancelled the save-as prompt
            displayContent();
            return;
        }
    }

    const filePath = path.resolve(filenameToSave);
    const dirPath = path.dirname(filePath);

    if (dirPath !== '.' && !fs.existsSync(dirPath)) {
        // Clear prompt line before showing error
        process.stdout.write(`\x1b[${process.stdout.rows};1H\x1b[K`);
        console.error(Colors.FgRed + `Error: Directory '${dirPath}' does not exist. Cannot save file.` + Colors.Reset);
        await new Promise(r => setTimeout(r, 2000));
        displayContent();
        return;
    }

    if (fs.existsSync(filePath)) {
        const existingContent = fs.readFileSync(filePath, 'utf8');
        if (existingContent.length > 0 && currentContentString !== existingContent) {
            const overwrite = await getUserInput(`File '${filenameToSave}' already exists. Overwrite? (y/n): `);
            if (overwrite.toLowerCase() !== 'y') {
                displayContent();
                return;
            }
        }
    }

    try {
        fs.writeFileSync(filePath, currentContentString);
        currentFilename = filenameToSave;
        unsavedChanges = false;
        lastSaveContent = currentContentString;
        // Clear prompt line before showing success message
        process.stdout.write(`\x1b[${process.stdout.rows};1H\x1b[K`);
        console.log(Colors.FgGreen + `File saved successfully as '${currentFilename}'.` + Colors.Reset);
        await new Promise(r => setTimeout(r, 1500));
    } catch (error) {
        // Clear prompt line before showing error
        process.stdout.write(`\x1b[${process.stdout.rows};1H\x1b[K`);
        console.error(Colors.FgRed + `Error saving file: ${error.message}` + Colors.Reset);
        await new Promise(r => setTimeout(r, 2000));
    }
    displayContent();
    if (exitAfterSave) {
        exitTool();
    }
}

/**
 * Exits the CLI editor.
 * Prompts to save if there are unsaved changes.
 */
async function exitTool() {
    if (unsavedChanges) {
        const confirmExit = await getUserInput('You have unsaved changes. Save before exiting? (y/n): ');
        if (confirmExit.toLowerCase() === 'y') {
            await saveFile({ exitAfterSave: true, forcePromptFilename: false });
            return;
        }
    }
    // Clear prompt line before exiting message
    process.stdout.write(`\x1b[${process.stdout.rows};1H\x1b[K`);
    console.log(Colors.FgCyan + 'Exiting CLI editor. Goodbye!' + Colors.Reset);
    await new Promise(r => setTimeout(r, 1000));
    rl.close();
    process.exit(0);
}

/**
 * Resets the cursor position to the end of the current content.
 * Useful after loading a file or undo/redo.
 */
function resetCursorPosition() {
    cursorY = Math.max(0, lines.length - 1);
    cursorX = lines[cursorY].length;
    adjustViewOffset(); // Adjust view after resetting cursor
}

// --- Initial Setup and File Loading ---

/**
 * Initializes the editor by loading content from a specified file if provided
 * as a command-line argument. Handles directory existence checks.
 */
function initializeEditor() {
    const args = process.argv.slice(2);

    if (args.length > 0) {
        const filenameArg = args[0];
        const filePath = path.resolve(filenameArg);
        const dirPath = path.dirname(filePath);

        if (dirPath !== '.' && !fs.existsSync(dirPath)) {
            console.error(Colors.FgRed + `Error: Directory '${dirPath}' does not exist. Cannot create/load file here.` + Colors.Reset);
            console.log(Colors.FgYellow + 'Starting with new untitled file in current directory.' + Colors.Reset);
            currentFilename = 'untitled.txt';
            lines = [''];
        } else {
            if (fs.existsSync(filePath)) {
                try {
                    const fileContent = fs.readFileSync(filePath, 'utf8');
                    lines = fileContent.split('\n');
                    currentFilename = filenameArg;
                    lastSaveContent = fileContent;
                    history = [[...lines]];
                    historyIndex = 0;
                    console.log(Colors.FgGreen + `Loaded file: ${currentFilename}` + Colors.Reset);
                } catch (error) {
                    console.error(Colors.FgRed + `Error loading file '${filenameArg}': ${error.message}` + Colors.Reset);
                    lines = [''];
                    console.log(Colors.FgYellow + 'Starting with empty content.' + Colors.Reset);
                }
            } else {
                console.log(Colors.FgYellow + `File '${filenameArg}' not found. Starting with new file.` + Colors.Reset);
                currentFilename = filenameArg;
                lines = [''];
            }
        }
    } else {
        console.log(Colors.FgYellow + 'No file specified. Starting with new untitled file.' + Colors.Reset);
        lines = [''];
    }

    resetCursorPosition();

    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    // Listen for terminal resize events
    process.stdout.on('resize', () => {
        adjustViewOffset(); // Re-adjust view based on new terminal size
        displayContent(); // Redraw content
    });

    displayContent();
}

// --- Main Execution Logic (Keypress Handling) ---

// Listen for 'data' events on process.stdin (i.e., key presses)
process.stdin.on('data', async (key) => {
    if (isPromptActive) {
        if (key === '\r') { // Enter key for prompt
            isPromptActive = false;
            // Clear the prompt line after input
            process.stdout.write(`\x1b[${process.stdout.rows};1H\x1b[K`); // Move to prompt line, clear it
            promptResolve(promptBuffer); // Resolve the promise with the collected input
            promptResolve = null;
            promptBuffer = '';
            // Editor will be redrawn by the function that called getUserInput
        } else if (key === '\x7f') { // Backspace for prompt
            if (promptBuffer.length > 0) {
                promptBuffer = promptBuffer.slice(0, -1);
                process.stdout.write('\x1b[D\x1b[K'); // Move cursor left, clear to end of line
            }
        } else if (key.length >= 1 && key.charCodeAt(0) >= 32 && key.charCodeAt(0) <= 126) {
            // Printable characters for prompt (including paste)
            promptBuffer += key;
            process.stdout.write(key); // Echo character(s)
        }
        return; // Do not process editor input while in prompt mode
    }

    // --- Editor Input Handling ---
    // Control keys
    if (key === '\x03') { // CTRL+C (Force Exit)
        console.log(Colors.FgRed + '\nForce exiting...' + Colors.Reset);
        rl.close();
        process.exit(0);
    } else if (key === '\x13') { // CTRL+S (Save)
        process.stdout.write(Colors.FgBlue + '\nSaving...' + Colors.Reset);
        await saveFile({ forcePromptFilename: false });
    } else if (key === '\x0c') { // CTRL+L (Save As)
        process.stdout.write(Colors.FgBlue + '\nSaving As...' + Colors.Reset);
        await saveFile({ forcePromptFilename: true });
    } else if (key === '\x18') { // CTRL+X (Exit with prompt)
        process.stdout.write(Colors.FgBlue + '\nAttempting to exit...' + Colors.Reset);
        await exitTool();
    } else if (key === '\x1A') { // CTRL+Z (Undo)
        undo();
    } else if (key === '\x19') { // CTRL+Y (Redo)
        redo();
    }
    // Cursor Movement (Arrow Keys)
    else if (key === '\x1b[A') { // Up arrow
        if (cursorY > 0) {
            cursorY--;
            const currentLineLength = lines[cursorY].length;
            cursorX = Math.min(cursorX, currentLineLength);
            adjustViewOffset(); // Adjust view after cursor move
            displayContent();
        }
    } else if (key === '\x1b[B') { // Down arrow
        if (cursorY < lines.length - 1) {
            cursorY++;
            const currentLineLength = lines[cursorY].length;
            cursorX = Math.min(cursorX, currentLineLength);
            adjustViewOffset(); // Adjust view after cursor move
            displayContent();
        }
    } else if (key === '\x1b[C') { // Right arrow
        const currentLineLength = lines[cursorY].length;
        if (cursorX < currentLineLength) {
            cursorX++;
        } else if (cursorY < lines.length - 1) {
            cursorY++;
            cursorX = 0;
        }
        adjustViewOffset(); // Adjust view after cursor move
        displayContent();
    } else if (key === '\x1b[D') { // Left arrow
        if (cursorX > 0) {
            cursorX--;
        } else if (cursorY > 0) {
            cursorY--;
            const currentLineLength = lines[cursorY].length;
            cursorX = currentLineLength;
        }
        adjustViewOffset(); // Adjust view after cursor move
        displayContent();
    }
    // Content Modification Keys
    else if (key === '\x7f') { // Backspace
        deleteChar();
    } else if (key === '\r') { // Enter
        insertText('\n');
    }
    // Handle regular printable characters and Tab (including pasted content)
    else if (key.length >= 1 && key.charCodeAt(0) >= 32 && key.charCodeAt(0) <= 126 || key === '\t') {
        insertText(key); // Directly insert the key (which can be multiple chars for paste)
    }
});

// --- Process Exit Handlers ---
process.on('exit', () => {
    process.stdin.setRawMode(false);
    rl.close();
});

process.on('SIGINT', async () => {
    await exitTool();
});

// Start the editor initialization
initializeEditor();
