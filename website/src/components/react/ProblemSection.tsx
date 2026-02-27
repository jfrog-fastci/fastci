import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { fadeInUp, staggerContainer } from '../../lib/animations';
import { TextAnimate } from '../ui/text-animate';

function FlowInterruptedIcon({ hovered }: { hovered: boolean }) {
  return (
    <svg width="64" height="48" viewBox="0 0 64 48" fill="none" className="mb-4">
      <motion.g
        initial={false}
        animate={{ x: hovered ? -5 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      >
        <path
          d="M2 24C9 10 17 38 24 24"
          stroke="#818cf8"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="5" cy="20" r="1.5" fill="#818cf8" opacity="0.5" />
        <circle cx="15" cy="30" r="1.5" fill="#818cf8" opacity="0.5" />
      </motion.g>
      <motion.g
        initial={false}
        animate={{ x: hovered ? 5 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      >
        <path
          d="M40 24C47 10 55 38 62 24"
          stroke="#818cf8"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="49" cy="16" r="1.5" fill="#818cf8" opacity="0.5" />
        <circle cx="58" cy="30" r="1.5" fill="#818cf8" opacity="0.5" />
      </motion.g>
      <motion.path
        d="M24 24C29 18 35 30 40 24"
        stroke="#818cf8"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        initial={false}
        animate={{ opacity: hovered ? 0 : 0.5 }}
        transition={{ duration: 0.25 }}
      />
      <motion.path
        d="M34 14L30 24L34 22L30 34"
        stroke="#f97316"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={false}
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.25, delay: hovered ? 0.15 : 0 }}
      />
    </svg>
  );
}

function ToilRecurringIcon({ hovered }: { hovered: boolean }) {
  return (
    <motion.div
      className="mb-4 w-12 h-12"
      initial={false}
      animate={hovered ? { rotate: 360 } : { rotate: 0 }}
      transition={
        hovered
          ? { duration: 2, repeat: Infinity, ease: 'linear' }
          : { duration: 0.5, ease: 'easeOut' }
      }
    >
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <path
          d="M24 8A16 16 0 0140 24"
          stroke="#818cf8"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M37 20L40 24L36 26"
          stroke="#818cf8"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M24 40A16 16 0 018 24"
          stroke="#818cf8"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M11 28L8 24L12 22"
          stroke="#818cf8"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </motion.div>
  );
}

function MaintenancePriorityIcon({ hovered }: { hovered: boolean }) {
  return (
    <svg width="56" height="48" viewBox="0 0 56 48" fill="none" className="mb-4">
      <motion.g
        initial={false}
        animate={{ y: hovered ? 6 : 0, opacity: hovered ? 0.35 : 1 }}
        transition={{ duration: 0.4 }}
      >
        <rect x="4" y="8" rx="3" width="36" height="6" fill="#818cf8" />
      </motion.g>
      <motion.g
        initial={false}
        animate={{ y: hovered ? 8 : 0, opacity: hovered ? 0.2 : 0.6 }}
        transition={{ duration: 0.4, delay: 0.06 }}
      >
        <rect x="4" y="20" rx="3" width="26" height="6" fill="#818cf8" />
      </motion.g>
      <motion.g
        initial={false}
        animate={{ y: hovered ? 10 : 0, opacity: hovered ? 0.08 : 0.3 }}
        transition={{ duration: 0.4, delay: 0.12 }}
      >
        <rect x="4" y="32" rx="3" width="18" height="6" fill="#818cf8" />
      </motion.g>
      <motion.g
        initial={false}
        animate={{ opacity: hovered ? 1 : 0, y: hovered ? 0 : -4 }}
        transition={{ duration: 0.3, delay: hovered ? 0.2 : 0 }}
      >
        <path d="M46 12L46 36" stroke="#f97316" strokeWidth="2" strokeLinecap="round" />
        <path
          d="M42 32L46 36L50 32"
          stroke="#f97316"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </motion.g>
    </svg>
  );
}

const iconComponents = [FlowInterruptedIcon, ToilRecurringIcon, MaintenancePriorityIcon];

const problems = [
  {
    title: 'Flow gets interrupted',
    body: 'Long CI runs force context switching before PR handoff.',
  },
  {
    title: 'Toil keeps recurring',
    body: 'The same bottlenecks and regressions reappear across workflows.',
  },
  {
    title: 'Maintenance loses priority',
    body: 'Feature pressure pushes CI tuning to later, and slowdowns compound.',
  },
] as const;

function PainCard({
  problem,
  Icon,
}: {
  problem: (typeof problems)[number];
  Icon: React.ComponentType<{ hovered: boolean }>;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.article
      variants={fadeInUp}
      className="rounded-2xl border border-white/[0.08] bg-surface-950 p-7"
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
    >
      <Icon hovered={hovered} />
      <h3 className="text-lg font-bold text-white mb-2">{problem.title}</h3>
      <p className="text-sm text-gray-400 leading-relaxed">{problem.body}</p>
    </motion.article>
  );
}

export default function ProblemSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section className="py-20 md:py-24 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-5xl mx-auto" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-14"
        >
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-5">Fast Agents Need FastCI</h2>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10"
        >
          {problems.map((problem, i) => (
            <PainCard key={problem.title} problem={problem} Icon={iconComponents[i]} />
          ))}
        </motion.div>

        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          <TextAnimate
            animation="slideUp"
            by="word"
            className="text-center text-base md:text-lg text-gray-300 max-w-3xl mx-auto"
            stagger={0.05}
            once
          >
            FastCI turns CI optimization into a continuous, reviewable process so teams ship faster without sacrificing control.
          </TextAnimate>
        </motion.div>
      </div>
    </section>
  );
}
