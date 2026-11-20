import React from 'react';

/**
 * The ClearPath flame, served from our own origin.
 *
 * `clearpath-mark-128.png` is a transparent 128px square cut from the founder's
 * logo render, so it sits on the near-black chrome and on a white chart
 * background without showing a plate behind it. 128px covers a 32-40px slot at
 * 3x device pixel ratio.
 */
export const BRAND_MARK_SRC = '/brand/clearpath-mark-128.png';
export const BRAND_LOCKUP_SRC = '/brand/clearpath-lockup-512.png';
/** Community Outreach variant: cyan outer, emerald middle ring, purple core. */
export const COMMUNITY_BRAND_MARK_SRC = '/brand/clearpath-mark-community-128.png';
export const COMMUNITY_BRAND_MARK_512_SRC = '/brand/clearpath-mark-community-512.png';

export function BrandMark({
  size = 32,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <img
      src={BRAND_MARK_SRC}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      className={`shrink-0 select-none object-contain ${className}`}
      style={{ width: size, height: size }}
      draggable={false}
    />
  );
}

/** Community Outreach flame — emerald outline instead of magenta. */
export function CommunityBrandMark({
  size = 32,
  className = '',
  animated = false,
}: {
  size?: number;
  className?: string;
  animated?: boolean;
}) {
  const src = size >= 200 ? COMMUNITY_BRAND_MARK_512_SRC : COMMUNITY_BRAND_MARK_SRC;
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      className={`shrink-0 select-none object-contain ${animated ? 'co-flame-live' : ''} ${className}`}
      style={{ width: size, height: size }}
      draggable={false}
    />
  );
}

/**
 * Bottom-left attribution on every candle chart, so a screenshot that leaves
 * the site still reads as a ClearPath chart. Deliberately quiet: it must never
 * compete with the candles or swallow a click meant for the plot.
 *
 * Sits above the intel overlays — Pattern Scanner and Forming Watch both open
 * at z-55 in this same corner and would otherwise bury the mark.
 */
export function ChartWatermark({ className = '' }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute bottom-2 left-2 z-[65] opacity-55 ${className}`}
      data-chart-watermark=""
      aria-hidden="true"
    >
      <img
        src={BRAND_MARK_SRC}
        alt=""
        width={26}
        height={26}
        className="select-none object-contain drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]"
        style={{ width: 26, height: 26 }}
        draggable={false}
      />
    </div>
  );
}
