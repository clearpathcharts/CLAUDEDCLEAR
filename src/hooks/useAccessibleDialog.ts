import { useEffect, useEffectEvent, useRef } from 'react';

type Options = {
  open: boolean;
  onClose: () => void;
  /** Element to focus when the dialog opens (falls back to first focusable). */
  initialFocusRef?: React.RefObject<HTMLElement | null>;
};

/**
 * WCAG dialog helpers: Escape to close, restore focus, move focus into the panel,
 * and keep Tab cycling inside the dialog while open.
 * Pair with role="dialog" aria-modal="true" on the panel.
 */
export function useAccessibleDialog(
  dialogRef: React.RefObject<HTMLElement | null>,
  { open, onClose, initialFocusRef }: Options,
) {
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const handleClose = useEffectEvent(onClose);

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const focusInitial = () => {
      const preferred = initialFocusRef?.current;
      if (preferred) {
        preferred.focus();
        return;
      }
      const root = dialogRef.current;
      if (!root) return;
      const focusable = root.querySelector<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      focusable?.focus();
    };

    const t = window.setTimeout(focusInitial, 50);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
        return;
      }
      if (e.key !== 'Tab' || !dialogRef.current) return;

      const nodes = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null || el === dialogRef.current);

      if (nodes.length === 0) {
        e.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        if (active === first || !dialogRef.current.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('keydown', onKeyDown);
      previouslyFocused.current?.focus?.();
    };
  }, [open, dialogRef, initialFocusRef]);
}
