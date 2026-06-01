import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, isToday, isYesterday, differenceInMinutes, differenceInHours, differenceInDays } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Generate a consistent color from a name string
export function getAvatarColor(name: string): string {
  if (!name) return '?';
  const colors = [
    '#818cf8', '#34d399', '#fbbf24', '#f87171', '#a78bfa',
    '#60a5fa', '#fb923c', '#e879f9', '#2dd4bf', '#f472b6',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// Get initials from a name
export function getInitials(name: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Format message timestamp
export function formatTime(timestamp: string | Date): string {
  const date = new Date(timestamp);
  const now = new Date();
  
  const minutesDiff = differenceInMinutes(now, date);
  if (minutesDiff < 1) return 'now';
  if (minutesDiff < 60) return `${minutesDiff}m`;
  
  const hoursDiff = differenceInHours(now, date);
  if (hoursDiff < 24) return `${hoursDiff}h`;
  
  const daysDiff = differenceInDays(now, date);
  if (daysDiff === 1) return 'Yesterday';
  if (daysDiff < 7) return `${daysDiff}d`;
  
  return format(date, 'MMM d');
}

// Format full date for tooltips
export function formatFullDate(timestamp: string | Date): string {
  const date = new Date(timestamp);
  if (isToday(date)) return `Today at ${format(date, 'h:mm a')}`;
  if (isYesterday(date)) return `Yesterday at ${format(date, 'h:mm a')}`;
  return format(date, 'MMM d, yyyy h:mm a');
}

// Format date separator
export function formatDateSeparator(timestamp: string | Date): string {
  const date = new Date(timestamp);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMMM d, yyyy');
}

// Format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
