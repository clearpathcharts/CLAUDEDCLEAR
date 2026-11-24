"use client";

import { useEffect, useRef } from "react";
import type { Candle } from "@/lib/marketData";
import type { DeskMeta } from "@/lib/desks";
import type { PatternHit } from "@/lib/patternScatter";
import { resolveCandleColors, type ChartStyle } from "@/lib/chartStyle";

type Props = {
  candles: Candle[];
  desk: DeskMeta;
  chartStyle?: ChartStyle;
  patternHits?: PatternHit[];
  showPatternScatter?: boolean;
};

export function CandleChart({
  candles,
  desk,
  chartStyle = "desk",
  patternHits = [],
  showPatternScatter = false,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(parent.clientWidth, 320);
      const height = Math.max(parent.clientHeight, 420);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (width < 40 || candles.length === 0) return;

      ctx.fillStyle = desk.chartBg;
      ctx.fillRect(0, 0, width, height);

      const padL = 12;
      const padR = 56;
      const padT = 16;
      const padB = 24;
      const plotW = width - padL - padR;
      const plotH = height - padT - padB;

      let min = Infinity;
      let max = -Infinity;
      for (const c of candles) {
        min = Math.min(min, chartStyle === "line" ? c.c : c.l);
        max = Math.max(max, chartStyle === "line" ? c.c : c.h);
      }
      const span = Math.max(max - min, Math.abs(min) * 0.001 || 0.001);
      min -= span * 0.05;
      max += span * 0.05;

      const yAt = (price: number) => padT + ((max - price) / (max - min)) * plotH;
      const xAt = (index: number) => {
        const slot = plotW / candles.length;
        return padL + index * slot + slot / 2;
      };

      ctx.strokeStyle = desk.grid;
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = padT + (plotH * i) / 4;
        ctx.beginPath();
        ctx.moveTo(padL, y);
        ctx.lineTo(width - padR, y);
        ctx.stroke();
        const price = max - ((max - min) * i) / 4;
        ctx.fillStyle = "rgba(154, 168, 188, 0.75)";
        ctx.font = "11px IBM Plex Mono, monospace";
        ctx.fillText(formatPrice(price), width - padR + 6, y + 4);
      }

      const colors = resolveCandleColors(desk, chartStyle);
      const slot = plotW / candles.length;

      if (chartStyle === "line") {
        ctx.strokeStyle = colors.line;
        ctx.lineWidth = 2;
        ctx.beginPath();
        candles.forEach((c, i) => {
          const x = xAt(i);
          const y = yAt(c.c);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      } else if (chartStyle === "bars") {
        const tick = Math.max(2, slot * 0.28);
        candles.forEach((c, i) => {
          const x = xAt(i);
          const up = c.c >= c.o;
          const color = up ? colors.up : colors.down;
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(x, yAt(c.h));
          ctx.lineTo(x, yAt(c.l));
          ctx.moveTo(x - tick, yAt(c.o));
          ctx.lineTo(x, yAt(c.o));
          ctx.moveTo(x, yAt(c.c));
          ctx.lineTo(x + tick, yAt(c.c));
          ctx.stroke();
        });
      } else {
        const bodyW = Math.max(2, slot * 0.55);
        candles.forEach((c, i) => {
          const x = xAt(i);
          const yO = yAt(c.o);
          const yC = yAt(c.c);
          const up = c.c >= c.o;
          const color = up ? colors.up : colors.down;

          ctx.strokeStyle = color;
          ctx.beginPath();
          ctx.moveTo(x, yAt(c.h));
          ctx.lineTo(x, yAt(c.l));
          ctx.stroke();

          const top = Math.min(yO, yC);
          const bodyH = Math.max(1, Math.abs(yC - yO));
          ctx.fillStyle = color;
          ctx.fillRect(x - bodyW / 2, top, bodyW, bodyH);
        });
      }

      if (showPatternScatter && patternHits.length) {
        for (const hit of patternHits) {
          const i0 = Math.max(0, Math.min(candles.length - 1, hit.index));
          const i1 = Math.max(
            0,
            Math.min(candles.length - 1, hit.endIndex ?? hit.index),
          );
          const color =
            hit.group === "candlestick"
              ? "#00F5FF"
              : hit.direction === "bullish"
                ? "#FF1493"
                : "#BF00FF";

          if (i1 !== i0) {
            const y =
              hit.direction === "bullish"
                ? yAt(Math.min(candles[i0].l, candles[i1].l))
                : yAt(Math.max(candles[i0].h, candles[i1].h));
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 3]);
            ctx.beginPath();
            ctx.moveTo(xAt(i0), y);
            ctx.lineTo(xAt(i1), y);
            ctx.stroke();
            ctx.setLineDash([]);
          }

          const markI = i1;
          const markY =
            hit.direction === "bullish"
              ? yAt(candles[markI].l) + 10
              : yAt(candles[markI].h) - 10;
          const markX = xAt(markI);

          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(markX, markY, 3.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.font = "9px IBM Plex Mono, monospace";
          ctx.fillStyle = color;
          const label = hit.label.length > 18 ? `${hit.label.slice(0, 16)}…` : hit.label;
          ctx.fillText(label, markX + 6, markY + 3);
        }
      }
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(parent);
    return () => ro.disconnect();
  }, [candles, desk, chartStyle, patternHits, showPatternScatter]);

  return (
    <div className="chart-canvas-wrap">
      <canvas ref={canvasRef} aria-label="Market chart" />
      <img
        src="/clearpath-flame.png"
        alt=""
        className="chart-flame-mark"
        width={88}
        height={88}
        aria-hidden="true"
      />
    </div>
  );
}

function formatPrice(n: number): string {
  if (n >= 1000) return n.toFixed(1);
  if (n >= 100) return n.toFixed(2);
  if (n >= 1) return n.toFixed(3);
  return n.toFixed(5);
}
