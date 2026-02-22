import { useMemo } from 'react';
import type { InsightMeta, RepoBenchmark } from '../../../data/insights/types';
import { computeRepoStats, aggregateROI } from '../../../lib/insightStats';
import InsightHero from './InsightHero';
import DockerMultiStageDemo from './DockerMultiStageDemo';
import RepoResultsGrid from './RepoResultsGrid';

interface Props {
  meta: InsightMeta;
  benchmarks: RepoBenchmark[];
}

export default function InsightPage({ meta, benchmarks }: Props) {
  const repoStats = useMemo(
    () => benchmarks.map(computeRepoStats),
    [benchmarks],
  );
  const avgROI = useMemo(() => aggregateROI(repoStats), [repoStats]);

  return (
    <>
      <InsightHero meta={meta} aggregatedROI={avgROI} repoCount={benchmarks.length} />
      <DockerMultiStageDemo />
      <RepoResultsGrid repoStats={repoStats} />
    </>
  );
}
