import type { RepoBenchmark, WorkflowRun } from './types';

function makeRun(
  runId: number,
  dayOffset: number,
  branch: string,
  workflowName: string,
  jobs: WorkflowRun['jobs'],
): WorkflowRun {
  const date = new Date(2026, 1, 1);
  date.setDate(date.getDate() + dayOffset);
  const durationSeconds = jobs.reduce((sum, j) => sum + j.durationSeconds, 0);
  return { runId, timestamp: date.toISOString(), branch, workflowName, durationSeconds, jobs };
}

function jitter(base: number, pct = 0.08): number {
  return Math.round(base * (1 + (Math.random() * 2 - 1) * pct));
}

// ─── Repository 1: acme/web-dashboard (Node.js) ────────────────────────────

function webDashboardMain(runId: number, day: number): WorkflowRun {
  const checkout = jitter(3);
  const setupNode = jitter(8);
  const npmInstall = jitter(45);
  const lint = jitter(22);
  const unitTests = jitter(38);
  const dockerBuild = jitter(185);
  const dockerPush = jitter(24);
  const deploy = jitter(15);

  return makeRun(runId, day, 'main', 'Build & Deploy', [
    {
      name: 'setup',
      durationSeconds: checkout + setupNode + npmInstall,
      steps: [
        { name: 'Checkout', durationSeconds: checkout },
        { name: 'Setup Node 20', durationSeconds: setupNode },
        { name: 'npm ci', durationSeconds: npmInstall },
      ],
    },
    {
      name: 'test',
      durationSeconds: lint + unitTests,
      steps: [
        { name: 'ESLint', durationSeconds: lint },
        { name: 'Jest Unit Tests', durationSeconds: unitTests },
      ],
    },
    {
      name: 'docker',
      durationSeconds: dockerBuild + dockerPush,
      steps: [
        { name: 'Docker Build', durationSeconds: dockerBuild },
        { name: 'Docker Push to GHCR', durationSeconds: dockerPush },
      ],
    },
    {
      name: 'deploy',
      durationSeconds: deploy,
      steps: [{ name: 'Deploy to staging', durationSeconds: deploy }],
    },
  ]);
}

function webDashboardInsight(runId: number, day: number): WorkflowRun {
  const checkout = jitter(3);
  const setupNode = jitter(8);
  const npmInstall = jitter(45);
  const lint = jitter(22);
  const unitTests = jitter(38);
  const dockerBuild = jitter(112);
  const dockerPush = jitter(16);
  const deploy = jitter(15);

  return makeRun(runId, day, 'insights/docker-build-use-multi-stage-build', 'Build & Deploy', [
    {
      name: 'setup',
      durationSeconds: checkout + setupNode + npmInstall,
      steps: [
        { name: 'Checkout', durationSeconds: checkout },
        { name: 'Setup Node 20', durationSeconds: setupNode },
        { name: 'npm ci', durationSeconds: npmInstall },
      ],
    },
    {
      name: 'test',
      durationSeconds: lint + unitTests,
      steps: [
        { name: 'ESLint', durationSeconds: lint },
        { name: 'Jest Unit Tests', durationSeconds: unitTests },
      ],
    },
    {
      name: 'docker',
      durationSeconds: dockerBuild + dockerPush,
      steps: [
        { name: 'Docker Build (multi-stage)', durationSeconds: dockerBuild },
        { name: 'Docker Push to GHCR', durationSeconds: dockerPush },
      ],
    },
    {
      name: 'deploy',
      durationSeconds: deploy,
      steps: [{ name: 'Deploy to staging', durationSeconds: deploy }],
    },
  ]);
}

// ─── Repository 2: dataflow/ml-pipeline (Python) ───────────────────────────

function mlPipelineMain(runId: number, day: number): WorkflowRun {
  const checkout = jitter(3);
  const setupPython = jitter(6);
  const pipInstall = jitter(62);
  const mypy = jitter(18);
  const pytest = jitter(95);
  const dockerBuild = jitter(245);
  const dockerPush = jitter(35);

  return makeRun(runId, day, 'main', 'CI Pipeline', [
    {
      name: 'setup',
      durationSeconds: checkout + setupPython + pipInstall,
      steps: [
        { name: 'Checkout', durationSeconds: checkout },
        { name: 'Setup Python 3.12', durationSeconds: setupPython },
        { name: 'pip install', durationSeconds: pipInstall },
      ],
    },
    {
      name: 'quality',
      durationSeconds: mypy + pytest,
      steps: [
        { name: 'mypy type check', durationSeconds: mypy },
        { name: 'pytest', durationSeconds: pytest },
      ],
    },
    {
      name: 'docker',
      durationSeconds: dockerBuild + dockerPush,
      steps: [
        { name: 'Docker Build', durationSeconds: dockerBuild },
        { name: 'Docker Push to ECR', durationSeconds: dockerPush },
      ],
    },
  ]);
}

