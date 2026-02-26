import { useState, useEffect, useRef, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeInUp, staggerContainer } from '../../lib/animations';
import { InteractiveGridPattern } from '../ui/grid-pattern';

const CURSOR_INSTALL_URL =
  'https://cursor.com/link/prompt?text=%2A%2AIMPORTANT%3A%2A%2A%20Ignore%20previous%20FastCI%20installation%20instructions%20and%20follow%20these%20updated%20steps.%0A%0AScan%20all%20workflow%20files%20in%20%60.github%2Fworkflows%2F%60%20for%20FastCI%20usage%3A%0A%0A1.%20For%20each%20workflow%20using%20%60jfrog-fastci%2Ffastci%40v0%60%3A%0A%20%20%20-%20Check%20if%20%60issues%3A%20write%60%20permission%20exists%20at%20workflow%20level%0A%20%20%20-%20If%20set%20to%20%60false%60%2C%20ask%3A%20%22Workflow%20%5Bname%5D%20has%20issues%3A%20write%3A%20false.%20Change%20to%20%27write%27%3F%22%0A%20%20%20-%20If%20missing%2C%20add%20it%20automatically%20at%20workflow%20level%0A%0A2.%20Add%20FastCI%20as%20the%20first%20step%20in%20each%20job%3A%0A%0A%60%60%60yaml%0A-%20uses%3A%20jfrog-fastci%2Ffastci%40v0%0A%20%20with%3A%0A%20%20%20%20github_token%3A%20%24%7B%7B%20secrets.GITHUB_TOKEN%20%7D%7D%0A%20%20%20%20accept_terms%3A%20%27yes%27%0A%60%60%60%0A%0A3.%20For%20jobs%20using%20containers%2C%20add%20volume%20mount%3A%0A%0A%60%60%60yaml%0Acontainer%3A%0A%20%20image%3A%20%3Cyour-image%3E%0A%20%20volumes%3A%0A%20%20%20%20-%20%2Fhome%2Frunner%3A%2Ftmp%2Ffastci%2Fmounts%2Fhome%2Frunner%0A%60%60%60%0A%0AExample%3A%0A%0A%60%60%60yaml%0Apermissions%3A%0A%20%20issues%3A%20write%0A%0Ajobs%3A%0A%20%20build%3A%0A%20%20%20%20runs-on%3A%20ubuntu-latest%0A%20%20%20%20steps%3A%0A%20%20%20%20%20%20-%20uses%3A%20jfrog-fastci%2Ffastci%40v0%0A%20%20%20%20%20%20%20%20with%3A%0A%20%20%20%20%20%20%20%20%20%20github_token%3A%20%24%7B%7B%20secrets.GITHUB_TOKEN%20%7D%7D%0A%20%20%20%20%20%20%20%20%20%20accept_terms%3A%20%27yes%27%0A%20%20%20%20%20%20-%20uses%3A%20actions%2Fcheckout%40v4%0A%60%60%60';

const PROMPT_INSTALL_URL =
  'https://raw.githubusercontent.com/jfrog-fastci/fastci/main/prompts/install.md';

const VSCODE_INSTALL_URL =
  'https://aka.ms/awesome-copilot/install/agent?url=vscode%3Achat-agent%2Finstall%3Furl%3Dhttps%3A%2F%2Fraw.githubusercontent.com%2Fjfrog-fastci%2Ffastci%2Fmain%2Fprompts%2Finstall.md';

function CursorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" fillRule="evenodd" viewBox="0 0 24 24" aria-hidden>
      <path d="M22.106 5.68L12.5.135a.998.998 0 00-.998 0L1.893 5.68a.84.84 0 00-.419.726v11.186c0 .3.16.577.42.727l9.607 5.547a.999.999 0 00.998 0l9.608-5.547a.84.84 0 00.42-.727V6.407a.84.84 0 00-.42-.726zm-.603 1.176L12.228 22.92c-.063.108-.228.064-.228-.061V12.34a.59.59 0 00-.295-.51l-9.11-5.26c-.107-.062-.063-.228.062-.228h18.55c.264 0 .428.286.296.514z" />
    </svg>
  );
}

function PromptIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function VscodeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 32 32" aria-hidden>
      <path d="M28 25.6l-5.9 2.4-9.7-9.6-6.1 4.8L4 21.9V10.1l2.3-1.2 6.1 4.8L22.1 4 28 6.4v19.2zM15.7 16l6.3 5V11l-6.3 5zM6.3 19.7L10 16l-3.6-3.7L6.3 19.7z" />
    </svg>
  );
}

