import React from 'react';
import { PATH_CARDS, NEURODIVERGENT_BANNER } from '../content/chooseYourPath';
import type { TraderDeskId } from '../lib/traderDesks';

type Props = {
  onEnter: (deskId: TraderDeskId) => void;
};

/** Native-pixel images — never CSS-upscale past width/height. */
function SharpPathImage({
  webp,
  png,
  width,
  height,
  alt,
}: {
  webp: string;
  png: string;
  width: number;
  height: number;
  alt: string;
}) {
  return (
    <picture>
      <source type="image/webp" srcSet={webp} />
      <img
        src={png}
        alt={alt}
        width={width}
        height={height}
        decoding="async"
        draggable={false}
        className="pointer-events-none block h-auto w-full"
        style={{
          maxWidth: `${width}px`,
          imageRendering: 'auto',
        }}
      />
    </picture>
  );
}

function PathEnter({
  accent,
  deskId,
  onEnter,
}: {
  accent: string;
  deskId: TraderDeskId;
  onEnter: () => void;
}) {
  return (
    <button
      type="button"
      data-path-enter={deskId}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onEnter();
      }}
      className="relative z-10 mb-2 sm:mb-3 w-full max-w-[12rem] px-2 sm:px-4 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest cursor-pointer border"
      style={{
        color: accent,
        borderColor: `${accent}99`,
        background: `${accent}14`,
      }}
    >
      Enter
    </button>
  );
}

export default function ChooseYourPath({ onEnter }: Props) {
  return (
    <section
      id="choose-path"
      className="relative py-12 sm:py-16 border-b border-zinc-900/60 z-20 scroll-mt-28"
      aria-labelledby="choose-path-heading"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-8">
        <h2
          id="choose-path-heading"
          className="text-center text-xl sm:text-3xl md:text-4xl font-black tracking-tight text-white uppercase leading-snug font-sans mb-8 sm:mb-10"
        >
          Welcome to ClearPath Trader Please choose your path
        </h2>

        <ul className="relative z-20 grid grid-cols-3 gap-2 sm:gap-5 lg:gap-8 items-start isolate">
          {PATH_CARDS.map((card) => (
            <li key={card.id} className="relative z-10 min-w-0 w-full flex flex-col items-center">
              <PathEnter
                accent={card.accent}
                deskId={card.id}
                onEnter={() => onEnter(card.id)}
              />
              <button
                type="button"
                data-path-card={card.id}
                onClick={() => onEnter(card.id)}
                className="w-full rounded-2xl overflow-hidden border bg-black/80 text-left cursor-pointer"
                style={{
                  borderColor: `${card.accent}66`,
                  boxShadow: `0 0 24px ${card.accent}22`,
                }}
                aria-label={`Enter ${card.title}`}
              >
                <SharpPathImage
                  webp={card.webp}
                  png={card.png}
                  width={card.width}
                  height={card.height}
                  alt={`${card.title}. ${card.tagline}.`}
                />
              </button>
            </li>
          ))}
        </ul>

        <div className="relative z-10 mt-8 sm:mt-12 flex justify-center isolate">
          <div className="w-[min(100%,42rem)] md:w-[min(100%,48rem)] flex flex-col items-center">
            <PathEnter
              accent="#FF1493"
              deskId="neurodivergent"
              onEnter={() => onEnter('neurodivergent')}
            />
            <button
              type="button"
              data-path-card="neurodivergent"
              onClick={() => onEnter('neurodivergent')}
              className="w-full rounded-2xl overflow-hidden border border-[#FF1493]/40 text-left cursor-pointer"
              aria-label="Enter Neurodivergent Traders"
            >
              <SharpPathImage
                webp={NEURODIVERGENT_BANNER.webp}
                png={NEURODIVERGENT_BANNER.png}
                width={NEURODIVERGENT_BANNER.width}
                height={NEURODIVERGENT_BANNER.height}
                alt={NEURODIVERGENT_BANNER.alt}
              />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
