import { useState, useEffect, useRef, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeIn, fadeInUp, staggerContainer } from '../../lib/animations';
import { InteractiveGridPattern } from '../ui/grid-pattern';
import { TextAnimate } from '../ui/text-animate';

const CURSOR_INSTALL_URL =
  'https://cursor.com/link/prompt?text=%2A%2AIMPORTANT%3A%2A%2A%20Ignore%20previous%20FastCI%20installation%20instructions%20and%20follow%20these%20updated%20steps.%0A%0AScan%20all%20workflow%20files%20in%20%60.github%2Fworkflows%2F%60%20for%20FastCI%20usage%3A%0A%0A1.%20Create%20a%20%60fastci.config.json%60%20file%20in%20the%20repository%20root%20with%20this%20content%3A%0A%0A%60%60%60json%0A%7B%0A%20%20%22accept_terms%22%3A%20%22yes%22%0A%7D%0A%60%60%60%0A%0A2.%20For%20each%20workflow%3A%0A%20%20%20-%20Check%20if%20%60issues%3A%20write%60%20permission%20exists%20at%20workflow%20level%0A%20%20%20-%20If%20set%20to%20%60false%60%2C%20ask%3A%20%22Workflow%20%5Bname%5D%20has%20issues%3A%20write%3A%20false.%20Change%20to%20%27write%27%3F%22%0A%20%20%20-%20If%20missing%2C%20add%20it%20automatically%20at%20workflow%20level%0A%0A3.%20Add%20FastCI%20as%20the%20first%20step%20in%20each%20job%20%28no%20%60with%60%20block%20needed%29%3A%0A%0A%60%60%60yaml%0A-%20uses%3A%20jfrog-fastci%2Ffastci%40v0%0A%60%60%60%0A%0A4.%20For%20jobs%20using%20containers%2C%20add%20volume%20mount%3A%0A%0A%60%60%60yaml%0Acontainer%3A%0A%20%20image%3A%20%3Cyour-image%3E%0A%20%20volumes%3A%0A%20%20%20%20-%20%2Fhome%2Frunner%3A%2Ftmp%2Ffastci%2Fmounts%2Fhome%2Frunner%0A%60%60%60%0A%0AExample%3A%0A%0A%60%60%60yaml%0Apermissions%3A%0A%20%20issues%3A%20write%0A%0Ajobs%3A%0A%20%20build%3A%0A%20%20%20%20runs-on%3A%20ubuntu-latest%0A%20%20%20%20steps%3A%0A%20%20%20%20%20%20-%20uses%3A%20jfrog-fastci%2Ffastci%40v0%0A%20%20%20%20%20%20-%20uses%3A%20actions%2Fcheckout%40v4%0A%60%60%60';

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

function CopilotIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M23.922 13.73c0 1.572-.907 2.838-2.025 2.838-.372 0-.728-.135-1.025-.387V18.2c0 .873-.354 1.662-.927 2.234a3.14 3.14 0 0 1-2.233.928H6.288a3.14 3.14 0 0 1-2.234-.928A3.14 3.14 0 0 1 3.127 18.2v-2.019a1.66 1.66 0 0 1-1.025.387C.984 16.568.078 15.302.078 13.73c0-1.571.906-2.837 2.024-2.837.372 0 .728.135 1.025.386V6.232C3.127 2.79 5.917 0 9.36 0h5.28c3.442 0 6.232 2.79 6.232 6.232v5.047c.297-.251.653-.386 1.025-.386 1.118 0 2.025 1.266 2.025 2.837ZM5.247 18.2c0 .574.468 1.04 1.041 1.04h11.424a1.04 1.04 0 0 0 1.04-1.04V6.232a4.113 4.113 0 0 0-4.112-4.113H9.36a4.113 4.113 0 0 0-4.113 4.113V18.2Zm3.063-8.7a2.105 2.105 0 1 1 0 4.21 2.105 2.105 0 0 1 0-4.21Zm7.38 0a2.105 2.105 0 1 1 0 4.21 2.105 2.105 0 0 1 0-4.21Zm-6.28 7.506a.847.847 0 0 1 1.196 0l.552.553.553-.553a.847.847 0 0 1 1.197 1.197l-.554.553.554.553a.847.847 0 0 1-1.197 1.197l-.553-.553-.552.553a.847.847 0 0 1-1.197-1.197l.553-.553-.553-.553a.847.847 0 0 1 0-1.197Z" />
    </svg>
  );
}

