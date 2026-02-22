import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { fadeInUp, staggerContainer } from '../../lib/animations';

function YamlSnippet() {
  return (
    <div className="mt-6 rounded-xl bg-black/60 border border-white/[0.06] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06]">
        <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
        <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
        <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
        <span className="ml-2 text-[11px] text-gray-500 font-mono">ci.yml</span>
      </div>
      <div className="p-4 font-mono text-[13px] leading-relaxed">
        <div className="text-gray-600"># Add to any job</div>
        <div className="mt-1">
          <span className="text-purple-400">steps</span>
          <span className="text-gray-500">:</span>
        </div>
        <div>
          <span className="text-gray-500">  - </span>
          <span className="text-purple-400">uses</span>
          <span className="text-gray-500">: </span>
          <span className="text-brand-400">jfrog-fastci/fastci@v0</span>
        </div>
      </div>
    </div>
  );
}

function IssueMockup() {
  return (
    <div className="mt-6 rounded-xl bg-black/60 border border-white/[0.06] overflow-hidden">
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border-2 border-emerald-500 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </div>
          <span className="text-[13px] text-white font-medium">Cache miss detected in npm install</span>
        </div>
        <div className="pl-6 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-amber-400/80 bg-amber-500/10 px-2 py-0.5 rounded-full">bottleneck</span>
            <span className="text-[10px] font-medium text-purple-400/80 bg-purple-500/10 px-2 py-0.5 rounded-full">cache</span>
          </div>
          <p className="text-[12px] text-gray-500 leading-relaxed">
            Step "Install dependencies" takes 2m 34s. Adding a cache key based on package-lock.json could reduce this to ~8s.
          </p>
        </div>
      </div>
    </div>
  );
}

function PRMockup() {
  return (
    <div className="mt-6 rounded-xl bg-black/60 border border-white/[0.06] overflow-hidden">
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2.5">
          <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
          </svg>
          <span className="text-[13px] text-white font-medium">Add npm caching to CI workflow</span>
        </div>
        <div className="pl-6 space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-brand-400/80 bg-brand-500/10 px-2 py-0.5 rounded-full">ready for review</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-gray-500">
            <span className="flex items-center gap-1">
              <span className="text-emerald-400">+12</span> <span className="text-red-400">-2</span>
            </span>
            <span>ci.yml</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section className="py-24 md:py-32 px-4 sm:px-6 lg:px-8 relative" id="how-it-works">
      <div className="max-w-7xl mx-auto" ref={ref}>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {/* Hero card — spans 1 col on desktop */}
          <motion.div
            variants={fadeInUp}
            className="md:row-span-2 rounded-2xl border border-white/[0.08] bg-surface-950 p-8 md:p-10 flex flex-col justify-between"
          >
            <div>
              <h2 className="text-3xl md:text-[2.75rem] font-extrabold text-white leading-tight tracking-tight">
                Your CI,<br />optimized.
              </h2>
              <p className="text-gray-400 mt-4 leading-relaxed">
                Three steps, fully automated. From installation to AI-powered fixes, FastCI handles everything so you can focus on shipping.
              </p>
            </div>
            <div className="mt-8 flex items-center gap-3">
              <div className="flex -space-x-1">
                <div className="w-2 h-2 rounded-full bg-brand-400" />
                <div className="w-2 h-2 rounded-full bg-brand-300" />
                <div className="w-2 h-2 rounded-full bg-brand-200" />
              </div>
              <span className="text-xs text-gray-500">Works with any GitHub Actions workflow</span>
            </div>
          </motion.div>

          {/* Step 1: Drop in */}
          <motion.div
            variants={fadeInUp}
            className="md:col-span-2 rounded-2xl border border-white/[0.08] bg-surface-950 p-8"
          >
            <div className="flex items-center gap-3 mb-1">
              <span className="text-[11px] font-mono text-gray-500 tracking-widest">01</span>
              <h3 className="text-xl font-bold text-white">Drop in FastCI</h3>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Add 3 lines of YAML to any GitHub Actions workflow. FastCI runs as the first step and instruments your entire pipeline.
            </p>
            <YamlSnippet />
          </motion.div>

          {/* Step 2: Insights */}
          <motion.div
            variants={fadeInUp}
            className="rounded-2xl border border-white/[0.08] bg-surface-950 p-8"
          >
            <div className="flex items-center gap-3 mb-1">
              <span className="text-[11px] font-mono text-gray-500 tracking-widest">02</span>
              <h3 className="text-xl font-bold text-white">Insights Detected</h3>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Analyzes every run, identifies bottlenecks, and opens GitHub Issues with actionable diagnostics.
            </p>
            <IssueMockup />
          </motion.div>

          {/* Step 3: AI Fixes */}
          <motion.div
            variants={fadeInUp}
            className="rounded-2xl border border-white/[0.08] bg-surface-950 p-8"
          >
            <div className="flex items-center gap-3 mb-1">
              <span className="text-[11px] font-mono text-gray-500 tracking-widest">03</span>
              <h3 className="text-xl font-bold text-white">AI Fixes Applied</h3>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              An AI agent implements each fix and opens a pull request. Just review and merge.
            </p>
            <PRMockup />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
