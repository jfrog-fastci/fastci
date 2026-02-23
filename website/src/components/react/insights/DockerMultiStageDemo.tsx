import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const beforeLines = [
  { text: 'FROM node:20', type: 'instruction' as const },
  { text: 'WORKDIR /app', type: 'normal' as const },
  { text: 'COPY package*.json ./', type: 'normal' as const },
  { text: 'RUN npm ci', type: 'normal' as const },
  { text: 'COPY . .', type: 'normal' as const },
  { text: 'RUN npm run build', type: 'normal' as const },
  { text: 'RUN npm run test', type: 'comment' as const },
  { text: 'EXPOSE 3000', type: 'normal' as const },
  { text: 'CMD ["node", "dist/server.js"]', type: 'instruction' as const },
];

const afterLines = [
  { text: '# Stage 1: Build', type: 'stage' as const },
  { text: 'FROM node:20-alpine AS builder', type: 'instruction' as const },
  { text: 'WORKDIR /app', type: 'normal' as const },
  { text: 'COPY package*.json ./', type: 'normal' as const },
  { text: 'RUN npm ci', type: 'normal' as const },
  { text: 'COPY . .', type: 'normal' as const },
  { text: 'RUN npm run build', type: 'normal' as const },
  { text: '', type: 'blank' as const },
  { text: '# Stage 2: Runtime', type: 'stage' as const },
  { text: 'FROM node:20-alpine', type: 'instruction' as const },
  { text: 'WORKDIR /app', type: 'normal' as const },
  { text: 'COPY --from=builder /app/dist ./dist', type: 'highlight' as const },
  { text: 'COPY --from=builder /app/package*.json ./', type: 'highlight' as const },
  { text: 'RUN npm ci --omit=dev', type: 'highlight' as const },
  { text: 'EXPOSE 3000', type: 'normal' as const },
  { text: 'CMD ["node", "dist/server.js"]', type: 'instruction' as const },
];

const colorMap = {
  instruction: 'text-cyan-400',
  normal: 'text-gray-400',
  comment: 'text-gray-600',
  stage: 'text-brand-400 font-semibold',
  highlight: 'text-emerald-400',
  blank: '',
};

function CodeBlock({
  lines,
  label,
}: {
  lines: typeof beforeLines;
  label: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35 }}
      className="rounded-xl bg-surface-950 border border-white/[0.08] overflow-hidden"
    >
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
        </div>
        <span className="text-[11px] text-gray-500 font-mono ml-2">
          {label}
        </span>
      </div>
      <div className="p-4 font-mono text-[13px] leading-6 overflow-x-auto">
        {lines.map((line, i) => (
          <div key={i} className="flex">
            <span className="text-gray-700 w-7 text-right mr-4 shrink-0 select-none text-[11px] leading-6">
              {line.type !== 'blank' ? i + 1 : ''}
            </span>
            <span className={colorMap[line.type]}>{line.text}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function DockerMultiStageDemo() {
  const [activeTab, setActiveTab] = useState<'before' | 'after'>('before');

  return (
    <section className="px-4 sm:px-6 lg:px-8 mb-16 md:mb-24">
      <div className="max-w-5xl mx-auto">
        <div className="glass-card p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-6">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">
                How It Works
              </h3>
              <p className="text-gray-400 text-sm max-w-xl leading-relaxed">
                A monolithic Dockerfile ships compilers, dev tools, and source
                alongside your app. Multi-stage builds isolate the build
                environment, copying only the production artifact into a minimal
                runtime image.
              </p>
            </div>

            <div className="flex bg-surface-950 rounded-lg p-1 border border-white/[0.08] shrink-0">
              {(['before', 'after'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? 'text-white'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {activeTab === tab && (
                    <motion.div
                      layoutId="tab-bg"
                      className="absolute inset-0 bg-white/[0.08] rounded-md"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                  <span className="relative z-10 capitalize">{tab}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <AnimatePresence mode="wait">
                {activeTab === 'before' ? (
                  <CodeBlock
                    key="before"
                    lines={beforeLines}
                    label="Dockerfile"
                  />
                ) : (
                  <CodeBlock
                    key="after"
                    lines={afterLines}
                    label="Dockerfile (multi-stage)"
                  />
                )}
              </AnimatePresence>
            </div>

            <div className="flex flex-col justify-center gap-4">
              <AnimatePresence mode="wait">
                {activeTab === 'before' ? (
                  <motion.div
                    key="before-stats"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <StatCard
                      label="Final image"
                      value="1.2 GB"
                      detail="Includes build tools, dev deps, source maps"
                      color="amber"
                    />
                    <StatCard
                      label="Build time"
                      value="~3m 05s"
                      detail="Full dependency install + build in single layer"
                      color="amber"
                    />
                    <StatCard
                      label="Attack surface"
                      value="High"
                      detail="gcc, make, python, npm dev packages all present"
                      color="red"
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="after-stats"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <StatCard
                      label="Final image"
                      value="185 MB"
                      detail="Only production deps + compiled output"
                      color="brand"
                    />
                    <StatCard
                      label="Build time"
                      value="~1m 52s"
                      detail="Cached builder stage, minimal runtime copy"
                      color="brand"
                    />
                    <StatCard
                      label="Attack surface"
                      value="Minimal"
                      detail="Alpine base with only runtime packages"
                      color="brand"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
  detail,
  color,
}: {
  label: string;
  value: string;
  detail: string;
  color: 'brand' | 'amber' | 'red';
}) {
  const valueColors = {
    brand: 'text-brand-400',
    amber: 'text-amber-400',
    red: 'text-red-400',
  };

  return (
    <div className="rounded-xl border border-white/[0.08] bg-surface-950 p-4">
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">
          {label}
        </span>
        <span className={`text-lg font-bold ${valueColors[color]}`}>
          {value}
        </span>
      </div>
      <p className="text-[11px] text-gray-600 leading-relaxed">{detail}</p>
    </div>
  );
}
