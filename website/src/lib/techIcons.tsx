import {
  SiDocker,
  SiNodedotjs,
  SiPython,
  SiGo,
  SiGradle,
  SiRust,
  SiGithubactions,
  SiNpm,
  SiGit,
  SiApachemaven,
} from 'react-icons/si';

interface IconProps {
  className?: string;
  fill?: string;
}

export function DockerIcon({ className = 'w-4 h-4', fill = '#2496ED' }: IconProps) {
  return <SiDocker className={className} color={fill} />;
}

export function MavenIcon({ className = 'w-4 h-4', fill = '#C71A32' }: IconProps) {
  return <SiApachemaven className={className} color={fill} />;
}
export function NodeIcon({ className = 'w-4 h-4', fill = '#539E43' }: IconProps) {
  return <SiNodedotjs className={className} color={fill} />;
}

export function PythonIcon({ className = 'w-4 h-4', fill = '#3776AB' }: IconProps) {
  return <SiPython className={className} color={fill} />;
}

export function GoIcon({ className = 'w-4 h-4', fill = '#00ADD8' }: IconProps) {
  return <SiGo className={className} color={fill} />;
}

export function GradleIcon({ className = 'w-4 h-4', fill = '#1BA798' }: IconProps) {
  return <SiGradle className={className} color={fill} />;
}

export function RustIcon({ className = 'w-4 h-4', fill = '#DEA584' }: IconProps) {
  return <SiRust className={className} color={fill} />;
}

export function GitHubActionsIcon({ className = 'w-4 h-4', fill = '#2088FF' }: IconProps) {
  return <SiGithubactions className={className} color={fill} />;
}

export function NpmIcon({ className = 'w-4 h-4', fill = '#CB3837' }: IconProps) {
  return <SiNpm className={className} color={fill} />;
}

export function GitIcon({ className = 'w-4 h-4', fill = '#F05032' }: IconProps) {
  return <SiGit className={className} color={fill} />;
}

export const techIconColors = {
  docker: '#2496ED',
  node: '#539E43',
  python: '#3776AB',
  go: '#00ADD8',
  gradle: '#1BA798',
  rust: '#DEA584',
  githubActions: '#2088FF',
  npm: '#CB3837',
  git: '#F05032',
} as const;
