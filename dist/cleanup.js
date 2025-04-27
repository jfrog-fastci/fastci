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
const exec_1 = require("@actions/exec");
const fs = __importStar(require("fs"));
async function cleanup() {
    try {
        core.info('Stopping tracer process...');
        // Try to find tracer processes
        try {
            // Find and kill running tracer process
            await (0, exec_1.exec)('pkill', ['-f', 'tracer-bin']);
            core.info('Tracer process stopped successfully');
        }
        catch (error) {
            core.info('No tracer process found or unable to stop it');
        }
        // Clean up the binary if it exists
        if (fs.existsSync('./tracer-bin')) {
            try {
                fs.unlinkSync('./tracer-bin');
                core.info('Tracer binary removed');
            }
            catch (error) {
                core.warning('Failed to remove tracer binary');
            }
        }
        core.info('Cleanup completed');
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
