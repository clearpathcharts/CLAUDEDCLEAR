/** Site-wide WCAG / neuro-inclusive display preferences. */

export const A11Y_HIGH_CONTRAST_KEY = 'cp_a11y_high_contrast';
export const A11Y_REDUCED_SENSORY_KEY = 'cp_a11y_reduced_sensory';

export type A11yPreferences = {
  highContrast: boolean;
  reducedSensory: boolean;
};

/** Mid-tone WCAG-safe brand accents (4.5:1 with white text). */
export const A11Y_SAFE_PINK = '#d81b60';
export const A11Y_SAFE_ORANGE = '#e65100';

/** Default neuro-optimized brand accents. */
export const A11Y_DEFAULT_PINK = '#FF1493';
export const A11Y_DEFAULT_ORANGE = '#FF7B00';

export function readA11yPreferences(): A11yPreferences {
  if (typeof window === 'undefined') {
    return { highContrast: false, reducedSensory: false };
  }
  try {
    return {
      highContrast: localStorage.getItem(A11Y_HIGH_CONTRAST_KEY) === 'true',
      reducedSensory: localStorage.getItem(A11Y_REDUCED_SENSORY_KEY) === 'true',
    };
  } catch {
    return { highContrast: false, reducedSensory: false };
  }
}

export function persistA11yPreferences(prefs: A11yPreferences): void {
  try {
    localStorage.setItem(A11Y_HIGH_CONTRAST_KEY, prefs.highContrast ? 'true' : 'false');
    localStorage.setItem(A11Y_REDUCED_SENSORY_KEY, prefs.reducedSensory ? 'true' : 'false');
  } catch {
    // ignore quota / private mode
  }
}

/** Apply preferences to <html> so every page (SPA + SSR shell) can theme via CSS. */
export function applyA11yPreferencesToDocument(prefs: A11yPreferences): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-high-contrast', prefs.highContrast ? 'true' : 'false');
  root.setAttribute('data-reduced-sensory', prefs.reducedSensory ? 'true' : 'false');
  root.style.setProperty('--cpt-pink', prefs.highContrast ? A11Y_SAFE_PINK : A11Y_DEFAULT_PINK);
  root.style.setProperty('--cpt-orange', prefs.highContrast ? A11Y_SAFE_ORANGE : A11Y_DEFAULT_ORANGE);
  root.style.setProperty('--cpt-cta-on-pink', prefs.highContrast ? '#ffffff' : '#000000');
  root.style.setProperty('--cpt-cta-on-orange', prefs.highContrast ? '#ffffff' : '#000000');
}
