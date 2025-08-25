import { promises as fs } from 'fs';
import readline from 'readline';
import { color, box, line, title, Spinner, progressBar, log } from './adclours.mjs';
import process from 'process';
import https from 'https'; // Import https module
import { exec } from 'child_process'; // Import exec from child_process

const REPO_PACKAGE_JSON_URL = 'https://raw.githubusercontent.com/Codeleafly/Smartedit/main/package.json';

// Helper to clear screen and move cursor to home
function clearScreen() {
    process.stdout.write('\x1Bc');
}

// Helper to move cursor
function moveCursor(row, col) {
    process.stdout.write(`\x1B[${row};${col}H`);
}

// Helper to hide cursor
function hideCursor() {
    process.stdout.write('\x1B[?25l');
}

// Helper to show cursor
function showCursor() {
    process.stdout.write('\x1B[?25h');
}

// Function to compare versions (major.minor.patch)
function compareVersions(local, remote) {
    const localParts = local.split('.').map(Number);
    const remoteParts = remote.split('.').map(Number);

    for (let i = 0; i < Math.max(localParts.length, remoteParts.length); i++) {
        const localPart = localParts[i] || 0;
        const remotePart = remoteParts[i] || 0;

        if (remotePart > localPart) return 1; // Remote is newer
        if (remotePart < localPart) return -1; // Local is newer
    }
    return 0; // Versions are the same
}

// Function to get local package version
async function getLocalVersion() {
    try {
        const packageJsonPath = './package.json';
        const content = await fs.readFile(packageJsonPath, 'utf8');
        const packageJson = JSON.parse(content);
        return packageJson.version;
    } catch (error) {
        log.error(`Failed to read local package.json: ${error.message}`);
        return null;
    }
}

// Function to get remote package version
async function getRemoteVersion() {
    return new Promise((resolve, reject) => {
        https.get(REPO_PACKAGE_JSON_URL, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const packageJson = JSON.parse(data);
                    resolve(packageJson.version);
                } catch (error) {
                    log.error(`Failed to parse remote package.json: ${error.message}`);
                    reject(error);
                }
            });
        }).on('error', (error) => {
            log.error(`Failed to fetch remote package.json: ${error.message}`);
            reject(error);
        });
    });
}

// Function to display interactive update UI
async function showUpdateUI(localVersion, remoteVersion) {
    clearScreen();
    hideCursor();

    const options = [
        { name: 'Update Now', value: 'update' },
        { name: 'Remind Me Later', value: 'remind' },
        { name: 'Cancel', value: 'cancel' }
    ];
    let selectedIndex = 0;

    const drawUI = () => {
        clearScreen();
        const header = color.bold.cyan('SmartEdit Update Available!');
        const versionInfo = `Local: ${color.yellow(localVersion)} | Remote: ${color.green(remoteVersion)}`;
        
        console.log(box(
            `${header}\n${line(strip(header).length + 10)}\n${versionInfo}\n\n` +
            options.map((option, i) => {
                const prefix = i === selectedIndex ? color.green('▶') : ' ';
                const optionText = i === selectedIndex ? color.bold.white(option.name) : color.white(option.name);
                return `${prefix} ${i + 1}. ${optionText}`;
            }).join('\n'),
            { borderColor: 'blue', style: 'double' }
        ));
        console.log('\n' + color.dim('Use arrow keys or numbers (1-3) to navigate, Enter to select.'));
    };

    drawUI();

    return new Promise(resolve => {
        readline.emitKeypressEvents(process.stdin);
        process.stdin.setRawMode(true);
        process.stdin.resume();

        const onKeypress = (chunk, key) => {
            if (key && key.name === 'up') {
                selectedIndex = (selectedIndex - 1 + options.length) % options.length;
                drawUI();
            } else if (key && key.name === 'down') {
                selectedIndex = (selectedIndex + 1) % options.length;
                drawUI();
            } else if (key && key.name === 'return') {
                process.stdin.removeListener('keypress', onKeypress);
                process.stdin.setRawMode(false);
                process.stdin.pause();
                resolve(options[selectedIndex].value);
            } else if (key && key.ctrl && key.name === 'c') {
                process.stdin.removeListener('keypress', onKeypress);
                process.stdin.setRawMode(false);
                process.stdin.pause();
                resolve('cancel'); // Treat Ctrl+C as cancel
            } else if (chunk && !isNaN(parseInt(chunk))) { // Check for numeric input
                const num = parseInt(chunk);
                if (num >= 1 && num <= options.length) {
                    selectedIndex = num - 1;
                    drawUI(); // Redraw to show selection
                }
            }
        };
        process.stdin.on('keypress', onKeypress);
    });
}

// Function to simulate progress bar
async function simulateProgress(message, duration, steps) {
    return new Promise(resolve => {
        let currentStep = 0;
        const intervalTime = duration / steps;
        const spinner = new Spinner(['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'], message, 80, color.yellow);
        spinner.start();

        const progressInterval = setInterval(() => {
            currentStep++;
            if (currentStep <= steps) {
                const bar = progressBar(currentStep, steps, { width: 30, filledChar: color.green('█'), emptyChar: color.dim('░') });
                process.stdout.write(`\r${spinner.frames[spinner.frameIndex]} ${message} ${bar}`);
                spinner.frameIndex = (spinner.frameIndex + 1) % spinner.frames.length;
            } else {
                clearInterval(progressInterval);
                spinner.stop('✔', message + ' Complete!', 'green');
                resolve();
            }
        }, intervalTime);
    });
}

// Main update handler function
export async function handleUpdate() {
    log.info('Checking for SmartEdit updates...');
    hideCursor();

    const localVersion = await getLocalVersion();
    const remoteVersion = await getRemoteVersion();

    if (!localVersion || !remoteVersion) {
        log.error('Could not determine versions. Update check failed.');
        showCursor();
        return;
    }

    log.info(`Local version: ${localVersion}, Remote version: ${remoteVersion}`);

    const comparison = compareVersions(localVersion, remoteVersion);

    if (comparison === 1) {
        log.success('You are running the latest version of SmartEdit!');
    } else if (comparison === -1) {
        log.warn('New version available!');
        const choice = await showUpdateUI(localVersion, remoteVersion);

        if (choice === 'update') {
            log.info('Starting update process...');
            try {
                await simulateProgress('Downloading update', 2000, 50);
                await simulateProgress('Installing update', 3000, 70);
                
                log.info('Executing: npm install -g smartedit');
                const { stdout, stderr, exitCode } = await new Promise(resolve => {
                    exec('npm install -g smartedit', (error, stdout, stderr) => {
                        resolve({ stdout, stderr, exitCode: error ? error.code : 0 });
                    });
                });

                if (exitCode === 0) {
                    log.success('SmartEdit updated successfully!');
                    log.info('Please restart SmartEdit to use the new version.');
                } else {
                    log.error(`Update failed with exit code ${exitCode}.`);
                    if (stdout) log.error(`Stdout: ${stdout}`);
                    if (stderr) log.error(`Stderr: ${stderr}`);
                }
            } catch (error) {
                log.error(`An error occurred during update: ${error.message}`);
            }
        } else if (choice === 'remind') {
            log.info('Update reminder set. You will be prompted again later.');
        } else {
            log.info('Update cancelled.');
        }
    } else {
        log.success('You are running the latest version of SmartEdit!');
    }
    showCursor();
}