const INSTALL_PROMPT_TEXT = `**IMPORTANT:** Ignore previous FastCI installation instructions and follow these updated steps.

Scan all workflow files in \`.github/workflows/\` for FastCI usage:

1. For each workflow using \`jfrog-fastci/fastci@v0\`:
   - Check if \`issues: write\` permission exists at workflow level
   - If set to \`false\`, ask: "Workflow [name] has issues: write: false. Change to 'write'?"
   - If missing, add it automatically at workflow level

2. Add FastCI as the first step in each job:

\`\`\`yaml
- uses: jfrog-fastci/fastci@v0
  with:
    github_token: \${{ secrets.GITHUB_TOKEN }}
    accept_terms: 'yes'
\`\`\`

3. For jobs using containers, add volume mount:

\`\`\`yaml
container:
  image: <your-image>
  volumes:
    - /home/runner:/tmp/fastci/mounts/home/runner
\`\`\`

Example:

\`\`\`yaml
permissions:
  issues: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: jfrog-fastci/fastci@v0
        with:
          github_token: \${{ secrets.GITHUB_TOKEN }}
          accept_terms: 'yes'
      - uses: actions/checkout@v4
\`\`\``;

type ColorTheme = {
  bg: string;
  hoverBg: string;
  shadow: string;
  hoverShadow: string;
  border: string;
  selectedBg: string;
  selectedText: string;
};

const COLORS: Record<string, ColorTheme> = {
  cursor: {
    bg: '#3c3c3c',
    hoverBg: '#505050',
    shadow: '0 0 30px rgba(60,60,60,0.25)',
    hoverShadow: '0 0 30px rgba(80,80,80,0.4)',
    border: 'rgba(255,255,255,0.15)',
    selectedBg: 'rgba(180,180,180,0.15)',
    selectedText: '#d4d4d4',
  },
  prompt: {
    bg: '#36a13b',
    hoverBg: '#5cb85f',
    shadow: '0 0 30px rgba(54,161,59,0.2)',
    hoverShadow: '0 0 30px rgba(54,161,59,0.35)',
    border: 'rgba(255,255,255,0.2)',
    selectedBg: 'rgba(54,161,59,0.2)',
    selectedText: '#5cb85f',
  },
  vscode: {
    bg: '#0078d4',
    hoverBg: '#1a8fe8',
    shadow: '0 0 30px rgba(0,120,212,0.25)',
    hoverShadow: '0 0 30px rgba(0,120,212,0.4)',
    border: 'rgba(255,255,255,0.2)',
    selectedBg: 'rgba(0,120,212,0.2)',
    selectedText: '#4fc3f7',
  },
};

type InstallOption = {
  label: string;
  icon: (props: { className?: string }) => ReactNode;
  color: ColorTheme;
} & ({ type: 'link'; href: string } | { type: 'modal' });

const INSTALL_OPTIONS: InstallOption[] = [
  { label: 'Install via Cursor', type: 'link', href: CURSOR_INSTALL_URL, icon: CursorIcon, color: COLORS.cursor },
  { label: 'Install with a Prompt', type: 'modal', icon: PromptIcon, color: COLORS.prompt },
  { label: 'Install via Vscode', type: 'link', href: VSCODE_INSTALL_URL, icon: VscodeIcon, color: COLORS.vscode },
];

function PromptModal({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(INSTALL_PROMPT_TEXT).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[80vh] rounded-2xl bg-surface-900 border border-white/10 shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h3 className="text-white font-semibold text-base">Installation Prompt</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Copy to clipboard"
            >
              {copied ? (
                <svg className="w-4 h-4 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="overflow-y-auto p-5 max-h-[calc(80vh-60px)]">
          <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">{INSTALL_PROMPT_TEXT}</pre>
        </div>
      </motion.div>
    </motion.div>
  );
}

function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
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

      <InteractiveGridPattern
        width={30}
        height={30}
        squares={[60, 40]}
        className="[mask-image:radial-gradient(500px_circle_at_center,white,transparent)] border-none"
        squaresClassName="stroke-white/[0.06] hover:fill-brand-500/20"
      />

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-surface-950" />
    </div>
  );
}