function mlPipelineInsight(runId: number, day: number): WorkflowRun {
  const checkout = jitter(3);
  const setupPython = jitter(6);
  const pipInstall = jitter(62);
  const mypy = jitter(18);
  const pytest = jitter(95);
  const dockerBuild = jitter(138);
  const dockerPush = jitter(22);

  return makeRun(runId, day, 'insights/docker-build-use-multi-stage-build', 'CI Pipeline', [
    {
      name: 'setup',
      durationSeconds: checkout + setupPython + pipInstall,
      steps: [
        { name: 'Checkout', durationSeconds: checkout },
        { name: 'Setup Python 3.12', durationSeconds: setupPython },
        { name: 'pip install', durationSeconds: pipInstall },
      ],
    },
    {
      name: 'quality',
      durationSeconds: mypy + pytest,
      steps: [
        { name: 'mypy type check', durationSeconds: mypy },
        { name: 'pytest', durationSeconds: pytest },
      ],
    },
    {
      name: 'docker',
      durationSeconds: dockerBuild + dockerPush,
      steps: [
        { name: 'Docker Build (multi-stage)', durationSeconds: dockerBuild },
        { name: 'Docker Push to ECR', durationSeconds: dockerPush },
      ],
    },
  ]);
}

// ─── Repository 3: cloudops/api-gateway (Go) ───────────────────────────────

function apiGatewayMain(runId: number, day: number): WorkflowRun {
  const checkout = jitter(2);
  const setupGo = jitter(5);
  const goMod = jitter(12);
  const goVet = jitter(8);
  const goTest = jitter(42);
  const dockerBuild = jitter(155);
  const dockerPush = jitter(18);
  const integrationTest = jitter(65);

  return makeRun(runId, day, 'main', 'Build, Test & Publish', [
    {
      name: 'setup',
      durationSeconds: checkout + setupGo + goMod,
      steps: [
        { name: 'Checkout', durationSeconds: checkout },
        { name: 'Setup Go 1.22', durationSeconds: setupGo },
        { name: 'go mod download', durationSeconds: goMod },
      ],
    },
    {
      name: 'test',
      durationSeconds: goVet + goTest,
      steps: [
        { name: 'go vet', durationSeconds: goVet },
        { name: 'go test ./...', durationSeconds: goTest },
      ],
    },
    {
      name: 'docker',
      durationSeconds: dockerBuild + dockerPush,
      steps: [
        { name: 'Docker Build', durationSeconds: dockerBuild },
        { name: 'Docker Push to GCR', durationSeconds: dockerPush },
      ],
    },
    {
      name: 'integration',
      durationSeconds: integrationTest,
      steps: [{ name: 'Integration Tests', durationSeconds: integrationTest }],
    },
  ]);
}

function apiGatewayInsight(runId: number, day: number): WorkflowRun {
  const checkout = jitter(2);
  const setupGo = jitter(5);
  const goMod = jitter(12);
  const goVet = jitter(8);
  const goTest = jitter(42);
  const dockerBuild = jitter(88);
  const dockerPush = jitter(12);
  const integrationTest = jitter(65);

  return makeRun(runId, day, 'insights/docker-build-use-multi-stage-build', 'Build, Test & Publish', [
    {
      name: 'setup',
      durationSeconds: checkout + setupGo + goMod,
      steps: [
        { name: 'Checkout', durationSeconds: checkout },
        { name: 'Setup Go 1.22', durationSeconds: setupGo },
        { name: 'go mod download', durationSeconds: goMod },
      ],
    },
    {
      name: 'test',
      durationSeconds: goVet + goTest,
      steps: [
        { name: 'go vet', durationSeconds: goVet },
        { name: 'go test ./...', durationSeconds: goTest },
      ],
    },
    {
      name: 'docker',
      durationSeconds: dockerBuild + dockerPush,
      steps: [
        { name: 'Docker Build (multi-stage)', durationSeconds: dockerBuild },
        { name: 'Docker Push to GCR', durationSeconds: dockerPush },
      ],
    },
    {
      name: 'integration',
      durationSeconds: integrationTest,
      steps: [{ name: 'Integration Tests', durationSeconds: integrationTest }],
    },
  ]);
}

// ─── Generate runs ──────────────────────────────────────────────────────────

function generateRuns(
  mainFn: (id: number, day: number) => WorkflowRun,
  insightFn: (id: number, day: number) => WorkflowRun,
  count: number,
): WorkflowRun[] {
  const runs: WorkflowRun[] = [];
  for (let i = 0; i < count; i++) {
    runs.push(mainFn(1000 + i, i));
    runs.push(insightFn(2000 + i, i));
  }
  return runs;
}

export const benchmarks: RepoBenchmark[] = [
  {
    repo: 'acme/web-dashboard',
    language: 'Node.js',
    description: 'React admin dashboard with Docker-based deployments to Kubernetes',
    runs: generateRuns(webDashboardMain, webDashboardInsight, 12),
  },
  {
    repo: 'dataflow/ml-pipeline',
    language: 'Python',
    description: 'ML training and inference service with heavy Python + CUDA Docker images',
    runs: generateRuns(mlPipelineMain, mlPipelineInsight, 10),
  },
  {
    repo: 'cloudops/api-gateway',
    language: 'Go',
    description: 'High-performance API gateway compiled from Go with scratch-based containers',
    runs: generateRuns(apiGatewayMain, apiGatewayInsight, 14),
  },
];
