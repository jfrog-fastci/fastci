import { motion, useInView } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { fadeInUp, staggerContainer } from '../../../lib/animations';
import { basePath } from '../../../lib/baseUrl';
import type { InsightMeta } from '../../../data/insights/types';

interface Props {
  meta: InsightMeta;
  aggregatedROI: number;
  repoCount: number;
}

function InlineCounter({ target }: { target: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const startTime = performance.now();
    const durationMs = 2000;
    function step(currentTime: number) {
      const progress = Math.min((currentTime - startTime) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [isInView, target]);

  return <span ref={ref}>{count}</span>;
}

export default function InsightHero({ meta, aggregatedROI, repoCount }: Props) {
  return (
    <section className="relative px-4 sm:px-6 lg:px-8 mb-16 md:mb-24">
      <div className="max-w-5xl mx-auto">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.a
            variants={fadeInUp}
            href={basePath('#labs')}
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-brand-400 transition-colors mb-8 group"
          >
            <svg
              className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11 17l-5-5m0 0l5-5m-5 5h12"
              />
            </svg>
            JFrog CI Labs
          </motion.a>

          <motion.div variants={fadeInUp} className="mb-4">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-brand-400 bg-brand-500/10 px-4 py-1.5 rounded-full border border-brand-500/20">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"
                />
              </svg>
              {meta.category}
            </span>
          </motion.div>

          <motion.div
            variants={fadeInUp}
            className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6"
          >
            <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight">
              {meta.title}
            </h1>
            <div className="shrink-0 flex flex-col items-center">
              <div className="inline-flex items-center gap-2 bg-brand-500/15 border border-brand-500/30 rounded-full px-5 py-2.5">
                <svg
                  className="w-5 h-5 text-brand-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898M18.75 3.75h4.5v4.5"
                  />
                </svg>
                <span className="text-brand-300 font-bold text-lg whitespace-nowrap">
                  <InlineCounter target={Math.round(aggregatedROI)} />% faster
                </span>
              </div>
              <span className="text-[11px] text-gray-500 mt-1.5">
                based on {repoCount} test repositories
              </span>
            </div>
          </motion.div>

          <motion.p
            variants={fadeInUp}
            className="text-gray-400 text-lg max-w-3xl leading-relaxed"
          >
            {meta.longDescription}
          </motion.p>

          <motion.div
            variants={fadeInUp}
            className="mt-8 flex items-center gap-6 text-sm text-gray-500"
          >
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-500" />
              Tested across 3 repositories
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-500" />
              Data collected daily
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
