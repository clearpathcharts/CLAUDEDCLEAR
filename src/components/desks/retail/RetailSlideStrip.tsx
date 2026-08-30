import React, { useCallback, useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'clearpath_retail_slide_strip_px';
const COLLAPSED_PX = 44;
const DEFAULT_PX = 240;
const MIN_PX = 44;
const MAX_PX = 520;

function readStoredHeight(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw == null) return DEFAULT_PX;
    const n = Number(raw);
    if (!Number.isFinite(n)) return DEFAULT_PX;
    return Math.min(MAX_PX, Math.max(MIN_PX, Math.round(n)));
  } catch {
    return DEFAULT_PX;
  }
}

/**
 * Vertical slide strip under the primary chart row.
 * Drag the handle up to give charts more room; drag down to reveal analytics.
 * Double-click collapses / restores.
 */
export function RetailSlideStrip({
  title = 'Market analytics',
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  const [height, setHeight] = useState(readStoredHeight);
  const [collapsed, setCollapsed] = useState(() => readStoredHeight() <= COLLAPSED_PX + 4);
  const [dragging, setDragging] = useState(false);
  const startY = useRef(0);
  const startH = useRef(DEFAULT_PX);
  const lastExpanded = useRef(Math.max(DEFAULT_PX, readStoredHeight()));

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed ? COLLAPSED_PX : height));
    } catch {
      /* ignore */
    }
  }, [height, collapsed]);

  const onPointerMove = useCallback((e: PointerEvent) => {
    const delta = e.clientY - startY.current;
    // Drag handle down → taller strip; up → shorter (more chart room)
    const next = Math.min(MAX_PX, Math.max(MIN_PX, Math.round(startH.current + delta)));
    setCollapsed(next <= COLLAPSED_PX + 8);
    setHeight(next);
    if (next > COLLAPSED_PX + 8) lastExpanded.current = next;
  }, []);

  const onPointerUp = useCallback(() => {
    setDragging(false);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
  }, [onPointerMove]);

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    startY.current = e.clientY;
    startH.current = collapsed ? COLLAPSED_PX : height;
    setDragging(true);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const toggleCollapse = () => {
    if (collapsed) {
      const restore = Math.max(DEFAULT_PX, lastExpanded.current);
      setHeight(restore);
      setCollapsed(false);
    } else {
      lastExpanded.current = height;
      setHeight(COLLAPSED_PX);
      setCollapsed(true);
    }
  };

  const shown = collapsed ? COLLAPSED_PX : height;

  return (
    <div
      data-retail-slide-strip
      className="flex shrink-0 flex-col overflow-hidden rounded-xl"
      style={{ height: shown, maxHeight: '55vh' }}
    >
      <div
        role="separator"
        aria-orientation="horizontal"
        aria-valuenow={shown}
        aria-valuemin={MIN_PX}
        aria-valuemax={MAX_PX}
        aria-label={`${title} resize. Drag up for more charts, down for more analytics.`}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onDoubleClick={(e) => {
          e.preventDefault();
          toggleCollapse();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleCollapse();
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setCollapsed(false);
            setHeight((h) => Math.max(MIN_PX, h - 24));
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            setCollapsed(false);
            setHeight((h) => Math.min(MAX_PX, h + 24));
          }
        }}
        className={`retail-slide-handle flex h-9 shrink-0 cursor-row-resize select-none items-center justify-center gap-3 border px-3 ${
          dragging ? 'opacity-100' : ''
        }`}
      >
        <span className="retail-slide-grip" aria-hidden="true" />
        <span className="text-sm font-black uppercase tracking-[0.14em]">
          {collapsed ? `${title} · collapsed — drag down or double-click` : `${title} · drag to slide · double-click collapse`}
        </span>
        <button
          type="button"
          className="ml-auto rounded-md border px-2 py-1 text-sm font-black uppercase tracking-wider"
          onClick={(e) => {
            e.stopPropagation();
            toggleCollapse();
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {collapsed ? 'Expand' : 'Collapse'}
        </button>
      </div>
      {!collapsed ? (
        <div className="retail-slide-body min-h-0 flex-1 overflow-auto px-0.5 pb-0.5">{children}</div>
      ) : null}
    </div>
  );
}
