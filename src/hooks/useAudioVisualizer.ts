import { useEffect, useRef, useState } from 'react';

/** Real frequency bars driven by Web Audio API (not random animation). */
export function useAudioVisualizer(
  audioRef: React.RefObject<HTMLAudioElement | null>,
  isPlaying: boolean,
  barCount = 16
) {
  const [bars, setBars] = useState<number[]>(() => Array(barCount).fill(8));
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isPlaying) {
      setBars(Array(barCount).fill(8));
      return;
    }

    let cancelled = false;

    const setup = async () => {
      try {
        if (!ctxRef.current) {
          ctxRef.current = new AudioContext();
        }
        const ctx = ctxRef.current;
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }

        if (!sourceRef.current) {
          sourceRef.current = ctx.createMediaElementSource(audio);
          analyserRef.current = ctx.createAnalyser();
          analyserRef.current.fftSize = 64;
          sourceRef.current.connect(analyserRef.current);
          analyserRef.current.connect(ctx.destination);
        }

        const analyser = analyserRef.current!;
        const data = new Uint8Array(analyser.frequencyBinCount);

        const tick = () => {
          if (cancelled) return;
          analyser.getByteFrequencyData(data);
          const slice = Math.floor(data.length / barCount);
          const next = Array.from({ length: barCount }, (_, i) => {
            const start = i * slice;
            let sum = 0;
            for (let j = start; j < start + slice; j++) sum += data[j] ?? 0;
            const avg = sum / slice;
            return Math.max(8, Math.min(100, (avg / 255) * 100));
          });
          setBars(next);
          rafRef.current = requestAnimationFrame(tick);
        };

        tick();
      } catch {
        setBars(Array(barCount).fill(12));
      }
    };

    setup();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
    };
  }, [audioRef, isPlaying, barCount]);

  return bars;
}
