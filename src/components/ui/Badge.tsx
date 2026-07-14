import { cn } from '../../lib/utils';

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  children: React.ReactNode;
  className?: string;
}

const variantClasses = {
  default: 'bg-slate-100 text-slate-700',
  success: 'bg-accent-100 text-accent-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-red-600',
  info: 'bg-brand-100 text-brand-700',
};

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium',
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

interface StatusBadgeProps {
  status: string;
  label: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const colorMap: Record<string, string> = {
    active: 'bg-brand-100 text-brand-700',
    inactive: 'bg-slate-100 text-slate-500',
    draft: 'bg-slate-100 text-slate-600',
    pending: 'bg-slate-100 text-slate-600',
    issued: 'bg-brand-100 text-brand-700',
    part_used: 'bg-accent-100 text-accent-700',
    fully_used: 'bg-slate-100 text-slate-500',
    expired: 'bg-red-50 text-red-600',
    frozen: 'bg-amber-50 text-amber-700',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium',
        colorMap[status] || variantClasses.default,
        className,
      )}
    >
      {label}
    </span>
  );
}
