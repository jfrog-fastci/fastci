import type { components } from "@octokit/openapi-types";
import { type Attributes, SpanStatusCode, trace } from "@opentelemetry/api";
import { ProcessTree } from "../../types/process";
import { traceProcessTree } from "./process";
import { debug, info } from "@actions/core";

type Step = NonNullable<components["schemas"]["job"]["steps"]>[number];

async function traceStep(step: Step, processTree: ProcessTree[]) {
  debug(`Tracing step ${step.name}`);
  debug(JSON.stringify(step, null, 2));
  const tracer = trace.getTracer("otel-cicd-action");

  if (!step.completed_at || !step.started_at) {
    step.completed_at = new Date().toISOString();
    //core.debug(`Step ${step.name} is not completed yet.`);
    //return;
  }

  if (step.conclusion === "cancelled" || step.conclusion === "skipped") {
    step.completed_at = step.started_at ? new Date(step.started_at).toISOString() : "";
    //core.debug(`Step ${step.name} did not run.`);
    //return;
  }

  const startTime = new Date(step.started_at || new Date());
  const completedTime = new Date(step.completed_at);
  const attributes = stepToAttributes(step);

  await tracer.startActiveSpan(step.name, { attributes, startTime }, async (span) => {
    const code = step.conclusion === "failure" ? SpanStatusCode.ERROR : SpanStatusCode.OK;
    span.setStatus({ code });

    const stepRootProcesses = findRootProcessesRelatedToStep(step, processTree);
    info(`Found ${stepRootProcesses.length} root processes related to step ${step.name}`);
    for (const process of stepRootProcesses) {
      await traceProcessTree(process, step);
    }

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


function findRootProcessesRelatedToStep(step: Step, processTree: ProcessTree[]): ProcessTree[] {
  const stepStartedAt = step.started_at ? new Date(step.started_at) : new Date();
  const stepCompletedAt = step.completed_at ? new Date(step.completed_at) : new Date();
  return processTree.filter(process => {
    const pStartedAt = process.process.started_at ? new Date(process.process.started_at) : new Date();
    const pStoppedAt = process.process.stopped_at ? new Date(process.process.stopped_at) : new Date();
    info(`Checking process ${process.process.command} started at ${pStartedAt} and completed at ${pStoppedAt}, step started at ${stepStartedAt} and completed at ${stepCompletedAt}`);
    return(stepStartedAt < pStartedAt) && (pStartedAt < stepCompletedAt)
  });
}

export { traceStep };