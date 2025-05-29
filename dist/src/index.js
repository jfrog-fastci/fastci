"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const child_process_1 = require("child_process");
const io = __importStar(require("@actions/io"));
const tc = __importStar(require("@actions/tool-cache"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const sendCoralogixLog_1 = require("./sendCoralogixLog");
const cache_1 = require("./cache");
// Check if a command exists by trying to access it
async function commandExists(command) {
    try {
        await io.which(command, true);
        return true;
    }
    catch (error) {
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
function resolveBinaryName(arch) {
    const architectureToTracerVersionMap = {
        'x64': 'tracer-amd64',
        'arm64': 'tracer-arm64',
        'arm': 'tracer-arm64',
    };
    if (!Object.prototype.hasOwnProperty.call(architectureToTracerVersionMap, arch)) {
        return null;
    }
    return architectureToTracerVersionMap[arch];
}
// Download and setup tracer binary
async function downloadAndSetupTracer(tracerVersion, binaryName) {
    const tracerUrl = `https://github.com/jfrog-fastci/fastci/releases/download/${tracerVersion}/${binaryName}`;
    core.debug('Downloading tracer binary.. ' + tracerUrl);
    const tracerPath = await tc.downloadTool(tracerUrl);
    const tracerBinPath = path.join(process.cwd(), 'tracer-bin');
    await io.cp(tracerPath, tracerBinPath);
    await fs.promises.chmod(tracerBinPath, '755');
    return tracerBinPath;
}
// Set up environment variables for tracer
function setupTracerEnv(otelEndpoint, otelToken, trackFiles) {
    return {
        OTEL_ENDPOINT: otelEndpoint,
        OTEL_TOKEN: otelToken,
        MONITOR_FILES: trackFiles,
    };
}
// Spawn tracer process with sudo
function spawnTracerWithSudo(tracerBinPath, envVars) {
    return (0, child_process_1.spawn)('sudo', ['-E', `OTEL_ENDPOINT=${envVars.OTEL_ENDPOINT} OTEL_TOKEN=${envVars.OTEL_TOKEN} MONITOR_FILES=${envVars.MONITOR_FILES}`, tracerBinPath], {
        detached: true,
        stdio: 'ignore',
        env: {
            OTEL_ENDPOINT: envVars.OTEL_ENDPOINT,
            OTEL_TOKEN: envVars.OTEL_TOKEN,
        },
    });
}
// Spawn tracer process without sudo
function spawnTracerWithoutSudo(tracerBinPath, envVars) {
    return (0, child_process_1.spawn)(tracerBinPath, [], {
        detached: true,
        stdio: 'ignore',
        env: envVars,
    });
}
// Handle child process error and logging
function handleChildProcess(child, logMsg, logMeta) {
    child.on('error', (err) => {
        core.warning(`Failed to start tracer: ${err.message}`);
        (0, sendCoralogixLog_1.sendCoralogixLog)(`Failed to start tracer: ${err.message}`, {
            ...logMeta,
            severity: 4,
            category: 'error',
        });
    });
    (0, sendCoralogixLog_1.sendCoralogixLog)(logMsg, {
        ...logMeta,
        severity: 3,
        category: 'debug',
    });
}
async function RunTracer() {
    try {
        if (process.platform !== 'linux') {
            core.info('This runner is not Linux-based. Skipping tracer setup.');
            return;
        }
        const timeout = setTimeout(async () => {
            core.debug('Reached timeout duraing setup, exiting');
            (0, sendCoralogixLog_1.sendCoralogixLog)('Reached timeout duraing setup, exiting', {
                subsystemName: process.env.GITHUB_REPOSITORY || 'unknown',
                severity: 5,
                category: 'error',
                ...(0, sendCoralogixLog_1.getGithubLogMetadata)(),
            });
            process.exit(0);
        }, 5000);
        await (0, sendCoralogixLog_1.sendSessionStartLog)();
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
            ...(0, sendCoralogixLog_1.getGithubLogMetadata)(),
        };
        if (sudoAvailable) {
            child = spawnTracerWithSudo(tracerBinPath, envVars);
            handleChildProcess(child, 'Tracer started successfully with sudo in background', logMeta);
            core.info('Tracer started successfully with sudo in background');
        }
        else {
            core.warning('sudo is not available, trying to run tracer without sudo');
            child = spawnTracerWithoutSudo(tracerBinPath, envVars);
            handleChildProcess(child, 'Tracer started successfully without sudo in background', logMeta);
            core.info('Tracer started successfully without sudo in background');
        }
        child.unref();
        clearTimeout(timeout);
        core.debug('Tracer setup completed');
    }
    catch (error) {
        await (0, sendCoralogixLog_1.sendCoralogixLog)(error, {
            subsystemName: process.env.GITHUB_REPOSITORY || 'unknown',
            severity: 5,
            category: 'error',
            ...(0, sendCoralogixLog_1.getGithubLogMetadata)(),
        });
        if (error instanceof Error) {
            core.warning(error.message);
        }
        else {
            core.warning('An unknown error occurred');
        }
    }
}
async function RunSetup() {
    // Load cache
    await (0, cache_1.RestoreCache)();
    // start the tracer
    await RunTracer();
}
RunSetup();
