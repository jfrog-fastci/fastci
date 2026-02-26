import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { fadeInUp, staggerContainer } from '../../lib/animations';
import { basePath } from '../../lib/baseUrl';
import { LabsIcon } from '../icons/LabsIcon';
import { TextAnimate } from '../ui/text-animate';

const posts = [
  {
    slug: 'why-ci-maintenance-matters',
    tag: 'Best Practices',
    title: 'Why CI Maintenance Matters',
    excerpt:
      'CI pipelines degrade silently. Builds that once took 3 minutes creep to 15. Learn why proactive CI maintenance is the key to engineering velocity.',
    readTime: '5 min read',
    gradient: 'from-brand-500/20 to-emerald-500/20',
    image: 'images/_fastci.svg',
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
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-white-400 bg-black px-4 py-1.5 rounded-full border border-gray-700/30 mb-6">
            <LabsIcon />
            JFrog CI Labs
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-5">
            Research &amp; Best Practices
          </h2>
          <TextAnimate
            animation="slideUp"
            by="word"
            className="text-gray-400 text-lg max-w-3xl mx-auto leading-relaxed"
            stagger={0.04}
            once
          >
            JFrog CI Labs is on a mission to automatically identify optimization opportunities in CI pipelines, and build the most up-to-date, centralized source of CI/CD best practices and knowledge.
          </TextAnimate>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <a
            href={basePath('labs/insights/docker-build-use-multi-stage-build')}
            className="group block"
          >
            <motion.div
              whileHover={{ scale: 1.01, y: -2, transition: { duration: 0.25 } }}
              className="glass-card-hover overflow-hidden"
            >
              <div className="flex flex-col md:flex-row">
                <div className="md:w-1/3 h-40 md:h-auto relative overflow-hidden">
                  <img
                    src={basePath('images/docker-insight-thumb.svg')}
                    alt="Docker optimization insight"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-surface-950/40" />
                  <div className="absolute bottom-4 left-5 flex gap-2">
                    <span className="text-xs font-medium text-white/80 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full">
                      Insight
                    </span>
                    <span className="text-xs font-medium text-brand-300 bg-brand-500/20 backdrop-blur-sm px-3 py-1 rounded-full">
                      Docker Optimization
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
                <div className="p-6 md:p-8 md:w-2/3">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-xl font-bold text-white group-hover:text-brand-400 transition-colors">
                      Docker Build: Use Multi-Stage Builds
                    </h3>
                    <span className="shrink-0 text-xs font-bold text-brand-400 bg-brand-500/15 border border-brand-500/30 px-3 py-1 rounded-full">
                      ~34% faster
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed mb-4">
                    Replace monolithic Dockerfiles with multi-stage builds to drastically reduce image size and build time. Backed by real CI data from 3 open-source repositories tested daily.
                  </p>
                  <span className="text-brand-400 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                    View performance data
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </div>
              </div>
            </motion.div>
          </a>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid md:grid-cols-3 gap-6"
        >
          {posts.map((post) => (
            <a key={post.slug} href={basePath(`blog/${post.slug}`)} className="group">
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
                  {post.image && (
                    <img
                      src={basePath(post.image)}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}
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
