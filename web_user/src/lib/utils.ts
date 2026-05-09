import { clsx, type ClassValue } from 'clsx';
import { PUBLIC_PROJECT_PATTERN } from './constants';

// Classname utility (same as admin web)
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Time ago formatter
export function timeAgo(iso: string): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// Strip "public-" prefix for display
export function displayAgentName(name: string): string {
  return name.replace(PUBLIC_PROJECT_PATTERN, '');
}

// Wait helper
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}