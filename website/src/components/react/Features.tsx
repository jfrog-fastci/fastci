import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { fadeInUp, staggerContainer } from '../../lib/animations';
import { DockerIcon, NodeIcon, PythonIcon, GoIcon, GradleIcon, RustIcon } from '../../lib/techIcons';
import TraceGraph from './TraceGraph';

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

function LanguagePills() {
  const tools = [
    { name: 'Docker', icon: <DockerIcon /> },
    { name: 'Node.js', icon: <NodeIcon /> },
    { name: 'Python', icon: <PythonIcon /> },
    { name: 'Go', icon: <GoIcon /> },
    { name: 'Gradle', icon: <GradleIcon /> },
    { name: 'Rust', icon: <RustIcon /> },
  ];

  return (
    <div className="mt-6 flex flex-wrap gap-2">
      {tools.map((tool) => (
        <span
          key={tool.name}
          className="inline-flex items-center gap-2 text-[12px] font-medium text-gray-300 bg-white/[0.04] border border-white/[0.08] px-3 py-1.5 rounded-lg"
        >
          {tool.icon}
          {tool.name}
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
            Built for teams who want pipelines to stay fast without constant manual tuning. Insights as Issues, fixes as PRs—you review and merge, FastCI does the rest.
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {/* CI Trace & Critical Path — full-width card */}
          <motion.div
            variants={fadeInUp}
            className="md:col-span-3 rounded-2xl border border-white/[0.08] bg-surface-950 p-8"
          >
            <h3 className="text-xl font-bold text-white">CI Trace &amp; Critical Path</h3>
            <p className="text-gray-400 text-sm mt-2 leading-relaxed">
              OpenTelemetry-powered tracing captures every job in your pipeline. The critical path—the longest sequential chain—is highlighted so you know exactly what to optimize.
            </p>
            <TraceGraph />
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
