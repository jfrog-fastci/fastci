/**
 * Horizontal Gantt-style trace graph showing a realistic CI workflow.
 * Critical path blocks are highlighted in amber.
 * Hover over a trace to see insights.
 *
 * Critical path: Verify Release → Build Docker Image → Security Scan (10m)
 */

import { useState, useRef } from 'react';

interface Job {
  name: string;
  startMin: number;
  endMin: number;
  isCritical: boolean;
  insight: string;
}

const TOTAL_MINUTES = 11;
const ROW_H = 28;
const ROW_GAP = 6;

const JOBS: Job[] = [
  { name: 'Verify Release',     startMin: 0,   endMin: 0.1,  isCritical: true,  insight: 'Gatekeeper that triggers the pipeline. Keeps releases fast and prevents broken builds from propagating.' },
  { name: 'Build Docker Image', startMin: 0.1, endMin: 8,    isCritical: true,  insight: 'Longest on critical path. Consider multi-stage builds, layer caching, or BuildKit to reduce time.' },
  { name: 'Build Go Binary',    startMin: 0.1, endMin: 3,    isCritical: false, insight: 'Runs in parallel with Docker build. Module cache can speed up subsequent runs.' },
  { name: 'Run Go Tests',       startMin: 0.1, endMin: 4.5,  isCritical: false, insight: 'Unit tests provide fast feedback. Parallelize with -parallel flag if not already.' },
  { name: 'Integration Tests',  startMin: 4.5, endMin: 7,    isCritical: false, insight: 'Validates service interactions. Consider splitting by domain or mocking external deps.' },
  { name: 'E2E Tests',          startMin: 4.5, endMin: 9,    isCritical: false, insight: 'Full system validation. Often the slowest non-critical job—run only when needed.' },
  { name: 'Security Scan',      startMin: 8,   endMin: 10,   isCritical: true,  insight: 'Critical path tail. Trivy/Grype scans can be cached; pin base images for stability.' },
];

function formatDuration(minutes: number): string {
  if (minutes < 1) return `${Math.round(minutes * 60)}s`;
  const whole = Math.floor(minutes);
  const secs = Math.round((minutes - whole) * 60);
  return secs > 0 ? `${whole}m ${secs}s` : `${whole}m`;
}

const TICKS = [0, 2, 4, 6, 8, 10];

const HOVER_DELAY_MS = 150;

export default function TraceGraph() {
  const [hoveredJob, setHoveredJob] = useState<Job | null>(null);
  const clearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleClear = () => {
    if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current);
    clearTimeoutRef.current = setTimeout(() => setHoveredJob(null), HOVER_DELAY_MS);
  };
  const cancelClear = () => {
    if (clearTimeoutRef.current) {
      clearTimeout(clearTimeoutRef.current);
      clearTimeoutRef.current = null;
    }
  };

  return (
    <div className="mt-5 overflow-x-auto">
      <div className="min-w-[420px]">
        <div className="relative">
          {/* Job rows */}
          <div className="space-y-1.5">
            {JOBS.map((job) => {
              const leftPct = (job.startMin / TOTAL_MINUTES) * 100;
              const widthPct = ((job.endMin - job.startMin) / TOTAL_MINUTES) * 100;
              const duration = formatDuration(job.endMin - job.startMin);
              const isHovered = hoveredJob?.name === job.name;

              return (
                <div key={job.name} className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono w-[120px] text-right shrink-0 truncate ${job.isCritical ? 'text-amber-300' : 'text-gray-500'}`}>
                    {job.name}
                  </span>

                  <div className="flex-1 h-7 rounded bg-white/[0.02] relative">
                    {TICKS.map((t) => (
                      <div
                        key={t}
                        className="absolute top-0 bottom-0 w-px bg-white/[0.04]"
                        style={{ left: `${(t / TOTAL_MINUTES) * 100}%` }}
                      />
                    ))}

                    <div
                      className={`absolute top-0.5 bottom-0.5 rounded flex items-center px-1.5 cursor-pointer transition-all ${
                        job.isCritical
                          ? 'bg-amber-500/25 border border-amber-500/50 hover:bg-amber-500/35 hover:border-amber-500/70'
                          : 'bg-brand-500/20 border border-brand-500/30 hover:bg-brand-500/30 hover:border-brand-500/50'
                      } ${isHovered ? 'ring-2 ring-white/20 ring-offset-2 ring-offset-surface-950' : ''}`}
                      style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                      onMouseEnter={() => { cancelClear(); setHoveredJob(job); }}
                      onMouseLeave={scheduleClear}
                    >
                      <span className={`text-[9px] font-mono whitespace-nowrap ${job.isCritical ? 'text-amber-300' : 'text-gray-400'}`}>
                        {duration}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Hover card — insight for hovered trace */}
        <div
          className="mt-3 rounded-lg border border-white/[0.08] bg-surface-900/95 backdrop-blur-sm p-3 min-h-[52px]"
          onMouseEnter={cancelClear}
          onMouseLeave={() => { cancelClear(); setHoveredJob(null); }}
        >
          {hoveredJob ? (
            <>
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-xs font-semibold ${hoveredJob.isCritical ? 'text-amber-300' : 'text-gray-300'}`}>
                  {hoveredJob.name}
                </span>
                <span className="text-[10px] text-gray-500 font-mono">
                  {formatDuration(hoveredJob.endMin - hoveredJob.startMin)}
                  {hoveredJob.isCritical && (
                    <span className="ml-1.5 text-amber-500/80">· Critical path</span>
                  )}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                {hoveredJob.insight}
              </p>
            </>
          ) : (
            <p className="text-[11px] text-gray-500 italic">
              Hover over a trace to see optimization insights
            </p>
          )}
        </div>

        {/* Time axis */}
        <div className="flex items-start mt-1 pl-[128px]">
          <div className="flex-1 relative h-3">
            {TICKS.map((t) => (
              <span
                key={t}
                className="text-[8px] text-gray-600 font-mono absolute -translate-x-1/2"
                style={{ left: `${(t / TOTAL_MINUTES) * 100}%` }}
              >
                {t}m
              </span>
            ))}
          </div>
        </div>

        {/* Critical path legend */}
        <div className="mt-3 flex items-center gap-2 px-2 py-1.5 rounded-lg bg-amber-500/8 border border-amber-500/20">
          <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
          <p className="text-[10px] text-amber-200/90">
            <span className="font-medium">Critical path</span> — Verify → Build Docker Image → Security Scan (10m). Optimizing this path directly reduces CI duration.
          </p>
        </div>
      </div>
    </div>
  );
}
