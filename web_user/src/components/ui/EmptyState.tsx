import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  message: string;
  icon?: LucideIcon;
}

export function EmptyState({ message, icon }: EmptyStateProps) {
  const IconComponent = icon;
  return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
      {IconComponent && <IconComponent size={48} className="mb-4 opacity-50" />}
      <p className="text-sm">{message}</p>
    </div>
  );
}