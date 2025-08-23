import { promises as fs } from 'fs';
import readline from 'readline';
import path from 'path';
import { displayStatusMessage } from './styling.mjs';
import { fileContent, currentFilePath, drawEditor, handleKeypress } from './editor.mjs';

const UNTITLED_FILENAME = 'untitled.txt';

export async function loadFile(filePath) {
    try {
        const content = await fs.readFile(filePath, { encoding: 'utf8' });
        fileContent.splice(0, fileContent.length, ...content.split('\n')); // Update fileContent in editor.mjs
        currentFilePath.value = filePath; // Update currentFilePath in editor.mjs
        displayStatusMessage(`Loaded file: ${filePath}`, 'success');
    } catch (error) {
        if (error.code === 'ENOENT') {
            displayStatusMessage(`File not found: ${filePath}. Starting with an empty buffer.`, 'warn');
            currentFilePath.value = filePath; // Set path even if file doesn't exist for saving later
            fileContent.splice(0, fileContent.length, ''); // Ensure at least one empty line
        } else {
            displayStatusMessage(`Error loading file ${filePath}: ${error.message}`, 'error');
            process.exit(1);
        }
    }
}

export async function saveFile() {
    let filePathToSave = currentFilePath.value;

    if (filePathToSave === UNTITLED_FILENAME) {
        // Pause the main editor's keypress listener
        process.stdin.removeListener('data', handleKeypress);
        process.stdin.setRawMode(false); // Disable raw mode for readline question

        const tempRl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        displayStatusMessage('This is an untitled file. Please enter a filename to save:', 'info');
        filePathToSave = await new Promise(resolve => {
            tempRl.question('Enter filename: ', (filename) => {
                tempRl.close(); // Close the temporary readline instance
                resolve(path.resolve(filename.trim()));
            });
        });

        process.stdin.setRawMode(true); // Re-enable raw mode for editor
        process.stdin.addListener('data', handleKeypress); // Re-add the main editor's keypress listener

        if (filePathToSave === '') {
            displayStatusMessage('No filename provided. Save cancelled.', 'error');
            drawEditor(); // Redraw editor
            return;
        }
    }

    try {
        await fs.writeFile(filePathToSave, fileContent.join('\n'), { encoding: 'utf8' });
        currentFilePath.value = filePathToSave; // Update if it was untitled
        displayStatusMessage(`Saved to: ${filePathToSave}`, 'success');
    } catch (error) {
        displayStatusMessage(`Error saving file ${filePathToSave}: ${error.message}`, 'error');
    } finally {
        drawEditor(); // Redraw editor after save
    }
}
