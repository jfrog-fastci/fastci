import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { fadeInUp, staggerContainer } from '../../../lib/animations';
import type { RepoStats } from '../../../lib/insightStats';
import WorkflowComparison from './WorkflowComparison';

interface Props {
  repoStats: RepoStats[];
}

const languageColors: Record<string, string> = {
  'Node.js': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  Python: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  Go: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
};

function StatBox({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`text-center p-3 rounded-lg border ${
        highlight
          ? 'bg-brand-500/10 border-brand-500/20'
          : 'bg-white/[0.02] border-white/[0.05]'
      }`}
    >
      <p
        className={`text-xl font-bold ${highlight ? 'text-brand-400' : 'text-white'}`}
      >
        {value}
      </p>
      <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">
        {label}
      </p>
    </div>
  );
}

export default function RepoResultsGrid({ repoStats }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section className="px-4 sm:px-6 lg:px-8 mb-16 md:mb-24">
      <div className="max-w-5xl mx-auto" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-3">
            Performance Results
          </h2>
          <p className="text-gray-400 text-sm max-w-2xl leading-relaxed">
            Measured across real CI workflows. Each repository runs both the
            original and optimized Dockerfiles daily, with results compared
            head-to-head.
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {repoStats.map((stats) => (
            <motion.div
              key={stats.repo}
              variants={fadeInUp}
              className="rounded-2xl border border-white/[0.08] bg-surface-950 p-6 flex flex-col"
            >
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg
                    className="w-4 h-4 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776"
                    />
                  </svg>
                  <h3 className="text-sm font-bold text-white">{stats.repo}</h3>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                      languageColors[stats.language] ?? 'text-gray-400 bg-white/[0.04] border-white/[0.08]'
                    }`}
                  >
                    {stats.language}
                  </span>
                  <span className="text-[10px] text-gray-600">
                    {stats.runCount} runs
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  {stats.description}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-5">
                <StatBox label="Avg" value={`${stats.avgROI}%`} highlight />
                <StatBox label="p50" value={`${stats.p50ROI}%`} />
                <StatBox label="p90" value={`${stats.p90ROI}%`} />
              </div>

              <div className="flex-1">
                <p className="text-[10px] text-gray-600 uppercase tracking-wider font-medium mb-3">
                  Median run comparison
                </p>
                <WorkflowComparison
                  mainRun={stats.mainMedianRun}
                  insightRun={stats.insightMedianRun}
                />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
