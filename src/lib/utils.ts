import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const isVideoUrl = (url: string | undefined | null) => {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  return lowerUrl.startsWith('data:video/') || 
         lowerUrl.includes('.mp4?alt=media') || 
         lowerUrl.includes('.webm?alt=media') || 
         lowerUrl.includes('.mov?alt=media');
};

export const isAudioUrl = (url: string | undefined | null) => {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  return lowerUrl.startsWith('data:audio/') || 
         lowerUrl.includes('.mp3?alt=media') || 
         lowerUrl.includes('.wav?alt=media') ||
         lowerUrl.includes('.ogg?alt=media');
};
