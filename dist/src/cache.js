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
exports.UPLOAD_CACHE_DIR = exports.DOWNLOAD_CACHE_DIR = void 0;
exports.GenerateCacheKeys = GenerateCacheKeys;
exports.RestoreCache = RestoreCache;
exports.ListPathsForCache = ListPathsForCache;
exports.SaveCache = SaveCache;
const cache = __importStar(require("@actions/cache"));
const core = __importStar(require("@actions/core"));
const fs = require('fs');
const path = require('path');
exports.DOWNLOAD_CACHE_DIR = '/tmp/fastci/cache/download';
exports.UPLOAD_CACHE_DIR = '/tmp/fastci/cache/upload';
function GenerateCacheKeys() {
    const repo = process.env.GITHUB_REPOSITORY;
    const operationSystem = process.platform;
    const architecture = process.arch;
    const sourceBranch = process.env.GITHUB_REF_NAME;
    const targetBranch = process.env.GITHUB_BASE_REF;
    const cacheKey = `${repo}:${operationSystem}:${architecture}:${sourceBranch}`;
    const fallbackToCacheFromTargetBranch = `${repo}:${operationSystem}:${architecture}:${targetBranch}`;
    const fallbackToCacheFromRepo = `${repo}:${operationSystem}:${architecture}`;
    return [cacheKey, fallbackToCacheFromTargetBranch, fallbackToCacheFromRepo];
}
async function RestoreCache() {
    const [cacheKey, fallbackToCacheFromTargetBranch, fallbackToCacheFromRepo] = GenerateCacheKeys();
    const cacheHit = await cache.restoreCache([exports.DOWNLOAD_CACHE_DIR], cacheKey, [fallbackToCacheFromTargetBranch, fallbackToCacheFromRepo])
        .catch(error => {
        core.warning(`Error restoring cache: ${error}`);
    });
    if (cacheHit) {
        core.info(`Cache hit for ${cacheKey}`);
    }
    else {
        core.info(`Cache miss for ${[cacheKey, fallbackToCacheFromTargetBranch, fallbackToCacheFromRepo]}`);
    }
}
async function ListPathsForCache() {
    // list all symlinks in the UPLOAD_CACHE_DIR dir and get the paths they target to
    const symlinks = await fs.promises.readdir(exports.UPLOAD_CACHE_DIR);
    const paths = symlinks.map(async (symlink) => fs.promises.readlink(path.join(exports.UPLOAD_CACHE_DIR, symlink)));
    return Promise.all(paths);
}
async function SaveCache() {
    const [cacheKey, fallbackToCacheFromTargetBranch, fallbackToCacheFromRepo] = GenerateCacheKeys();
    const cacheHit = await cache.saveCache([exports.DOWNLOAD_CACHE_DIR], cacheKey)
        .catch(error => {
        core.warning(`Error restoring cache: ${error}`);
    });
    if (cacheHit) {
        core.info(`Cache hit for ${cacheKey}`);
    }
    else {
        core.info(`Cache miss for ${[cacheKey, fallbackToCacheFromTargetBranch, fallbackToCacheFromRepo]}`);
    }
}
