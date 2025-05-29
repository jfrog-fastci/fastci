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
exports.traceWorkflowRun = traceWorkflowRun;
const api_1 = require("@opentelemetry/api");
const incubating_1 = require("@opentelemetry/semantic-conventions/incubating");
const job_1 = require("./job");
const core = __importStar(require("@actions/core"));
async function traceWorkflowRun(processTrees, workflowRun, jobs, jobAnnotations, prLabels) {
    const tracer = api_1.trace.getTracer("otel-cicd-action");
    const startTime = new Date(workflowRun.run_started_at ?? workflowRun.created_at);
    const attributes = workflowRunToAttributes(workflowRun, prLabels);
    return await tracer.startActiveSpan(workflowRun.name ?? workflowRun.display_title, { attributes, root: true, startTime }, async (rootSpan) => {
        const code = workflowRun.conclusion === "failure" ? api_1.SpanStatusCode.ERROR : api_1.SpanStatusCode.OK;
        rootSpan.setStatus({ code });
        if (jobs && jobs.length > 0) {
            // "Queued" span represent the time between the workflow has been started_at and
            // the first job has been picked up by a runner
            const queuedSpan = tracer.startSpan("Queued", { startTime }, api_1.context.active());
            queuedSpan.end(new Date(jobs[0].started_at));
        }
        for (const job of jobs) {
            core.debug(`Tracing job ${job.name}`);
            await (0, job_1.traceJob)(processTrees, job, jobAnnotations[job.id]);
        }
        rootSpan.end(new Date(workflowRun.updated_at));
        return rootSpan.spanContext().traceId;
    });
}
function workflowRunToAttributes(workflowRun, prLabels) {
    return {
        // OpenTelemetry semantic convention CICD Pipeline Attributes
        // https://opentelemetry.io/docs/specs/semconv/attributes-registry/cicd/
        [incubating_1.ATTR_CICD_PIPELINE_NAME]: workflowRun.name ?? undefined,
        [incubating_1.ATTR_CICD_PIPELINE_RUN_ID]: workflowRun.id,
        "github.workflow_id": workflowRun.workflow_id,
        "github.run_id": workflowRun.id,
        "github.run_number": workflowRun.run_number,
        "github.run_attempt": workflowRun.run_attempt ?? 1,
        ...referencedWorkflowsToAttributes(workflowRun.referenced_workflows),
        "github.url": workflowRun.url,
        "github.html_url": workflowRun.html_url,
        "github.workflow_url": workflowRun.workflow_url,
        "github.event": workflowRun.event,
        "github.status": workflowRun.status ?? undefined,
        "github.workflow": workflowRun.name ?? undefined,
        "github.node_id": workflowRun.node_id,
        "github.check_suite_id": workflowRun.check_suite_id,
        "github.check_suite_node_id": workflowRun.check_suite_node_id,
        "github.conclusion": workflowRun.conclusion ?? undefined,
        "github.created_at": workflowRun.created_at,
        "github.updated_at": workflowRun.updated_at,
        "github.run_started_at": workflowRun.run_started_at,
        "github.jobs_url": workflowRun.jobs_url,
        "github.logs_url": workflowRun.logs_url,
        "github.check_suite_url": workflowRun.check_suite_url,
        "github.artifacts_url": workflowRun.artifacts_url,
        "github.cancel_url": workflowRun.cancel_url,
        "github.rerun_url": workflowRun.rerun_url,
        "github.previous_attempt_url": workflowRun.previous_attempt_url ?? undefined,
        ...headCommitToAttributes(workflowRun.head_commit),
        "github.head_branch": workflowRun.head_branch ?? undefined,
        "github.head_sha": workflowRun.head_sha,
        "github.path": workflowRun.path,
        "github.display_title": workflowRun.display_title,
        error: workflowRun.conclusion === "failure",
        ...prsToAttributes(workflowRun.pull_requests, prLabels),
    };
}
function referencedWorkflowsToAttributes(refs) {
    const attributes = {};
    for (let i = 0; refs && i < refs?.length; i++) {
        const ref = refs[i];
        const prefix = `github.referenced_workflows.${i}`;
        attributes[`${prefix}.path`] = ref.path;
        attributes[`${prefix}.sha`] = ref.sha;
        attributes[`${prefix}.ref`] = ref.ref;
    }
    return attributes;
}
function headCommitToAttributes(head_commit) {
    return {
        "github.head_commit.id": head_commit?.id,
        "github.head_commit.tree_id": head_commit?.tree_id,
        "github.head_commit.author.name": head_commit?.author?.name,
        "github.head_commit.author.email": head_commit?.author?.email,
        "github.head_commit.committer.name": head_commit?.committer?.name,
        "github.head_commit.committer.email": head_commit?.committer?.email,
        "github.head_commit.message": head_commit?.message,
        "github.head_commit.timestamp": head_commit?.timestamp,
    };
}
function prsToAttributes(pullRequests, prLabels) {
    const attributes = {
        "github.head_ref": pullRequests?.[0]?.head?.ref,
        "github.base_ref": pullRequests?.[0]?.base?.ref,
        "github.base_sha": pullRequests?.[0]?.base?.sha,
    };
    for (let i = 0; pullRequests && i < pullRequests?.length; i++) {
        const pr = pullRequests[i];
        const prefix = `github.pull_requests.${i}`;
        attributes[`${prefix}.id`] = pr.id;
        attributes[`${prefix}.url`] = pr.url;
        attributes[`${prefix}.number`] = pr.number;
        attributes[`${prefix}.labels`] = prLabels[pr.number];
        attributes[`${prefix}.head.sha`] = pr.head.sha;
        attributes[`${prefix}.head.ref`] = pr.head.ref;
        attributes[`${prefix}.head.repo.id`] = pr.head.repo.id;
        attributes[`${prefix}.head.repo.url`] = pr.head.repo.url;
        attributes[`${prefix}.head.repo.name`] = pr.head.repo.name;
        attributes[`${prefix}.base.ref`] = pr.base.ref;
        attributes[`${prefix}.base.sha`] = pr.base.sha;
        attributes[`${prefix}.base.repo.id`] = pr.base.repo.id;
        attributes[`${prefix}.base.repo.url`] = pr.base.repo.url;
        attributes[`${prefix}.base.repo.name`] = pr.base.repo.name;
    }
    return attributes;
}
