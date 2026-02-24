import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function Line({
  children,
  delay = 0,
  visible,
  highlight,
  duration,
  flashWhen,
  durationHighlight,
}: {
  children: React.ReactNode;
  delay?: number;
  visible: boolean;
  highlight?: boolean;
  duration?: string;
  flashWhen?: boolean;
  durationHighlight?: boolean;
}) {
  const prevFlashWhen = useRef(false);
  const [showNewFlash, setShowNewFlash] = useState(false);

  useEffect(() => {
    if (flashWhen && !prevFlashWhen.current) {
      setShowNewFlash(true);
      const t = setTimeout(() => setShowNewFlash(false), 500);
      prevFlashWhen.current = true;
      return () => clearTimeout(t);
    }
    if (!flashWhen) prevFlashWhen.current = false;
  }, [flashWhen]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={
        visible
          ? { opacity: 1, x: 0 }
          : { opacity: 0.4, x: 0 }
      }
      transition={{ duration: 0.3, delay }}
      className={`relative flex items-start gap-2 w-full flex-nowrap ${highlight ? 'text-brand-400' : ''}`}
    >
      {showNewFlash && (
        <motion.span
          className="absolute inset-0 -left-1 -right-1 rounded"
          initial={{ backgroundColor: 'rgba(54, 161, 59, 0.28)' }}
          animate={{ backgroundColor: 'rgba(54, 161, 59, 0)' }}
          transition={{ duration: 0.5 }}
          style={{ zIndex: -1 }}
          aria-hidden
        />
      )}
      {children}
      {duration && (
        <span
          className={`ml-auto shrink-0 text-xs tabular-nums ${
            durationHighlight ? 'text-emerald-400' : 'text-gray-500'
          }`}
        >
          ~{duration}
        </span>
      )}
    </motion.div>
  );
}

function InsightBadge({
  text,
  visible,
  delay = 0,
}: {
  text: string;
  visible: boolean;
  delay?: number;
}) {
  return (
    <span className="relative inline-flex">
      <motion.span
        initial={{ opacity: 0, scale: 0.8 }}
        animate={visible ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.35, delay }}
        className="relative inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-500/20 text-brand-300 text-xs font-medium border border-brand-500/30 whitespace-nowrap"
      >
        <span className="text-brand-400">→</span> {text}
      </motion.span>
    </span>
  );
}

const PHASE_TIMINGS = [4500, 3750, 4500, 2500, 10000] as const; // original → +fastci → +insights → fixing → fixed (10s so people can see)
const nbsp = (n: number) => '\u00A0'.repeat(n);

const STEPS = [
  { id: 0, label: 'Original workflow' },
  { id: 1, label: 'Add FastCI' },
  { id: 2, label: 'Insights' },
  { id: 3, label: 'Fixing In PR' },
  { id: 4, label: 'Fixes applied' },
] as const;

