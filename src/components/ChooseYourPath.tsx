import React from 'react';
import { PATH_CARDS, NEURODIVERGENT_BANNER } from '../content/chooseYourPath';
import type { AdvancedProfileId } from '../lib/advanced/profiles';

type Props = {
  onEnter: (profileId: AdvancedProfileId) => void;
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
        className="block h-auto w-full"
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
  onEnter,
}: {
  accent: string;
  onEnter: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onEnter}
      className="mb-2 sm:mb-3 w-full max-w-[12rem] px-2 sm:px-4 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest cursor-pointer border"
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

        <ul className="grid grid-cols-3 gap-2 sm:gap-5 lg:gap-8 items-start">
          {PATH_CARDS.map((card) => (
            <li key={card.id} className="min-w-0 w-full flex flex-col items-center">
              <PathEnter
                accent={card.accent}
                onEnter={() => onEnter(card.profileId)}
              />
              <div
                className="w-full rounded-2xl overflow-hidden border bg-black/80"
                style={{
                  borderColor: `${card.accent}66`,
                  boxShadow: `0 0 24px ${card.accent}22`,
                }}
              >
                <SharpPathImage
                  webp={card.webp}
                  png={card.png}
                  width={card.width}
                  height={card.height}
                  alt={`${card.title}. ${card.tagline}.`}
                />
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-8 sm:mt-12 flex justify-center">
          <div className="w-[min(100%,42rem)] md:w-[min(100%,48rem)] flex flex-col items-center">
            <PathEnter
              accent="#FF1493"
              onEnter={() => onEnter(NEURODIVERGENT_BANNER.profileId)}
            />
            <div className="w-full rounded-2xl overflow-hidden border border-[#FF1493]/40">
              <SharpPathImage
                webp={NEURODIVERGENT_BANNER.webp}
                png={NEURODIVERGENT_BANNER.png}
                width={NEURODIVERGENT_BANNER.width}
                height={NEURODIVERGENT_BANNER.height}
                alt={NEURODIVERGENT_BANNER.alt}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
