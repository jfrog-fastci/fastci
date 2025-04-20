import * as core from "@actions/core";
import { context, getOctokit } from "@actions/github";
import { RequestError } from "@octokit/request-error";
import  { ResourceAttributes } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from "@opentelemetry/semantic-conventions";
import { ATTR_SERVICE_INSTANCE_ID, ATTR_SERVICE_NAMESPACE } from "@opentelemetry/semantic-conventions/incubating";
import { getJobsAnnotations, getPRsLabels, getWorkflowRun, listJobsForWorkflowRun } from "./github";

import { createTracerProvider, stringToRecord } from "./tracer";
import { traceWorkflowRun } from "./trace/workflow";

async function fetchGithub(token: string, runId: number) {
  const octokit = getOctokit(token);

  core.info(`Get workflow run for ${runId}`);
  const workflowRun = await getWorkflowRun(context, octokit, runId);
  core.info(`Workflow run: ${JSON.stringify(workflowRun)}`);

  core.info("Get jobs");
  const jobs = await listJobsForWorkflowRun(context, octokit, runId);
  core.info(`Jobs: ${JSON.stringify(jobs)}`);

  core.info("Get job annotations");
  const jobsId = (jobs ?? []).map((job) => job.id);
  let jobAnnotations = {};
  try {
    jobAnnotations = await getJobsAnnotations(context, octokit, jobsId);
    core.info(`Job annotations: ${JSON.stringify(jobAnnotations)}`);
  } catch (error) {
    if (error instanceof RequestError) {
      core.info(`Failed to get job annotations: ${error.message}}`);
    } else {
      throw error;
    }
  }

  core.info("Get PRs labels");
  const prNumbers = (workflowRun.pull_requests ?? []).map((pr) => pr.number);
  let prLabels = {};
  try {
    prLabels = await getPRsLabels(context, octokit, prNumbers);
  } catch (error) {
    if (error instanceof RequestError) {
      core.info(`Failed to get PRs labels: ${error.message}}`);
    } else {
      throw error;
    }
  }

  return { workflowRun, jobs, jobAnnotations, prLabels };
}

export async function RunCiCdOtelExport() {
  try {
    const otlpEndpoint = core.getInput("fastci_otel_endpoint");
    const otlpToken = core.getInput("fastci_otel_token");
    const otlpHeaders = `Authorization=Bearer ${otlpToken}`;
    const otelServiceName = core.getInput("otelServiceName") || process.env["OTEL_SERVICE_NAME"] || "";
    const runId = Number.parseInt(core.getInput("runId") || `${context.runId}`);
    const extraAttributes = stringToRecord(core.getInput("extra_attributes"));
    const ghToken = core.getInput("github_token") || process.env["GITHUB_TOKEN"] || "";

    core.info("Use Github API to fetch workflow data");
    const { workflowRun, jobs, jobAnnotations, prLabels } = await fetchGithub(ghToken, runId);

    core.info(`Workflow run: ${JSON.stringify(workflowRun)}`);
    core.info(`Jobs: ${JSON.stringify(jobs)}`);
    core.info(`Job annotations: ${JSON.stringify(jobAnnotations)}`);
    core.info(`PR labels: ${JSON.stringify(prLabels)}`);

    core.info(`Create tracer provider for ${otlpEndpoint}`);
    const attributes: ResourceAttributes = {
      [ATTR_SERVICE_NAME]: otelServiceName || workflowRun.name || `${workflowRun.workflow_id}`,
      [ATTR_SERVICE_INSTANCE_ID]: [
        workflowRun.repository.full_name,
        `${workflowRun.workflow_id}`,
        `${workflowRun.id}`,
        `${workflowRun.run_attempt ?? 1}`,
      ].join("/"),
      [ATTR_SERVICE_NAMESPACE]: workflowRun.repository.full_name,
      [ATTR_SERVICE_VERSION]: workflowRun.head_sha,
      ...extraAttributes,
    };
    const provider = createTracerProvider(otlpEndpoint, otlpHeaders, attributes);

    core.info(`Trace workflow run for ${runId} and export to ${otlpEndpoint}`);
    const traceId = await traceWorkflowRun(workflowRun, jobs, jobAnnotations, prLabels);

    core.setOutput("traceId", traceId);
    core.info(`traceId: ${traceId}`);

    core.info("Flush and shutdown tracer provider");
    await provider.forceFlush();
    await provider.shutdown();
    core.info("Provider shutdown");
  } catch (error) {
    const message = error instanceof Error ? error : JSON.stringify(error);
    core.setFailed(message);
  }
}