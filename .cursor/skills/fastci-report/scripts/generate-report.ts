import { Database } from "bun:sqlite";
import { readdir } from "node:fs/promises";
import { join, resolve } from "node:path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OtelSpan {
  trace_id: string;
  span_id: string;
  parent_span_id?: string;
  name: string;
  start_time: string;
  end_time: string;
  attributes: Record<string, unknown>;
  status: { code: string };
  span_kind: string;
  resource: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    branch: "main",
    limit: 10,
    workflow: "",
    output: "/tmp/fastci-report",
    local: "",
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--branch":   opts.branch   = args[++i] ?? opts.branch; break;
      case "--limit":    opts.limit    = Number(args[++i] ?? opts.limit); break;
      case "--workflow":  opts.workflow  = args[++i] ?? opts.workflow; break;
      case "--output":   opts.output   = args[++i] ?? opts.output; break;
      case "--local":    opts.local    = args[++i] ?? ""; break;
    }
  }
  return opts;
}

// ---------------------------------------------------------------------------
// GitHub artifact retrieval
// ---------------------------------------------------------------------------

async function getGitHubToken(): Promise<string> {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  const proc = Bun.spawn(["gh", "auth", "token"], { stdout: "pipe", stderr: "pipe" });
  const text = await new Response(proc.stdout).text();
  await proc.exited;
  const token = text.trim();
  if (!token) throw new Error("No GITHUB_TOKEN and `gh auth token` returned empty. Run `gh auth login`.");
  return token;
}

async function resolveRepo(): Promise<{ owner: string; repo: string }> {
  const proc = Bun.spawn(["gh", "repo", "view", "--json", "nameWithOwner", "-q", ".nameWithOwner"], {
    stdout: "pipe", stderr: "pipe",
  });
  const nwo = (await new Response(proc.stdout).text()).trim();
  await proc.exited;
  if (!nwo.includes("/")) throw new Error(`Could not resolve repo. Got: "${nwo}"`);
  const parts = nwo.split("/");
  return { owner: parts[0]!, repo: parts[1]! };
}

const GH_API = "https://api.github.com";

function ghHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

async function ghFetchJson<T>(url: string, token: string): Promise<T> {
  const res = await fetch(url, { headers: ghHeaders(token) });
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

async function fetchTraceArtifacts(
  token: string,
  owner: string,
  repo: string,
  branch: string,
  workflow: string,
  limit: number,
): Promise<Map<string, string>> {
  const runTraces = new Map<string, string>();

  const qs = new URLSearchParams({
    branch,
    per_page: String(limit),
    status: "completed",
  });
  if (workflow) qs.set("workflow_id", workflow);

  const runsData = await ghFetchJson<{ workflow_runs: { id: number }[] }>(
    `${GH_API}/repos/${owner}/${repo}/actions/runs?${qs}`,
    token,
  );
  console.error(`Found ${runsData.workflow_runs.length} completed run(s) on '${branch}'.`);

  for (const run of runsData.workflow_runs) {
    const artifactsData = await ghFetchJson<{ artifacts: { id: number; name: string }[] }>(
      `${GH_API}/repos/${owner}/${repo}/actions/runs/${run.id}/artifacts`,
      token,
    );
    const traceArtifact = artifactsData.artifacts.find(a => a.name.startsWith("fastci-trace"));
    if (!traceArtifact) continue;

    const zipRes = await fetch(
      `${GH_API}/repos/${owner}/${repo}/actions/artifacts/${traceArtifact.id}/zip`,
      { headers: ghHeaders(token) },
    );
    if (!zipRes.ok) { console.error(`  Skipping artifact ${traceArtifact.id}: HTTP ${zipRes.status}`); continue; }

    const jsonl = await extractJsonlFromZip(new Blob([await zipRes.arrayBuffer()]));
    if (jsonl) runTraces.set(String(run.id), jsonl);
  }

  console.error(`Downloaded traces for ${runTraces.size} run(s).`);
  return runTraces;
}

async function extractJsonlFromZip(blob: Blob): Promise<string | null> {
  const buf = Buffer.from(await blob.arrayBuffer());
  const tmpDir = `/tmp/fastci-artifact-${Date.now()}`;
  const tmpZip = `${tmpDir}.zip`;
  await Bun.write(tmpZip, buf);
  const proc = Bun.spawn(["unzip", "-o", tmpZip, "-d", tmpDir], { stdout: "pipe", stderr: "pipe" });
  await proc.exited;

  const jsonlFiles = await findFiles(tmpDir, ".jsonl");
  const first = jsonlFiles[0];
  if (!first) return null;
  return await Bun.file(first).text();
}

async function findFiles(dir: string, ext: string): Promise<string[]> {
  const results: string[] = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) results.push(...(await findFiles(full, ext)));
      else if (entry.name.endsWith(ext)) results.push(full);
    }
  } catch { /* dir doesn't exist */ }
  return results;
}

