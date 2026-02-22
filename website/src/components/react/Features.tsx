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
  const tools: { name: string; icon: React.ReactNode }[] = [
    {
      name: 'Docker',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M13.983 11.078h2.119a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.119a.186.186 0 00-.185.186v1.887c0 .102.083.185.185.185zm-2.954-5.43h2.118a.186.186 0 00.186-.186V3.574a.186.186 0 00-.186-.185h-2.118a.186.186 0 00-.185.185v1.888c0 .102.082.185.185.186zm0 2.716h2.118a.187.187 0 00.186-.186V6.29a.186.186 0 00-.186-.185h-2.118a.186.186 0 00-.185.185v1.887c0 .102.082.186.185.186zm-2.93 0h2.12a.186.186 0 00.184-.186V6.29a.185.185 0 00-.185-.185H8.1a.186.186 0 00-.185.185v1.887c0 .102.083.186.185.186zm-2.964 0h2.119a.186.186 0 00.185-.186V6.29a.186.186 0 00-.185-.185H5.136a.186.186 0 00-.186.185v1.887c0 .102.084.186.186.186zm5.893 2.715h2.118a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.118a.186.186 0 00-.185.186v1.887c0 .102.082.185.185.185zm-2.93 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.186v1.887c0 .102.083.185.185.185zm-2.964 0h2.119a.186.186 0 00.185-.185V9.006a.186.186 0 00-.185-.186H5.136a.186.186 0 00-.186.186v1.887c0 .102.084.185.186.185zm-2.92 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.186.186 0 00-.186.186v1.887c0 .102.084.185.186.185zM23.763 9.89c-.065-.051-.672-.51-1.954-.51-.338.001-.676.03-1.01.087-.248-1.7-1.653-2.53-1.716-2.566l-.344-.199-.226.327c-.284.438-.49.922-.612 1.43-.23.97-.09 1.882.403 2.661-.595.332-1.55.413-1.744.42H.751a.751.751 0 00-.75.748 11.376 11.376 0 00.692 4.062c.545 1.428 1.355 2.48 2.41 3.124 1.18.723 3.1 1.137 5.275 1.137.983.003 1.963-.086 2.93-.266a12.248 12.248 0 003.823-1.389c.98-.567 1.86-1.288 2.61-2.136 1.252-1.418 1.998-2.997 2.553-4.4h.221c1.372 0 2.215-.549 2.68-1.009.309-.293.55-.65.707-1.046l.098-.288z" />
        </svg>
      ),
    },
    {
      name: 'Node.js',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.998 24c-.321 0-.641-.084-.922-.247l-2.936-1.737c-.438-.245-.224-.332-.08-.383.585-.203.703-.25 1.328-.604.065-.037.151-.023.218.017l2.256 1.339a.29.29 0 00.272 0l8.795-5.076a.277.277 0 00.134-.238V6.921a.28.28 0 00-.137-.242l-8.791-5.072a.278.278 0 00-.271 0L3.075 6.68a.284.284 0 00-.139.241v10.15a.27.27 0 00.138.236l2.409 1.392c1.307.654 2.108-.116 2.108-.89V7.787c0-.142.114-.253.256-.253h1.115c.139 0 .255.112.255.253v10.021c0 1.745-.95 2.745-2.604 2.745-.508 0-.909 0-2.026-.551L2.28 18.675A1.857 1.857 0 011.375 17.07V6.921c0-.681.363-1.317.953-1.658L11.12.187a1.929 1.929 0 011.846 0l8.794 5.076c.588.34.952.977.952 1.658v10.15c0 .68-.364 1.316-.952 1.658l-8.794 5.076a1.89 1.89 0 01-.968.195z" />
        </svg>
      ),
    },
    {
      name: 'Python',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14.25.18l.9.2.73.26.59.3.45.32.34.34.25.34.16.33.1.3.04.26.02.2-.01.13V8.5l-.05.63-.13.55-.21.46-.26.38-.3.31-.33.25-.35.19-.35.14-.33.1-.3.07-.26.04-.21.02H8.77l-.69.05-.59.14-.5.22-.41.27-.33.32-.27.35-.2.36-.15.37-.1.35-.07.32-.04.27-.02.21v3.06H3.17l-.21-.03-.28-.07-.32-.12-.35-.18-.36-.26-.36-.36-.35-.46-.32-.59-.28-.73-.21-.88-.14-1.05-.05-1.23.06-1.22.16-1.04.24-.87.32-.71.36-.57.4-.44.42-.33.42-.24.4-.16.36-.1.32-.05.24-.01h.16l.06.01h8.16v-.83H6.18l-.01-2.75-.02-.37.05-.34.11-.31.17-.28.25-.26.31-.23.38-.2.44-.18.51-.15.58-.12.64-.1.71-.06.77-.04.84-.02 1.27.05zm-6.3 1.98l-.23.33-.08.41.08.41.23.34.33.22.41.09.41-.09.33-.22.23-.34.08-.41-.08-.41-.23-.33-.33-.22-.41-.09-.41.09zm13.09 3.95l.28.06.32.12.35.18.36.27.36.35.35.47.32.59.28.73.21.88.14 1.04.05 1.23-.06 1.23-.16 1.04-.24.86-.32.71-.36.57-.4.45-.42.33-.42.24-.4.16-.36.09-.32.05-.24.02-.16-.01h-8.22v.82h5.84l.01 2.76.02.36-.05.34-.11.31-.17.29-.25.25-.31.24-.38.2-.44.17-.51.15-.58.13-.64.09-.71.07-.77.04-.84.01-1.27-.04-1.07-.14-.9-.2-.73-.25-.59-.3-.45-.33-.34-.34-.25-.34-.16-.33-.1-.3-.04-.25-.02-.2.01-.13v-5.34l.05-.64.13-.54.21-.46.26-.38.3-.32.33-.24.35-.2.35-.14.33-.1.3-.06.26-.04.21-.02.13-.01h5.84l.69-.05.59-.14.5-.21.41-.28.33-.32.27-.35.2-.36.15-.36.1-.35.07-.32.04-.28.02-.21V6.07h2.09l.14.01zm-6.47 14.25l-.23.33-.08.41.08.41.23.33.33.23.41.08.41-.08.33-.23.23-.33.08-.41-.08-.41-.23-.33-.33-.23-.41-.08-.41.08z" />
        </svg>
      ),
    },
    {
      name: 'Go',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M1.811 10.231c-.047 0-.058-.023-.035-.059l.246-.315c.023-.035.081-.058.128-.058h4.172c.046 0 .058.035.035.07l-.199.303c-.023.036-.082.07-.117.07zM.047 11.306c-.047 0-.059-.023-.035-.058l.245-.316c.023-.035.082-.058.129-.058h5.328c.047 0 .07.035.058.07l-.093.28c-.012.047-.058.07-.105.07zm2.828 1.075c-.047 0-.059-.035-.035-.07l.163-.292c.023-.035.07-.07.117-.07h2.337c.047 0 .07.035.07.082l-.023.28c0 .047-.047.082-.082.082zm12.129-2.36c-.736.187-1.239.327-1.963.514-.176.046-.187.058-.34-.117-.174-.199-.303-.327-.548-.444-.737-.362-1.45-.257-2.115.175-.795.514-1.204 1.274-1.192 2.22.011.934.654 1.706 1.577 1.835.795.105 1.46-.175 1.987-.77.105-.13.198-.27.315-.434H10.47c-.245 0-.304-.152-.222-.35.152-.362.432-.97.596-1.274a.315.315 0 01.292-.187h4.253c-.023.316-.023.631-.07.947a4.983 4.983 0 01-.958 2.29c-.841 1.11-1.94 1.8-3.33 1.986-1.145.152-2.209-.07-3.143-.77-.865-.655-1.356-1.52-1.484-2.595-.152-1.274.222-2.419.993-3.424.83-1.086 1.928-1.776 3.272-2.02 1.098-.2 2.15-.07 3.096.571.62.41 1.063.97 1.356 1.648.07.105.023.164-.117.2z" />
        </svg>
      ),
    },
    {
      name: 'Gradle',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.695 4.297a3.807 3.807 0 00-5.29-.09.214.214 0 00.007.312l.96.862a.214.214 0 00.282.006 1.726 1.726 0 012.608 2.108c-.263.506-.801 1.394-1.553 2.49A9.2 9.2 0 0012.145 6.2a9.2 9.2 0 00-5.206 1.61C4.345 5.833 3.37 4.57 3.37 4.57s-.484.36-.725.538c0 0 .982 1.45 3.492 3.926A9.22 9.22 0 003.14 15.2a9.2 9.2 0 009.198 9.199 9.2 9.2 0 009.198-9.199c0-2.107-.717-4.044-1.917-5.594.85-1.123 1.595-2.2 1.944-2.87a3.808 3.808 0 001.133-2.438zM12.145 22.08a6.88 6.88 0 110-13.76 6.88 6.88 0 010 13.76zM9.06 15.2a.96.96 0 11-1.92 0 .96.96 0 011.92 0zm5.922 0a.96.96 0 11-1.92 0 .96.96 0 011.92 0z" />
        </svg>
      ),
    },
    {
      name: 'Rust',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.834 11.703l-1.707-.956a12.545 12.545 0 00-.065-.632l1.452-1.263a.298.298 0 00.037-.378l-.327-.564a.298.298 0 00-.355-.143l-1.817.596a10.178 10.178 0 00-.404-.507l1.063-1.632a.298.298 0 00-.09-.37l-.52-.378a.298.298 0 00-.38.021l-1.37 1.218c-.174-.14-.354-.274-.537-.4l.597-1.897a.298.298 0 00-.198-.34l-.601-.196a.298.298 0 00-.364.12l-.863 1.665a10.094 10.094 0 00-.618-.236L16.35 2.694a.298.298 0 00-.295-.262h-.63a.298.298 0 00-.295.262l-.174 1.92a10.15 10.15 0 00-.63.124l-.862-1.666a.298.298 0 00-.364-.121l-.601.196a.298.298 0 00-.198.34l.597 1.897c-.183.126-.363.26-.537.4L11.99 4.566a.298.298 0 00-.38-.02l-.52.378a.298.298 0 00-.09.37l1.063 1.632c-.14.165-.275.334-.403.507l-1.817-.596a.298.298 0 00-.355.143l-.327.564a.298.298 0 00.037.378l1.452 1.263a12.59 12.59 0 00-.065.632l-1.707.956a.298.298 0 00-.139.361l.196.601a.298.298 0 00.34.198l1.898-.597a10.23 10.23 0 00.208.623l-1.545 1.137a.298.298 0 00-.055.374l.378.52a.298.298 0 00.37.09l1.74-.952c.17.178.347.35.53.516l-1.109 1.471a.298.298 0 00.037.378l.472.428a.298.298 0 00.38.02l1.422-1.24c.2.143.405.277.616.402l-.618 1.742a.298.298 0 00.131.367l.564.327a.298.298 0 00.378-.037l1.02-1.56c.22.094.445.178.674.252l-.092 1.887a.298.298 0 00.222.305l.63.164a.298.298 0 00.34-.198l.505-1.811c.236.03.474.05.714.057l.43 1.84a.298.298 0 00.305.222l.645-.049a.298.298 0 00.262-.295l-.078-1.913c.232-.059.462-.128.687-.207l.897 1.696a.298.298 0 00.367.131l.581-.275a.298.298 0 00.143-.355l-.813-1.769c.201-.13.397-.269.587-.415l1.275 1.343a.298.298 0 00.378.037l.471-.428a.298.298 0 00.02-.38l-1.21-1.402a10.3 10.3 0 00.435-.543l1.59.937a.298.298 0 00.374-.054l.327-.52a.298.298 0 00-.09-.37l-1.522-1.068c.12-.204.231-.413.334-.626l1.82.518a.298.298 0 00.34-.198l.196-.601a.298.298 0 00-.14-.361zM12 18.601a6.6 6.6 0 110-13.2 6.6 6.6 0 010 13.2zM7.658 13.482h1.667l.504 1.559H8.064zm4.178-3.263l.917 2.832H10.92zm3.678 3.263h1.667l-1.765 1.559h-1.765z" />
        </svg>
      ),
    },
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
