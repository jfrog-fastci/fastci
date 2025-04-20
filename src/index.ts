import * as core from '@actions/core';
import { spawn } from 'child_process';
import * as io from '@actions/io';
import * as tc from '@actions/tool-cache';
import * as path from 'path';
import * as fs from 'fs';

async function run(): Promise<void> {
    try {
        // Get inputs
        // const jfrogUserWriter = core.getInput('jfrog_user_writer', { required: true });
        // const jfrogPasswordWriter = core.getInput('jfrog_password_writer', { required: true });
        const otelEndpoint = core.getInput('fastci_otel_endpoint', { required: true });
        const otelToken = core.getInput('fastci_otel_token', { required: true });
        const tracerVersion = core.getInput('tracer_version');

        // Download tracer binary
        const tracerUrl = `https://github.com/fastci-dev/tracer-bin/releases/download/${tracerVersion}/tracer`;
        core.info('Downloading tracer binary.. ' + tracerUrl);
        const tracerPath = await tc.downloadTool(tracerUrl);

        // Move to tracer-bin and make executable
        const tracerBinPath = path.join(process.cwd(), 'tracer-bin');
        await io.cp(tracerPath, tracerBinPath);
        await fs.promises.chmod(tracerBinPath, '755');
        process.env["OTEL.ENDPOINT"] = otelEndpoint
        process.env["OTEL.TOKEN"] = otelToken
        // Start tracer
        core.info('Starting tracer...');
        core.info(otelEndpoint);
        core.info(otelToken);
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

        core.info('Tracer started successfully in background');
    } catch (error) {
        if (error instanceof Error) {
            core.setFailed(error.message);
        } else {
            core.setFailed('An unknown error occurred');
        }
    }
}

run(); 