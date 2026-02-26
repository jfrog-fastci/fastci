import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import AnimatedWorkflow from './AnimatedWorkflow';
import { TextAnimate } from '../ui/text-animate';

export default function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section className="py-24 md:py-32 px-4 sm:px-6 lg:px-8 relative" id="how-it-works">
      <div className="max-w-7xl mx-auto" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-5">
            Your CI, optimized.
          </h2>
          <TextAnimate
            animation="slideUp"
            by="word"
            className="text-gray-400 text-lg max-w-2xl mx-auto"
            stagger={0.05}
            once
          >
            {"Three steps: instrument, detect, propose. FastCI handles the analysis and fix generation\u2014you stay in control with reviewable PRs at every step."}
          </TextAnimate>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <AnimatedWorkflow />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-6 flex items-center justify-center gap-3"
        >
          <div className="flex -space-x-1">
            <div className="w-2 h-2 rounded-full bg-brand-400" />
            <div className="w-2 h-2 rounded-full bg-brand-300" />
            <div className="w-2 h-2 rounded-full bg-brand-200" />
          </div>
          <span className="text-xs text-gray-500">Works with any GitHub Actions workflow</span>
        </motion.div>
      </div>
    </section>
  );
}
