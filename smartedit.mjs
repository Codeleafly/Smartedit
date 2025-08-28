#! /usr/bin/env node
import process from 'process';
import path from 'path';
import { promises as fs } from 'fs'; // Import fs for reading package.json
import { fileURLToPath } from 'url';
import { loadFile } from './fileOperations.mjs';
import { drawEditor, handleKeypress, updateTerminalSize, currentFilePath, originalUserProvidedPath, startBlinking } from './editor.mjs';
import { displayStatusMessage, color, gradient } from './styling.mjs';
import { box, line, title, Spinner, progressBar, log } from './adclours.mjs';
import { spawn } from 'child_process'; // For running shell commands
import https from 'https'; // For fetching remote package.json


const UNTITLED_FILENAME = 'untitled.txt';

const HELP_MESSAGE = `
${color.bold.cyan('SmartEdit - A Powerful Terminal Text Editor')}

${color.yellow('Usage:')}
  ${color.green('smartedit')} [${color.blue('filename')}]
  ${color.green('smartedit')} ${color.blue('path/to/filename')}
  ${color.green('smartedit')} ${color.magenta('--help')} | ${color.magenta('-h')}
  ${color.green('smartedit')} ${color.magenta('--version')} | ${color.magenta('-v')}
  ${color.green('smartedit')} ${color.magenta('--update')} | ${color.magenta('-u')}

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

async function getLocalPackageVersion() {
    try {
        const packageJsonPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'package.json');
        const content = await fs.readFile(packageJsonPath, 'utf8');
        const packageJson = JSON.parse(content);
        return packageJson.version;
    } catch (error) {
        log.error(color.red(`Error reading local package.json: ${error.message}`));
        return null;
    }
}

async function getRemotePackageVersion(repoUrl) {
    return new Promise((resolve, reject) => {
        https.get(repoUrl, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const packageJson = JSON.parse(data);
                    resolve(packageJson.version);
                } catch (error) {
                    reject(new Error(`Error parsing remote package.json: ${error.message}`));
                }
            });
        }).on('error', (err) => {
            reject(new Error(`Error fetching remote package.json: ${err.message}`));
        });
    });
}

function compareVersions(localVersion, remoteVersion) {
    const localParts = localVersion.split('.').map(Number);
    const remoteParts = remoteVersion.split('.').map(Number);

    for (let i = 0; i < Math.max(localParts.length, remoteParts.length); i++) {
        const local = localParts[i] || 0;
        const remote = remoteParts[i] || 0;

        if (remote > local) {
            return 1; // Remote is newer
        }
        if (remote < local) {
            return -1; // Local is newer
        }
    }
    return 0; // Versions are the same
}

async function installGlobalPackage(packageName) {
    return new Promise((resolve, reject) => {
        const npm = spawn('npm', ['install', '-g', packageName], { stdio: 'inherit' });

        npm.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`npm install failed with code ${code}`));
            }
        });

        npm.on('error', (err) => {
            reject(new Error(`Failed to start npm process: ${err.message}`));
        });
    });
}

async function checkAndUpdate() {
    clearScreen();
    log.info(color.cyan('Checking for updates...'));

    const localVersion = await getLocalPackageVersion();
    if (!localVersion) {
        log.error(color.red('Could not determine local SmartEdit version.'));
        process.exit(1);
    }

    const remoteRepoUrl = 'https://raw.githubusercontent.com/Codeleafly/Smartedit/main/package.json';
    let remoteVersion;
    try {
        remoteVersion = await getRemotePackageVersion(remoteRepoUrl);
    } catch (error) {
        log.error(color.red(`Failed to fetch remote version: ${error.message}`));
        process.exit(1);
    }

    if (!remoteVersion) {
        log.error(color.red('Could not determine remote SmartEdit version.'));
        process.exit(1);
    }

    log.info(`Local version: ${color.yellow(localVersion)}`);
    log.info(`Remote version: ${color.yellow(remoteVersion)}`);

    const comparisonResult = compareVersions(localVersion, remoteVersion);

    if (comparisonResult === 1) { // Remote is newer
        log.info(gradient('New version available. Waiting for installation...', '#FFA500', '#FFD700'));
        try {
            await installGlobalPackage('smartedit');
            log.success(gradient('Smartedit updated successfully!', '#00FF00', '#008000'));
            // Immediately display the new version by re-fetching the remote version
            const newInstalledVersion = await getRemotePackageVersion(remoteRepoUrl);
            if (newInstalledVersion) {
                console.log(gradient(`SmartEdit Version: ${newInstalledVersion}`, '#8A2BE2', '#ADD8E6'));
            } else {
                log.error(color.red('Could not confirm the new SmartEdit version after update.'));
            }
        } catch (error) {
            log.error(color.red(`Update failed: ${error.message}`));
            process.exit(1);
        }
    } else {
        log.info(color.green('Smartedit is already up-to-date.'));
    }
    process.exit(0);
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

    const supportedFlags = ['--version', '-v', '--help', '-h', '--update', '-u'];
    const unknownFlag = args.find(arg => arg.startsWith('-') && !supportedFlags.includes(arg));

    if (unknownFlag) {
        await displayUnknownFlagError(unknownFlag);
        process.exit(1);
    }
    
    

    // Check for version flags
    if (args.includes('--version') || args.includes('-version') || args.includes('-v') || args.includes('--v')) {
        try {
            const packageJsonPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'package.json');
            const content = await fs.readFile(packageJsonPath, 'utf8');
            const packageJson = JSON.parse(content);
            console.log(gradient(`SmartEdit Version: ${packageJson.version}`, '#8A2BE2', '#ADD8E6')); // Purple to Light Blue
        } catch (error) {
            console.error(color.red(`Error reading version: ${error.message}`));
        }
        process.exit(0);
    }

    // Check for update flags
    if (args.includes('--update') || args.includes('-u')) {
        await checkAndUpdate();
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
