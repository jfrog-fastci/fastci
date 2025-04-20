import * as core from "@actions/core";
import type { components } from "@octokit/openapi-types";
import { type Attributes, SpanStatusCode, trace } from "@opentelemetry/api";

type Step = NonNullable<components["schemas"]["job"]["steps"]>[number];

async function traceStep(step: Step) {
  const tracer = trace.getTracer("otel-cicd-action");

  if (!step.completed_at || !step.started_at) {
    core.info(`Step ${step.name} is not completed yet.`);
    return;
  }

  if (step.conclusion === "cancelled" || step.conclusion === "skipped") {
    core.info(`Step ${step.name} did not run.`);
    return;
  }

  const startTime = new Date(step.started_at);
  const completedTime = new Date(step.completed_at);
  const attributes = stepToAttributes(step);

  await tracer.startActiveSpan(step.name, { attributes, startTime }, async (span) => {
    const code = step.conclusion === "failure" ? SpanStatusCode.ERROR : SpanStatusCode.OK;
    span.setStatus({ code });

    // Some skipped and post jobs return completed_at dates that are older than started_at
    span.end(new Date(Math.max(startTime.getTime(), completedTime.getTime())));
  });
}

function stepToAttributes(step: Step): Attributes {
  return {
    "github.job.step.status": step.status,
    "github.job.step.conclusion": step.conclusion ?? undefined,
    "github.job.step.name": step.name,
    "github.job.step.number": step.number,
    "github.job.step.started_at": step.started_at ?? undefined,
    "github.job.step.completed_at": step.completed_at ?? undefined,
    error: step.conclusion === "failure",
  };
}

export { traceStep };