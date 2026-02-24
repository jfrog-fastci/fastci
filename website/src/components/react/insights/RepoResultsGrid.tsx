import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { fadeInUp } from '../../../lib/animations';
import type { RepoStats } from '../../../lib/insightStats';
import { formatDuration } from '../../../lib/insightStats';

interface Props {
  repoStats: RepoStats[];
}

const languageColors: Record<string, string> = {
  'Node.js': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  Python: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  Go: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
};

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
          variants={fadeInUp}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="rounded-2xl border border-white/[0.08] bg-surface-950 overflow-hidden"
        >
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left text-[10px] text-gray-500 uppercase tracking-wider font-medium px-5 py-3">
                    Repository
                  </th>
                  <th className="text-center text-[10px] text-gray-500 uppercase tracking-wider font-medium px-3 py-3">
                    Runs
                  </th>
                  <th className="text-center text-[10px] text-gray-500 uppercase tracking-wider font-medium px-3 py-3">
                    Avg improvement
                  </th>
                  <th className="text-center text-[10px] text-gray-500 uppercase tracking-wider font-medium px-3 py-3">
                    P50
                  </th>
                  <th className="text-center text-[10px] text-gray-500 uppercase tracking-wider font-medium px-3 py-3">
                    P90
                  </th>
                  <th className="text-center text-[10px] text-gray-500 uppercase tracking-wider font-medium px-3 py-3">
                    Before
                  </th>
                  <th className="text-center text-[10px] text-gray-500 uppercase tracking-wider font-medium px-3 py-3">
                    After
                  </th>
                  <th className="text-center text-[10px] text-gray-500 uppercase tracking-wider font-medium px-3 py-3">
                    Saved
                  </th>
                </tr>
              </thead>
              <tbody>
                {repoStats.map((stats) => {
                  const saved = stats.mainMedianRun.durationSeconds - stats.insightMedianRun.durationSeconds;

                  return (
                    <DesktopRow
                      key={stats.repo}
                      stats={stats}
                      saved={saved}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile stacked layout */}
          <div className="md:hidden divide-y divide-white/[0.06]">
            {repoStats.map((stats) => {
              const saved = stats.mainMedianRun.durationSeconds - stats.insightMedianRun.durationSeconds;

              return (
                <MobileRow
                  key={stats.repo}
                  stats={stats}
                  saved={saved}
                />
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function DesktopRow({
  stats,
  saved,
}: {
  stats: RepoStats;
  saved: number;
}) {
  return (
    <tr
      role="button"
      tabIndex={0}
      onClick={() => window.open(stats.actionsRunUrl, '_blank', 'noopener,noreferrer')}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          window.open(stats.actionsRunUrl, '_blank', 'noopener,noreferrer');
        }
      }}
      className="border-b border-white/[0.04] hover:bg-white/[0.02] cursor-pointer transition-colors"
    >
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <svg
            className="w-4 h-4 text-gray-500 shrink-0"
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
          <div>
            <span className="text-sm font-bold text-white">{stats.repo}</span>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${
                  languageColors[stats.language] ?? 'text-gray-400 bg-white/[0.04] border-white/[0.08]'
                }`}
              >
                {stats.language}
              </span>
              <span className="text-[10px] text-gray-600 hidden lg:inline">
                {stats.description}
              </span>
            </div>
          </div>
        </div>
      </td>
      <td className="text-center px-3 py-4">
        <span className="text-xs text-gray-400 tabular-nums">{stats.runCount}</span>
      </td>
      <td className="text-center px-3 py-4">
        <span className="text-sm font-bold text-brand-400 tabular-nums">
          {stats.avgROI}%
        </span>
      </td>
      <td className="text-center px-3 py-4">
        <span className="text-xs text-gray-300 tabular-nums">{stats.p50ROI}%</span>
      </td>
      <td className="text-center px-3 py-4">
        <span className="text-xs text-gray-300 tabular-nums">{stats.p90ROI}%</span>
      </td>
      <td className="text-center px-3 py-4">
        <span className="text-xs text-gray-400 tabular-nums font-mono">
          {formatDuration(stats.mainMedianRun.durationSeconds)}
        </span>
      </td>
      <td className="text-center px-3 py-4">
        <span className="text-xs text-brand-300 tabular-nums font-mono">
          {formatDuration(stats.insightMedianRun.durationSeconds)}
        </span>
      </td>
      <td className="text-center px-3 py-4">
        <span className="text-xs text-emerald-400 tabular-nums font-mono font-medium">
          {formatDuration(saved)}
        </span>
      </td>
    </tr>
  );
}

function MobileRow({
  stats,
  saved,
}: {
  stats: RepoStats;
  saved: number;
}) {
  return (
    <a
      href={stats.actionsRunUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-full text-left px-4 py-4 hover:bg-white/[0.02] transition-colors"
    >
      <div className="flex items-center gap-2 mb-2">
        <svg
          className="w-4 h-4 text-gray-500 shrink-0"
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
          <span className="text-sm font-bold text-white">{stats.repo}</span>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span
          className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${
            languageColors[stats.language] ?? 'text-gray-400 bg-white/[0.04] border-white/[0.08]'
          }`}
        >
            {stats.language}
        </span>
        <span className="text-[10px] text-gray-600">{stats.runCount} runs</span>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Avg improvement</p>
            <p className="text-sm font-bold text-brand-400 tabular-nums">{stats.avgROI}%</p>
        </div>
        <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Before</p>
            <p className="text-xs text-gray-400 tabular-nums font-mono">
              {formatDuration(stats.mainMedianRun.durationSeconds)}
          </p>
        </div>
        <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">After</p>
            <p className="text-xs text-brand-300 tabular-nums font-mono">
              {formatDuration(stats.insightMedianRun.durationSeconds)}
          </p>
        </div>
        <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Saved</p>
            <p className="text-xs text-emerald-400 tabular-nums font-mono font-medium">
              {formatDuration(saved)}
          </p>
        </div>
      </div>
    </a>
  );
}