const INSTALL_PROMPT_TEXT = `**IMPORTANT:** Ignore previous FastCI installation instructions and follow these updated steps.

Scan all workflow files in \`.github/workflows/\` for FastCI usage:

1. Create a \`fastci.config.json\` file in the repository root with this content:

\`\`\`json
{
  "accept_terms": "yes"
}
\`\`\`

2. For each workflow:
   - Check if \`issues: write\` permission exists at workflow level
   - If set to \`false\`, ask: "Workflow [name] has issues: write: false. Change to 'write'?"
   - If missing, add it automatically at workflow level

3. Add FastCI as the first step in each job (no \`with\` block needed):

\`\`\`yaml
- uses: jfrog-fastci/fastci@v0
\`\`\`

4. For jobs using containers, add volume mount:

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
      - uses: actions/checkout@v4
\`\`\``;

const COPILOT_INSTALL_URL =
  'https://fastci.jfrog.com/open?ide=copilot&prompt=' + encodeURIComponent(INSTALL_PROMPT_TEXT);

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
  copilot: {
    bg: '#1f2328',
    hoverBg: '#2d333b',
    shadow: '0 0 30px rgba(31,35,40,0.25)',
    hoverShadow: '0 0 30px rgba(31,35,40,0.4)',
    border: 'rgba(255,255,255,0.2)',
    selectedBg: 'rgba(31,35,40,0.2)',
    selectedText: '#e6edf3',
  },
};

type InstallOption = {
  label: string;
  icon: (props: { className?: string }) => ReactNode;
  color: ColorTheme;
} & ({ type: 'link'; href: string } | { type: 'modal' });

