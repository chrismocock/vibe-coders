import { cn } from '@/lib/utils';
import { HTMLAttributes } from 'react';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-neutral-200/70', className)}
      {...props}
    />
  );
}

interface TextSkeletonProps {
  lines?: number;
  className?: string;
}

export function TextSkeleton({ lines = 3, className }: TextSkeletonProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn(
            'h-3 w-full',
            index === lines - 1 && 'w-2/3',
          )}
        />
      ))}
    </div>
  );
}

interface PillarSkeletonProps {
  className?: string;
}

export function PillarSkeleton({ className }: PillarSkeletonProps) {
  return (
    <div className={cn('rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm', className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex flex-col items-end gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <div className="mt-4 space-y-3">
        <Skeleton className="h-2 w-full rounded-full" />
        <TextSkeleton lines={2} />
        <TextSkeleton lines={2} />
      </div>
    </div>
  );
}

