import { debug, getInput, warning } from "@actions/core";
import { ProcessTree } from "./types/process";
import type { components } from "@octokit/openapi-types";

/**
 * Send logs to Coralogix Singles API using OTEL token and endpoint
 * @param {string | object} message - The log message text or object
 * @param {CoralogixLogOptions} options - Additional options
 * @param {string} options.subsystemName - Subsystem name (required)
 * @param {number} options.severity - Log severity: 1-Debug, 2-Verbose, 3-Info, 4-Warn, 5-Error, 6-Critical (optional)
 * @param {string} options.category - Category field (optional)
 * @returns {Promise<any>} - Promise resolving to response or error
 */
export async function sendCoralogixLog(message: any, options: any) {
  // Get OpenTelemetry endpoint and token from environment variables
  const otelEndpoint = getInput('fastci_otel_endpoint', { required: true });
  const otelToken = getInput('fastci_otel_token', { required: true });

  // Prepare log entry
  const logEntry: any = {
    applicationName: "fastci-github-action",
    text: typeof message === 'object' ? JSON.stringify(message) : message,
    timestamp: Date.now(),
    severity: options.severity || 3, // Default to Info
    ...options
  };


  try {
    // Using fetch API (available in Node.js since v18)
    const now = new Date();
    const response = await fetch(`https://${otelEndpoint}/logs/v1/singles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${otelToken}`
      },
      body: JSON.stringify([logEntry]) // API expects an array of log entries
    });

    const duration = Date.now() - now.getTime();
    debug(`Sent log to Coralogix in ${duration}ms`);

    if (!response.ok) {
      throw new Error(`Failed to send log: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    warning('Error sending log to Coralogix:' + error);
    return null;
  }
}

// get github environment variables as log metadata
export function getGithubLogMetadata() {
  return {
    // GitHub environment variables
    CI: process.env.CI,
    GITHUB_ACTOR_ID: process.env.GITHUB_ACTOR_ID,
    GITHUB_BASE_REF: process.env.GITHUB_BASE_REF,
    GITHUB_EVENT_NAME: process.env.GITHUB_EVENT_NAME,
    GITHUB_JOB: process.env.GITHUB_JOB,
    GITHUB_REF: process.env.GITHUB_REF,
    GITHUB_REF_NAME: process.env.GITHUB_REF_NAME,
    GITHUB_REF_TYPE: process.env.GITHUB_REF_TYPE,
    GITHUB_REPOSITORY: process.env.GITHUB_REPOSITORY,
    GITHUB_REPOSITORY_ID: process.env.GITHUB_REPOSITORY_ID,
    GITHUB_RUN_ATTEMPT: process.env.GITHUB_RUN_ATTEMPT,
    GITHUB_RUN_ID: process.env.GITHUB_RUN_ID,
    GITHUB_RUN_NUMBER: process.env.GITHUB_RUN_NUMBER,
    GITHUB_SHA: process.env.GITHUB_SHA,
    GITHUB_STATE: process.env.GITHUB_STATE,
    GITHUB_STEP_SUMMARY: process.env.GITHUB_STEP_SUMMARY,
    GITHUB_WORKFLOW: process.env.GITHUB_WORKFLOW,
    GITHUB_WORKFLOW_REF: process.env.GITHUB_WORKFLOW_REF,
    GITHUB_WORKFLOW_SHA: process.env.GITHUB_WORKFLOW_SHA,
    GITHUB_RUN_URL: `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`,
    RUNNER_OS: process.env.RUNNER_OS,
    RUNNER_TOOL_CACHE: process.env.RUNNER_TOOL_CACHE
  };
}

// Send session start log
export async function sendSessionStartLog() {
  await sendCoralogixLog({
    text: "Session started",
    ...getGithubLogMetadata()
  }, {
    subsystemName: process.env.GITHUB_REPOSITORY || 'unknown',
    severity: 3,
  });
}
function summerizeProcessTrees(processTrees: ProcessTree[]) {
  const rootProcessesCommands: string[] = [];
  (processTrees ?? []).forEach(tree => {
    rootProcessesCommands.push(tree.process.args)
  })

  return {
    totalRootProcesses: processTrees?.length,
    rootProcessesCommands,
  }
}
export async function sendTraceWorkflowRunLog(processTrees: ProcessTree[], workflowRun: components["schemas"]["workflow-run"], jobs: components["schemas"]["job"][], traceId: string) {
  await sendCoralogixLog({
    text: "Workflow run traced",
    traceId,
    processes_summary: summerizeProcessTrees(processTrees),
    workflow: {
      name: workflowRun.name,
      id: workflowRun.id,
      conclusion: workflowRun.conclusion,
      started_at: workflowRun.run_started_at,
      completed_at: workflowRun.updated_at,
    },
    jobs,
    github_env: { ...getGithubLogMetadata() }
  }, {
    subsystemName: process.env.GITHUB_REPOSITORY || 'unknown',
    severity: 3,
  })
} ``