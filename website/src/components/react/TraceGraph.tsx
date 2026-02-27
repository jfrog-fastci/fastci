/**
 * Horizontal Gantt-style trace graph showing a realistic CI workflow.
 * Animates between a full waterfall view and a single-line critical path view.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Job {
  name: string;
  startMin: number;
  endMin: number;
  isCritical: boolean;
  insight: string;
  improvementCount: number;
}

const TOTAL_MINUTES = 11;

const JOBS: Job[] = [
  { name: 'Verify Release',     startMin: 0,   endMin: 0.1,  isCritical: true,  insight: 'Gatekeeper that triggers the pipeline.', improvementCount: 1 },
  { name: 'Build Docker Image', startMin: 0.1, endMin: 8,    isCritical: true,  insight: 'Longest on critical path.', improvementCount: 3 },
  { name: 'Build Go Binary',    startMin: 0.1, endMin: 3,    isCritical: false, insight: 'Runs in parallel with Docker build.', improvementCount: 0 },
  { name: 'Run Go Tests',       startMin: 0.1, endMin: 4.5,  isCritical: false, insight: 'Unit tests provide fast feedback.', improvementCount: 0 },
  { name: 'Integration Tests',  startMin: 4.5, endMin: 7,    isCritical: false, insight: 'Validates service interactions.', improvementCount: 0 },
  { name: 'E2E Tests',          startMin: 4.5, endMin: 9,    isCritical: false, insight: 'Full system validation.', improvementCount: 0 },
  { name: 'Security Scan',      startMin: 8,   endMin: 10,   isCritical: true,  insight: 'Critical path tail.', improvementCount: 2 },
];

const TICKS = [0, 2, 4, 6, 8, 10];

function formatDuration(minutes: number): string {
  if (minutes < 1) return `${Math.round(minutes * 60)}s`;
  const whole = Math.floor(minutes);
  const secs = Math.round((minutes - whole) * 60);
  return secs > 0 ? `${whole}m ${secs}s` : `${whole}m`;
}

export default function TraceGraph() {
  const [mode, setMode] = useState<'waterfall' | 'critical-path'>('waterfall');

  useEffect(() => {
    const interval = setInterval(() => {
      setMode((prev) => (prev === 'waterfall' ? 'critical-path' : 'waterfall'));
    }, 5000); 
    return () => clearInterval(interval);
  }, []);

  const criticalJobs = JOBS.filter(j => j.isCritical);
  const totalCriticalTime = criticalJobs.reduce((acc, j) => acc + (j.endMin - j.startMin), 0);

  return (
    <div className="mt-5 overflow-x-auto">
      <div className="min-w-[420px] rounded-lg bg-[#0d1117] border border-[#30363d] p-6 h-[320px] flex flex-col relative overflow-hidden">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider">
                {mode === 'waterfall' ? 'Full CI Trace' : 'Critical Path Optimization'}
            </h3>
            <div className="flex gap-2">
                <div className={`w-2 h-2 rounded-full transition-colors duration-500 ${mode === 'waterfall' ? 'bg-[#3fb950]' : 'bg-[#30363d]'}`} />
                <div className={`w-2 h-2 rounded-full transition-colors duration-500 ${mode === 'critical-path' ? 'bg-[#d29922]' : 'bg-[#30363d]'}`} />
            </div>
        </div>
        
        <div className="flex-1 relative w-full">
            <AnimatePresence mode="wait">
                {mode === 'waterfall' ? (
                    <motion.div 
                        key="waterfall"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        transition={{ duration: 0.4 }}
                        className="space-y-2 relative h-full w-full"
                    >
                        {/* Time grid lines */}
                         <div className="absolute inset-0 pl-[120px] pointer-events-none h-full">
                            {TICKS.map((t) => (
                                <div
                                    key={t}
                                    className="absolute top-0 bottom-0 w-px bg-[#30363d]/40"
                                    style={{ left: `${(t / TOTAL_MINUTES) * 100}%` }}
                                >
                                    <span className="absolute -bottom-5 -translate-x-1/2 text-[9px] text-[#8b949e] font-mono">
                                        {t}m
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="relative z-10 space-y-2">
                        {JOBS.map((job) => {
                             const leftPct = (job.startMin / TOTAL_MINUTES) * 100;
                             const widthPct = ((job.endMin - job.startMin) / TOTAL_MINUTES) * 100;
                             const duration = formatDuration(job.endMin - job.startMin);
                             
                             return (
                                <div 
                                    key={job.name}
                                    className="flex items-center gap-3 relative"
                                >
                                    <span className={`text-[10px] font-mono w-[120px] text-right shrink-0 truncate ${job.isCritical ? 'text-[#d29922]' : 'text-[#8b949e]'}`}>
                                        {job.name}
                                    </span>
                                    <div className="flex-1 h-6 relative bg-[#161b22]/50 rounded">
                                        <div
                                            className={`absolute top-0 bottom-0 rounded-sm flex items-center px-2 border ${
                                                job.isCritical
                                                ? 'bg-[#d29922]/15 border-[#d29922]/40'
                                                : 'bg-[#238636]/15 border-[#238636]/40'
                                            }`}
                                            style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                                        >
                                            <span className={`text-[9px] font-mono whitespace-nowrap overflow-hidden text-ellipsis ${job.isCritical ? 'text-[#d29922]' : 'text-[#3fb950]'}`}>
                                                {duration}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                             );
                        })}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="critical-path"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        transition={{ duration: 0.4 }}
                        className="h-full flex flex-col items-center justify-center w-full"
                    >
                        <div className="w-full flex items-center justify-center gap-1 px-4">
                             {criticalJobs.map((job, index) => {
                                 const jobDuration = job.endMin - job.startMin;
                                 
                                 return (
                                     <div
                                        key={job.name}
                                        className="relative group flex flex-col items-center flex-1"
                                     >
                                        {/* Connector Line (except for last item) */}
                                        {index < criticalJobs.length - 1 && (
                                            <div className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 text-[#8b949e] bg-[#0d1117] px-1">
                                                →
                                            </div>
                                        )}

                                        <div className="w-full h-12 bg-[#d29922]/10 border border-[#d29922]/40 rounded flex flex-col items-center justify-center relative hover:bg-[#d29922]/20 transition-colors cursor-default">
                                            <span className="text-[10px] font-semibold text-[#d29922] truncate w-full text-center px-2">
                                                {job.name}
                                            </span>
                                            <span className="text-[9px] text-[#d29922]/80 font-mono">
                                                {formatDuration(jobDuration)}
                                            </span>
                                        </div>
                                        
                                        {/* Improvement Badge */}
                                        <motion.div 
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 + (index * 0.1) }}
                                            className="mt-3"
                                        >
                                            <div className="text-[9px] text-[#8b949e] flex items-center gap-1.5 bg-[#161b22] px-2 py-1 rounded-full border border-[#30363d] shadow-sm whitespace-nowrap">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#d29922] animate-pulse" />
                                                {job.improvementCount} fixes
                                            </div>
                                        </motion.div>
                                     </div>
                                 );
                             })}
                        </div>
                        
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                            className="mt-8 text-center"
                        >
                            <p className="text-[10px] text-[#8b949e]">
                                Total Critical Path: <span className="text-[#d29922] font-mono font-semibold">{formatDuration(totalCriticalTime)}</span>
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
