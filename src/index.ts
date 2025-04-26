import * as core from '@actions/core';
import { spawn } from 'child_process';
import * as io from '@actions/io';
import * as tc from '@actions/tool-cache';
import * as path from 'path';
import * as fs from 'fs';
import { exposeRuntime } from './export-gh-env';
import { createSharedLogger } from './logger';

async function run(): Promise<void> {
    try {
        // Get inputs
        // const jfrogUserWriter = core.getInput('jfrog_user_writer', { required: true });
        // const jfrogPasswordWriter = core.getInput('jfrog_password_writer', { required: true });
        const otelEndpoint = core.getInput('fastci_otel_endpoint', { required: true });
        const otelToken = core.getInput('fastci_otel_token', { required: true });
        const tracerVersion = core.getInput('tracer_version');
        core.info('Creating logger');
        const logger = createSharedLogger(
            {
                applicationName: "fastci-github-action",
                privateKey: otelToken,
                subsystemName: "tracer",
                category: "CI"
            }
        );
        // Download tracer binary
        const tracerUrl = `https://github.com/jfrog-fastci/fastci/releases/download/${tracerVersion}/tracer`;
        core.info('Downloading tracer binary.. ' + tracerUrl);
        logger.debug('Downloading tracer binary.. ' + tracerUrl);
        const tracerPath = await tc.downloadTool(tracerUrl);

        // Move to tracer-bin and make executable
        const tracerBinPath = path.join(process.cwd(), 'tracer-bin');
        await io.cp(tracerPath, tracerBinPath);
        await fs.promises.chmod(tracerBinPath, '755');
        process.env["OTEL.ENDPOINT"] = otelEndpoint
        process.env["OTEL.TOKEN"] = otelToken
        
        // expose github actions env variables
        core.debug('Exposing runtime environment variables starting with GITHUB_');
        await exposeRuntime();
        
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

        core.debug('Tracer started successfully in background');
    } catch (error) {
        if (error instanceof Error) {
            core.warning(error.message);
        } else {
            core.warning('An unknown error occurred');
        }
    }
}

run(); 