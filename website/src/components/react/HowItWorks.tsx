import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useRef, useState } from 'react';
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

const issues = [
  { id: 42, title: 'Dependency caching missing for `npm i`' },
  { id: 43, title: 'Missing multi-stage build in `docker build`' },
  { id: 44, title: 'Pin base image to increase cache hit rate' },
] as const;

function GitHubIssueIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
      <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z" />
    </svg>
  );
}

function IssueRow({ id, title, index }: { id: number; title: string; index: number }) {
  const [hovered, setHovered] = useState(false);
  const parts = title.split(/`([^`]+)`/);

  return (
    <motion.div
      className="group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-default transition-colors hover:bg-white/[0.03]"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.12, duration: 0.4, ease: [0.25, 0.4, 0.25, 1] }}
    >
      <GitHubIssueIcon className="w-3.5 h-3.5 text-emerald-500 shrink-0" />

      <span className="text-[13px] text-gray-300 flex-1 min-w-0 truncate">
        {parts.map((part, i) =>
          i % 2 === 1 ? (
            <code key={i} className="text-brand-400 bg-brand-500/10 px-1 py-0.5 rounded text-[12px]">{part}</code>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>

      <AnimatePresence>
        {hovered && (
          <motion.span
            initial={{ opacity: 0, x: 6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 6 }}
            transition={{ duration: 0.15 }}
            className="text-[11px] font-mono text-gray-500 shrink-0"
          >
            #{id}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function IssueMockup() {
  return (
    <div className="mt-6 rounded-xl bg-black/60 border border-white/[0.06] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06]">
        <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 16 16">
          <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="8" cy="8" r="2" />
        </svg>
        <span className="text-[11px] text-gray-500 font-mono">3 issues opened</span>
      </div>
      <div className="p-2 space-y-0.5">
        {issues.map((issue, i) => (
          <IssueRow key={i} id={issue.id} title={issue.title} index={i} />
        ))}
      </div>
    </div>
  );
}

function DiffLine({ type, oldNum, newNum, content }: { type: 'add' | 'del' | 'ctx'; oldNum?: number; newNum?: number; content: string }) {
  const bg = type === 'add' ? 'bg-emerald-500/10' : type === 'del' ? 'bg-red-500/10' : '';
  const prefix = type === 'add' ? '+' : type === 'del' ? '-' : ' ';
  const prefixColor = type === 'add' ? 'text-emerald-400' : type === 'del' ? 'text-red-400' : 'text-gray-500';
  const textColor = type === 'del' ? 'text-red-300/90' : 'text-gray-300';
  return (
    <div className={`flex font-mono text-[11px] leading-relaxed ${bg}`}>
      <span className="w-6 shrink-0 text-right pr-2 text-gray-600 select-none">{oldNum ?? ''}</span>
      <span className="w-6 shrink-0 text-right pr-2 text-gray-600 select-none">{newNum ?? ''}</span>
      <span className={`w-4 shrink-0 ${prefixColor}`}>{prefix}</span>
      <span className={textColor}>{content}</span>
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
          <span className="text-[13px] text-white font-medium">Add multi-stage build to Dockerfile</span>
        </div>
        <div className="pl-6 space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-brand-400/80 bg-brand-500/10 px-2 py-0.5 rounded-full">ready for review</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-gray-500">
            <span className="flex items-center gap-1">
              <span className="text-emerald-400">+12</span> <span className="text-red-400">-8</span>
            </span>
            <span>Dockerfile</span>
          </div>
        </div>
      </div>
      {/* GitHub-style diff: single-stage → multi-stage */}
      <div className="border-t border-white/[0.06]">
        <div className="flex items-center gap-2 px-4 py-2 border-b border-white/[0.06] bg-black/30">
          <span className="text-[11px] text-gray-500 font-mono">Dockerfile</span>
        </div>
        <div className="p-2 font-mono text-[11px] overflow-x-auto">
          <DiffLine type="del" oldNum={1} newNum={undefined} content="FROM node:18" />
          <DiffLine type="add" oldNum={undefined} newNum={1} content="FROM node:18 AS builder" />
          <DiffLine type="ctx" oldNum={2} newNum={2} content="WORKDIR /app" />
          <DiffLine type="ctx" oldNum={3} newNum={3} content="COPY package*.json ./" />
          <DiffLine type="ctx" oldNum={4} newNum={4} content="RUN npm ci" />
          <DiffLine type="ctx" oldNum={5} newNum={5} content="COPY . ." />
          <DiffLine type="del" oldNum={6} newNum={undefined} content="RUN npm run build" />
          <DiffLine type="del" oldNum={7} newNum={undefined} content={'CMD ["npm", "start"]'} />
          <DiffLine type="add" oldNum={undefined} newNum={6} content="RUN npm run build" />
          <DiffLine type="add" oldNum={undefined} newNum={7} content="FROM node:18-slim" />
          <DiffLine type="add" oldNum={undefined} newNum={8} content="WORKDIR /app" />
          <DiffLine type="add" oldNum={undefined} newNum={9} content="COPY --from=builder /app/dist ./dist" />
          <DiffLine type="add" oldNum={undefined} newNum={10} content="COPY package*.json ./" />
          <DiffLine type="add" oldNum={undefined} newNum={11} content="RUN npm ci --omit=dev" />
          <DiffLine type="add" oldNum={undefined} newNum={12} content={'CMD ["npm", "start"]'} />
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
