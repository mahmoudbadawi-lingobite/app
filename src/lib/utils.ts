import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Builds a shareable, direct link to a single lesson. Anyone opening this
// URL (teacher or student) lands straight on that lesson once signed in —
// see the `lesson` search param handling in App.tsx.
export function buildLessonShareUrl(lessonId: string): string {
  const url = new URL(window.location.href);
  url.search = `?lesson=${encodeURIComponent(lessonId)}`;
  url.hash = '';
  return url.toString();
}

// Copies text to the clipboard, with a manual fallback for browsers/contexts
// where the async Clipboard API isn't available (e.g. non-HTTPS previews).
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the legacy method below.
  }
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);
    return successful;
  } catch {
    return false;
  }
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
