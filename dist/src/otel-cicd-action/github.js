"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWorkflowRun = getWorkflowRun;
exports.listJobsForWorkflowRun = listJobsForWorkflowRun;
exports.getJobsAnnotations = getJobsAnnotations;
exports.getPRsLabels = getPRsLabels;
async function getWorkflowRun(context, octokit, runId) {
    const res = await octokit.rest.actions.getWorkflowRun({
        ...context.repo,
        run_id: runId,
    });
    return res.data;
}
async function listJobsForWorkflowRun(context, octokit, runId) {
    return await octokit.paginate(octokit.rest.actions.listJobsForWorkflowRun, {
        ...context.repo,
        run_id: runId,
        filter: "latest", // risk of missing a run if re-run happens between Action trigger and this query
        per_page: 100,
    });
}
async function getJobsAnnotations(context, octokit, jobIds) {
    const annotations = {};
    for (const jobId of jobIds) {
        annotations[jobId] = await listAnnotations(context, octokit, jobId);
    }
    return annotations;
}
async function listAnnotations(context, octokit, checkRunId) {
    return await octokit.paginate(octokit.rest.checks.listAnnotations, {
        ...context.repo,
        check_run_id: checkRunId,
    });
}
async function getPRsLabels(context, octokit, prNumbers) {
    const labels = {};
    for (const prNumber of prNumbers) {
        labels[prNumber] = await listLabelsOnIssue(context, octokit, prNumber);
    }
    return labels;
}
async function listLabelsOnIssue(context, octokit, prNumber) {
    return await octokit.paginate(octokit.rest.issues.listLabelsOnIssue, {
        ...context.repo,
        issue_number: prNumber,
    }, (response) => response.data.map((issue) => issue.name));
}
