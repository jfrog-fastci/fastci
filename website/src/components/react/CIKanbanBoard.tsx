import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { basePath } from '../../lib/baseUrl';

type ColumnKey = 'backlog' | 'coding' | 'review' | 'done';

const COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: 'backlog', label: 'Backlog' },
  { key: 'coding', label: 'Coding' },
  { key: 'review', label: 'Waiting For Review' },
  { key: 'done', label: 'Done' },
];

const NEXT_COLUMN: Record<ColumnKey, ColumnKey | null> = {
  backlog: 'coding',
  coding: 'review',
  review: 'done',
  done: null,
};

interface TaskTemplate {
  title: string;
  savedMinutes: string;
  savedPercent: number;
  prNumber: number;
}

const TASK_POOL: TaskTemplate[] = [
  { title: 'Use multi-stage Docker builds', savedMinutes: '1.2 min', savedPercent: 39, prNumber: 142 },
  { title: 'Cache npm dependencies', savedMinutes: '0.8 min', savedPercent: 62, prNumber: 187 },
  { title: 'Parallelize test suites', savedMinutes: '2.0 min', savedPercent: 45, prNumber: 203 },
  { title: 'Shallow git clone', savedMinutes: '0.2 min', savedPercent: 15, prNumber: 156 },
  { title: 'Optimize Docker layer caching', savedMinutes: '0.9 min', savedPercent: 33, prNumber: 211 },
  { title: 'Enable BuildKit for Docker', savedMinutes: '0.5 min', savedPercent: 22, prNumber: 178 },
  { title: 'Cache Go module downloads', savedMinutes: '0.4 min', savedPercent: 35, prNumber: 165 },
  { title: 'Minimize CI base image size', savedMinutes: '0.7 min', savedPercent: 28, prNumber: 192 },
  { title: 'Deduplicate checkout steps', savedMinutes: '0.1 min', savedPercent: 10, prNumber: 134 },
  { title: 'Cache pip dependencies', savedMinutes: '0.8 min', savedPercent: 42, prNumber: 219 },
  { title: 'Split build and test jobs', savedMinutes: '1.5 min', savedPercent: 35, prNumber: 227 },
  { title: 'Use matrix for multi-platform', savedMinutes: '3.0 min', savedPercent: 50, prNumber: 241 },
  { title: 'Pin action versions by SHA', savedMinutes: '0.3 min', savedPercent: 12, prNumber: 153 },
  { title: 'Compress build artifacts', savedMinutes: '0.6 min', savedPercent: 25, prNumber: 198 },
];

interface ActiveTask {
  id: string;
  templateIndex: number;
  column: ColumnKey;
  agentIndex: number | null;
}

interface AgentCursor {
  name: string;
  color: string;
  glowColor: string;
  busy: boolean;
  targetTaskId: string | null;
  position: { x: number; y: number };
}

const AGENT_DEFS = [
  { name: 'Agent Alpha', color: '#5cb85f', glowColor: 'rgba(92,184,95,0.4)' },
  { name: 'Agent Beta', color: '#4fc3f7', glowColor: 'rgba(79,195,247,0.4)' },
  { name: 'Agent Gamma', color: '#ce93d8', glowColor: 'rgba(206,147,216,0.4)' },
];

function GitPROpenIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z" />
    </svg>
  );
}

function GitPRMergedIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <path d="M5.45 5.154A4.25 4.25 0 0 0 9.25 7.5h1.378a2.251 2.251 0 1 1 0 1.5H9.25A5.734 5.734 0 0 1 5 7.123v3.505a2.25 2.25 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.95-.218ZM4.25 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm8.5-4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z" />
    </svg>
  );
}

