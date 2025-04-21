import * as core from '@actions/core';

export async function exposeRuntime() {
  core.info('Exposing runtime environment variables starting with GITHUB_');
  Object.keys(process.env).forEach(function (key) {
    if (key.startsWith('GITHUB_')) {
      core.info(`${key}=${process.env[key]}`);
      core.exportVariable(key, process.env[key]);
    }
  });
}