const INSTALL_OPTIONS: InstallOption[] = [
  { label: 'Install via Cursor', type: 'link', href: CURSOR_INSTALL_URL, icon: CursorIcon, color: COLORS.cursor },
  { label: 'Install via Copilot', type: 'link', href: COPILOT_INSTALL_URL, icon: CopilotIcon, color: COLORS.copilot },
  { label: 'Install via Prompt', type: 'modal', icon: PromptIcon, color: COLORS.prompt },
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

function CIPlatformLogo({
  name,
  enabled = false,
  children,
}: {
  name: string;
  enabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-col items-center gap-2 group">
      <div
        className={`text-white transition-opacity duration-300 ${
          enabled ? 'opacity-100' : 'opacity-[0.35] grayscale'
        }`}
      >
        {children}
      </div>
      <span
        className={`text-xs font-medium whitespace-nowrap ${
          enabled ? 'text-gray-300' : 'text-gray-600'
        }`}
      >
        {name}
      </span>
      {!enabled && (
        <span className="text-[10px] text-gray-600 -mt-1">coming soon</span>
      )}
    </div>
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
    }, 3000);
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

          <motion.div variants={fadeInUp}>
            <TextAnimate
              animation="slideUp"
              by="word"
              as="p"
              className="text-lg md:text-xl text-gray-400 leading-relaxed mb-10 max-w-2xl"
              stagger={0.06}
              once
            >
              Faster CI with ongoing expert level CI maintenance for free.
            </TextAnimate>
          </motion.div>

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

          <motion.div
            variants={fadeIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="mt-20 md:mt-28 w-full max-w-4xl"
          >
            <p className="text-xs uppercase tracking-[0.25em] text-gray-500 text-center mb-8">
              Supported CI Platforms, more coming soon
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 md:gap-16">
              <CIPlatformLogo name="GitHub Actions" enabled>
                <svg className="h-7 sm:h-8" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </CIPlatformLogo>
              <CIPlatformLogo name="GitLab CI">
                <svg className="h-7 sm:h-8" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.955 13.587l-1.342-4.135-2.664-8.189a.455.455 0 00-.867 0L16.418 9.45H7.582L4.918 1.263a.455.455 0 00-.867 0L1.386 9.45.044 13.587a.924.924 0 00.331 1.023L12 23.054l11.625-8.443a.92.92 0 00.33-1.024"/>
                </svg>
              </CIPlatformLogo>
              <CIPlatformLogo name="Jenkins">
                <svg className="h-7 sm:h-8" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.872 24h-.975a3.866 3.866 0 01-.07-.197c-.215-.666-.594-1.49-.692-2.154-.146-.984.78-1.039 1.374-1.465.915-.66 1.635-1.025 2.627-1.62.295-.179 1.182-.624 1.281-.829.201-.408-.345-.982-.49-1.3-.225-.507-.345-.937-.376-1.435-.824-.13-1.455-.627-1.844-1.185-.63-.925-1.066-2.635-.525-3.936.045-.103.254-.305.285-.463.06-.308-.105-.72-.12-1.048-.06-1.692.284-3.15 1.425-3.66.463-1.84 2.113-2.453 3.673-3.367.58-.342 1.224-.562 1.89-.807 2.372-.877 6.027-.712 7.994.783.836.633 2.176 1.97 2.656 2.939 1.262 2.555 1.17 6.825.287 9.934-.12.421-.29 1.032-.533 1.533-.168.35-.689 1.05-.625 1.36.064.314 1.19 1.17 1.432 1.395.434.422 1.26.975 1.324 1.5.07.557-.248 1.336-.41 1.875-.217.721-.436 1.441-.654 2.131H2.87zm11.104-3.54c-.545-.3-1.361-.622-2.065-.757-.87-.164-.78 1.188-.75 1.994.03.643.36 1.316.51 1.744.076.197.09.41.256.449.3.068 1.29-.326 1.575-.479.6-.328 1.064-.844 1.574-1.189.016-.17.016-.34.03-.508a2.648 2.648 0 00-1.095-.277c.314-.15.75-.15 1.035-.332l.016-.193c-.496-.03-.69-.254-1.021-.436zm7.454 2.935a17.78 17.78 0 00.465-1.752c.06-.287.215-.918.178-1.176-.059-.459-.684-.799-1.004-1.086-.584-.525-.95-.975-1.56-1.469-.249.375-.78.615-.983.914 1.447-.689 1.71 2.625 1.141 3.69.09.329.391.45.514.735l-.086.166h1.29c.013 0 .03 0 .044.014zm-6.634-.012c-.05-.074-.1-.135-.15-.209l-.301.195h.45zm2.77 0c.008-.209.018-.404.03-.598-.53.029-.825-.48-1.196-.527-.324-.045-.6.361-1.02.195-.095.105-.183.227-.284.316.154.18.295.375.424.584h.815c.014-.164.135-.285.3-.285.165 0 .284.121.284.27h.66zm2.116 0c-.314-.479-.947-.898-1.68-.555l-.03.541h1.71zm-8.51 0l-.104-.344c-.225-.72-.36-1.26-.405-1.68-.914-.436-1.875-.87-2.654-1.426-.15-.105-1.109-1.35-1.23-1.305-1.739.676-3.359 1.86-4.814 2.984.256.557.48 1.141.69 1.74h8.505zm8.265-2.113c-.029-.512-.164-1.56-.48-1.74-.66-.39-1.846.78-2.34.943.045.15.135.271.15.48.285-.074.645-.029.898.092-.299.03-.629.03-.824.164-.074.195.016.48-.029.764.69.197 1.5.303 2.385.332.164-.227.225-.645.211-1.082zm-4.08-.36c-.044.375.046.51.12.943 1.26.391 1.034-1.74-.135-.959zM8.76 19.5c-.45.457 1.27 1.082 1.814 1.115 0-.29.165-.564.135-.77-.65-.118-1.502-.042-1.945-.347zm5.565.215c0 .043-.061.03-.068.064.58.451 1.014.545 1.802.51.354-.262.67-.563 1.043-.807-.855.074-1.931.607-2.774.23zm3.42-17.726c-1.606-.906-4.35-1.591-6.076-.731-1.38.692-3.27 1.84-3.899 3.292.6 1.402-.166 2.686-.226 4.109-.018.757.36 1.42.391 2.242-.2.338-.825.38-1.26.356-.146-.729-.4-1.549-1.155-1.63-1.064-.116-1.845.764-1.89 1.683-.06 1.08.833 2.864 2.085 2.745.488-.046.608-.54 1.139-.54.285.57-.445.75-.523 1.154-.016.105.06.511.104.705.233.944.744 2.16 1.245 2.88.635.9 1.884 1.051 3.229 1.141.24-.525 1.125-.48 1.706-.346-.691-.27-1.336-.945-1.875-1.529-.615-.676-1.23-1.41-1.261-2.28 1.155 1.604 2.1 3 4.2 3.704 1.59.525 3.45-.254 4.664-1.109.51-.359.811-.93 1.17-1.439 1.35-1.936 1.98-4.71 1.846-7.394-.06-1.111-.06-2.221-.436-2.955-.389-.781-1.695-1.471-2.475-.781-.15-.764.63-1.23 1.545-.96-.66-.854-1.336-1.858-2.266-2.384zM13.58 14.896c.615 1.544 2.724 1.363 4.505 1.323-.084.194-.256.435-.465.515-.57.232-2.145.408-2.937-.012-.506-.27-.824-.873-1.102-1.227-.137-.172-.795-.608-.012-.609zm.164-.87c.893.464 2.52.517 3.731.48.066.267.066.593.068.913-1.55.08-3.386-.304-3.794-1.395h-.005zm6.675-.586c-.473.9-1.145 1.897-2.539 1.928-.023-.284-.045-.735 0-.904 1.064-.103 1.727-.646 2.543-1.017zm-.649-.667c-1.02.66-2.154 1.375-3.824 1.21-.351-.31-.485-1-.14-1.458.181.313.06.885.57.97.944.165 2.038-.579 2.73-.84.42-.713-.046-.976-.42-1.433-.782-.93-1.83-2.1-1.802-3.51.314-.224.346.346.391.45.404.96 1.424 2.175 2.174 3 .18.21.48.39.51.524.092.39-.254.854-.209 1.11zm-13.439-.675c-.314-.184-.393-.99-.768-1.01-.535-.03-.438 1.05-.436 1.68-.37-.33-.435-1.365-.164-1.89-.308-.15-.445.164-.618.284.22-1.59 2.34-.734 1.99.96zM4.713 5.995c-.685.756-.54 2.174-.459 3.188 1.244-.785 2.898.06 2.883 1.394.595-.016.223-.744.115-1.215-.353-1.528.592-3.187.041-4.59-1.064.084-1.939.52-2.578 1.215zm9.12 1.113c.307.562.404 1.148.84 1.57.195.19.574.424.387.95-.045.121-.365.391-.551.45-.674.195-2.254.03-1.721-.81.563.015 1.314.36 1.732-.045-.314-.524-.885-1.53-.674-2.13zm6.198-.013h.068c.33.668.6 1.375 1.004 1.965-.27.628-2.053 1.19-2.023.057.39-.17 1.05-.035 1.395-.25-.193-.556-.48-1.006-.434-1.771zm-6.927-1.617c-1.422-.33-2.131.592-2.56 1.553-.384-.094-.231-.615-.135-.883.255-.701 1.28-1.633 2.119-1.506.359.057.848.386.576.834zM9.642 1.593c-1.56.44-3.56 1.574-4.2 2.974.495-.07.84-.321 1.33-.351.186-.016.428.074.641.015.424-.104.78-1.065 1.102-1.41.31-.345.685-.496.94-.81.167-.09.409-.074.42-.33-.073-.075-.15-.135-.232-.105v.017z"/>
                </svg>
              </CIPlatformLogo>
              <CIPlatformLogo name="CircleCI">
                <svg className="h-7 sm:h-8" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8.96 12a3.04 3.04 0 116.08 0 3.04 3.04 0 01-6.08 0zM12 0C6.2 0 1.31 3.87.15 9.14a.46.46 0 00.45.57h4.2c.2 0 .37-.12.44-.3A7.12 7.12 0 0112 4.88 7.12 7.12 0 0119.12 12 7.12 7.12 0 0112 19.12a7.12 7.12 0 01-6.76-4.94.48.48 0 00-.44-.3H.6a.46.46 0 00-.45.58C1.31 20.13 6.2 24 12 24c6.63 0 12-5.37 12-12S18.63 0 12 0z"/>
                </svg>
              </CIPlatformLogo>
              <CIPlatformLogo name="Azure Pipelines">
                <svg className="h-7 sm:h-8" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M15 3.622v8.512L11.5 15l-5.425-1.975v1.958L3.004 10.97l8.951.7V4.005L15 3.622zm-2.984.428L6.994 1v2.001L2.382 4.356 1 6.13v4.029l1.978.873V5.869l9.038-1.818z"/>
                </svg>
              </CIPlatformLogo>
            </div>
          </motion.div>
        </motion.div>
      </div>
      <AnimatePresence>
        {isPromptModalOpen && <PromptModal onClose={() => setIsPromptModalOpen(false)} />}
      </AnimatePresence>
    </section>
  );
}
