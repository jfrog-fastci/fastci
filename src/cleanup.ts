import * as core from '@actions/core';
import * as fs from 'fs';
import { FASTCI_TEMP_DIR, PROCESS_TREES_PATH, TRIGGER_FILE_PATH } from './types/constants';
import { getGithubLogMetadata, sendCoralogixLog } from './sendCoralogixLog';
import { SaveCache } from './cache';

async function createTriggerFile(): Promise<void> {
    core.debug('Setting trigger file to stop tracer');
    fs.mkdirSync(FASTCI_TEMP_DIR, { recursive: true });
    fs.writeFileSync(TRIGGER_FILE_PATH, '');
}

async function waitForTriggerFileDelete(timeoutSeconds: number): Promise<boolean> {
    const startTime = Date.now();
    let lastLogTime = 0;

    core.debug(`Waiting for tracer process to stop (timeout: ${timeoutSeconds}s)...`);

    while (true) {
        const currentTime = Date.now();
        const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);

        // Break out after timeout period
        if (elapsedSeconds >= timeoutSeconds) {
            core.debug(`Timeout of ${timeoutSeconds}s reached. Stopping wait.`);
            return false;
        }

        // Check if the file exists and has content
        if (!fs.existsSync(TRIGGER_FILE_PATH)) {
            return true;
        }

        // Only log every 5 seconds to avoid flooding the logs
        if (currentTime - lastLogTime >= 1000) {
            core.debug(`Still waiting for trigger file to be deleted (${elapsedSeconds}s elapsed)`);
            lastLogTime = currentTime;
        }

        await new Promise(resolve => setTimeout(resolve, 200));
    }
}

async function stopTracerProcess(): Promise<void> {
    try {
        core.debug('Stopping tracer process...');
        await createTriggerFile();

        const timeoutSeconds = 2;
        await waitForTriggerFileDelete(timeoutSeconds);

        // await displayProcessTreesFile();
    } catch (error) {
        core.error(error as any);
        core.error('No tracer process found or unable to stop it');
    }
}

async function StopTracer(): Promise<void> {

    try {
        const timeout = setTimeout(async () => {
            core.debug('Reached timeout during cleanup, exiting');
            sendCoralogixLog('Reached timeout during cleanup, exiting', {
                subsystemName: process.env.GITHUB_REPOSITORY || 'unknown',
                severity: 5,
                category: 'error',
                ...getGithubLogMetadata()
            });
            process.exit(0);

        }, 5000)
        if (process.platform === 'linux') {
            await stopTracerProcess();
        }
        timeout.close()

        core.debug('Cleanup completed');
    } catch (error) {
        await sendCoralogixLog(error, {
            subsystemName: process.env.GITHUB_REPOSITORY || 'unknown',
            severity: 5,
            category: 'error',
            ...getGithubLogMetadata()
        });
        if (error instanceof Error) {
            core.warning(`Cleanup failed: ${error.message}`);
        } else {
            core.warning('Cleanup failed with an unknown error');
        }
        // Don't fail the action if cleanup fails
    }
}
async function cleanup() {
    await SaveCache();
    await StopTracer();
}
cleanup(); 