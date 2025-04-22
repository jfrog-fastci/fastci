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
const fs = __importStar(require("fs"));
const runner_1 = require("./otel-cicd-action/runner");
const constants_1 = require("./types/constants");
async function runOtelExport() {
    try {
        await (0, runner_1.RunCiCdOtelExport)();
    }
    catch (error) {
        core.error(error);
    }
}
async function createTriggerFile() {
    core.debug('Setting trigger file to stop tracer');
    fs.mkdirSync(constants_1.FASTCI_TEMP_DIR, { recursive: true });
    fs.writeFileSync(constants_1.TRIGGER_FILE_PATH, '');
}
async function waitForProcessTreesFile(timeoutSeconds) {
    const startTime = Date.now();
    let lastLogTime = 0;
    core.debug(`Waiting for tracer process to stop (timeout: ${timeoutSeconds}s)...`);
    while (true) {
        const currentTime = Date.now();
        const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
        // Break out after timeout period
        if (elapsedSeconds >= timeoutSeconds) {
            core.debug(`Timeout of ${timeoutSeconds}s reached. Stopping wait.`);
            return false;
        }
        // Check if the file exists and has content
        if (fs.existsSync(constants_1.PROCESS_TREES_PATH)) {
            try {
                const stats = fs.statSync(constants_1.PROCESS_TREES_PATH);
                if (stats.size > 0) {
                    core.debug('process_trees.json file has content, continuing...');
                    return true;
                }
            }
            catch (error) {
                core.debug(`Error checking file: ${error}`);
            }
        }
        // Only log every 5 seconds to avoid flooding the logs
        if (currentTime - lastLogTime >= 1000) {
            core.debug(`Still waiting for process_trees.json to have content... (${elapsedSeconds}s elapsed)`);
            lastLogTime = currentTime;
        }
        await new Promise(resolve => setTimeout(resolve, 200));
    }
}
// async function displayProcessTreesFile(): Promise<void> {
//     if (fs.existsSync(PROCESS_TREES_PATH)) {
//         await exec(`cat ${PROCESS_TREES_PATH}`);
//         core.info('Tracer process stopped successfully');
//     } else {
//         core.info('process_trees.json file does not exist after waiting');
//     }
// }
async function verifyProcessTreesExists() {
    if (fs.existsSync(constants_1.PROCESS_TREES_PATH)) {
        core.debug('process_trees.json file found successfully');
    }
    else {
        core.debug('process_trees.json file does not exist');
    }
}
async function stopTracerProcess() {
    try {
        core.debug('Stopping tracer process...');
        await createTriggerFile();
        const timeoutSeconds = 2;
        await waitForProcessTreesFile(timeoutSeconds);
        // await displayProcessTreesFile();
    }
    catch (error) {
        core.debug(error);
        core.debug('No tracer process found or unable to stop it');
    }
}
async function cleanup() {
    try {
        await stopTracerProcess();
        await verifyProcessTreesExists();
        await runOtelExport();
        core.debug('Cleanup completed');
    }
    catch (error) {
        if (error instanceof Error) {
            core.warning(`Cleanup failed: ${error.message}`);
        }
        else {
            core.warning('Cleanup failed with an unknown error');
        }
        // Don't fail the action if cleanup fails
    }
}
cleanup();
