import { LABS_ICON_PATH } from '../../lib/icons';

interface Props {
  className?: string;
}

export function LabsIcon({ className = 'w-4 h-4' }: Props) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={LABS_ICON_PATH} />
    </svg>
  );
}
