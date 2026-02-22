import { motion } from 'framer-motion';
import type { WorkflowRun } from '../../../data/insights/types';
import { formatDuration } from '../../../lib/insightStats';

interface Props {
  mainRun: WorkflowRun;
  insightRun: WorkflowRun;
}

export default function WorkflowComparison({ mainRun, insightRun }: Props) {
  const maxDuration = Math.max(mainRun.durationSeconds, insightRun.durationSeconds);

  const mainJobs = mainRun.jobs;
  const insightJobs = insightRun.jobs;

  const allJobNames = mainJobs.map((j) => j.name);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-[10px] text-gray-500 mb-2">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-1 rounded-full bg-gray-500/50" />
          main ({formatDuration(mainRun.durationSeconds)})
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-1 rounded-full bg-brand-500" />
          optimized ({formatDuration(insightRun.durationSeconds)})
        </span>
      </div>

      {allJobNames.map((jobName) => {
        const mainJob = mainJobs.find((j) => j.name === jobName);
        const insightJob = insightJobs.find((j) => j.name === jobName);
        if (!mainJob || !insightJob) return null;

        const isImproved = insightJob.durationSeconds < mainJob.durationSeconds * 0.9;
        const improvementPct = Math.round(
          ((mainJob.durationSeconds - insightJob.durationSeconds) /
            mainJob.durationSeconds) *
            100,
        );

        return (
          <div key={jobName}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-gray-400 font-mono">{jobName}</span>
              {isImproved && (
                <span className="text-[10px] text-brand-400 font-medium">
                  -{improvementPct}%
                </span>
              )}
            </div>
            <div className="space-y-1">
              <div className="h-4 rounded bg-white/[0.03] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(mainJob.durationSeconds / maxDuration) * 100}%`,
                  }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded bg-gray-500/30 flex items-center px-2"
                >
                  <span className="text-[9px] font-mono text-gray-500 whitespace-nowrap">
                    {formatDuration(mainJob.durationSeconds)}
                  </span>
                </motion.div>
              </div>
              <div className="h-4 rounded bg-white/[0.03] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(insightJob.durationSeconds / maxDuration) * 100}%`,
                  }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                  className={`h-full rounded flex items-center px-2 ${
                    isImproved
                      ? 'bg-brand-500/30 border border-brand-500/40'
                      : 'bg-brand-500/20'
                  }`}
                >
                  <span
                    className={`text-[9px] font-mono whitespace-nowrap ${
                      isImproved ? 'text-brand-300' : 'text-gray-400'
                    }`}
                  >
                    {formatDuration(insightJob.durationSeconds)}
                  </span>
                </motion.div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
