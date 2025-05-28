import * as core from '@actions/core';
import { spawn } from 'child_process';
import * as io from '@actions/io';
import * as tc from '@actions/tool-cache';
import * as path from 'path';
import * as fs from 'fs';
import { getGithubLogMetadata, sendCoralogixLog, sendSessionStartLog } from './sendCoralogixLog';

// Check if a command exists by trying to access it
async function commandExists(command: string): Promise<boolean> {
    try {
        await io.which(command, true);
        return true;
    } catch (error) {
        return false;
    }
}

async function run(): Promise<void> {
    try {
        // Check if the runner is Linux-based
        if (process.platform !== 'linux') {
            core.info('This runner is not Linux-based. Skipping tracer setup.');
            return;
        }
        const timeout = setTimeout(async () => {
            core.debug('Reached timeout duraing setup, exiting');
            sendCoralogixLog('Reached timeout duraing setup, exiting', {
                subsystemName: process.env.GITHUB_REPOSITORY || 'unknown',
                severity: 5,
                category: 'error',
                ...getGithubLogMetadata()
            });
            process.exit(0);

        }, 5000)
        await sendSessionStartLog();
        // Get inputs
        // const jfrogUserWriter = core.getInput('jfrog_user_writer', { required: true });
        // const jfrogPasswordWriter = core.getInput('jfrog_password_writer', { required: true });
        const otelEndpoint = core.getInput('fastci_otel_endpoint', { required: true });
        const otelToken = core.getInput('fastci_otel_token', { required: true });
        const tracerVersion = core.getInput('tracer_version');
        const architectureToTracerVersionMap = {
            'x64': 'tracer-amd64',
            'arm64': 'tracer-arm64',
            'arm': 'tracer-arm64'
        }
        const architecture = process.arch as keyof typeof architectureToTracerVersionMap;

        if (!Object.prototype.hasOwnProperty.call(architectureToTracerVersionMap, architecture)) {
            core.warning(`Unsupported architecture: ${architecture}. Skipping tracer setup.`);
            return;
        }
        const binaryName = architectureToTracerVersionMap[architecture];


        // Download tracer binary
        const tracerUrl = `https://github.com/jfrog-fastci/fastci/releases/download/${tracerVersion}/${binaryName}`
        core.debug('Downloading tracer binary.. ' + tracerUrl);
        const tracerPath = await tc.downloadTool(tracerUrl);

        // Move to tracer-bin and make executable
        const tracerBinPath = path.join(process.cwd(), 'tracer-bin');
        await io.cp(tracerPath, tracerBinPath);
        await fs.promises.chmod(tracerBinPath, '755');
        process.env["OTEL.ENDPOINT"] = otelEndpoint
        process.env["OTEL.TOKEN"] = otelToken

        // Start tracer
        core.info('Starting tracer...');

        // Check if sudo is available
        const sudoAvailable = await commandExists('sudo');
        let child;

        const trackFiles = core.getInput('tracer_track_files');

        if (sudoAvailable) {
            child = spawn('sudo', ['-E', `OTEL_ENDPOINT=${otelEndpoint} OTEL_TOKEN=${otelToken} MONITOR_FILES=${trackFiles}`, './tracer-bin'], {
                detached: true,
                stdio: 'ignore',
                env: {
                    OTEL_ENDPOINT: otelEndpoint,
                    OTEL_TOKEN: otelToken
                }
            });

            // Handle the error properly instead of just unref-ing
            child.on('error', (err) => {
                core.warning(`Failed to start tracer: ${err.message}`);
                sendCoralogixLog(`Failed to start tracer: ${err.message}`, {
                    subsystemName: process.env.GITHUB_REPOSITORY || 'unknown',
                    severity: 4,
                    category: 'error',
                    ...getGithubLogMetadata()
                });
            });
            await sendCoralogixLog('Tracer started successfully with sudo in background', {
                subsystemName: process.env.GITHUB_REPOSITORY || 'unknown',
                severity: 3,
                category: 'debug',
                ...getGithubLogMetadata()
            })

            core.info('Tracer started successfully with sudo in background');
        } else {
            // Try to run without sudo if it's not available
            core.warning('sudo is not available, trying to run tracer without sudo');
            child = spawn('./tracer-bin', [], {
                detached: true,
                stdio: 'ignore',
                env: {
                    MONITOR_FILES: String(trackFiles),
                    OTEL_ENDPOINT: otelEndpoint,
                    OTEL_TOKEN: otelToken
                }
            });

            child.on('error', (err) => {
                core.warning(`Failed to start tracer: ${err.message}`);
                sendCoralogixLog(`Failed to start tracer: ${err.message}`, {
                    subsystemName: process.env.GITHUB_REPOSITORY || 'unknown',
                    severity: 4,
                    category: 'error',
                    ...getGithubLogMetadata()
                });
            });
            await sendCoralogixLog('Tracer started successfully without sudo in background', {
                subsystemName: process.env.GITHUB_REPOSITORY || 'unknown',
                severity: 3,
                category: 'debug',
                ...getGithubLogMetadata()
            })
            core.info('Tracer started successfully without sudo in background');
        }
        child.unref();

        clearTimeout(timeout);

        core.debug('Tracer setup completed');
    } catch (error) {
        await sendCoralogixLog(error, {
            subsystemName: process.env.GITHUB_REPOSITORY || 'unknown',
            severity: 5,
            category: 'error',
            ...getGithubLogMetadata()
        });
        if (error instanceof Error) {
            core.warning(error.message);
        } else {
            core.warning('An unknown error occurred');
        }
    }
}

run();