import * as core from "@actions/core";
import { context, getOctokit } from "@actions/github";
import { RequestError } from "@octokit/request-error";
import  { ResourceAttributes } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from "@opentelemetry/semantic-conventions";
import { ATTR_SERVICE_INSTANCE_ID, ATTR_SERVICE_NAMESPACE } from "@opentelemetry/semantic-conventions/incubating";
import { getJobsAnnotations, getPermissions, getPRsLabels, getWorkflowRun, listJobsForWorkflowRun } from "./github";
import { PROCESS_TREES_PATH } from "../types/constants";
import { ProcessTree } from "../types/process";
import * as fs from "fs";

import { createTracerProvider, stringToRecord } from "./tracer";
import { traceWorkflowRun } from "./trace/workflow";
import { sendTraceWorkflowRunLog } from "../sendCoralogixLog";

async function fetchGithub(token: string, runId: number) {
  const octokit = getOctokit(token);
  const permissions = await getPermissions(context, octokit, runId);
  core.debug(`Permissions: ${permissions}`);
  
  core.debug(`Get workflow run for ${runId}`);
  const workflowRun = await getWorkflowRun(context, octokit, runId);

  core.debug("Get jobs");
  const jobs = await listJobsForWorkflowRun(context, octokit, runId);

  core.debug("Get job annotations");
  const jobsId = (jobs ?? []).map((job) => job.id);
  let jobAnnotations = {};
  
  try {
    jobAnnotations = await getJobsAnnotations(context, octokit, jobsId);
  } catch (error) {
    if (error instanceof RequestError) {
      core.debug(`Failed to get job annotations: ${error.message}}`);
    } else {
      throw error;
    }
  }

  core.debug("Get PRs labels");
  const prNumbers = (workflowRun.pull_requests ?? []).map((pr) => pr.number);
  let prLabels = {};
  try {
    prLabels = await getPRsLabels(context, octokit, prNumbers);
  } catch (error) {
    if (error instanceof RequestError) {
      core.debug(`Failed to get PRs labels: ${error.message}}`);
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
    const otlpHeaders = `Authorization=Bearer ${otlpToken},api-key=${otlpToken}`;
    const otelServiceName = core.getInput("otelServiceName") || process.env["OTEL_SERVICE_NAME"] || "";
    const runId = Number.parseInt(core.getInput("runId") || `${context.runId}`);
    const extraAttributes = stringToRecord(core.getInput("extra_attributes"));
    const ghToken = core.getInput("github_token") || process.env["GITHUB_TOKEN"] || "";

    core.debug("Use Github API to fetch workflow data");
    const { workflowRun, jobs, jobAnnotations, prLabels } = await fetchGithub(ghToken, runId);

    
    // core.info(`Jobs: ${JSON.stringify(jobs)}`);
    
    core.debug(`Create tracer provider for ${otlpEndpoint}`);
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

    const processTrees = loadProcessTrees();

    core.debug(`Process trees: ${JSON.stringify(processTrees, null, 2)}`);


    core.debug(`Trace workflow run for ${runId} and export to ${otlpEndpoint}`);
    const traceId = await traceWorkflowRun(processTrees, workflowRun, jobs, jobAnnotations, prLabels);
    await sendTraceWorkflowRunLog(processTrees, workflowRun, jobs, traceId);

    core.setOutput("traceId", traceId);
    core.debug(`traceId: ${traceId}`);

    core.debug("Flush and shutdown tracer provider");
    await provider.forceFlush();
    await provider.shutdown();
    core.debug("Provider shutdown");
  } catch (error) {
    const message = error instanceof Error ? error : JSON.stringify(error);
    core.warning(message);
  }
}

export function loadProcessTrees(): ProcessTree[] {
  const startTime = Date.now();
  try {
    if (!fs.existsSync(PROCESS_TREES_PATH)) {
      core.debug(`Process trees file does not exist at ${PROCESS_TREES_PATH}`);
      return [];
    }
    
    const fileContent = fs.readFileSync(PROCESS_TREES_PATH, 'utf-8');
    if (!fileContent || fileContent.trim() === '') {
      core.debug('Process trees file is empty');
      return [];
    }
    
    const processTrees = JSON.parse(fileContent) as ProcessTree[];
    const duration = Date.now() - startTime;
    core.debug(`Loaded ${processTrees?.length} process trees in ${duration}ms`);
    return processTrees;
  } catch (error) {
    core.error(`Failed to load process trees: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  } finally {
    const totalDuration = Date.now() - startTime;
    core.debug(`Total time to process and load trees: ${totalDuration}ms`);
  }
}