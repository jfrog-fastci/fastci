import type { Context } from "@actions/github/lib/context";
import type { GitHub } from "@actions/github/lib/utils";
import type { components } from "@octokit/openapi-types";

type Octokit = InstanceType<typeof GitHub>;

async function getWorkflowRun(context: Context, octokit: Octokit, runId: number) {
  const res = await octokit.rest.actions.getWorkflowRun({
    ...context.repo,
    run_id: runId,
  });
  return res.data;
}

async function listJobsForWorkflowRun(context: Context, octokit: Octokit, runId: number) {
  return await octokit.paginate(octokit.rest.actions.listJobsForWorkflowRun, {
    ...context.repo,
    run_id: runId,
    filter: "latest", // risk of missing a run if re-run happens between Action trigger and this query
    per_page: 100,
  });
}

async function getJobsAnnotations(context: Context, octokit: Octokit, jobIds: number[]) {
  const annotations: Record<number, components["schemas"]["check-annotation"][]> = {};

  for (const jobId of jobIds) {
    annotations[jobId] = await listAnnotations(context, octokit, jobId);
  }
  return annotations;
}

async function listAnnotations(context: Context, octokit: Octokit, checkRunId: number) {
  return await octokit.paginate(octokit.rest.checks.listAnnotations, {
    ...context.repo,
    check_run_id: checkRunId,
  });
}

async function getPRsLabels(context: Context, octokit: Octokit, prNumbers: number[]) {
  const labels: Record<number, string[]> = {};

  for (const prNumber of prNumbers) {
    labels[prNumber] = await listLabelsOnIssue(context, octokit, prNumber);
  }
  return labels;
}

async function listLabelsOnIssue(context: Context, octokit: Octokit, prNumber: number) {
  return await octokit.paginate(
    octokit.rest.issues.listLabelsOnIssue,
    {
      ...context.repo,
      issue_number: prNumber,
    },
    (response) => response.data.map((issue) => issue.name),
  );
}

/**
 * Checks the permissions (scopes) of the current token by calling the /user endpoint.
 * Returns the scopes as a string (comma-separated) or null if not available.
 * Note: Only works for classic tokens and GITHUB_TOKEN, not for GitHub Apps.
 */
async function getTokenPermissions(octokit: Octokit): Promise<string | null> {
  // The /user endpoint returns the X-OAuth-Scopes header for classic tokens
  const response = await octokit.rest.actions.getGithubActionsPermissionsRepository();
  // GitHub returns scopes in the 'x-oauth-scopes' header (case-insensitive)
  
  const scopes = response.headers["x-oauth-scopes"] || response.headers["X-OAuth-Scopes"];
  return typeof scopes === "string" ? scopes : null;
}

export { getWorkflowRun, listJobsForWorkflowRun, getJobsAnnotations, getPRsLabels, type Octokit, getTokenPermissions };