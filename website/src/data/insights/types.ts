export interface StepRun {
  name: string;
  durationSeconds: number;
}

export interface JobRun {
  name: string;
  durationSeconds: number;
  steps: StepRun[];
}

export interface WorkflowRun {
  runId: number;
  timestamp: string;
  branch: string;
  workflowName: string;
  durationSeconds: number;
  jobs: JobRun[];
}

export interface RepoBenchmark {
  repo: string;
  language: string;
  description: string;
  runs: WorkflowRun[];
}

export interface InsightMeta {
  slug: string;
  title: string;
  category: string;
  shortDescription: string;
  longDescription: string;
}

export interface InsightData {
  meta: InsightMeta;
  benchmarks: RepoBenchmark[];
}
