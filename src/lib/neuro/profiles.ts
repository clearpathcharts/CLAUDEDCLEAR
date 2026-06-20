export type NeuroProfileId = 'calm_focus' | 'adhd_hyperfocus' | 'dyslexia_readable' | 'high_contrast';

export interface NeuroProfile {
  id: NeuroProfileId;
  title: string;
  colors: {
    bg: string;
    text: string;
    accent: string;
    secondary: string;
  };
  grid: {
    visible: boolean;
    opacity: number;
    size: number;
  };
  motion: {
    reduced: boolean;
    duration: number;
  };
  typography: {
    fontFamily: string;
    letterSpacing: string;
    lineHeight: string;
    fontSize: string;
  };
}

export const neuroProfiles: Record<NeuroProfileId, NeuroProfile> = {
  calm_focus: {
    id: 'calm_focus',
    title: 'Calm Focus',
    colors: {
      bg: '#0F172A', // Slate 900
      text: '#F8FAFC', // Slate 50
      accent: '#38BDF8', // Sky 400
      secondary: '#94A3B8', // Slate 400
    },
    grid: { visible: true, opacity: 0.05, size: 40 },
    motion: { reduced: true, duration: 0.5 },
    typography: { fontFamily: 'sans-serif', letterSpacing: 'normal', lineHeight: '1.6', fontSize: '16px' }
  },
  adhd_hyperfocus: {
    id: 'adhd_hyperfocus',
    title: 'ADHD (Hyperfocus)',
    colors: {
      bg: '#000000',
      text: '#FFFFFF',
      accent: '#EAB308', // Yellow 500
      secondary: '#71717A', // Zinc 500
    },
    grid: { visible: false, opacity: 0, size: 0 },
    motion: { reduced: false, duration: 0.2 },
    typography: { fontFamily: 'monospace', letterSpacing: '-0.02em', lineHeight: '1.4', fontSize: '18px' }
  },
  dyslexia_readable: {
    id: 'dyslexia_readable',
    title: 'Dyslexia Support',
    colors: {
      bg: '#FAF9F6', // Off-white
      text: '#171717', // Neutral 900
      accent: '#2563EB', // Blue 600
      secondary: '#525252', // Neutral 500
    },
    grid: { visible: false, opacity: 0, size: 0 },
    motion: { reduced: true, duration: 0 },
    typography: { fontFamily: '"OpenDyslexic", "Comic Sans MS", sans-serif', letterSpacing: '0.05em', lineHeight: '1.8', fontSize: '18px' }
  },
  high_contrast: {
    id: 'high_contrast',
    title: 'High Contrast (B/W)',
    colors: {
      bg: '#000000',
      text: '#FFFFFF',
      accent: '#FFFFFF',
      secondary: '#FFFFFF',
    },
    grid: { visible: true, opacity: 0.2, size: 60 },
    motion: { reduced: true, duration: 0 },
    typography: { fontFamily: 'monospace', letterSpacing: '0.1em', lineHeight: '1.5', fontSize: '20px' }
  }
};
