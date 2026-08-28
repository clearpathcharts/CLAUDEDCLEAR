import React from 'react';
import { PATH_CARDS, NEURODIVERGENT_BANNER } from '../content/chooseYourPath';
import type { AdvancedProfileId } from '../lib/advanced/profiles';

type Props = {
  onEnterUi: (profileId: AdvancedProfileId) => void;
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

export default function ChooseYourPath({ onEnterUi }: Props) {
  return (
    <section
      id="choose-path"
      className="relative py-20 sm:py-24 border-y border-zinc-900/60 z-20 scroll-mt-28"
      aria-labelledby="choose-path-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <header className="text-center space-y-4 mb-12 sm:mb-16">
          <p className="font-mono text-[10px] sm:text-xs text-[#00FFFF] font-black uppercase tracking-[0.28em]">
            Welcome
          </p>
          <h2
            id="choose-path-heading"
            className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-white uppercase leading-tight font-sans"
          >
            Welcome to ClearPathTrader.com
          </h2>
          <p className="text-lg sm:text-2xl md:text-3xl font-black uppercase tracking-widest text-[#00FFFF] text-neon-glow">
            Please choose your path
          </p>
        </header>

        <ul className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-start justify-items-center">
          {PATH_CARDS.map((card) => (
            <li key={card.id} className="w-full flex justify-center">
              <button
                type="button"
                onClick={() => onEnterUi(card.profileId)}
                className="group w-full max-w-full rounded-2xl overflow-hidden border bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 cursor-pointer"
                style={{
                  maxWidth: `${card.width}px`,
                  borderColor: `${card.accent}66`,
                  boxShadow: `0 0 24px ${card.accent}22`,
                }}
                aria-label={`${card.title}. ${card.tagline}. ${card.cta}.`}
              >
                <SharpPathImage
                  webp={card.webp}
                  png={card.png}
                  width={card.width}
                  height={card.height}
                  alt=""
                />
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-12 sm:mt-16 flex justify-center">
          <a
            href={NEURODIVERGENT_BANNER.href}
            className="block w-full rounded-2xl overflow-hidden border border-[#FF1493]/40 hover:border-[#00FFFF]/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00FFFF]"
            style={{ maxWidth: `${NEURODIVERGENT_BANNER.width}px` }}
          >
            <SharpPathImage
              webp={NEURODIVERGENT_BANNER.webp}
              png={NEURODIVERGENT_BANNER.png}
              width={NEURODIVERGENT_BANNER.width}
              height={NEURODIVERGENT_BANNER.height}
              alt={NEURODIVERGENT_BANNER.alt}
            />
          </a>
        </div>
      </div>
    </section>
  );
}
