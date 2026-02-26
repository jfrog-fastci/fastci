import { memo, useMemo } from 'react';
import { motion, type Variants } from 'framer-motion';
import clsx from 'clsx';

type AnimationType = 'text' | 'word' | 'character' | 'line';
type AnimationVariant =
  | 'fadeIn'
  | 'blurInUp'
  | 'slideUp'
  | 'slideDown'
  | 'slideLeft'
  | 'slideRight';

type MotionElement = 'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4';

interface TextAnimateProps {
  children: string;
  className?: string;
  segmentClassName?: string;
  delay?: number;
  stagger?: number;
  duration?: number;
  as?: MotionElement;
  by?: AnimationType;
  startOnView?: boolean;
  once?: boolean;
  animation?: AnimationVariant;
}

const itemVariants: Record<AnimationVariant, Variants> = {
  fadeIn: {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0 },
  },
  blurInUp: {
    hidden: { opacity: 0, filter: 'blur(8px)', y: 12 },
    show: { opacity: 1, filter: 'blur(0px)', y: 0 },
  },
  slideUp: {
    hidden: { y: '100%', opacity: 0 },
    show: { y: 0, opacity: 1 },
  },
  slideDown: {
    hidden: { y: '-100%', opacity: 0 },
    show: { y: 0, opacity: 1 },
  },
  slideLeft: {
    hidden: { x: 20, opacity: 0 },
    show: { x: 0, opacity: 1 },
  },
  slideRight: {
    hidden: { x: -20, opacity: 0 },
    show: { x: 0, opacity: 1 },
  },
};

const motionElements: Record<MotionElement, typeof motion.p> = {
  p: motion.p,
  span: motion.span,
  div: motion.div,
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
  h4: motion.h4,
};

function TextAnimateBase({
  children,
  delay = 0,
  stagger = 0.04,
  duration = 0.35,
  className,
  segmentClassName,
  as = 'p',
  startOnView = true,
  once = true,
  by = 'word',
  animation = 'fadeIn',
}: TextAnimateProps) {
  const MotionComponent = motionElements[as];

  const segments = useMemo(() => {
    switch (by) {
      case 'word':
        return children.split(/(\s+)/);
      case 'character':
        return children.split('');
      case 'line':
        return children.split('\n');
      case 'text':
      default:
        return [children];
    }
  }, [children, by]);

  const containerVariants: Variants = useMemo(
    () => ({
      hidden: {},
      show: {
        transition: {
          delayChildren: delay,
          staggerChildren: stagger,
        },
      },
    }),
    [delay, stagger],
  );

  const childVariants: Variants = useMemo(
    () => ({
      hidden: itemVariants[animation].hidden,
      show: {
        ...itemVariants[animation].show,
        transition: {
          duration,
          ease: [0.25, 0.4, 0.25, 1],
        },
      },
    }),
    [animation, duration],
  );

  const needsClip = animation === 'slideUp' || animation === 'slideDown';

  return (
    <MotionComponent
      variants={containerVariants}
      initial="hidden"
      whileInView={startOnView ? 'show' : undefined}
      animate={startOnView ? undefined : 'show'}
      className={clsx('whitespace-pre-wrap', className)}
      viewport={{ once }}
    >
      {segments.map((segment, i) => {
        const inner = (
          <motion.span
            key={`${by}-${i}`}
            variants={childVariants}
            className={clsx(
              by === 'line' ? 'block' : 'inline-block whitespace-pre',
              segmentClassName,
            )}
          >
            {segment}
          </motion.span>
        );

        if (needsClip && segment.trim()) {
          return (
            <span key={`clip-${i}`} className="inline-block overflow-hidden align-bottom">
              {inner}
            </span>
          );
        }

        return inner;
      })}
    </MotionComponent>
  );
}

export const TextAnimate = memo(TextAnimateBase);