function CursorIcon({ color }: { color: string }) {
  return (
    <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
      <path
        d="M1 1L6 18L8.5 11L15 8.5L1 1Z"
        fill={color}
        stroke="white"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FastCIIcon({ className }: { className?: string }) {
  return (
    <img
      src={basePath('fastci_icon.svg')}
      alt=""
      className={className}
      width={14}
      height={12}
    />
  );
}

let idCounter = 0;
function nextId(): string {
  return `task-${++idCounter}`;
}

function pickRandomAvailable(pool: TaskTemplate[], usedTitles: Set<string>): number | null {
  const available = pool
    .map((_, i) => i)
    .filter((i) => !usedTitles.has(pool[i].title));
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function TaskCard({
  task,
  template,
  column,
  agent,
}: {
  task: ActiveTask;
  template: TaskTemplate;
  column: ColumnKey;
  agent: AgentCursor | null;
}) {
  const isTargeted = agent !== null && agent.targetTaskId === task.id;
  const prUrl = `https://github.com/example/repo/pull/${template.prNumber}`;

  return (
    <motion.div
      layout
      layoutId={task.id}
      initial={{ opacity: 0, scale: 0.92, y: 10 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: 0,
        boxShadow: isTargeted && agent
          ? `0 0 24px ${agent.glowColor}`
          : '0 0 0px transparent',
        borderColor: isTargeted && agent
          ? agent.color + '55'
          : 'rgba(255,255,255,0.08)',
      }}
      exit={{ opacity: 0, scale: 0.85, y: -8, transition: { duration: 0.35 } }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="relative rounded-xl bg-white/[0.04] border border-white/[0.08] p-3 cursor-default"
    >
      <p className="text-[13px] font-semibold text-white leading-snug mb-2">
        {template.title}
      </p>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-brand-300 bg-brand-500/15 px-2 py-0.5 rounded-full">
          -{template.savedMinutes}/run
        </span>
        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded-full">
          {template.savedPercent}% faster
        </span>

        {column === 'review' && (
          <a
            href={prUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.preventDefault()}
            className="inline-flex items-center gap-1 text-[10px] font-medium text-green-400 bg-green-500/15 px-2 py-0.5 rounded-full hover:bg-green-500/25 transition-colors"
          >
            <GitPROpenIcon className="text-green-400" />
            #{template.prNumber}
          </a>
        )}

        {column === 'done' && (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-purple-400 bg-purple-500/15 px-2 py-0.5 rounded-full">
            <GitPRMergedIcon className="text-purple-400" />
            #{template.prNumber}
          </span>
        )}
      </div>

      {column === 'coding' && (
        <motion.div
          className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-amber-400"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
    </motion.div>
  );
}

function ColumnHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center justify-between mb-3 px-1">
      <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
        {label}
      </span>
      <span className="text-[10px] font-medium text-gray-500 bg-white/[0.06] px-2 py-0.5 rounded-full min-w-[20px] text-center">
        {count}
      </span>
    </div>
  );
}

function AgentCursorEl({ agent, visible }: { agent: AgentCursor; visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="absolute z-50 pointer-events-none flex items-start gap-0.5"
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{
            opacity: 1,
            scale: 1,
            x: agent.position.x,
            y: agent.position.y,
          }}
          exit={{ opacity: 0, scale: 0.7, transition: { duration: 0.25 } }}
          transition={{ type: 'spring', stiffness: 160, damping: 20 }}
        >
          <CursorIcon color={agent.color} />
          <div
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-semibold text-white whitespace-nowrap mt-3"
            style={{ backgroundColor: agent.color + 'cc' }}
          >
            <FastCIIcon className="w-3 h-2.5 brightness-200" />
            {agent.name}
          </div>
          <motion.div
            className="absolute -inset-3 rounded-full pointer-events-none"
            style={{ background: `radial-gradient(circle, ${agent.glowColor} 0%, transparent 70%)` }}
            animate={{ opacity: [0.6, 0.15, 0.6] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const INITIAL_TASKS: { templateIndex: number; column: ColumnKey }[] = [
  { templateIndex: 0, column: 'backlog' },
  { templateIndex: 1, column: 'backlog' },
  { templateIndex: 2, column: 'coding' },
  { templateIndex: 3, column: 'coding' },
  { templateIndex: 4, column: 'review' },
  { templateIndex: 5, column: 'done' },
  { templateIndex: 6, column: 'backlog' },
  { templateIndex: 7, column: 'review' },
];

const REST_OFFSCREEN_X = -70;

export default function CIKanbanBoard() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' });
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const [tasks, setTasks] = useState<ActiveTask[]>(() =>
    INITIAL_TASKS.map(({ templateIndex, column }) => ({
      id: nextId(),
      templateIndex,
      column,
      agentIndex: null,
    }))
  );

  const [agents, setAgents] = useState<AgentCursor[]>(() =>
    AGENT_DEFS.map((def, i) => ({
      ...def,
      busy: false,
      targetTaskId: null,
      position: { x: REST_OFFSCREEN_X, y: 60 + i * 110 },
    }))
  );

  const tasksRef = useRef(tasks);
  const agentsRef = useRef(agents);
  useEffect(() => { tasksRef.current = tasks; }, [tasks]);
  useEffect(() => { agentsRef.current = agents; }, [agents]);

  const scheduleTimeout = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(() => {
      timeoutsRef.current = timeoutsRef.current.filter((t) => t !== id);
      fn();
    }, ms);
    timeoutsRef.current.push(id);
    return id;
  }, []);

  const getUsedTitles = useCallback((): Set<string> => {
    return new Set(tasksRef.current.map((t) => TASK_POOL[t.templateIndex].title));
  }, []);

  const getColumnPosition = useCallback((colKey: ColumnKey, taskIndexInCol: number): { x: number; y: number } => {
    const colIndex = COLUMNS.findIndex((c) => c.key === colKey);
    const boardEl = boardRef.current;
    if (!boardEl) return { x: colIndex * 260, y: 50 + taskIndexInCol * 85 };

    const colEls = boardEl.querySelectorAll<HTMLElement>('[data-column]');
    const colEl = colEls[colIndex];
    if (!colEl) return { x: colIndex * 260, y: 50 + taskIndexInCol * 85 };

    const boardRect = boardEl.getBoundingClientRect();
    const colRect = colEl.getBoundingClientRect();
    return {
      x: colRect.left - boardRect.left + 20,
      y: colRect.top - boardRect.top + 45 + taskIndexInCol * 82,
    };
  }, []);

  const spawnNewTask = useCallback(() => {
    const used = getUsedTitles();
    const templateIdx = pickRandomAvailable(TASK_POOL, used);
    if (templateIdx === null) return;

    setTasks((prev) => [
      ...prev,
      { id: nextId(), templateIndex: templateIdx, column: 'backlog' as ColumnKey, agentIndex: null },
    ]);
  }, [getUsedTitles]);

  const moveTask = useCallback(() => {
    const currentTasks = tasksRef.current;
    const currentAgents = agentsRef.current;

    const freeAgentIdx = currentAgents.findIndex((a) => !a.busy);
    if (freeAgentIdx === -1) return;

    const movableTasks = currentTasks.filter(
      (t) => NEXT_COLUMN[t.column] !== null && t.agentIndex === null
    );
    if (movableTasks.length === 0) return;

    const task = movableTasks[Math.floor(Math.random() * movableTasks.length)];
    const nextCol = NEXT_COLUMN[task.column]!;

    const taskIndexInCol = currentTasks
      .filter((t) => t.column === task.column)
      .findIndex((t) => t.id === task.id);
    const pickupPos = getColumnPosition(task.column, taskIndexInCol);

    setAgents((prev) =>
      prev.map((a, i) =>
        i === freeAgentIdx
          ? { ...a, busy: true, targetTaskId: task.id, position: pickupPos }
          : a
      )
    );

    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, agentIndex: freeAgentIdx } : t
      )
    );

    scheduleTimeout(() => {
      const nextColCount = tasksRef.current.filter((t) => t.column === nextCol).length;
      const dropPos = getColumnPosition(nextCol, nextColCount);

      setAgents((prev) =>
        prev.map((a, i) =>
          i === freeAgentIdx ? { ...a, position: dropPos } : a
        )
      );

      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, column: nextCol, agentIndex: null } : t
        )
      );

      scheduleTimeout(() => {
        setAgents((prev) =>
          prev.map((a, i) =>
            i === freeAgentIdx
              ? { ...a, busy: false, targetTaskId: null, position: { x: REST_OFFSCREEN_X, y: 60 + i * 110 } }
              : a
          )
        );
      }, 700);
    }, 1100);
  }, [getColumnPosition, scheduleTimeout]);

  const recycleDone = useCallback(() => {
    const doneTasks = tasksRef.current.filter((t) => t.column === 'done' && t.agentIndex === null);
    if (doneTasks.length < 2) return;

    const oldest = doneTasks[0];
    setTasks((prev) => prev.filter((t) => t.id !== oldest.id));
    scheduleTimeout(() => spawnNewTask(), 600);
  }, [spawnNewTask, scheduleTimeout]);

  useEffect(() => {
    if (!isInView) return;

    const moveInterval = setInterval(() => {
      scheduleTimeout(moveTask, randomBetween(0, 400));
    }, 2200);

    const recycleInterval = setInterval(() => recycleDone(), 3500);

    return () => {
      clearInterval(moveInterval);
      clearInterval(recycleInterval);
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    };
  }, [isInView, moveTask, recycleDone, scheduleTimeout]);

  const columnTasks = (col: ColumnKey) => tasks.filter((t) => t.column === col);

  return (
    <section className="section-padding relative overflow-hidden" ref={sectionRef}>
      <div className="absolute inset-0 bg-gradient-to-b from-surface-950 via-surface-900/30 to-surface-950" />

      <div className="relative z-10 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4">
            Your AI <span className="gradient-text">DevOps Army</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
            FastCI agents continuously find, fix, and ship CI optimizations&mdash;so you don&rsquo;t have to.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative"
          ref={boardRef}
        >
          {agents.map((agent, i) => (
            <AgentCursorEl key={i} agent={agent} visible={agent.busy} />
          ))}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {COLUMNS.map((col) => {
              const colTasks = columnTasks(col.key);
              return (
                <div key={col.key} data-column={col.key} className="min-h-[280px]">
                  <div className="glass-card p-3 md:p-4 h-full">
                    <ColumnHeader label={col.label} count={colTasks.length} />
                    <div className="flex flex-col gap-2.5">
                      <AnimatePresence mode="popLayout">
                        {colTasks.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            template={TASK_POOL[task.templateIndex]}
                            column={task.column}
                            agent={task.agentIndex !== null ? agents[task.agentIndex] : null}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