// ---------------------------------------------------------------------------
// Local trace loading
// ---------------------------------------------------------------------------

async function loadLocalTraces(dir: string): Promise<Map<string, string>> {
  const resolved = resolve(dir);
  const jsonlFiles = await findFiles(resolved, ".jsonl");
  const traces = new Map<string, string>();

  for (const file of jsonlFiles) {
    const parts = file.split("/");
    const runId = parts.at(-2) ?? parts.at(-1) ?? file;
    const content = await Bun.file(file).text();
    const existing = traces.get(runId);
    traces.set(runId, existing ? existing + "\n" + content : content);
  }
  return traces;
}

// ---------------------------------------------------------------------------
// SQLite schema & ingestion
// ---------------------------------------------------------------------------

function createSchema(db: Database) {
  db.run("PRAGMA journal_mode = WAL");
  db.run(`CREATE TABLE runs (
    run_id TEXT PRIMARY KEY,
    branch TEXT,
    commit_sha TEXT,
    trigger_type TEXT,
    workflow_name TEXT,
    conclusion TEXT
  )`);
  db.run(`CREATE TABLE jobs (
    run_id TEXT,
    span_id TEXT,
    name TEXT,
    duration_ms REAL,
    start_time TEXT,
    end_time TEXT,
    status TEXT
  )`);
  db.run(`CREATE TABLE steps (
    run_id TEXT,
    span_id TEXT,
    parent_span_id TEXT,
    job_name TEXT,
    name TEXT,
    duration_seconds REAL,
    start_time TEXT,
    end_time TEXT,
    result TEXT,
    stage TEXT,
    action TEXT
  )`);
  db.run(`CREATE TABLE docker_builds (
    run_id TEXT,
    span_id TEXT,
    parent_span_id TEXT,
    cache_hit_rate_pct REAL,
    cache_hit_units INTEGER,
    cache_miss_units INTEGER,
    cache_total_units INTEGER,
    is_multi_stage INTEGER,
    command_line TEXT
  )`);
  db.run(`CREATE TABLE docker_vertices (
    run_id TEXT,
    span_id TEXT,
    parent_span_id TEXT,
    name TEXT,
    description TEXT,
    duration_ms REAL,
    start_time TEXT,
    end_time TEXT,
    cache_hit INTEGER
  )`);
  db.run(`CREATE TABLE insights (
    run_id TEXT,
    insight_id TEXT,
    name TEXT,
    title TEXT,
    implemented INTEGER,
    technology TEXT,
    remediation_type TEXT,
    parent_span_id TEXT,
    job_name TEXT,
    step_name TEXT
  )`);
}

