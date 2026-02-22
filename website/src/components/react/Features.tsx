import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { fadeInUp, staggerContainer } from '../../lib/animations';

function TracingVisual() {
  const steps = [
    { name: 'Checkout', duration: '4s', width: '8%' },
    { name: 'Install deps', duration: '2m 34s', width: '52%', highlight: true },
    { name: 'Build', duration: '45s', width: '18%' },
    { name: 'Test', duration: '1m 12s', width: '26%' },
  ];

  return (
    <div className="mt-6 space-y-2.5">
      {steps.map((step) => (
        <div key={step.name} className="flex items-center gap-3">
          <span className="text-[11px] text-gray-500 w-20 text-right shrink-0 font-mono">{step.name}</span>
          <div className="flex-1 h-6 rounded bg-white/[0.03] overflow-hidden relative">
            <div
              className={`h-full rounded ${step.highlight ? 'bg-amber-500/30 border border-amber-500/40' : 'bg-brand-500/20'} flex items-center px-2`}
              style={{ width: step.width }}
            >
              <span className={`text-[10px] font-mono ${step.highlight ? 'text-amber-300' : 'text-gray-400'}`}>
                {step.duration}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function GitHubVisual() {
  return (
    <div className="mt-6 space-y-3">
      <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]">
        <div className="w-5 h-5 rounded-full border-2 border-emerald-500 flex items-center justify-center shrink-0">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
        </div>
        <div className="min-w-0">
          <p className="text-[12px] text-white font-medium truncate">Cache miss in "Install dependencies"</p>
          <p className="text-[11px] text-gray-500">#142 opened 2 min ago</p>
        </div>
      </div>
      <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]">
        <svg className="w-5 h-5 text-purple-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
        </svg>
        <div className="min-w-0">
          <p className="text-[12px] text-white font-medium truncate">Add npm caching to CI workflow</p>
          <p className="text-[11px] text-gray-500">#143 ready for review</p>
        </div>
      </div>
    </div>
  );
}

function LanguagePills() {
  const tools = ['Docker', 'Node.js', 'Python', 'Go', 'Gradle', 'Rust'];
  return (
    <div className="mt-6 flex flex-wrap gap-2">
      {tools.map((tool) => (
        <span
          key={tool}
          className="text-[12px] font-medium text-gray-300 bg-white/[0.04] border border-white/[0.08] px-3 py-1.5 rounded-lg"
        >
          {tool}
        </span>
      ))}
    </div>
  );
}

export default function Features() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section className="py-24 md:py-32 px-4 sm:px-6 lg:px-8 relative" id="features">
      <div className="max-w-7xl mx-auto" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 md:mb-20"
        >
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-5">
            Everything you need for faster CI
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Built for developers who want their CI pipelines to stay fast without constant manual tuning.
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {/* Real-Time CI Analysis — wide card */}
          <motion.div
            variants={fadeInUp}
            className="md:col-span-2 rounded-2xl border border-white/[0.08] bg-surface-950 p-8"
          >
            <h3 className="text-xl font-bold text-white">Real-Time CI Analysis</h3>
            <p className="text-gray-400 text-sm mt-2 leading-relaxed">
              OpenTelemetry-powered tracing captures every step of your pipeline. Instantly see what's slow and why.
            </p>
            <TracingVisual />
          </motion.div>

          {/* Automatic Bottleneck Detection */}
          <motion.div
            variants={fadeInUp}
            className="rounded-2xl border border-white/[0.08] bg-surface-950 p-8"
          >
            <h3 className="text-xl font-bold text-white">Bottleneck Detection</h3>
            <p className="text-gray-400 text-sm mt-2 leading-relaxed">
              Identifies slow steps, redundant operations, and cache misses across every workflow run.
            </p>
            <div className="mt-6 space-y-3">
              {[
                { label: 'Cache miss', value: 'npm install', severity: 'high' },
                { label: 'Redundant step', value: 'duplicate checkout', severity: 'medium' },
                { label: 'Slow step', value: 'docker build', severity: 'high' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                  <div>
                    <p className="text-[12px] text-white font-medium">{item.label}</p>
                    <p className="text-[11px] text-gray-500 font-mono">{item.value}</p>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    item.severity === 'high'
                      ? 'text-red-400/80 bg-red-500/10'
                      : 'text-amber-400/80 bg-amber-500/10'
                  }`}>
                    {item.severity}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* GitHub-Native */}
          <motion.div
            variants={fadeInUp}
            className="rounded-2xl border border-white/[0.08] bg-surface-950 p-8"
          >
            <h3 className="text-xl font-bold text-white">GitHub-Native</h3>
            <p className="text-gray-400 text-sm mt-2 leading-relaxed">
              Insights as Issues. Fixes as PRs. Everything stays in your existing workflow.
            </p>
            <GitHubVisual />
          </motion.div>

          {/* Zero Configuration */}
          <motion.div
            variants={fadeInUp}
            className="rounded-2xl border border-white/[0.08] bg-surface-950 p-8"
          >
            <h3 className="text-xl font-bold text-white">Zero Configuration</h3>
            <p className="text-gray-400 text-sm mt-2 leading-relaxed">
              No dashboards, no config files, no tokens. Add 3 lines of YAML and FastCI does the rest.
            </p>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { value: '3', label: 'lines to install' },
                { value: '0', label: 'config needed' },
                { value: '5m', label: 'setup time' },
              ].map((stat) => (
                <div key={stat.label} className="text-center p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-[10px] text-gray-500 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Any Language, Any Framework */}
          <motion.div
            variants={fadeInUp}
            className="rounded-2xl border border-white/[0.08] bg-surface-950 p-8"
          >
            <h3 className="text-xl font-bold text-white">Any Language, Any Framework</h3>
            <p className="text-gray-400 text-sm mt-2 leading-relaxed">
              Works with Docker, Gradle, Go, Node.js, Python, and any other build tool on GitHub Actions.
            </p>
            <LanguagePills />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
