import { debug, getInput } from "@actions/core";
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
    debug(`Sending log to Coralogix: ${JSON.stringify(logEntry)}`);
    const response = await fetch(`https://${otelEndpoint}/logs/v1/singles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${otelToken}`
      },
      body: JSON.stringify([logEntry]) // API expects an array of log entries
    });

    if (!response.ok) {
      throw new Error(`Failed to send log: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending log to Coralogix:', error);
    throw error;
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
    RUNNER_OS: process.env.RUNNER_OS,
    RUNNER_TOOL_CACHE: process.env.RUNNER_TOOL_CACHE
  };
}

// Send session start log
export async function sendSessionStartLog() {
  await sendCoralogixLog("Session started", {
    subsystemName: process.env.GITHUB_REPOSITORY || 'unknown',
    severity: 3,
    ...getGithubLogMetadata()
  });
}

export async function sendTraceWorkflowRunLog(processTrees: ProcessTree[], workflowRun: components["schemas"]["workflow-run"], jobs: components["schemas"]["job"][], jobAnnotations: Record<number, components["schemas"]["check-annotation"][]>, prLabels: Record<number, string[]>) {
  await sendCoralogixLog("Workflow run traced", {
    subsystemName: process.env.GITHUB_REPOSITORY || 'unknown',
    severity: 3,
    processTrees,
    workflowRun,
    jobs,
    jobAnnotations,
    prLabels,
  })
}