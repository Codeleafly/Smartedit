#! /usr/bin/env node
import process from 'process';
import path from 'path';
import { promises as fs } from 'fs'; // Import fs for reading package.json
import { loadFile } from './fileOperations.mjs';
import { drawEditor, handleKeypress, updateTerminalSize, currentFilePath, originalUserProvidedPath, startBlinking } from './editor.mjs';
import { displayStatusMessage, color, gradient } from './styling.mjs';
import { box, line, title, Spinner, progressBar, log } from './adclours.mjs';


const UNTITLED_FILENAME = 'untitled.txt';

const HELP_MESSAGE = `
${color.bold.cyan('SmartEdit - A Powerful Terminal Text Editor')}

${color.yellow('Usage:')}
  ${color.green('smartedit')} [${color.blue('filename')}]
  ${color.green('smartedit')} ${color.blue('path/to/filename')}
  ${color.green('smartedit')} ${color.magenta('--help')} | ${color.magenta('-h')}
  ${color.green('smartedit')} ${color.magenta('--version')} | ${color.magenta('-v')}

${color.yellow('Commands:')}
  ${color.bold('Arrow Keys')}: Move cursor
  ${color.bold('Enter')}: Insert new line
  ${color.bold('Backspace')}: Delete character
  ${color.bold('Ctrl + S')}: Save the current file.
  ${color.bold('Ctrl + C')}: Exit the editor.
  ${color.bold('Ctrl + R')}: Toggle blinking cursor.

${color.yellow('Description:')}
  SmartEdit is now a multiline editor with advanced styling.
  If no filename is provided, SmartEdit will open an untitled buffer.
  All text is handled with UTF-8 encoding.

${color.yellow('Advanced Styling & Features:')}
  - ${color.bold('Dynamic Theming')}: Utilizes rich color gradients and borders for a modern look.
  - ${color.bold('Responsive Layout')}: Adapts seamlessly to various terminal sizes.
  - ${color.bold('Custom Blinking Cursor')}: A visually distinct blinking pipe '|' indicates the current typing position.
  - ${color.bold('Real-time Updates')}: Editor redraws instantly on keypress for a fluid experience.
  - ${color.bold('Status Bar')}: Provides real-time file information and messages.
`;

function displayUsage() {
    console.log(HELP_MESSAGE);
}

// Helper to clear screen and move cursor to home
function clearScreen() {
    process.stdout.write('\x1Bc');
}

// Helper to move cursor
function moveCursor(row, col) {
    process.stdout.write(`\x1B[${row};${col}H`);
}

async function displayUnknownFlagError(flag) {
    clearScreen();
    const errorMessage = box(
        `${color.bold.red('Unknown Flag:')} ${color.yellow(flag)}

` +
        `${color.white('Please use')} ${color.cyan('smartedit --help')} ${color.white('to see supported flags.')}`,
        { borderColor: 'red', style: 'double', padding: 2 }
    );
    console.log(errorMessage);

    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for 5 seconds
    clearScreen();
}

// Main execution
(async () => {
    const args = process.argv.slice(2);

    const supportedFlags = ['--version', '-v', '--help', '-h'];
    const unknownFlag = args.find(arg => arg.startsWith('-') && !supportedFlags.includes(arg));

    if (unknownFlag) {
        await displayUnknownFlagError(unknownFlag);
        process.exit(1);
    }
    
    

    // Check for version flags
    if (args.includes('--version') || args.includes('-version') || args.includes('-v') || args.includes('--v')) {
        try {
            const packageJsonPath = path.resolve('./package.json');
            const content = await fs.readFile(packageJsonPath, 'utf8');
            const packageJson = JSON.parse(content);
            console.log(gradient(`SmartEdit Version: ${packageJson.version}`, '#8A2BE2', '#ADD8E6')); // Purple to Light Blue
        } catch (error) {
            console.error(color.red(`Error reading version: ${error.message}`));
        }
        process.exit(0);
    }

    let initialFilePath = UNTITLED_FILENAME;
    let userProvidedArg = ''; // To store the original argument

    if (args.includes('--help') || args.includes('-h')) {
        console.log(HELP_MESSAGE);
        process.exit(0);
    }

    if (args.length > 0 && !args[0].startsWith('-')) {
        initialFilePath = args[0];
        userProvidedArg = args[0]; // Store the original argument
    }

    currentFilePath.value = path.resolve(initialFilePath); // Set initial file path in editor state
    originalUserProvidedPath.value = userProvidedArg; // Set the original argument
    await loadFile(path.resolve(initialFilePath));

    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', handleKeypress);

    process.stdout.on('resize', updateTerminalSize);

    drawEditor();
    startBlinking();
})();