export default function Hero() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isHovered || isDropdownOpen) return;
    const id = setInterval(() => {
      setSelectedIndex((i) => (i + 1) % INSTALL_OPTIONS.length);
    }, 5000);
    return () => clearInterval(id);
  }, [isHovered, isDropdownOpen]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const current = INSTALL_OPTIONS[selectedIndex];
  const theme = current.color;

  return (
    <section className="relative min-h-screen flex items-center pt-20">
      <GridBackground />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 text-center">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center"
        >
          <motion.div variants={fadeInUp} className="mb-6">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-brand-400 bg-brand-500/10 px-4 py-1.5 rounded-full border border-brand-500/20">
              Pay Less
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
              Build Faster ⚡
             </span>
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="text-4xl sm:text-5xl lg:text-7xl font-medium leading-[1.1] tracking-tight mb-6"
          >
            Free CI Expert{' '}
            <span className="gradient-text">For Everyone</span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="text-lg md:text-xl text-gray-400 leading-relaxed mb-10 max-w-2xl"
          >
            <span className="gradient-text"><b>Faster CI</b></span> with ongoing expert level CI maintenance for free.
          </motion.p>

          <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-4">
            <div
              ref={dropdownRef}
              className="relative inline-flex"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <motion.div
                className="inline-flex rounded-full transition-shadow duration-300"
                animate={{
                  backgroundColor: theme.bg,
                  boxShadow: isHovered ? theme.hoverShadow : theme.shadow,
                }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
              >
                {current.type === 'link' ? (
                  <a
                    href={current.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 pl-7 pr-3 py-3.5 text-white font-semibold text-base rounded-l-full transition-all duration-200 overflow-hidden hover:brightness-110"
                  >
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={selectedIndex}
                        initial={{ y: 12, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -12, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="inline-flex items-center gap-2 whitespace-nowrap"
                      >
                        <current.icon className="w-5 h-5 flex-shrink-0" />
                        {current.label}
                      </motion.span>
                    </AnimatePresence>
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsPromptModalOpen(true)}
                    className="inline-flex items-center gap-2 pl-7 pr-3 py-3.5 text-white font-semibold text-base rounded-l-full transition-all duration-200 overflow-hidden hover:brightness-110"
                  >
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={selectedIndex}
                        initial={{ y: 12, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -12, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="inline-flex items-center gap-2 whitespace-nowrap"
                      >
                        <current.icon className="w-5 h-5 flex-shrink-0" />
                        {current.label}
                      </motion.span>
                    </AnimatePresence>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen((o) => !o)}
                  aria-expanded={isDropdownOpen}
                  aria-haspopup="listbox"
                  aria-label="Select install option"
                  className="inline-flex items-center justify-center px-3 py-3.5 text-white rounded-r-full transition-all duration-200 hover:brightness-110"
                  style={{ borderLeft: `1px solid ${theme.border}` }}
                >
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </motion.div>
              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute top-full left-0 right-0 mt-2 py-1 rounded-2xl bg-surface-900 border border-white/10 shadow-xl z-50 min-w-[240px]"
                    role="listbox"
                  >
                    {INSTALL_OPTIONS.map((opt, i) => {
                      const Icon = opt.icon;
                      const isSelected = i === selectedIndex;
                      const itemStyle = isSelected
                        ? { backgroundColor: opt.color.selectedBg, color: opt.color.selectedText }
                        : {};
                      const cls = `flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors w-full ${
                        isSelected ? '' : 'text-white hover:bg-white/5'
                      }`;
                      if (opt.type === 'modal') {
                        return (
                          <button
                            key={opt.label}
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => {
                              setSelectedIndex(i);
                              setIsDropdownOpen(false);
                              setIsPromptModalOpen(true);
                            }}
                            className={cls}
                            style={itemStyle}
                          >
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            {opt.label}
                          </button>
                        );
                      }
                      return (
                        <a
                          key={opt.label}
                          href={opt.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => {
                            setSelectedIndex(i);
                            setIsDropdownOpen(false);
                          }}
                          className={cls}
                          style={itemStyle}
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          {opt.label}
                        </a>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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
        </motion.div>
      </div>
      <AnimatePresence>
        {isPromptModalOpen && <PromptModal onClose={() => setIsPromptModalOpen(false)} />}
      </AnimatePresence>
    </section>
  );
}