export default function AnimatedWorkflow() {
  const [phase, setPhase] = useState(0);
  const [lineIndex, setLineIndex] = useState(0);
  const [phaseProgress, setPhaseProgress] = useState(0);
  const phaseStartRef = useRef(Date.now());

  // Line-by-line reveal for phase 0
  useEffect(() => {
    if (phase !== 0) {
      setLineIndex(99); // Show all lines
      return;
    }
    setLineIndex(0);
    const totalLines = 18;
    const iv = setInterval(() => {
      setLineIndex((i) => (i < totalLines ? i + 1 : i));
    }, 150);
    return () => clearInterval(iv);
  }, [phase]);

  // Phase cycle + progress bar
  useEffect(() => {
    phaseStartRef.current = Date.now();
    setPhaseProgress(0);

    const duration = PHASE_TIMINGS[phase];
    const iv = setInterval(() => {
      const elapsed = Date.now() - phaseStartRef.current;
      const progress = Math.min(elapsed / duration, 1);
      setPhaseProgress(progress);
      if (progress >= 1) {
        setPhase((p) => (p + 1) % 5);
      }
    }, 50);
    return () => clearInterval(iv);
  }, [phase]);

  // Phase logic: 0=original, 1=+fastci, 2=+insights, 3=fixing, 4=fixed
  const showOriginal = phase === 0;
  const showFastCI = phase >= 1;
  const showInsights = phase >= 2;
  const showFixingInPR = phase === 3;
  const showFixed = phase === 4;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="relative w-full max-w-[672px] min-w-0 mx-auto lg:mx-0"
    >
      <div className="glass-card overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
          <div className="w-3 h-3 rounded-full bg-red-500/60" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
          <div className="w-3 h-3 rounded-full bg-green-500/60" />
          <span className="ml-2 text-xs text-gray-500 font-mono">
            .github/workflows/ci.yml
          </span>
          <AnimatePresence mode="wait">
            {showInsights && !showFixingInPR && !showFixed && (
              <motion.span
                key="insights-badge"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="ml-auto text-xs text-brand-400"
              >
                Insights found
              </motion.span>
            )}
            {showFixingInPR && (
              <motion.span
                key="fixing-badge"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="ml-auto flex items-center gap-2 text-xs text-amber-400"
              >
                Fixing In PR
                <span className="relative inline-flex h-4 w-4">
                  <svg className="h-4 w-4 -rotate-90" viewBox="0 0 36 36">
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      className="text-white/10"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeDasharray={100}
                      strokeDashoffset={100 - phaseProgress * 100}
                      strokeLinecap="round"
                      className="text-amber-400 transition-all duration-75"
                    />
                  </svg>
                </span>
              </motion.span>
            )}
            {showFixed && (
              <motion.span
                key="fixed-badge"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="ml-auto text-xs text-emerald-400"
              >
                Fixes applied
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div
          className="p-3 sm:p-5 font-mono text-xs sm:text-sm leading-relaxed overflow-x-auto overflow-y-auto"
          style={{ height: '420px' }}
        >
          {/* name */}
          <Line visible={lineIndex > 0}>
            <span className="text-purple-400">name</span>
            <span className="text-gray-500">: CI</span>
          </Line>
          <Line visible={lineIndex > 1}>
            <span className="text-purple-400">on</span>
            <span className="text-gray-500">: [push]</span>
          </Line>
          <Line visible={lineIndex > 2}>
            <span className="text-purple-400">jobs</span>
            <span className="text-gray-500">:</span>
          </Line>

          {/* build job */}
          <Line visible={lineIndex > 3}>
            <span className="text-gray-500">{nbsp(2)}</span>
            <span className="text-amber-400">build</span>
            <span className="text-gray-500">:</span>
          </Line>
          <Line visible={lineIndex > 4}>
            <span className="text-gray-500">{nbsp(4)}</span>
            <span className="text-purple-400">runs-on</span>
            <span className="text-gray-500">: ubuntu-latest</span>
          </Line>
          <Line visible={lineIndex > 5}>
            <span className="text-gray-500">{nbsp(4)}</span>
            <span className="text-purple-400">steps</span>
            <span className="text-gray-500">:</span>
          </Line>

          {/* FastCI step - appears in phase 1 */}
          <AnimatePresence>
          {showFastCI && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ staggerChildren: 0.08, delayChildren: 0.1 }}
              className="contents"
            >
              <Line visible={true} highlight duration="0s">
                <span className="text-gray-500">{nbsp(6)}- </span>
                <span className="text-purple-400">uses</span>
                <span className="text-gray-500">: </span>
                <span className="text-brand-400">jfrog-fastci/fastci@v0</span>
              </Line>
            </motion.div>
          )}
          </AnimatePresence>

          <Line visible={lineIndex > 6} duration="3s" durationHighlight={showFixed}>
            <span className="text-gray-500">{nbsp(6)}- </span>
            <span className="text-purple-400">uses</span>
            <span className="text-gray-500">: actions/checkout@v4</span>
          </Line>
          <Line visible={lineIndex > 7} duration={showFixed ? '1.2m' : '1m'} durationHighlight={showFixed}>
            <span className="text-gray-500">{nbsp(6)}- </span>
            <span className="text-purple-400">uses</span>
            <span className="text-gray-500">: actions/setup-go@v5</span>
          </Line>
          <Line visible={lineIndex > 8}>
            <span className="text-gray-500">{nbsp(8)}</span>
            <span className="text-purple-400">with</span>
            <span className="text-gray-500">:</span>
            {(showInsights && !showFixed) && (
              <span className="absolute right-0 top-0">
                <InsightBadge
                  text="Enable cache ~2m faster"
                  visible={true}
                  delay={0.2}
                />
              </span>
            )}
          </Line>
          <Line visible={lineIndex > 9}>
            <span className="text-gray-500">{nbsp(10)}</span>
            <span className="text-purple-400">go-version</span>
            <span className="text-gray-500">: </span>
            <span className="text-amber-300">'1.22'</span>
          </Line>
          <Line visible={lineIndex > 10} flashWhen={showFixed}>
            <span className="text-gray-500">{nbsp(10)}</span>
            <span className="text-purple-400">cache</span>
            <span className="text-gray-500">: </span>
            {showFixed ? (
              <motion.span
                key="cache-true"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-emerald-300"
              >
                true
              </motion.span>
            ) : (
              <span className="text-red-400/90">false</span>
            )}
          </Line>
          <Line visible={lineIndex > 11} duration={showFixed ? '20s' : '8.2m'} durationHighlight={showFixed}>
            <span className="text-gray-500">{nbsp(6)}- </span>
            <span className="text-purple-400">run</span>
            <span className="text-gray-500">: go build ./...</span>
          </Line>

          {/* docker job */}
          <Line visible={lineIndex > 12}>
            <span className="text-gray-500">{nbsp(2)}</span>
            <span className="text-amber-400">docker</span>
            <span className="text-gray-500">:</span>
          </Line>
          <Line visible={lineIndex > 13}>
            <span className="text-gray-500">{nbsp(4)}</span>
            <span className="text-purple-400">runs-on</span>
            <span className="text-gray-500">: ubuntu-latest</span>
          </Line>
          <Line visible={lineIndex > 14}>
            <span className="text-gray-500">{nbsp(4)}</span>
            <span className="text-purple-400">steps</span>
            <span className="text-gray-500">:</span>
          </Line>

          {/* FastCI for docker job */}
          <AnimatePresence>
          {showFastCI && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="contents"
            >
              <Line visible={true} highlight duration="0s">
                <span className="text-gray-500">{nbsp(6)}- </span>
                <span className="text-purple-400">uses</span>
                <span className="text-gray-500">: </span>
                <span className="text-brand-400">jfrog-fastci/fastci@v0</span>
              </Line>
            </motion.div>
          )}
          </AnimatePresence>

          <Line visible={lineIndex > 15} duration="3s" durationHighlight={showFixed}>
            <span className="text-gray-500">{nbsp(6)}- </span>
            <span className="text-purple-400">uses</span>
            <span className="text-gray-500">: actions/checkout@v4</span>
          </Line>
          {showFixed ? (
            <>
              <Line visible={true} duration="2m" durationHighlight={true} flashWhen={true}>
                <span className="text-gray-500">{nbsp(6)}- </span>
                <span className="text-purple-400">uses</span>
                <span className="text-gray-500">: docker/build-push-action@v5</span>
              </Line>
              <Line visible={true} flashWhen={true}>
                <span className="text-gray-500">{nbsp(8)}</span>
                <span className="text-purple-400">with</span>
                <span className="text-gray-500">:</span>
              </Line>
              <Line visible={true} flashWhen={true}>
                <span className="text-gray-500">{nbsp(10)}</span>
                <span className="text-purple-400">context</span>
                <span className="text-gray-500">: .</span>
              </Line>
              <Line visible={true} flashWhen={true}>
                <span className="text-gray-500">{nbsp(10)}</span>
                <span className="text-purple-400">push</span>
                <span className="text-gray-500">: true</span>
              </Line>
              <Line visible={true} flashWhen={true}>
                <span className="text-gray-500">{nbsp(10)}</span>
                <span className="text-purple-400">tags</span>
                <span className="text-gray-500">: jfrog.io/service:1.10.0</span>
              </Line>
            </>
          ) : (
            <>
              <Line visible={lineIndex > 16} duration="10m">
                <span className="text-gray-500">{nbsp(6)}- </span>
                <span className="text-purple-400">run</span>
                <span className="text-gray-500">: docker build -t jfrog.io/service:1.10.0 .</span>
                {showInsights && (
                  <span className="absolute right-0 top-0">
                    <InsightBadge
                      text="Use Buildx ~8m faster"
                      visible={true}
                      delay={0.4}
                    />
                  </span>
                )}
              </Line>
              <Line visible={lineIndex > 17} duration="30s">
                <span className="text-gray-500">{nbsp(6)}- </span>
                <span className="text-purple-400">run</span>
                <span className="text-gray-500">: docker push jfrog.io/service:1.10.0</span>
              </Line>
            </>
          )}
        </div>
      </div>

      {/* Step indicators - equal width so all fit in one row */}
      <div className="mt-4 grid grid-cols-5 gap-1 sm:gap-1.5 min-w-0">
        {STEPS.map(({ id, label }) => {
          const isActive = phase === id;
          const isComplete = phase > id;
          const progress = isComplete ? 1 : isActive ? phaseProgress : 0;

          return (
            <button
              key={id}
              type="button"
              title={label}
              onClick={() => {
                setPhase(id);
                setLineIndex(id === 0 ? 0 : 99);
                phaseStartRef.current = Date.now();
                setPhaseProgress(0);
              }}
              className="relative px-2 py-1 sm:py-1.5 rounded-md text-xs font-medium overflow-hidden transition-colors duration-200 border hover:border-white/20 truncate min-w-0"
              style={{
                backgroundColor: isActive || isComplete ? 'transparent' : 'rgba(255,255,255,0.05)',
                borderColor: isActive || isComplete ? 'rgba(54,161,59,0.4)' : 'rgba(255,255,255,0.1)',
                color: isActive || isComplete ? 'rgb(134,239,172)' : 'rgb(156,163,175)',
              }}
            >
              {/* Progress bar fill */}
              <span
                className="absolute inset-y-0 left-0 rounded-lg bg-brand-500/30 transition-[width] duration-75 ease-linear"
                style={{ width: `${progress * 100}%` }}
              />
              <span className="relative z-10 block truncate min-w-0">{label}</span>
            </button>
          );
        })}
      </div>

      {/* Glow behind card */}
      <div className="absolute -inset-4 -z-10 bg-brand-500/5 rounded-3xl blur-2xl" />
    </motion.div>
  );
}
