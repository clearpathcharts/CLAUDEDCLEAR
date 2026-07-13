import React, { useEffect, useRef } from 'react';

export default function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animationId: number;

    const colors = ['#FF1493', '#00FFFF', '#B026FF', '#FF7B00'];

    const convertHexToRGBA = (hex: string, alpha: number) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    const fontSize = 11;
    let columns = 0;
    let drops: number[] = [];
    let dropColors: string[] = [];
    const charPool = '01010101ABCDEFGHIJKLMNOPQRSTUVWXYZ$%#@&*()[]{}X+-='.split('');

    const updateHubsAndClusters = () => {
      const parent = canvas.parentElement;
      canvas.width = parent ? parent.clientWidth : window.innerWidth;
      const targetHeight = parent
        ? Math.max(parent.scrollHeight, parent.clientHeight)
        : document.documentElement.scrollHeight;
      canvas.height = targetHeight;

      columns = Math.floor(canvas.width / fontSize) + 1;
      drops = [];
      dropColors = [];

      for (let i = 0; i < columns; i++) {
        drops[i] = Math.floor(Math.random() * (canvas.height / fontSize));
        dropColors[i] = colors[Math.floor(Math.random() * colors.length)];
      }
    };

    updateHubsAndClusters();

    const resizeObserver = new ResizeObserver(() => {
      updateHubsAndClusters();
    });
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    const trailLength = 8;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = `600 ${fontSize}px monospace`;
      ctx.textAlign = 'center';

      for (let i = 0; i < columns; i++) {
        const baseColor = dropColors[i];
        const x = i * fontSize + fontSize / 2;
        const headY = Math.floor(drops[i]);

        for (let j = 0; j < trailLength; j++) {
          const currentY = headY - j;
          if (currentY >= 0 && currentY * fontSize < canvas.height) {
            const factor = (trailLength - j) / trailLength;
            const opacity = factor * 0.11;
            const char = charPool[(Math.floor(drops[i] * 5) + j) % charPool.length];
            const y = currentY * fontSize;
            ctx.fillStyle = convertHexToRGBA(baseColor, opacity);
            ctx.shadowBlur = 0;
            ctx.fillText(char, x, y);
          }
        }

        if (headY * fontSize < canvas.height) {
          const tipChar = charPool[Math.floor(Math.random() * charPool.length)];
          ctx.fillStyle = convertHexToRGBA('#FFFFFF', 0.15);
          ctx.shadowColor = baseColor;
          ctx.shadowBlur = 3;
          ctx.fillText(tipChar, x, headY * fontSize);
        }

        drops[i] += 0.18;
        if ((drops[i] - trailLength) * fontSize > canvas.height) {
          drops[i] = 0;
          dropColors[i] = colors[Math.floor(Math.random() * colors.length)];
        }
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-10 opacity-[0.08]"
      aria-hidden="true"
    />
  );
}
