import * as core from '@actions/core';
import * as fs from 'fs';
import { RunCiCdOtelExport } from './otel-cicd-action/runner';
import { FASTCI_TEMP_DIR, PROCESS_TREES_PATH, TRIGGER_FILE_PATH } from './types/constants';

async function runOtelExport(): Promise<void> {
    try {
        await RunCiCdOtelExport();
    } catch (error) {
        core.error(error as any);
    }
}

async function createTriggerFile(): Promise<void> {
    core.info('Setting trigger file to stop tracer');
    fs.mkdirSync(FASTCI_TEMP_DIR, { recursive: true });
    fs.writeFileSync(TRIGGER_FILE_PATH, '');
}

async function waitForProcessTreesFile(timeoutSeconds: number): Promise<boolean> {
    const startTime = Date.now();
    let lastLogTime = 0;
    
    core.info(`Waiting for tracer process to stop (timeout: ${timeoutSeconds}s)...`);
    
    while (true) {
        const currentTime = Date.now();
        const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
        
        // Break out after timeout period
        if (elapsedSeconds >= timeoutSeconds) {
            core.info(`Timeout of ${timeoutSeconds}s reached. Stopping wait.`);
            return false;
        }
        
        // Check if the file exists and has content
        if (fs.existsSync(PROCESS_TREES_PATH)) {
            try {
                const stats = fs.statSync(PROCESS_TREES_PATH);
                if (stats.size > 0) {
                    core.info('process_trees.json file has content, continuing...');
                    return true;
                }
            } catch (error) {
                core.info(`Error checking file: ${error}`);
            }
        }
        
        // Only log every 5 seconds to avoid flooding the logs
        if (currentTime - lastLogTime >= 1000) {
            core.info(`Still waiting for process_trees.json to have content... (${elapsedSeconds}s elapsed)`);
            lastLogTime = currentTime;
        }

        await new Promise(resolve => setTimeout(resolve, 200));
    }
}

// async function displayProcessTreesFile(): Promise<void> {
//     if (fs.existsSync(PROCESS_TREES_PATH)) {
//         await exec(`cat ${PROCESS_TREES_PATH}`);
//         core.info('Tracer process stopped successfully');
//     } else {
//         core.info('process_trees.json file does not exist after waiting');
//     }
// }

async function verifyProcessTreesExists(): Promise<void> {
    if (fs.existsSync(PROCESS_TREES_PATH)) {
        core.info('process_trees.json file found successfully');
    } else {
        core.info('process_trees.json file does not exist');
    }
}

async function stopTracerProcess(): Promise<void> {
    try {
        core.info('Stopping tracer process...');
        await createTriggerFile();
        
        const timeoutSeconds = 2;
        await waitForProcessTreesFile(timeoutSeconds);
        
        // await displayProcessTreesFile();
    } catch (error) {
        core.info(error as any);
        core.info('No tracer process found or unable to stop it');
    }
}

async function cleanup(): Promise<void> {
    try {
        await stopTracerProcess();
        await verifyProcessTreesExists();
        await runOtelExport();
        
        core.info('Cleanup completed');
    } catch (error) {
        if (error instanceof Error) {
            core.warning(`Cleanup failed: ${error.message}`);
        } else {
            core.warning('Cleanup failed with an unknown error');
        }
        // Don't fail the action if cleanup fails
    }
}

cleanup(); 