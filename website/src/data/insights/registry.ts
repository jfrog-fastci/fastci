import type { InsightData } from './types';
import { benchmarks as dockerMultiStageBenchmarks } from './docker-build-use-multi-stage-build';

export const insightRegistry: Record<string, InsightData> = {
  'docker-build-use-multi-stage-build': {
    meta: {
      slug: 'docker-build-use-multi-stage-build',
      title: 'Docker Build: Use Multi-Stage Builds',
      category: 'Docker Optimization',
      shortDescription:
        'Replace monolithic Dockerfiles with multi-stage builds to drastically reduce image size and build time.',
      longDescription:
        'A single-stage Dockerfile bundles compilers, build tools, dev dependencies, and source code into the final image. Multi-stage builds split this into a builder stage that compiles your app and a minimal runtime stage that copies only the production artifact. The result: smaller images, faster pushes, tighter security surface, and significantly shorter CI build times.',
    },
    benchmarks: dockerMultiStageBenchmarks,
  },
};

export function getAllInsightSlugs(): string[] {
  return Object.keys(insightRegistry);
}

export function getInsightData(slug: string): InsightData | undefined {
  return insightRegistry[slug];
}
