import * as core from '@actions/core';
import { spawn } from 'child_process';
import * as io from '@actions/io';
import * as tc from '@actions/tool-cache';
import * as path from 'path';
import * as fs from 'fs';


async function run(): Promise<void> {
    let timeoutOccurred = false;
    let timeout: NodeJS.Timeout | undefined;
    
    try {
        // Get inputs
        // const jfrogUserWriter = core.getInput('jfrog_user_writer', { required: true });
        // const jfrogPasswordWriter = core.getInput('jfrog_password_writer', { required: true });
        const otelEndpoint = core.getInput('fastci_otel_endpoint', { required: true });
        const otelToken = core.getInput('fastci_otel_token', { required: true });
        const tracerVersion = core.getInput('tracer_version');

        // Set a 5-second timeout
        timeout = setTimeout(() => {
            timeoutOccurred = true;
            core.warning('Timeout exceeded, but continuing the workflow');
        }, 5000);

        // Download tracer binary
        const tracerUrl = `https://github.com/jfrog-fastci/fastci/releases/download/${tracerVersion}/tracer`;
        core.info('Downloading tracer binary.. ' + tracerUrl);
        const tracerPath = await tc.downloadTool(tracerUrl);
        // Check if timeout occurred
        if (timeoutOccurred) {
            timeout.unref();
            return;
        }

        // Move to tracer-bin and make executable
        const tracerBinPath = path.join(process.cwd(), 'tracer-bin');
        await io.cp(tracerPath, tracerBinPath);
        
        // Check if timeout occurred
        if (timeoutOccurred) {
            timeout.unref();
            return;
        }
        
        await fs.promises.chmod(tracerBinPath, '755');
        process.env["OTEL.ENDPOINT"] = otelEndpoint
        process.env["OTEL.TOKEN"] = otelToken

        // Check if timeout occurred
        if (timeoutOccurred) {
            timeout.unref();
            return;
        }

        // Start tracer
        core.debug('Starting tracer...');
        const child = spawn('sudo', ['-E', `OTEL_ENDPOINT=${otelEndpoint} OTEL_TOKEN=${otelToken}`, './tracer-bin'], {
            detached: true,
            stdio: 'ignore',
            env: {
                OTEL_ENDPOINT: otelEndpoint,
                OTEL_TOKEN: otelToken
            }
        });

        // Unref the child to allow the parent process to exit independently
        child.unref();
        
        // Clear the timeout as the operation completed successfully
        if (timeout) clearTimeout(timeout);
        
        core.debug('Tracer started successfully in background');
    } catch (error) {
        // Clear timeout in case of error
        if (timeout) clearTimeout(timeout);
        
        if (error instanceof Error) {
            core.warning(error.message);
        } else {
            core.warning('An unknown error occurred');
        }
    }
}

run(); 