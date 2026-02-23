/**
 * Horizontal Gantt-style trace graph showing a realistic CI workflow.
 * Critical path blocks are connected with dashed lines + animated pulse dots.
 *
 * Critical path: Verify Release → Build Docker Image → Security Scan (10m)
 */

interface Job {
  name: string;
  startMin: number;
  endMin: number;
  isCritical: boolean;
}

const TOTAL_MINUTES = 11;
const ROW_H = 28;
const ROW_GAP = 6;
const ROW_STRIDE = ROW_H + ROW_GAP;

const JOBS: Job[] = [
  { name: 'Verify Release',     startMin: 0,   endMin: 0.1,  isCritical: true },
  { name: 'Build Docker Image', startMin: 0.1, endMin: 8,    isCritical: true },
  { name: 'Build Go Binary',    startMin: 0.1, endMin: 3,    isCritical: false },
  { name: 'Run Go Tests',       startMin: 0.1, endMin: 4.5,  isCritical: false },
  { name: 'Integration Tests',  startMin: 4.5, endMin: 7,    isCritical: false },
  { name: 'E2E Tests',          startMin: 4.5, endMin: 9,    isCritical: false },
  { name: 'Security Scan',      startMin: 8,   endMin: 10,   isCritical: true },
];

const CRITICAL_CONNECTIONS = [
  { fromRow: 0, toRow: 1, atMinute: 0.1 },
  { fromRow: 1, toRow: 6, atMinute: 8 },
];

function formatDuration(minutes: number): string {
  if (minutes < 1) return `${Math.round(minutes * 60)}s`;
  const whole = Math.floor(minutes);
  const secs = Math.round((minutes - whole) * 60);
  return secs > 0 ? `${whole}m ${secs}s` : `${whole}m`;
}

const toX = (min: number) => (min / TOTAL_MINUTES) * 1000;
const rowCenterY = (row: number) => row * ROW_STRIDE + ROW_H / 2;

const TICKS = [0, 2, 4, 6, 8, 10];
const TOTAL_H = JOBS.length * ROW_H + (JOBS.length - 1) * ROW_GAP;
const VB_W = 1000;

export default function TraceGraph() {
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
                      className={`absolute top-0.5 bottom-0.5 rounded flex items-center px-1.5 ${
                        job.isCritical
                          ? 'bg-amber-500/25 border border-amber-500/50'
                          : 'bg-brand-500/20 border border-brand-500/30'
                      }`}
                      style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
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

          {/* SVG overlay for connector lines — covers only the bar area */}
          <svg
            className="absolute top-0 pointer-events-none"
            style={{ left: '128px', right: 0, height: `${TOTAL_H}px` }}
            viewBox={`0 0 ${VB_W} ${TOTAL_H}`}
            preserveAspectRatio="none"
          >
            <defs>
              <filter id="pulse-glow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {CRITICAL_CONNECTIONS.map(({ fromRow, toRow, atMinute }, i) => {
              const x = toX(atMinute);
              const y1 = rowCenterY(fromRow);
              const y2 = rowCenterY(toRow);
              const pathId = `cpath-${i}`;

              return (
                <g key={i}>
                  {/* Dashed connector line */}
                  <line
                    x1={x} y1={y1}
                    x2={x} y2={y2}
                    stroke="rgba(251,191,36,0.3)"
                    strokeWidth="8"
                    strokeDasharray="12 8"
                    vectorEffect="non-scaling-stroke"
                  />

                  {/* Motion path */}
                  <path id={pathId} d={`M ${x} ${y1} L ${x} ${y2}`} fill="none" />

                  {/* Pulse dot traveling along the path */}
                  <circle
                    r="4"
                    fill="rgb(251,191,36)"
                    opacity="0.9"
                    filter="url(#pulse-glow)"
                    vectorEffect="non-scaling-stroke"
                  >
                    <animateMotion
                      dur={`${1.5 + (y2 - y1) / 150}s`}
                      repeatCount="indefinite"
                    >
                      <mpath href={`#${pathId}`} />
                    </animateMotion>
                  </circle>
                </g>
              );
            })}
          </svg>
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
