import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
// Self-contained fallback avatar (no network request) used whenever a user
// has no photoURL. Renders a simple person glyph on a neutral background.
export function avatarFallback(size: number = 40): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 40 40">
    <rect width="40" height="40" rx="20" fill="#e5ddd0"/>
    <circle cx="20" cy="16" r="7" fill="#0d1b2a" fill-opacity="0.35"/>
    <path d="M6 34c0-8 6-13 14-13s14 5 14 13" fill="#0d1b2a" fill-opacity="0.35"/>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
