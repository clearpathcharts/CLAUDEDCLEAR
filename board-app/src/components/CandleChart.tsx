"use client";

import { useEffect, useRef } from "react";
import type { Candle } from "@/lib/marketData";
import type { DeskMeta } from "@/lib/desks";

type Props = {
  candles: Candle[];
  desk: DeskMeta;
};

export function CandleChart({ candles, desk }: Props) {
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
        min = Math.min(min, c.l);
        max = Math.max(max, c.h);
      }
      const span = Math.max(max - min, min * 0.001);
      min -= span * 0.05;
      max += span * 0.05;

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

      const slot = plotW / candles.length;
      const bodyW = Math.max(2, slot * 0.55);

      candles.forEach((c, i) => {
        const x = padL + i * slot + slot / 2;
        const yO = padT + ((max - c.o) / (max - min)) * plotH;
        const yC = padT + ((max - c.c) / (max - min)) * plotH;
        const yH = padT + ((max - c.h) / (max - min)) * plotH;
        const yL = padT + ((max - c.l) / (max - min)) * plotH;
        const up = c.c >= c.o;
        const color = up ? desk.candleUp : desk.candleDown;

        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(x, yH);
        ctx.lineTo(x, yL);
        ctx.stroke();

        const top = Math.min(yO, yC);
        const bodyH = Math.max(1, Math.abs(yC - yO));
        ctx.fillStyle = color;
        ctx.fillRect(x - bodyW / 2, top, bodyW, bodyH);
      });
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(parent);
    return () => ro.disconnect();
  }, [candles, desk]);

  return (
    <div className="chart-canvas-wrap">
      <canvas ref={canvasRef} aria-label="Candlestick chart" />
    </div>
  );
}

function formatPrice(n: number): string {
  if (n >= 1000) return n.toFixed(1);
  if (n >= 100) return n.toFixed(2);
  if (n >= 1) return n.toFixed(3);
  return n.toFixed(5);
}
