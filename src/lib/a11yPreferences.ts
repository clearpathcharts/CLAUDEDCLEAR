/** Site-wide WCAG / neuro-inclusive display preferences. */

export const A11Y_HIGH_CONTRAST_KEY = 'cp_a11y_high_contrast';
export const A11Y_REDUCED_SENSORY_KEY = 'cp_a11y_reduced_sensory';

export type A11yPreferences = {
  highContrast: boolean;
  reducedSensory: boolean;
};

/**
 * Mid-tone WCAG-safe CTA fills (≈4.5:1 with white text).
 * Used for primary buttons in both default and High Contrast modes so
 * Lighthouse contrast passes without abandoning neon accents elsewhere.
 */
export const A11Y_SAFE_PINK = '#d81b60';
export const A11Y_SAFE_ORANGE = '#e65100';

/** Lighter accents for small text on near-black (readable neuro tints). */
export const A11Y_TEXT_PINK = '#f472b6';
export const A11Y_TEXT_ORANGE = '#fb923c';
export const A11Y_TEXT_PURPLE = '#e9d5ff';

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
  // CTA fills stay mid-tone for contrast; High Contrast mainly lifts muted copy
  root.style.setProperty('--cpt-pink', A11Y_SAFE_PINK);
  root.style.setProperty('--cpt-orange', A11Y_SAFE_ORANGE);
  root.style.setProperty('--cpt-cta-on-pink', '#ffffff');
  root.style.setProperty('--cpt-cta-on-orange', '#ffffff');
  root.style.setProperty('--cpt-text-pink', prefs.highContrast ? '#f9a8d4' : A11Y_TEXT_PINK);
  root.style.setProperty('--cpt-text-orange', prefs.highContrast ? '#fdba74' : A11Y_TEXT_ORANGE);
  root.style.setProperty('--cpt-text-purple', prefs.highContrast ? '#f3e8ff' : A11Y_TEXT_PURPLE);
}
