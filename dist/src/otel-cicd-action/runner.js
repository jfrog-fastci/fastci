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
exports.RunCiCdOtelExport = RunCiCdOtelExport;
exports.loadProcessTrees = loadProcessTrees;
const core = __importStar(require("@actions/core"));
const github_1 = require("@actions/github");
const request_error_1 = require("@octokit/request-error");
const semantic_conventions_1 = require("@opentelemetry/semantic-conventions");
const incubating_1 = require("@opentelemetry/semantic-conventions/incubating");
const github_2 = require("./github");
const constants_1 = require("../types/constants");
const fs = __importStar(require("fs"));
const tracer_1 = require("./tracer");
const workflow_1 = require("./trace/workflow");
async function fetchGithub(token, runId) {
    const octokit = (0, github_1.getOctokit)(token);
    core.debug(`Get workflow run for ${runId}`);
    const workflowRun = await (0, github_2.getWorkflowRun)(github_1.context, octokit, runId);
    core.debug("Get jobs");
    const jobs = await (0, github_2.listJobsForWorkflowRun)(github_1.context, octokit, runId);
    core.debug("Get job annotations");
    const jobsId = (jobs ?? []).map((job) => job.id);
    let jobAnnotations = {};
    try {
        jobAnnotations = await (0, github_2.getJobsAnnotations)(github_1.context, octokit, jobsId);
    }
    catch (error) {
        if (error instanceof request_error_1.RequestError) {
            core.debug(`Failed to get job annotations: ${error.message}}`);
        }
        else {
            throw error;
        }
    }
    core.debug("Get PRs labels");
    const prNumbers = (workflowRun.pull_requests ?? []).map((pr) => pr.number);
    let prLabels = {};
    try {
        prLabels = await (0, github_2.getPRsLabels)(github_1.context, octokit, prNumbers);
    }
    catch (error) {
        if (error instanceof request_error_1.RequestError) {
            core.debug(`Failed to get PRs labels: ${error.message}}`);
        }
        else {
            throw error;
        }
    }
    return { workflowRun, jobs, jobAnnotations, prLabels };
}
async function RunCiCdOtelExport() {
    try {
        const otlpEndpoint = core.getInput("fastci_otel_endpoint");
        const otlpToken = core.getInput("fastci_otel_token");
        const otlpHeaders = `Authorization=Bearer ${otlpToken}`;
        const otelServiceName = core.getInput("otelServiceName") || process.env["OTEL_SERVICE_NAME"] || "";
        const runId = Number.parseInt(core.getInput("runId") || `${github_1.context.runId}`);
        const extraAttributes = (0, tracer_1.stringToRecord)(core.getInput("extra_attributes"));
        const ghToken = core.getInput("github_token") || process.env["GITHUB_TOKEN"] || "";
        core.debug("Use Github API to fetch workflow data");
        const { workflowRun, jobs, jobAnnotations, prLabels } = await fetchGithub(ghToken, runId);
        // core.info(`Jobs: ${JSON.stringify(jobs)}`);
        core.debug(`Create tracer provider for ${otlpEndpoint}`);
        const attributes = {
            [semantic_conventions_1.ATTR_SERVICE_NAME]: otelServiceName || workflowRun.name || `${workflowRun.workflow_id}`,
            [incubating_1.ATTR_SERVICE_INSTANCE_ID]: [
                workflowRun.repository.full_name,
                `${workflowRun.workflow_id}`,
                `${workflowRun.id}`,
                `${workflowRun.run_attempt ?? 1}`,
            ].join("/"),
            [incubating_1.ATTR_SERVICE_NAMESPACE]: workflowRun.repository.full_name,
            [semantic_conventions_1.ATTR_SERVICE_VERSION]: workflowRun.head_sha,
            ...extraAttributes,
        };
        const provider = (0, tracer_1.createTracerProvider)(otlpEndpoint, otlpHeaders, attributes);
        const processTrees = loadProcessTrees();
        // core.info(`Process trees: ${JSON.stringify(processTrees, null, 2)}`);
        core.debug(`Trace workflow run for ${runId} and export to ${otlpEndpoint}`);
        const traceId = await (0, workflow_1.traceWorkflowRun)(processTrees, workflowRun, jobs, jobAnnotations, prLabels);
        core.setOutput("traceId", traceId);
        core.debug(`traceId: ${traceId}`);
        core.debug("Flush and shutdown tracer provider");
        await provider.forceFlush();
        await provider.shutdown();
        core.debug("Provider shutdown");
    }
    catch (error) {
        const message = error instanceof Error ? error : JSON.stringify(error);
        core.setFailed(message);
    }
}
function loadProcessTrees() {
    const startTime = Date.now();
    try {
        if (!fs.existsSync(constants_1.PROCESS_TREES_PATH)) {
            core.debug(`Process trees file does not exist at ${constants_1.PROCESS_TREES_PATH}`);
            return [];
        }
        const fileContent = fs.readFileSync(constants_1.PROCESS_TREES_PATH, 'utf-8');
        if (!fileContent || fileContent.trim() === '') {
            core.debug('Process trees file is empty');
            return [];
        }
        const processTrees = JSON.parse(fileContent);
        const duration = Date.now() - startTime;
        core.debug(`Loaded ${processTrees.length} process trees in ${duration}ms`);
        return processTrees;
    }
    catch (error) {
        core.error(`Failed to load process trees: ${error instanceof Error ? error.message : String(error)}`);
        return [];
    }
    finally {
        const totalDuration = Date.now() - startTime;
        core.debug(`Total time to process and load trees: ${totalDuration}ms`);
    }
}
