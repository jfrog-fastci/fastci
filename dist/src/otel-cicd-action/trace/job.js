"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.traceJob = traceJob;
const api_1 = require("@opentelemetry/api");
const incubating_1 = require("@opentelemetry/semantic-conventions/incubating");
const step_1 = require("./step");
const core_1 = require("@actions/core");
async function traceJob(processTrees, job, annotations) {
    (0, core_1.debug)(`Tracing job ${job.name}`);
    const tracer = api_1.trace.getTracer("otel-cicd-action");
    if (!job.completed_at) {
        job.completed_at = new Date().toISOString();
    }
    const startTime = new Date(job.started_at);
    const completedTime = new Date(job.completed_at);
    const attributes = {
        ...jobToAttributes(job),
        ...annotationsToAttributes(annotations),
    };
    await tracer.startActiveSpan(job.name, { attributes, startTime }, async (span) => {
        const code = job.conclusion === "failure" ? api_1.SpanStatusCode.ERROR : api_1.SpanStatusCode.OK;
        span.setStatus({ code });
        for (const step of job.steps ?? []) {
            await (0, step_1.traceStep)(step, processTrees);
        }
        // Some skipped and post jobs return completed_at dates that are older than started_at
        span.end(new Date(Math.max(startTime.getTime(), completedTime.getTime())));
    });
}
function jobToAttributes(job) {
    // Heuristic for task type
    let taskType;
    if (job.name.toLowerCase().includes("build")) {
        taskType = incubating_1.CICD_PIPELINE_TASK_TYPE_VALUE_BUILD;
    }
    else if (job.name.toLowerCase().includes("test")) {
        taskType = incubating_1.CICD_PIPELINE_TASK_TYPE_VALUE_TEST;
    }
    else if (job.name.toLowerCase().includes("deploy")) {
        taskType = incubating_1.CICD_PIPELINE_TASK_TYPE_VALUE_DEPLOY;
    }
    return {
        // OpenTelemetry semantic convention CICD Pipeline Attributes
        // https://opentelemetry.io/docs/specs/semconv/attributes-registry/cicd/
        [incubating_1.ATTR_CICD_PIPELINE_TASK_NAME]: job.name,
        [incubating_1.ATTR_CICD_PIPELINE_TASK_RUN_ID]: job.id,
        [incubating_1.ATTR_CICD_PIPELINE_TASK_RUN_URL_FULL]: job.html_url ?? undefined,
        [incubating_1.ATTR_CICD_PIPELINE_TASK_TYPE]: taskType,
        "github.job.id": job.id,
        "github.job.name": job.name,
        "github.job.run_id": job.run_id,
        "github.job.run_url": job.run_url,
        "github.job.run_attempt": job.run_attempt ?? 1,
        "github.job.node_id": job.node_id,
        "github.job.head_sha": job.head_sha,
        "github.job.url": job.url,
        "github.job.html_url": job.html_url ?? undefined,
        "github.job.status": job.status,
        "github.job.runner_id": job.runner_id ?? undefined,
        "github.job.runner_group_id": job.runner_group_id ?? undefined,
        "github.job.runner_group_name": job.runner_group_name ?? undefined,
        "github.job.runner_name": job.runner_name ?? undefined,
        "github.job.conclusion": job.conclusion ?? undefined,
        "github.job.labels": job.labels.join(", "),
        "github.job.created_at": job.created_at,
        "github.job.started_at": job?.started_at,
        "github.job.completed_at": job.completed_at ?? undefined,
        "github.conclusion": job.conclusion ?? undefined, // FIXME: it overrides the workflow conclusion
        "github.job.check_run_url": job.check_run_url,
        "github.job.workflow_name": job.workflow_name ?? undefined,
        "github.job.head_branch": job.head_branch ?? undefined,
        error: job.conclusion === "failure",
    };
}
function annotationsToAttributes(annotations) {
    const attributes = {};
    (0, core_1.debug)(`Annotations: ${JSON.stringify(annotations)}`);
    for (let i = 0; annotations && i < annotations?.length; i++) {
        const annotation = annotations[i];
        const prefix = `github.job.annotations.${i}`;
        attributes[`${prefix}.level`] = annotation.annotation_level ?? undefined;
        attributes[`${prefix}.message`] = annotation.message ?? undefined;
    }
    return attributes;
}
