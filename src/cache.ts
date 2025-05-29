import * as cache from '@actions/cache';
import * as core from '@actions/core';
const fs = require('fs');
const path = require('path');

export const DOWNLOAD_CACHE_DIR = '/tmp/fastci/cache/download';
export const UPLOAD_CACHE_DIR = '/tmp/fastci/cache/upload';


export function GenerateCacheKeys(): string[] {
    const repo = process.env.GITHUB_REPOSITORY;
    const operationSystem = process.platform;
    const architecture = process.arch;
    const sourceBranch = process.env.GITHUB_REF;
    const targetBranch = process.env.GITHUB_BASE_REF;
    const cacheKey = `${repo}:${operationSystem}:${architecture}:${sourceBranch}`;
    const fallbackToCacheFromTargetBranch = `${repo}:${operationSystem}:${architecture}:${targetBranch}`;
    const fallbackToCacheFromRepo = `${repo}:${operationSystem}:${architecture}`;
    return [cacheKey, fallbackToCacheFromTargetBranch, fallbackToCacheFromRepo];
}

export async function RestoreCache() {
    const [cacheKey, fallbackToCacheFromTargetBranch, fallbackToCacheFromRepo] = GenerateCacheKeys();
    const cacheHit = await cache.restoreCache([DOWNLOAD_CACHE_DIR], cacheKey, [fallbackToCacheFromTargetBranch, fallbackToCacheFromRepo])
        .catch(error => {
            core.warning(`Error restoring cache: ${error}`);
        });

    if (cacheHit) {
        core.info(`Cache hit for ${cacheKey}`);
    } else {
        core.info(`Cache miss for ${[cacheKey, fallbackToCacheFromTargetBranch, fallbackToCacheFromRepo]}`);
    }
    // todo symlin to paths in DOWNLOAD_CACHE_DIR
}

export async function ListPathsForCache() {
    // list all symlinks in the UPLOAD_CACHE_DIR dir and get the paths they target to
    const symlinks = await fs.promises.readdir(UPLOAD_CACHE_DIR);
    const paths = symlinks.map(async (symlink: string) => fs.promises.readlink(path.join(UPLOAD_CACHE_DIR, symlink)));
    return Promise.all(paths);
}

export async function SaveCache() {
    const paths = await ListPathsForCache();
    const [cacheKey, _, __] = GenerateCacheKeys();
    core.info(`Saving cache for ${cacheKey} with paths ${paths}`);
    const result = await cache.saveCache(paths, cacheKey)
        .catch(error => {
            core.warning(`Error saving cache: ${error}`);
        });

    if (result) {
        core.info(`Cache uploaded with id ${result} for ${cacheKey}`);
    } else {
        core.info(`Cache uploaded failed for ${[cacheKey]}`);
    }

}