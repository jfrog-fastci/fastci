import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { fadeInUp, staggerContainer } from '../../lib/animations';
import { TextAnimate } from '../ui/text-animate';

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
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-5">AI Codes Faster Than Your CI</h2>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10"
        >
          {problems.map((problem) => (
            <motion.article
              key={problem.title}
              variants={fadeInUp}
              className="rounded-2xl border border-white/[0.08] bg-surface-950 p-7"
            >
              <h3 className="text-lg font-bold text-white mb-2">{problem.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{problem.body}</p>
            </motion.article>
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
