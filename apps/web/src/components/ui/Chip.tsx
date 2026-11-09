import 'react';

export interface ChipProps {
  label: string;
  selected?: boolean;
  count?: number;
  size?: 'sm' | 'md';
  onClick?: () => void;
  className?: string;
}

export function Chip({
  label,
  selected = false,
  count,
  size = 'md',
  onClick,
  className = '',
}: ChipProps) {
  const Component = onClick ? 'button' : 'span';
  const sizeStyles = {
    sm: 'px-2.5 py-0.5 text-[11px]',
    md: 'px-3 py-1 text-xs',
  };

  return (
    <Component
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full font-medium transition-all select-none ${sizeStyles[size]} ${
        selected
          ? 'bg-[var(--accent-subtle)] text-[var(--accent-primary)] border border-[var(--accent-primary)]'
          : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
      } ${onClick ? 'cursor-pointer active:scale-95' : 'cursor-default'} ${className}`}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
            selected
              ? 'bg-[var(--accent-primary)] text-[var(--bg-primary)]'
              : 'bg-[var(--bg-elevated)] text-[var(--text-muted)]'
          }`}
        >
          {count}
        </span>
      )}
    </Component>
  );
}
