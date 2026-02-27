import { type ReactNode } from 'react';

export function Marquee({
  children,
  reverse = false,
  className = '',
  pauseOnHover = false,
}: {
  children: ReactNode;
  reverse?: boolean;
  className?: string;
  pauseOnHover?: boolean;
}) {
  return (
    <div className={`flex overflow-hidden gap-4 [--gap:1rem] ${className}`}>
      <div
        className={`flex shrink-0 gap-4 ${reverse ? 'animate-marquee-reverse' : 'animate-marquee'} [--duration:40s] ${
          pauseOnHover ? 'group-hover:[animation-play-state:paused]' : ''
        }`}
        style={{ willChange: 'transform' }}
      >
        {children}
      </div>
      <div
        className={`flex shrink-0 gap-4 ${reverse ? 'animate-marquee-reverse' : 'animate-marquee'} [--duration:40s] ${
          pauseOnHover ? 'group-hover:[animation-play-state:paused]' : ''
        }`}
        aria-hidden="true"
        style={{ willChange: 'transform' }}
      >
        {children}
      </div>
    </div>
  );
}
