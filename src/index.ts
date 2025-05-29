import * as core from '@actions/core';
import { spawn } from 'child_process';
import * as io from '@actions/io';
import * as tc from '@actions/tool-cache';
import * as fs from 'fs';
import { getGithubLogMetadata, sendCoralogixLog, sendSessionStartLog } from './sendCoralogixLog';
import { InitializeCacheFolders, RestoreCache, } from './cache';

// Check if a command exists by trying to access it
async function commandExists(command: string): Promise<boolean> {
    try {
        await io.which(command, true);
        return true;
    } catch (error) {
        return false;
    }
}

// Helper to fetch all required inputs
function getInputs() {
    return {
        otelEndpoint: core.getInput('fastci_otel_endpoint', { required: true }),
        otelToken: core.getInput('fastci_otel_token', { required: true }),
        tracerVersion: core.getInput('tracer_version'),
        trackFiles: core.getInput('tracer_track_files'),
    };
}

// Helper to resolve architecture and binary name
function resolveBinaryName(arch: string) {
    const architectureToTracerVersionMap = {
        'x64': 'tracer-amd64',
        'arm64': 'tracer-arm64',
        'arm': 'tracer-arm64',
    };
    if (!Object.prototype.hasOwnProperty.call(architectureToTracerVersionMap, arch)) {
        return null;
    }
    return architectureToTracerVersionMap[arch as keyof typeof architectureToTracerVersionMap];
}

// Download and setup tracer binary
async function downloadAndSetupTracer(tracerVersion: string, binaryName: string): Promise<string> {
    const tracerUrl = `https://github.com/jfrog-fastci/fastci/releases/download/${tracerVersion}/${binaryName}`;
    core.debug('Downloading tracer binary.. ' + tracerUrl);
    const tracerPath = await tc.downloadTool(tracerUrl, "./tracer-bin" );
    core.debug(`Downloaded tracer to: ${tracerPath}`);
    if (!fs.existsSync(tracerPath)) {
        throw new Error(`Tracer binary not found at ${tracerPath} after copy`);
    }
    await fs.promises.chmod(tracerPath, 0o755);
    core.debug(`Tracer binary is present and chmodded at: ${tracerPath}`);
    return tracerPath;
}

// Set up environment variables for tracer
function setupTracerEnv(otelEndpoint: string, otelToken: string, trackFiles: string) {
    return {
        OTEL_ENDPOINT: otelEndpoint,
        OTEL_TOKEN: otelToken,
        MONITOR_FILES: trackFiles,
    };
}

// Spawn tracer process with sudo
function spawnTracerWithSudo(tracerBinPath: string, envVars: any) {
    return spawn('sudo', ['-E', `OTEL_ENDPOINT=${envVars.OTEL_ENDPOINT} OTEL_TOKEN=${envVars.OTEL_TOKEN} MONITOR_FILES=${envVars.MONITOR_FILES}`, tracerBinPath], {
        detached: true,
        stdio: 'ignore',
        env: {
            OTEL_ENDPOINT: envVars.OTEL_ENDPOINT,
            OTEL_TOKEN: envVars.OTEL_TOKEN,
        },
    });
}

// Spawn tracer process without sudo
function spawnTracerWithoutSudo(tracerBinPath: string, envVars: any) {
    return spawn(tracerBinPath, [], {
        detached: true,
        stdio: 'ignore',
        env: envVars,
    });
}

// Handle child process error and logging
function handleChildProcess(child: any, logMsg: string, logMeta: any) {
    child.on('error', (err: any) => {
        core.warning(`Failed to start tracer: ${err.message}`);
        sendCoralogixLog(`Failed to start tracer: ${err.message}`, {
            ...logMeta,
            severity: 4,
            category: 'error',
        });
    });
    sendCoralogixLog(logMsg, {
        ...logMeta,
        severity: 3,
        category: 'debug',
    });
}

async function RunTracer(): Promise<void> {
    try {

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
                ...getGithubLogMetadata(),
            });
            process.exit(0);
        }, 5000);


        await sendSessionStartLog();
        const { otelEndpoint, otelToken, tracerVersion, trackFiles } = getInputs();
        const architecture = process.arch;
        const binaryName = resolveBinaryName(architecture);
        if (!binaryName) {
            core.warning(`Unsupported architecture: ${architecture}. Skipping tracer setup.`);
            return;
        }
        const tracerBinPath = await downloadAndSetupTracer(tracerVersion, binaryName);
        const envVars = setupTracerEnv(otelEndpoint, otelToken, trackFiles);
        core.info('Starting tracer...');
        const sudoAvailable = await commandExists('sudo');
        let child;
        const logMeta = {
            subsystemName: process.env.GITHUB_REPOSITORY || 'unknown',
            ...getGithubLogMetadata(),
        };
        if (sudoAvailable) {
            child = spawnTracerWithSudo(tracerBinPath, envVars);
            handleChildProcess(child, 'Tracer started successfully with sudo in background', logMeta);
            core.info('Tracer started successfully with sudo in background');
        } else {
            core.warning('sudo is not available, trying to run tracer without sudo');
            child = spawnTracerWithoutSudo(tracerBinPath, envVars);
            handleChildProcess(child, 'Tracer started successfully without sudo in background', logMeta);
            core.info('Tracer started successfully without sudo in background');
        }
        // check with ps that the tracer-bin is running
        const ps = await spawn('ps', ['-ef']);
        const psOutput = await ps.stdout.read();
        core.debug(psOutput);
        if (psOutput.includes(tracerBinPath)) {
            core.info('Tracer is running');
        }
        child.unref();
        clearTimeout(timeout);
        core.debug('Tracer setup completed');
    } catch (error) {
        await sendCoralogixLog(error, {
            subsystemName: process.env.GITHUB_REPOSITORY || 'unknown',
            severity: 5,
            category: 'error',
            ...getGithubLogMetadata(),
        });
        if (error instanceof Error) {
            core.warning(error.message);
        } else {
            core.warning('An unknown error occurred');
        }
    }
}



async function RunSetup() {
    InitializeCacheFolders();
    // Load cache
    await RestoreCache();

    // start the tracer
    await RunTracer();
}

RunSetup();