import React from 'react';
import { PATH_CARDS, NEURODIVERGENT_BANNER } from '../content/chooseYourPath';
import type { TraderDeskId } from '../lib/traderDesks';

type Props = {
  onChoosePath: (deskId: TraderDeskId) => void;
};

/** Path cards share one tall frame. Banner stays native-width. */
function SharpPathImage({
  webp,
  png,
  width,
  height,
  alt,
  fillFrame = false,
}: {
  webp: string;
  png: string;
  width: number;
  height: number;
  alt: string;
  fillFrame?: boolean;
}) {
  return (
    <picture className={fillFrame ? 'block h-full w-full' : undefined}>
      <source type="image/webp" srcSet={webp} />
      <img
        src={png}
        alt={alt}
        width={width}
        height={height}
        decoding="async"
        draggable={false}
        className={
          fillFrame
            ? 'pointer-events-none block h-full w-full object-cover object-top cp-path-art'
            : 'pointer-events-none block h-auto w-full cp-path-art'
        }
        style={{
          maxWidth: fillFrame ? '100%' : `${width}px`,
          imageRendering: 'auto',
        }}
      />
    </picture>
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
              <button
                type="button"
                data-path-card={card.id}
                onClick={() => onChoosePath(card.id)}
                className="cp-path-card block w-full aspect-[533/735] rounded-2xl overflow-hidden border bg-black text-left cursor-pointer"
                style={{
                  borderColor: `${card.accent}CC`,
                  boxShadow: `0 0 28px ${card.accent}88, 0 0 64px ${card.accent}40`,
                }}
                aria-label={`Private Login to open ${card.title}`}
              >
                <SharpPathImage
                  webp={card.webp}
                  png={card.png}
                  width={card.width}
                  height={card.height}
                  alt={`${card.title}. ${card.tagline}.`}
                  fillFrame
                />
              </button>
            </li>
          ))}
        </ul>

        <div className="relative z-10 mt-8 sm:mt-12 flex justify-center isolate">
          <div className="w-[min(100%,42rem)] md:w-[min(100%,48rem)] flex flex-col items-center">
            <button
              type="button"
              data-path-card="neurodivergent"
              onClick={() => onChoosePath('neurodivergent')}
              className="cp-path-card w-full rounded-2xl overflow-hidden border border-[#FF1493]/80 text-left cursor-pointer"
              style={{ boxShadow: '0 0 32px rgba(255,20,147,0.45), 0 0 72px rgba(0,229,255,0.22)' }}
              aria-label="Private Login to open Neurodivergent Traders"
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
