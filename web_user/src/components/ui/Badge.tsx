import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  className?: string;
}

export function Badge({ children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium',
        'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
        className
      )}
    >
      {children}
    </span>
  );
}