function ingestTraces(db: Database, runTraces: Map<string, string>) {
  const insertRun = db.prepare(
    `INSERT OR IGNORE INTO runs VALUES ($run_id, $branch, $commit_sha, $trigger_type, $workflow_name, $conclusion)`
  );
  const insertJob = db.prepare(
    `INSERT INTO jobs VALUES ($run_id, $span_id, $name, $duration_ms, $start_time, $end_time, $status)`
  );
  const insertStep = db.prepare(
    `INSERT INTO steps VALUES ($run_id, $span_id, $parent_span_id, $job_name, $name, $duration_seconds, $start_time, $end_time, $result, $stage, $action)`
  );
  const insertDockerBuild = db.prepare(
    `INSERT INTO docker_builds VALUES ($run_id, $span_id, $parent_span_id, $cache_hit_rate_pct, $cache_hit_units, $cache_miss_units, $cache_total_units, $is_multi_stage, $command_line)`
  );
  const insertVertex = db.prepare(
    `INSERT INTO docker_vertices VALUES ($run_id, $span_id, $parent_span_id, $name, $description, $duration_ms, $start_time, $end_time, $cache_hit)`
  );
  const insertInsight = db.prepare(
    `INSERT INTO insights VALUES ($run_id, $insight_id, $name, $title, $implemented, $technology, $remediation_type, $parent_span_id, $job_name, $step_name)`
  );

  for (const [runIdKey, content] of runTraces) {
    const lines = content.split("\n").filter(l => l.trim());
    const spanMap = new Map<string, OtelSpan>();
    const seenSpanIds = new Set<string>();

    // First pass: build span lookup (deduplicate by span_id)
    for (const line of lines) {
      try {
        const span: OtelSpan = JSON.parse(line);
        if (!seenSpanIds.has(span.span_id)) {
          seenSpanIds.add(span.span_id);
          spanMap.set(span.span_id, span);
        }
      } catch { /* skip malformed */ }
    }

    // Extract run metadata from first span with resource info
    let runInserted = false;
    for (const span of spanMap.values()) {
      if (!runInserted && span.resource) {
        const runId = String(span.resource["cicd.pipeline.run.id"] ?? runIdKey);
        insertRun.run({
          $run_id: runId,
          $branch: String(span.resource["vcs.ref.name"] ?? ""),
          $commit_sha: String(span.resource["vcs.ref.head.revision"] ?? ""),
          $trigger_type: String(span.resource["cicd.pipeline.run.trigger"] ?? ""),
          $workflow_name: String(span.resource["cicd.pipeline.id"] ?? ""),
          $conclusion: "success",
        });
        runInserted = true;
      }
    }

    // Resolve run_id consistently
    const firstSpan = spanMap.values().next().value;
    const runId = firstSpan ? String(firstSpan.resource?.["cicd.pipeline.run.id"] ?? runIdKey) : runIdKey;

    // Second pass: classify and insert spans
    for (const span of spanMap.values()) {
      const spanType = span.attributes["span.type"] as string | undefined;
      if (!spanType) continue;

      const durationMs = new Date(span.end_time).getTime() - new Date(span.start_time).getTime();

      switch (spanType) {
        case "job":
          insertJob.run({
            $run_id: runId,
            $span_id: span.span_id,
            $name: String(span.attributes["job.display_name"] ?? span.name),
            $duration_ms: span.attributes["job.duration_ms"] as number ?? durationMs,
            $start_time: span.start_time,
            $end_time: span.end_time,
            $status: span.status.code,
          });
          break;

        case "step": {
          const parentJob = resolveAncestor(spanMap, span.parent_span_id, "job");
          insertStep.run({
            $run_id: runId,
            $span_id: span.span_id,
            $parent_span_id: span.parent_span_id ?? "",
            $job_name: parentJob ? String(parentJob.attributes["job.display_name"] ?? parentJob.name) : "",
            $name: String(span.attributes["cicd.pipeline.step.name"] ?? span.name),
            $duration_seconds: span.attributes["step.execution_time_seconds"] as number ?? durationMs / 1000,
            $start_time: span.start_time,
            $end_time: span.end_time,
            $result: String(span.attributes["step.result"] ?? ""),
            $stage: String(span.attributes["step.stage"] ?? ""),
            $action: String(span.attributes["step.action"] ?? ""),
          });
          break;
        }

        case "docker_build":
          insertDockerBuild.run({
            $run_id: runId,
            $span_id: span.span_id,
            $parent_span_id: span.parent_span_id ?? "",
            $cache_hit_rate_pct: span.attributes["cache.hit_rate_percent"] as number ?? 0,
            $cache_hit_units: span.attributes["cache.hit_units"] as number ?? 0,
            $cache_miss_units: span.attributes["cache.miss_units"] as number ?? 0,
            $cache_total_units: span.attributes["cache.total_units"] as number ?? 0,
            $is_multi_stage: (span.attributes["docker.build.is_multi_stage"] as boolean) ? 1 : 0,
            $command_line: String(span.attributes["process.command_line"] ?? ""),
          });
          break;

        case "docker_build_vertex":
          insertVertex.run({
            $run_id: runId,
            $span_id: span.span_id,
            $parent_span_id: span.parent_span_id ?? "",
            $name: String(span.attributes["docker.build.vertex.name"] ?? span.name),
            $description: String(span.attributes["docker.build.vertex.description"] ?? ""),
            $duration_ms: durationMs,
            $start_time: span.start_time,
            $end_time: span.end_time,
            $cache_hit: (span.attributes["cache.hit"] as boolean) ? 1 : 0,
          });
          break;

        case "insight": {
          const parentStep = resolveAncestor(spanMap, span.parent_span_id, "step");
          const parentJob = resolveAncestor(spanMap, span.parent_span_id, "job");
          insertInsight.run({
            $run_id: runId,
            $insight_id: String(span.attributes["insight.id"] ?? ""),
            $name: String(span.attributes["insight.name"] ?? ""),
            $title: String(span.attributes["insight.title"] ?? span.name),
            $implemented: (span.attributes["insight.implemented"] as boolean) ? 1 : 0,
            $technology: String(span.attributes["insight.technology"] ?? ""),
            $remediation_type: String(span.attributes["insight.remediation_type"] ?? ""),
            $parent_span_id: span.parent_span_id ?? "",
            $job_name: parentJob ? String(parentJob.attributes["job.display_name"] ?? parentJob.name) : "",
            $step_name: parentStep ? String(parentStep.attributes["cicd.pipeline.step.name"] ?? parentStep.name) : "",
          });
          break;
        }
      }
    }
  }
}

