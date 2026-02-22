import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer, fadeIn } from '../../lib/animations';
import AnimatedCounter from './AnimatedCounter';

function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Gradient orbs */}
      <motion.div
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-1/4 -left-1/4 w-[800px] h-[800px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(26,173,124,0.12) 0%, transparent 70%)',
        }}
      />
      <motion.div
        animate={{
          opacity: [0.2, 0.5, 0.2],
          scale: [1, 1.15, 1],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute -bottom-1/4 -right-1/4 w-[600px] h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(62,200,150,0.1) 0%, transparent 70%)',
        }}
      />

      {/* Grid lines */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-surface-950" />
    </div>
  );
}

function CodeSnippet() {
  return (
    <motion.div
      variants={fadeInUp}
      className="relative max-w-lg mx-auto lg:mx-0"
    >
      <div className="glass-card overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
          <div className="w-3 h-3 rounded-full bg-red-500/60" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
          <div className="w-3 h-3 rounded-full bg-green-500/60" />
          <span className="ml-2 text-xs text-gray-500 font-mono">.github/workflows/ci.yml</span>
        </div>
        <div className="p-5 font-mono text-sm leading-relaxed">
          <div className="text-gray-500">
            <span className="text-gray-600"># Add FastCI to any job — just 3 lines</span>
          </div>
          <div className="mt-2">
            <span className="text-purple-400">steps</span>
            <span className="text-gray-500">:</span>
          </div>
          <div>
            <span className="text-gray-500">  - </span>
            <span className="text-purple-400">uses</span>
            <span className="text-gray-500">: </span>
            <motion.span
              className="text-brand-400"
              animate={{ opacity: [1, 0.6, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              jfrog-fastci/fastci@v0
            </motion.span>
          </div>
          <div>
            <span className="text-gray-500">    </span>
            <span className="text-purple-400">with</span>
            <span className="text-gray-500">:</span>
          </div>
          <div>
            <span className="text-gray-500">      </span>
            <span className="text-purple-400">github_token</span>
            <span className="text-gray-500">: </span>
            <span className="text-amber-300">{'${{ secrets.GITHUB_TOKEN }}'}</span>
          </div>
          <div>
            <span className="text-gray-500">      </span>
            <span className="text-purple-400">accept_terms</span>
            <span className="text-gray-500">: </span>
            <span className="text-emerald-300">'yes'</span>
          </div>
        </div>
      </div>

      {/* Glow behind card */}
      <div className="absolute -inset-4 -z-10 bg-brand-500/5 rounded-3xl blur-2xl" />
    </motion.div>
  );
}

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-20">
      <GridBackground />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center"
        >
          {/* Left column: Copy */}
          <div>
            <motion.div variants={fadeInUp} className="mb-6">
              <span className="inline-flex items-center gap-2 text-sm font-medium text-brand-400 bg-brand-500/10 px-4 py-1.5 rounded-full border border-brand-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
                Open Source &middot; Free Forever
              </span>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight mb-6"
            >
              Automatically Identify{' '}
              <br className="hidden sm:block" />
              &amp; Optimize{' '}
              <span className="gradient-text">Your CI</span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-lg md:text-xl text-gray-400 leading-relaxed mb-8 max-w-xl"
            >
              A drop-in agent for GitHub Actions that finds CI bottlenecks
              in real-time and generates fixes automatically. Turn CI
              maintenance from reactive to proactive.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-wrap gap-4">
              <a
                href="https://github.com/jfrog-fastci/fastci#installation"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-brand-500 text-white font-semibold text-base hover:bg-brand-400 transition-all duration-200 hover:shadow-[0_0_30px_rgba(26,173,124,0.35)]"
              >
                Get Started
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
              <a
                href="https://github.com/jfrog-fastci/fastci"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-white/10 text-white font-medium text-base hover:bg-white/5 hover:border-white/20 transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                View on GitHub
              </a>
            </motion.div>
          </div>

          {/* Right column: Code snippet */}
          <CodeSnippet />
        </motion.div>

        {/* Stats row */}
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.8 }}
          className="mt-20 md:mt-28 grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-4"
        >
          <AnimatedCounter target={3} suffix=" lines" label="to install" />
          <AnimatedCounter target={5} suffix=" min" label="setup time" />
          <AnimatedCounter target={100} suffix="%" label="GitHub native" />
        </motion.div>
      </div>
    </section>
  );
}
