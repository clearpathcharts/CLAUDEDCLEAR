import React, { useState } from 'react';
import { PATH_CARDS, LEARNING_PHILOSOPHY } from '../content/chooseYourPath';
import type { TraderDeskId } from '../lib/traderDesks';
import { BrandMark } from './brand/BrandMark';

type Props = {
  onChoosePath: (deskId: TraderDeskId) => void;
};

/** Path cards share one tall frame. */
function SharpPathImage({
  webp,
  png,
  mp4,
  width,
  height,
  alt,
  fillFrame = false,
}: {
  webp: string;
  png: string;
  mp4?: string;
  width: number;
  height: number;
  alt: string;
  fillFrame?: boolean;
}) {
  const [videoFailed, setVideoFailed] = useState(false);
  const frameClass = fillFrame
    ? 'pointer-events-none block h-full w-full object-cover object-top cp-path-art'
    : 'pointer-events-none block h-auto w-full cp-path-art';
  const showVideo = Boolean(mp4) && !videoFailed;
  return (
    <span className={`relative block ${fillFrame ? 'h-full w-full' : 'w-full'}`}>
      {showVideo ? (
        <video
          src={mp4}
          poster={png}
          aria-label={alt}
          width={width}
          height={height}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onError={() => setVideoFailed(true)}
          className={frameClass}
        />
      ) : (
        <picture className={fillFrame ? 'block h-full w-full' : undefined}>
          <source type="image/webp" srcSet={webp} />
          <img
            src={png}
            alt={alt}
            width={width}
            height={height}
            decoding="async"
            draggable={false}
            className={frameClass}
            style={{
              maxWidth: fillFrame ? '100%' : `${width}px`,
              imageRendering: 'auto',
            }}
          />
        </picture>
      )}
      <span
        className="pointer-events-none absolute right-2 top-[22%] z-10 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] sm:right-3"
        data-path-watermark=""
        aria-hidden="true"
      >
        <BrandMark size={28} />
      </span>
    </span>
  );
}

export default function ChooseYourPath({ onChoosePath }: Props) {
  return (
    <section
      id="choose-path"
      className="relative py-12 sm:py-16 border-b border-zinc-900/60 z-20 scroll-mt-28"
      aria-labelledby="choose-path-heading"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-8">
        <h2
          id="choose-path-heading"
          className="text-center text-xl sm:text-3xl md:text-4xl font-black tracking-tight uppercase leading-snug font-sans mb-8 sm:mb-10 bg-gradient-to-r from-[#00FFFF] via-[#FFD700] to-[#FF1493] bg-clip-text text-transparent"
        >
          Welcome to ClearPath Trader Please choose your path
        </h2>

        <ul className="relative z-20 grid grid-cols-3 gap-2 sm:gap-5 lg:gap-8 items-stretch isolate">
          {PATH_CARDS.map((card) => (
            <li key={card.id} className="relative z-10 min-w-0 w-full">
              <div
                data-path-card={card.id}
                className="cp-path-card relative block w-full aspect-[533/735] rounded-2xl overflow-hidden border bg-black text-left"
                style={{
                  borderColor: `${card.accent}CC`,
                  boxShadow: `0 0 28px ${card.accent}88, 0 0 64px ${card.accent}40`,
                }}
              >
                <SharpPathImage
                  webp={card.webp}
                  png={card.png}
                  mp4={card.mp4}
                  width={card.width}
                  height={card.height}
                  alt={`${card.title}. ${card.tagline}.`}
                  fillFrame
                />
                <span
                  className="pointer-events-none absolute inset-x-0 bottom-0 z-30 px-1 py-2 text-center text-[10px] font-black uppercase tracking-wider text-white sm:py-3 sm:text-base"
                  style={{
                    background: 'linear-gradient(to top, rgba(0,0,0,0.94) 45%, rgba(0,0,0,0))',
                    color: card.accent,
                    textShadow: `0 0 10px ${card.accent}`,
                  }}
                >
                  {card.id}
                </span>
                <button
                  type="button"
                  onClick={() => onChoosePath(card.id)}
                  className="absolute inset-0 z-20 cursor-pointer bg-transparent"
                  aria-label={`Private Login to open ${card.title}`}
                />
              </div>
            </li>
          ))}
        </ul>

        <div
          className="relative z-10 mt-8 sm:mt-12 isolate"
          data-learning-philosophy=""
        >
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,14rem)_1fr] lg:grid-cols-[minmax(0,16rem)_1fr] gap-6 sm:gap-8 items-start rounded-2xl border border-[#FF1493]/35 bg-black/70 p-4 sm:p-6 lg:p-8">
            <figure className="m-0 mx-auto md:mx-0 w-full max-w-[14rem] lg:max-w-[16rem]">
              <img
                src={LEARNING_PHILOSOPHY.photo}
                alt={LEARNING_PHILOSOPHY.photoAlt}
                width={LEARNING_PHILOSOPHY.photoWidth}
                height={LEARNING_PHILOSOPHY.photoHeight}
                decoding="async"
                className="w-full h-auto rounded-xl object-cover object-top border border-white/15"
              />
              <figcaption className="mt-3 text-center md:text-left space-y-1">
                <span className="block text-[10px] font-mono font-bold uppercase tracking-[0.22em] text-[#FF1493]">
                  {LEARNING_PHILOSOPHY.role}
                </span>
                <span className="block text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                  {LEARNING_PHILOSOPHY.roleLine}
                </span>
              </figcaption>
            </figure>

            <div className="min-w-0 flex flex-col gap-4">
              <h3 className="text-lg sm:text-2xl font-black tracking-tight text-white font-sans">
                {LEARNING_PHILOSOPHY.title}
              </h3>
              {LEARNING_PHILOSOPHY.paragraphs.map((paragraph) => (
                <p
                  key={paragraph.slice(0, 48)}
                  className="text-sm sm:text-base leading-relaxed text-zinc-300 font-sans"
                >
                  {paragraph}
                </p>
              ))}

              <blockquote
                data-board-quote="sarah-weber"
                className="mt-2 border-l-2 border-[#FFD700]/70 pl-4 sm:pl-5 space-y-3"
              >
                <p className="text-sm sm:text-base leading-relaxed text-zinc-200 font-sans italic">
                  “{LEARNING_PHILOSOPHY.quote.text}”
                </p>
                <footer className="not-italic">
                  <cite className="not-italic block text-[11px] font-mono font-bold uppercase tracking-[0.18em] text-[#FFD700]">
                    — {LEARNING_PHILOSOPHY.quote.attribution}
                  </cite>
                  <span className="block mt-1 text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                    {LEARNING_PHILOSOPHY.quote.attributionLine}
                  </span>
                </footer>
              </blockquote>

              <div className="pt-1 flex flex-wrap gap-3">
                <button
                  type="button"
                  data-path-card="neurodivergent"
                  onClick={() => onChoosePath('neurodivergent')}
                  className="inline-flex items-center justify-center rounded-xl border border-[#00FFFF]/50 bg-[#00FFFF]/10 px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.18em] text-[#7FE9FF] hover:bg-[#00FFFF]/20 transition-colors cursor-pointer"
                  aria-label="Private Login to open Neurodivergent Traders"
                >
                  Open Neurodivergent Traders
                </button>
                <a
                  href="/meet-the-board#sarah-weber"
                  className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-300 hover:border-[#FFD700]/50 hover:text-[#FFD700] transition-colors"
                >
                  Meet the Board
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
