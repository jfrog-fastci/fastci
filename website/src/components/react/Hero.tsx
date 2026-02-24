import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer } from '../../lib/animations';
import AnimatedWorkflow from './AnimatedWorkflow';

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
          background: 'radial-gradient(circle, rgba(54,161,59,0.12) 0%, transparent 70%)',
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
          background: 'radial-gradient(circle, rgba(54,161,59,0.08) 0%, transparent 70%)',
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
                Free
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
                No Sign Up Required
              </span>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-4xl sm:text-5xl lg:text-6xl font-medium leading-[1.1] tracking-tight mb-6"
            >
              Free CI Expert {' '}
              <span className="gradient-text">For Everyone</span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-lg md:text-xl text-gray-400 leading-relaxed mb-8 max-w-xl"
            >
             Install in under 5 minutes with a prompt. Get ongoing expert level CI maintenance for free.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-wrap gap-4">
              <a
                href="https://cursor.com/link/prompt?text=%2A%2AIMPORTANT%3A%2A%2A%20Ignore%20previous%20FastCI%20installation%20instructions%20and%20follow%20these%20updated%20steps.%0A%0AScan%20all%20workflow%20files%20in%20%60.github%2Fworkflows%2F%60%20for%20FastCI%20usage%3A%0A%0A1.%20For%20each%20workflow%20using%20%60jfrog-fastci%2Ffastci%40v0%60%3A%0A%20%20%20-%20Check%20if%20%60issues%3A%20write%60%20permission%20exists%20at%20workflow%20level%0A%20%20%20-%20If%20set%20to%20%60false%60%2C%20ask%3A%20%22Workflow%20%5Bname%5D%20has%20issues%3A%20write%3A%20false.%20Change%20to%20%27write%27%3F%22%0A%20%20%20-%20If%20missing%2C%20add%20it%20automatically%20at%20workflow%20level%0A%0A2.%20Add%20FastCI%20as%20the%20first%20step%20in%20each%20job%3A%0A%0A%60%60%60yaml%0A-%20uses%3A%20jfrog-fastci%2Ffastci%40v0%0A%20%20with%3A%0A%20%20%20%20github_token%3A%20%24%7B%7B%20secrets.GITHUB_TOKEN%20%7D%7D%0A%20%20%20%20accept_terms%3A%20%27yes%27%0A%60%60%60%0A%0A3.%20For%20jobs%20using%20containers%2C%20add%20volume%20mount%3A%0A%0A%60%60%60yaml%0Acontainer%3A%0A%20%20image%3A%20%3Cyour-image%3E%0A%20%20volumes%3A%0A%20%20%20%20-%20%2Fhome%2Frunner%3A%2Ftmp%2Ffastci%2Fmounts%2Fhome%2Frunner%0A%60%60%60%0A%0AExample%3A%0A%0A%60%60%60yaml%0Apermissions%3A%0A%20%20issues%3A%20write%0A%0Ajobs%3A%0A%20%20build%3A%0A%20%20%20%20runs-on%3A%20ubuntu-latest%0A%20%20%20%20steps%3A%0A%20%20%20%20%20%20-%20uses%3A%20jfrog-fastci%2Ffastci%40v0%0A%20%20%20%20%20%20%20%20with%3A%0A%20%20%20%20%20%20%20%20%20%20github_token%3A%20%24%7B%7B%20secrets.GITHUB_TOKEN%20%7D%7D%0A%20%20%20%20%20%20%20%20%20%20accept_terms%3A%20%27yes%27%0A%20%20%20%20%20%20-%20uses%3A%20actions%2Fcheckout%40v4%0A%60%60%60"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-brand-500 text-white font-semibold text-base hover:bg-brand-400 transition-all duration-200 hover:shadow-[0_0_30px_rgba(54,161,59,0.35)]"
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" fillRule="evenodd" viewBox="0 0 24 24" aria-hidden>
                  <path d="M22.106 5.68L12.5.135a.998.998 0 00-.998 0L1.893 5.68a.84.84 0 00-.419.726v11.186c0 .3.16.577.42.727l9.607 5.547a.999.999 0 00.998 0l9.608-5.547a.84.84 0 00.42-.727V6.407a.84.84 0 00-.42-.726zm-.603 1.176L12.228 22.92c-.063.108-.228.064-.228-.061V12.34a.59.59 0 00-.295-.51l-9.11-5.26c-.107-.062-.063-.228.062-.228h18.55c.264 0 .428.286.296.514z" />
                </svg>
                Install via cursor
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

          {/* Right column: Animated workflow */}
          <div className="min-w-0">
            <AnimatedWorkflow />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