function resolveAncestor(
  spanMap: Map<string, OtelSpan>,
  startParentId: string | undefined,
  targetType: string,
): OtelSpan | null {
  let currentId = startParentId;
  const visited = new Set<string>();
  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    const parent = spanMap.get(currentId);
    if (!parent) return null;
    if (parent.attributes["span.type"] === targetType) return parent;
    currentId = parent.parent_span_id;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Workflow YAML parser (handles the GitHub Actions subset we need)
// ---------------------------------------------------------------------------

interface WorkflowDef {
  name: string;
  fileName: string;
  jobs: Record<string, { steps: WfStep[] }>;
}

interface WfStep {
  name?: string;
  uses?: string;
  run?: string;
}

async function detectWorkflowFile(hint: string): Promise<string | null> {
  if (hint) {
    for (const c of [hint, `.github/workflows/${hint}`, `.github/workflows/${hint}.yml`, `.github/workflows/${hint}.yaml`]) {
      if (await Bun.file(c).exists()) return c;
    }
    return null;
  }
  try {
    const entries = await readdir(".github/workflows");
    const yamls = entries.filter(e => e.endsWith(".yml") || e.endsWith(".yaml"));
    if (yamls.length > 0) return `.github/workflows/${yamls[0]}`;
  } catch { /* no workflows dir */ }
  return null;
}

function parseWorkflowYaml(text: string, filePath: string): WorkflowDef {
  const lines = text.split("\n");
  const def: WorkflowDef = { name: "", fileName: filePath, jobs: {} };

  let state: "top" | "jobs" | "job" | "steps" | "step" = "top";
  let currentJob = "";
  let step: Partial<WfStep> = {};
  let hasStep = false;
  let jobKeyIndent = -1;
  let stepListIndent = -1;
  let inMultilineRun = false;
  let runBaseIndent = 0;
  let runLines: string[] = [];

  function pushStep() {
    if (hasStep && currentJob && def.jobs[currentJob] && (step.name || step.uses || step.run)) {
      def.jobs[currentJob].steps.push({ ...step } as WfStep);
    }
    step = {};
    hasStep = false;
  }

  for (const raw of lines) {
    const indent = raw.search(/\S/);
    if (indent < 0) continue;
    const trimmed = raw.trim();
    if (trimmed.startsWith("#")) continue;

    if (inMultilineRun) {
      if (indent > runBaseIndent) { runLines.push(trimmed); continue; }
      step.run = runLines.join(" && ").slice(0, 120);
      inMultilineRun = false;
      runLines = [];
    }

    if (indent === 0) {
      if (trimmed.startsWith("name:")) def.name = trimmed.slice(5).trim().replace(/^['"]|['"]$/g, "");
      else if (trimmed === "jobs:") { state = "jobs"; jobKeyIndent = -1; }
      else { pushStep(); state = "top"; }
      continue;
    }

    if (state === "jobs" && jobKeyIndent < 0 && trimmed.endsWith(":") && !trimmed.includes(" ")) {
      jobKeyIndent = indent;
    }

    if ((state === "jobs" || state === "job" || state === "steps" || state === "step") &&
        indent === jobKeyIndent && trimmed.endsWith(":") && !trimmed.includes(" ")) {
      pushStep();
      currentJob = trimmed.slice(0, -1);
      def.jobs[currentJob] = { steps: [] };
      state = "job";
      stepListIndent = -1;
      continue;
    }

    if ((state === "job" || state === "steps" || state === "step") && trimmed === "steps:") {
      state = "steps";
      stepListIndent = -1;
      continue;
    }

    if ((state === "steps" || state === "step") && trimmed.startsWith("- ")) {
      if (stepListIndent < 0) stepListIndent = indent;
      if (indent === stepListIndent) {
        pushStep();
        hasStep = true;
        state = "step";
        const rest = trimmed.slice(2).trim();
        if (rest) applyKV(step, rest);
        continue;
      }
    }

    if (state === "step" && indent > stepListIndent) {
      if (trimmed.match(/^run:\s*[|>]/)) {
        inMultilineRun = true;
        runBaseIndent = indent;
        runLines = [];
        step.run = "";
      } else {
        applyKV(step, trimmed);
      }
      continue;
    }

    if ((state === "step" || state === "steps") && indent <= (jobKeyIndent ?? 0)) {
      pushStep();
      state = "jobs";
    }
  }

  if (inMultilineRun) step.run = runLines.join(" && ").slice(0, 120);
  pushStep();
  return def;
}

function applyKV(step: Partial<WfStep>, line: string) {
  const m = line.match(/^(name|uses|run):\s*(.+)$/);
  if (!m) return;
  const key = m[1] as keyof WfStep;
  const val = m[2]!.replace(/^['"]|['"]$/g, "").trim();
  if (key === "run" && val.match(/^[|>]/)) return;
  step[key] = val;
}

// ---------------------------------------------------------------------------
// Report generation — structured YAML mirroring the workflow definition
// ---------------------------------------------------------------------------

async function generateReport(db: Database, opts: ReturnType<typeof parseArgs>): Promise<string> {
  const workflowFile = await detectWorkflowFile(opts.workflow);
  let workflow: WorkflowDef | null = null;
  if (workflowFile) {
    const text = await Bun.file(workflowFile).text();
    workflow = parseWorkflowYaml(text, workflowFile);
    console.error(`  Parsed workflow: ${workflow.name} from ${workflowFile}`);
  }

  const runCount = (db.prepare("SELECT COUNT(*) as c FROM runs").get() as any).c as number;
  const workflowName = workflow?.name
    ?? (db.prepare("SELECT workflow_name FROM runs LIMIT 1").get() as any)?.workflow_name
    ?? "ci";
  const branch = (db.prepare("SELECT branch FROM runs LIMIT 1").get() as any)?.branch ?? opts.branch;
  const source = workflowFile ?? `.github/workflows/${opts.workflow || "ci.yml"}`;

  // Workflow-level durations (sum of job durations per run)
  const runDurations = db.prepare(
    "SELECT run_id, SUM(duration_ms) / 1000.0 as sec FROM jobs GROUP BY run_id ORDER BY sec"
  ).all() as { run_id: string; sec: number }[];
  const totalSecs = runDurations.map(r => r.sec);

  // All insights grouped by job+step
  const allInsights = db.prepare(
    `SELECT title, implemented, job_name, step_name, COUNT(DISTINCT run_id) as freq
     FROM insights GROUP BY name ORDER BY implemented ASC, freq DESC`
  ).all() as { title: string; implemented: number; job_name: string; step_name: string; freq: number }[];

  // All unique trace jobs
  const traceJobs = db.prepare("SELECT name, MIN(start_time) as st FROM jobs GROUP BY name ORDER BY st").all() as { name: string }[];

  const Y: string[] = [];
  const _ = (indent: number, text: string) => Y.push(" ".repeat(indent) + text);

  // --- Workflow header ---
  _(0, `# generated: ${new Date().toISOString()}`);
  _(0, `# branch: ${branch}`);
  _(0, "");
  _(0, "workflow:");
  _(2, `name: ${workflowName}`);
  _(2, `source: ${source}`);
  _(2, `branch: ${branch}`);
  _(2, "");
  _(2, "stats:");
  _(4, `runs: ${runCount}`);
  if (totalSecs.length > 0) {
    _(4, "duration_sec:");
    _(6, `avg: ${r1(mean(totalSecs))}`);
    _(6, `p50: ${r1(pctl(totalSecs, 50))}`);
    _(6, `p90: ${r1(pctl(totalSecs, 90))}`);
    _(6, `p95: ${r1(pctl(totalSecs, 95))}`);
  }
  _(4, `success_rate: 1.0`);
  _(2, "");

  // --- Jobs ---
  _(2, "jobs:");

  // Workflow start time per run (earliest job start)
  const runStartTimes = db.prepare(
    "SELECT run_id, MIN(start_time) as wf_start FROM jobs GROUP BY run_id"
  ).all() as { run_id: string; wf_start: string }[];
  const wfStartByRun = new Map(runStartTimes.map(r => [r.run_id, new Date(r.wf_start).getTime()]));

  for (const { name: jobName } of traceJobs) {
    const jobRows = db.prepare(
      "SELECT run_id, duration_ms / 1000.0 as sec, start_time FROM jobs WHERE name = ? ORDER BY sec"
    ).all(jobName) as { run_id: string; sec: number; start_time: string }[];
    const jSecs = jobRows.map(r => r.sec);

    const jobOffsets = jobRows
      .map(r => { const wfStart = wfStartByRun.get(r.run_id); return wfStart != null ? (new Date(r.start_time).getTime() - wfStart) / 1000 : null; })
      .filter((v): v is number => v != null);

    const slug = slugify(jobName);
    _(4, `${slug}:`);
    if (jobOffsets.length > 0) {
      _(6, `started_after_sec: ${r1(mean(jobOffsets))}`);
    }
    _(6, "stats:");
    _(8, `runs: ${jobRows.length}`);
    _(8, "duration_sec:");
    _(10, `avg: ${r1(mean(jSecs))}`);
    _(10, `p50: ${r1(pctl(jSecs, 50))}`);
    _(10, `p90: ${r1(pctl(jSecs, 90))}`);
    _(10, `p95: ${r1(pctl(jSecs, 95))}`);

    // Steps for this job (aggregated across runs)
    const traceSteps = db.prepare(
      `SELECT name, action,
              AVG(duration_seconds) as avg_sec,
              MIN(duration_seconds) as min_sec,
              MAX(duration_seconds) as max_sec,
              COUNT(*) as cnt
       FROM steps
       WHERE job_name = ? AND stage = 'Main'
       GROUP BY name
       ORDER BY MIN(start_time)`
    ).all(jobName) as { name: string; action: string; avg_sec: number; min_sec: number; max_sec: number; cnt: number }[];

    // Multi-run step durations + offsets for percentiles
    const stepDurMap = new Map<string, number[]>();
    const stepOffsetMap = new Map<string, number[]>();
    const perRunSteps = db.prepare(
      "SELECT run_id, name, duration_seconds as sec, start_time FROM steps WHERE job_name = ? AND stage = 'Main'"
    ).all(jobName) as { run_id: string; name: string; sec: number; start_time: string }[];
    for (const s of perRunSteps) {
      const durArr = stepDurMap.get(s.name) ?? [];
      durArr.push(s.sec);
      stepDurMap.set(s.name, durArr);

      const wfStart = wfStartByRun.get(s.run_id);
      if (wfStart != null) {
        const offArr = stepOffsetMap.get(s.name) ?? [];
        offArr.push((new Date(s.start_time).getTime() - wfStart) / 1000);
        stepOffsetMap.set(s.name, offArr);
      }
    }

    // Docker build check for this job
    const hasDocker = (db.prepare(
      `SELECT COUNT(*) as c FROM docker_builds WHERE run_id IN (SELECT DISTINCT run_id FROM jobs WHERE name = ?)`
    ).get(jobName) as any).c > 0;

    // Workflow YAML job for step matching
    const wfJob = workflow ? findWfJob(workflow, jobName) : null;

    _(6, "steps:");

    for (const ts of traceSteps) {
      if (ts.action === "setup_job") continue;

      const wfStep = wfJob ? matchWfStep(wfJob.steps, ts.name, ts.action) : null;
      const stepSlug = deriveStepSlug(ts.name, ts.action, wfStep);
      const durations = stepDurMap.get(ts.name) ?? [];
      const sorted = [...durations].sort((a, b) => a - b);

      _(8, "");
      _(8, `${stepSlug}:`);

      const stepOffsets = stepOffsetMap.get(ts.name) ?? [];
      if (stepOffsets.length > 0) {
        _(10, `started_after_sec: ${r1(mean(stepOffsets))}`);
      }

      if (wfStep?.uses) _(10, `uses: ${wfStep.uses}`);
      else if (wfStep?.run) _(10, `run: ${wfStep.run}`);
      else if (ts.action && ts.action !== "sh") _(10, `uses: ${ts.action}`);

      // Step stats
      _(10, "stats:");
      _(12, "duration_sec:");
      _(14, `avg: ${r1(ts.avg_sec)}`);
      if (sorted.length > 1) {
        _(14, `p50: ${r1(pctl(sorted, 50))}`);
        _(14, `p90: ${r1(pctl(sorted, 90))}`);
        _(14, `p95: ${r1(pctl(sorted, 95))}`);
      }

      // Add cache_ratio for docker build steps
      if (ts.action === "sh" && hasDocker) {
        const cacheRate = db.prepare(
          `SELECT AVG(cache_hit_rate_pct) as rate FROM docker_builds
           WHERE run_id IN (SELECT DISTINCT run_id FROM jobs WHERE name = ?)`
        ).get(jobName) as { rate: number | null };
        if (cacheRate.rate != null) {
          _(12, `cache_ratio: ${r2(cacheRate.rate / 100)}`);
        }
      }

      // Insights for this step
      const stepInsights = allInsights.filter(i =>
        i.job_name === jobName && (i.step_name === ts.name || !i.step_name)
      );

      // If this is the docker build step, emit docker details + insights together
      if (ts.action === "sh" && hasDocker) {
        emitDockerBlock(db, jobName, stepInsights, runCount, _, Y);
      } else if (stepInsights.length > 0) {
        emitInsightsBlock(stepInsights, _);
      }
    }

    _(4, "");
  }

  return Y.join("\n");
}

// ---------------------------------------------------------------------------
// Docker detail block
// ---------------------------------------------------------------------------

function emitDockerBlock(
  db: Database,
  jobName: string,
  insights: { title: string; implemented: number }[],
  runCount: number,
  _: (indent: number, text: string) => void,
  Y: string[],
) {
  // Insights first
  if (insights.length > 0) {
    emitInsightsBlock(insights, _);
  }

  // Cache stats
  const cacheRows = db.prepare(
    `SELECT cache_hit_rate_pct, cache_hit_units, cache_miss_units, cache_total_units
     FROM docker_builds
     WHERE run_id IN (SELECT DISTINCT run_id FROM jobs WHERE name = ?)`
  ).all(jobName) as { cache_hit_rate_pct: number; cache_hit_units: number; cache_miss_units: number; cache_total_units: number }[];

  const avgCacheRate = cacheRows.length > 0
    ? cacheRows.reduce((s, r) => s + r.cache_hit_rate_pct, 0) / cacheRows.length
    : 0;
  const avgTotalLayers = cacheRows.length > 0
    ? cacheRows.reduce((s, r) => s + r.cache_total_units, 0) / cacheRows.length
    : 0;
  const avgMissLayers = cacheRows.length > 0
    ? cacheRows.reduce((s, r) => s + r.cache_miss_units, 0) / cacheRows.length
    : 0;

  _(10, "docker:");
  _(12, "layers:");
  _(14, `total: ${Math.round(avgTotalLayers)}`);
  _(14, `cached_ratio: ${r2(avgCacheRate / 100)}`);
  _(14, `avg_rebuilt_layers: ${r1(avgMissLayers)}`);

}

// ---------------------------------------------------------------------------
// Insights block
// ---------------------------------------------------------------------------

function emitInsightsBlock(
  insights: { title: string; implemented: number }[],
  _: (indent: number, text: string) => void,
) {
  const implemented = insights.filter(i => i.implemented);
  const missing = insights.filter(i => !i.implemented);

  _(10, "best_practices:");
  if (implemented.length > 0) {
    _(12, `implemented: ${implemented.length} ✔︎`);
  }
  if (missing.length > 0) {
    _(12, "missing:");
    for (const ins of missing) {
      _(14, `- ✖︎ ${ins.title}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Workflow ↔ trace matching helpers
// ---------------------------------------------------------------------------

function findWfJob(wf: WorkflowDef, traceJobName: string): { steps: WfStep[] } | null {
  for (const [key, job] of Object.entries(wf.jobs)) {
    if (key === traceJobName || key === slugify(traceJobName)) return job;
  }
  const jobs = Object.values(wf.jobs);
  return jobs.length === 1 ? jobs[0]! : null;
}

function matchWfStep(wfSteps: WfStep[], traceName: string, traceAction: string): WfStep | null {
  for (const s of wfSteps) {
    if (s.name && s.name === traceName) return s;
  }
  for (const s of wfSteps) {
    if (s.uses && traceAction && s.uses.startsWith(traceAction)) return s;
    if (s.uses && traceName.includes(s.uses.split("@")[0] ?? "")) return s;
  }
  for (const s of wfSteps) {
    if (s.run && traceAction === "sh") return s;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function deriveStepSlug(traceName: string, traceAction: string, wfStep: WfStep | null): string {
  if (wfStep?.name) return slugify(wfStep.name);
  if (wfStep?.uses) {
    const actionName = wfStep.uses.split("/").pop()?.split("@")[0] ?? wfStep.uses;
    return slugify(actionName);
  }
  if (traceName && !traceName.startsWith("Run ")) return slugify(traceName);
  if (traceAction && traceAction !== "sh") {
    const actionName = traceAction.split("/").pop()?.split("@")[0] ?? traceAction;
    return slugify(actionName);
  }
  return slugify(traceName || "step");
}

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function pctl(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil(p / 100 * sorted.length) - 1;
  return sorted[Math.max(0, idx)] ?? 0;
}

function r1(n: number): number { return Math.round(n * 10) / 10; }
function r2(n: number): number { return Math.round(n * 100) / 100; }

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const opts = parseArgs();
  console.error("FastCI Report Generator");
  console.error(`  branch: ${opts.branch}, limit: ${opts.limit}`);

  let runTraces: Map<string, string>;
  if (opts.local) {
    console.error(`  Loading local traces from: ${opts.local}`);
    runTraces = await loadLocalTraces(opts.local);
  } else {
    const token = await getGitHubToken();
    const { owner, repo } = await resolveRepo();
    console.error(`  repo: ${owner}/${repo}`);
    runTraces = await fetchTraceArtifacts(token, owner, repo, opts.branch, opts.workflow, opts.limit);
  }

  if (runTraces.size === 0) {
    console.error("ERROR: No traces found. Nothing to report.");
    process.exit(1);
  }
  console.error(`  Ingesting ${runTraces.size} trace(s) into SQLite...`);

  const db = new Database(":memory:");
  createSchema(db);
  ingestTraces(db, runTraces);

  const spanCount = (db.prepare("SELECT COUNT(*) as c FROM jobs").get() as any).c
    + (db.prepare("SELECT COUNT(*) as c FROM steps").get() as any).c
    + (db.prepare("SELECT COUNT(*) as c FROM docker_vertices").get() as any).c
    + (db.prepare("SELECT COUNT(*) as c FROM insights").get() as any).c;
  console.error(`  Ingested: ${spanCount} spans across ${runTraces.size} run(s).`);

  const report = await generateReport(db, opts);

  const outPath = `${opts.output}.yaml`;
  await Bun.write(outPath, report);

  console.error(`\nReport written to: ${outPath}`);
  console.log(report);

  db.close();
}

main();
