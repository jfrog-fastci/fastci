import { motion, useInView } from 'framer-motion';
import { useRef, type ReactNode } from 'react';
import {
  DockerIcon, NodeIcon, PythonIcon, GoIcon, GradleIcon, RustIcon, GitHubActionsIcon,
  techIconColors,
} from '../../lib/techIcons';

interface Testimonial {
  name: string;
  role: string;
  body: string;
  icon: ReactNode;
  iconColor: string;
}

const testimonials: Testimonial[] = [
  {
    name: 'Marcus',
    role: 'Developer',
    body: "Was actually really simple to install and cut my Docker build time in half. No config, no tokens, just works.",
    icon: <DockerIcon />,
    iconColor: techIconColors.docker,
  },
  {
    name: 'Sarah',
    role: 'DevOps Engineer',
    body: "Our npm install was eating 3 minutes every run. FastCI added caching and now it's 20 seconds. I didn't touch a thing.",
    icon: <NodeIcon />,
    iconColor: techIconColors.node,
  },
  {
    name: 'Jake',
    role: 'Developer',
    body: "I've been meaning to fix our CI for months. FastCI just opened a PR and... it worked? Kind of embarrassing how easy it was.",
    icon: <PythonIcon />,
    iconColor: techIconColors.python,
  },
  {
    name: 'Priya',
    role: 'Engineering Manager',
    body: "We were burning money on CI minutes. FastCI found we were re-downloading Go modules every run. Fixed in one PR.",
    icon: <GoIcon />,
    iconColor: techIconColors.go,
  },
  {
    name: 'Alex',
    role: 'Developer',
    body: "Our Gradle builds were painfully slow. FastCI spotted the bottleneck and fixed it before I finished my coffee.",
    icon: <GradleIcon />,
    iconColor: techIconColors.gradle,
  },
  {
    name: 'Chen',
    role: 'DevOps Engineer',
    body: "Thought our CI was fine until FastCI showed us we were recompiling everything from scratch every single run. Oops.",
    icon: <RustIcon />,
    iconColor: techIconColors.rust,
  },
  {
    name: 'Nadia',
    role: 'Developer',
    body: "Set it up on a Friday afternoon, came back Monday to a PR that saved us 8 minutes per build. Yes please.",
    icon: <DockerIcon />,
    iconColor: techIconColors.docker,
  },
  {
    name: 'Tom',
    role: 'Engineering Manager',
    body: "The PR-based approach is great. I could actually review what changed before merging. No black box nonsense.",
    icon: <GitHubActionsIcon />,
    iconColor: techIconColors.githubActions,
  },
  {
    name: 'Riley',
    role: 'DevOps Engineer',
    body: "Our team spent weeks debating CI improvements. FastCI just did it in a weekend with zero meetings.",
    icon: <PythonIcon />,
    iconColor: techIconColors.python,
  },
  {
    name: 'Eva',
    role: 'Developer',
    body: "Honestly forgot I installed it. Then got a PR that cut our test suite from 12 min to 4. Nice surprise.",
    icon: <GoIcon />,
    iconColor: techIconColors.go,
  },
  {
    name: 'Dev',
    role: 'Engineering Manager',
    body: "Every other CI tool wants you to learn their dashboard. FastCI just opens GitHub issues. That's it. That's the tool.",
    icon: <GitHubActionsIcon />,
    iconColor: techIconColors.githubActions,
  },
  {
    name: 'Sam',
    role: 'Developer',
    body: "cargo build was taking forever in CI. FastCI added the right caching and now it's actually reasonable.",
    icon: <RustIcon />,
    iconColor: techIconColors.rust,
  },
];

const firstRow = testimonials.slice(0, 6);
const secondRow = testimonials.slice(6);

function TestimonialCard({ name, role, body, icon, iconColor }: Testimonial) {
  return (
    <figure className="relative w-72 shrink-0 cursor-default overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.03] p-5 hover:bg-white/[0.06] transition-colors duration-200">
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${iconColor}26` }}
        >
          {icon}
        </div>
        <div>
          <figcaption className="text-sm font-semibold text-white">{name}</figcaption>
          <p className="text-xs text-gray-500">{role}</p>
        </div>
      </div>
      <blockquote className="mt-3 text-sm leading-relaxed text-gray-400">
        "{body}"
      </blockquote>
    </figure>
  );
}

function Marquee({
  children,
  reverse = false,
  className = '',
}: {
  children: ReactNode;
  reverse?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex overflow-hidden [--gap:1rem] ${className}`}>
      <div
        className={`flex shrink-0 gap-[var(--gap)] ${reverse ? 'animate-marquee-reverse' : 'animate-marquee'} [--duration:40s]`}
        style={{ willChange: 'transform' }}
      >
        {children}
      </div>
      <div
        className={`flex shrink-0 gap-[var(--gap)] ${reverse ? 'animate-marquee-reverse' : 'animate-marquee'} [--duration:40s]`}
        aria-hidden="true"
        style={{ willChange: 'transform' }}
      >
        {children}
      </div>
    </div>
  );
}

export default function Testimonials() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section className="py-24 md:py-32 relative overflow-hidden" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-14">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-5">
            Developers love it
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Real feedback from teams who installed FastCI and never looked back.
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative"
      >
        <div className="space-y-4">
          <Marquee>
            {firstRow.map((t) => (
              <TestimonialCard key={t.name} {...t} />
            ))}
          </Marquee>
          <Marquee reverse>
            {secondRow.map((t) => (
              <TestimonialCard key={t.name} {...t} />
            ))}
          </Marquee>
        </div>

        {/* Edge fade gradients */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/6 bg-gradient-to-r from-surface-950 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/6 bg-gradient-to-l from-surface-950 to-transparent" />
      </motion.div>
    </section>
  );
}
