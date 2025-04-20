import * as core from '@actions/core';
import { exec } from '@actions/exec';
import * as fs from 'fs';
import { RunCiCdOtelExport } from './otel-cicd-action/runner';

async function cleanup(): Promise<void> {
    try {
        await RunCiCdOtelExport()
    } catch (error) {
        core.error(error as any);
    }
    try {
        core.info('Stopping tracer process...');

        // Try to find tracer processes
        try {
            core.info('Setting /tmp/fastci/trigger file to stop tracer');

            // makir /tmp/fastci/
            fs.mkdirSync('/tmp/fastci', { recursive: true });

            // write the trigger file
            fs.writeFileSync('/tmp/fastci/trigger', '');

            // wait until the proces of tracer-bin is no longer alive
            const startTime = Date.now();
            let lastLogTime = 0;
            const timeoutSeconds = 10;
            core.info(`Waiting for tracer process to stop (timeout: ${timeoutSeconds}s)...`);
            
            // Check if process_trees.json exists and has content
            const processTreesPath = '/tmp/fastci/process_trees.json';
            
            while (true) {
                const currentTime = Date.now();
                const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
                
                // Break out after timeout period
                if (elapsedSeconds >= timeoutSeconds) {
                    core.info(`Timeout of ${timeoutSeconds}s reached. Stopping wait.`);
                    break;
                }
                
                // Check if the file exists and has content
                if (fs.existsSync(processTreesPath)) {
                    try {
                        const stats = fs.statSync(processTreesPath);
                        if (stats.size > 0) {
                            core.info('process_trees.json file has content, continuing...');
                            break;
                        }
                    } catch (error) {
                        core.info(`Error checking file: ${error}`);
                    }
                }
                
                // Only log every 5 seconds to avoid flooding the logs
                if (currentTime - lastLogTime >= 5000) {
                    core.info(`Still waiting for process_trees.json to have content... (${elapsedSeconds}s elapsed)`);
                    lastLogTime = currentTime;
                }

                await new Promise(resolve => setTimeout(resolve, 200));
            }
            
            if (fs.existsSync(processTreesPath)) {
                await exec(`cat ${processTreesPath}`);
                core.info('Tracer process stopped successfully');
            } else {
                core.info('process_trees.json file does not exist after waiting');
            }
        } catch (error) {
            core.info(error as any);
            core.info('No tracer process found or unable to stop it');
        }

        // check if /tmp/fastci/process_trees.json exists
        if (fs.existsSync('/tmp/fastci/process_trees.json')) {
            //   exec('./tracer-bin', ['--collect-only']);
            core.info('process_trees.json file found successfully');
        } else {
            core.info('process_trees.json file does not exist');
        }

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