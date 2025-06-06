"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.warning = exports.setFailed = exports.setOutput = exports.getInput = exports.info = exports.error = exports.debug = void 0;
const globals_1 = require("@jest/globals");
exports.debug = globals_1.jest.fn();
exports.error = globals_1.jest.fn();
exports.info = globals_1.jest.fn();
exports.getInput = globals_1.jest.fn();
exports.setOutput = globals_1.jest.fn();
exports.setFailed = globals_1.jest.fn();
exports.warning = globals_1.jest.fn();
