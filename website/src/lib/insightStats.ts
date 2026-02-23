import type { RepoBenchmark, WorkflowRun } from '../data/insights/types';

export interface RepoStats {
  repo: string;
  language: string;
  description: string;
  avgROI: number;
  p50ROI: number;
  p90ROI: number;
  mainAvgDuration: number;
  insightAvgDuration: number;
  mainMedianRun: WorkflowRun;
  insightMedianRun: WorkflowRun;
  runCount: number;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (idx - lower);
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function median(values: number[]): number {
  return percentile([...values].sort((a, b) => a - b), 50);
}

export function computeRepoStats(benchmark: RepoBenchmark): RepoStats {
  const mainRuns = benchmark.runs.filter((r) => r.branch === 'main');
  const insightRuns = benchmark.runs.filter((r) => r.branch !== 'main');

  const mainDurations = mainRuns.map((r) => r.durationSeconds);
  const insightDurations = insightRuns.map((r) => r.durationSeconds);

  const mainAvg = mean(mainDurations);
  const insightAvg = mean(insightDurations);

  const pairCount = Math.min(mainRuns.length, insightRuns.length);
  const roiValues: number[] = [];
  for (let i = 0; i < pairCount; i++) {
    const roi =
      ((mainRuns[i].durationSeconds - insightRuns[i].durationSeconds) /
        mainRuns[i].durationSeconds) *
      100;
    roiValues.push(roi);
  }

  const sortedROI = [...roiValues].sort((a, b) => a - b);

  const mainMedianDuration = median(mainDurations);
  const insightMedianDuration = median(insightDurations);

  const mainMedianRun =
    mainRuns.reduce((closest, run) =>
      Math.abs(run.durationSeconds - mainMedianDuration) <
      Math.abs(closest.durationSeconds - mainMedianDuration)
        ? run
        : closest,
    );

  const insightMedianRun =
    insightRuns.reduce((closest, run) =>
      Math.abs(run.durationSeconds - insightMedianDuration) <
      Math.abs(closest.durationSeconds - insightMedianDuration)
        ? run
        : closest,
    );

  return {
    repo: benchmark.repo,
    language: benchmark.language,
    description: benchmark.description,
    avgROI: Math.round(mean(roiValues) * 10) / 10,
    p50ROI: Math.round(percentile(sortedROI, 50) * 10) / 10,
    p90ROI: Math.round(percentile(sortedROI, 90) * 10) / 10,
    mainAvgDuration: Math.round(mainAvg),
    insightAvgDuration: Math.round(insightAvg),
    mainMedianRun,
    insightMedianRun,
    runCount: pairCount,
  };
}

export function aggregateROI(repoStats: RepoStats[]): number {
  return Math.round(mean(repoStats.map((s) => s.avgROI)) * 10) / 10;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}
