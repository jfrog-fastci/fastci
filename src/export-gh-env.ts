import * as core from '@actions/core';

export async function exposeRuntime() {
  
  Object.keys(process.env).forEach(function (key) {
    if (key.startsWith('GITHUB_')) {
      core.exportVariable(key, process.env[key]);
    }
  });
}