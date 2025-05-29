import * as cache from '@actions/cache';
import * as core from '@actions/core';
import * as fs from 'fs';
import * as path from 'path';

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
    return [Buffer.from(cacheKey).toString('base64'), Buffer.from(fallbackToCacheFromTargetBranch).toString('base64'), Buffer.from(fallbackToCacheFromRepo).toString('base64')];
}

export function InitializeCacheFolders() {
    if (!fs.existsSync(DOWNLOAD_CACHE_DIR)) {
        fs.mkdirSync(DOWNLOAD_CACHE_DIR, { recursive: true });
    }
    if (!fs.existsSync(UPLOAD_CACHE_DIR)) {
        fs.mkdirSync(UPLOAD_CACHE_DIR, { recursive: true });
    }
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
    core.info(`Saving cache`);
    const paths = await ListPathsForCache();
    if (paths.length === 0) {
        core.info(`No paths to save cache for`);
        return;
    }
    core.info(`Paths: ${paths}`);
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