import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { fadeInUp, staggerContainer } from '../../lib/animations';

const baseUrl = import.meta.env.BASE_URL;

const posts = [
  {
    slug: 'why-ci-maintenance-matters',
    tag: 'Best Practices',
    title: 'Why CI Maintenance Matters',
    excerpt:
      'CI pipelines degrade silently. Builds that once took 3 minutes creep to 15. Learn why proactive CI maintenance is the key to engineering velocity.',
    readTime: '5 min read',
    gradient: 'from-brand-500/20 to-emerald-500/20',
  },
  {
    slug: 'github-actions-performance-guide',
    tag: 'Performance',
    title: 'GitHub Actions Performance Guide',
    excerpt:
      'A curated collection of best practices for GitHub Actions: caching strategies, matrix optimization, runner selection, and more.',
    readTime: '8 min read',
    gradient: 'from-cyan-500/20 to-brand-500/20',
  },
  {
    slug: 'future-of-agentic-cicd',
    tag: 'Vision',
    title: 'The Future of Agentic CI/CD',
    excerpt:
      'What happens when AI agents can not only detect CI problems, but understand context and ship the fix? Welcome to the agentic era.',
    readTime: '6 min read',
    gradient: 'from-purple-500/20 to-brand-500/20',
  },
];

export default function FastCILabs() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section className="section-padding relative" id="labs">
      <div className="absolute inset-0 bg-gradient-to-b from-surface-950 via-surface-900/30 to-surface-950" />

      <div className="relative z-10 max-w-7xl mx-auto" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 md:mb-20"
        >
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-brand-400 bg-brand-500/10 px-4 py-1.5 rounded-full border border-brand-500/20 mb-6">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
            </svg>
            FastCI Labs
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-5">
            Research &amp; Best Practices
          </h2>
          <p className="text-gray-400 text-lg max-w-3xl mx-auto leading-relaxed">
            FastCI Labs is on a mission to automatically identify and optimize CI
            pipelines, and build the most up-to-date, centralized source of
            CI/CD best practices and knowledge.
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid md:grid-cols-3 gap-6"
        >
          {posts.map((post) => (
            <a key={post.slug} href={`${baseUrl}/blog/${post.slug}`} className="group">
              <motion.article
                variants={fadeInUp}
                whileHover={{
                  scale: 1.02,
                  y: -4,
                  transition: { duration: 0.25 },
                }}
                className="glass-card-hover overflow-hidden h-full"
              >
                <div
                  className={`h-40 bg-gradient-to-br ${post.gradient} relative overflow-hidden`}
                >
                  <div className="absolute inset-0 bg-surface-950/40" />
                  <div className="absolute bottom-4 left-5">
                    <span className="text-xs font-medium text-white/80 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full">
                      {post.tag}
                    </span>
                  </div>
                  <div
                    className="absolute inset-0 opacity-10"
                    style={{
                      backgroundImage:
                        'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
                      backgroundSize: '30px 30px',
                    }}
                  />
                </div>

                <div className="p-6">
                  <h3 className="text-lg font-bold text-white mb-3 group-hover:text-brand-400 transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-4">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{post.readTime}</span>
                    <span className="text-brand-400 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                      Read more
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                  </div>
                </div>
              </motion.article>
            </a>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
