import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle2, Clock3, Loader2 } from 'lucide-react';
import type { ComponentType } from 'react';
import type { AutoSaveStatus } from './useValidationRefinement';

interface ValidationStatusBarProps {
  status: AutoSaveStatus;
  label: string;
  timestamp?: number | null;
  className?: string;
}

const STATUS_STYLES: Record<
  AutoSaveStatus,
  { icon: ComponentType<{ className?: string }>; className: string; animate?: boolean }
> = {
  idle: { icon: Clock3, className: 'text-neutral-500' },
  saving: { icon: Loader2, className: 'text-amber-600', animate: true },
  saved: { icon: CheckCircle2, className: 'text-emerald-600' },
  error: { icon: AlertTriangle, className: 'text-rose-600' },
};

export function ValidationStatusBar({ status, label, timestamp, className }: ValidationStatusBarProps) {
  const token = STATUS_STYLES[status];
  const Icon = token.icon;

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-600 shadow-sm',
        className,
      )}
    >
      <Icon className={cn('h-4 w-4', token.className, token.animate && 'animate-spin')} />
      <span className="text-neutral-700">{label}</span>
      {status === 'saved' && timestamp && (
        <span className="text-[11px] text-neutral-400">
          {new Date(timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
        </span>
      )}
    </div>
  );
}

