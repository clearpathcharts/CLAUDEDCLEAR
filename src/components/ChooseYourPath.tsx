import React from 'react';
import { PATH_CARDS, NEURODIVERGENT_BANNER } from '../content/chooseYourPath';
import type { AdvancedProfileId } from '../lib/advanced/profiles';

type Props = {
  onEnter: (profileId: AdvancedProfileId) => void;
  onLogin: (profileId: AdvancedProfileId) => void;
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

function PathActions({
  accent,
  onEnter,
  onLogin,
}: {
  accent: string;
  onEnter: () => void;
  onLogin: () => void;
}) {
  return (
    <div className="flex items-center justify-center gap-3 mb-3 w-full">
      <button
        type="button"
        onClick={onEnter}
        className="flex-1 max-w-[9.5rem] px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer border"
        style={{
          color: accent,
          borderColor: `${accent}99`,
          background: `${accent}14`,
        }}
      >
        Enter
      </button>
      <button
        type="button"
        onClick={onLogin}
        className="flex-1 max-w-[9.5rem] px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer border border-white/25 bg-white/5 text-white hover:bg-white/10"
      >
        Login
      </button>
    </div>
  );
}

export default function ChooseYourPath({ onEnter, onLogin }: Props) {
  return (
    <section
      id="choose-path"
      className="relative py-12 sm:py-16 border-b border-zinc-900/60 z-20 scroll-mt-28"
      aria-labelledby="choose-path-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <h2
          id="choose-path-heading"
          className="text-center text-xl sm:text-3xl md:text-4xl font-black tracking-tight text-white uppercase leading-snug font-sans mb-8 sm:mb-10"
        >
          Welcome to ClearPath Trader Please choose your path
        </h2>

        <ul className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10 items-start justify-items-center">
          {PATH_CARDS.map((card) => (
            <li
              key={card.id}
              className="w-full flex flex-col items-center"
              style={{ maxWidth: `${card.width}px` }}
            >
              <PathActions
                accent={card.accent}
                onEnter={() => onEnter(card.profileId)}
                onLogin={() => onLogin(card.profileId)}
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

        <div
          className="mt-10 sm:mt-14 mx-auto flex flex-col items-center"
          style={{ maxWidth: `${NEURODIVERGENT_BANNER.width}px` }}
        >
          <PathActions
            accent="#FF1493"
            onEnter={() => onEnter(NEURODIVERGENT_BANNER.profileId)}
            onLogin={() => onLogin(NEURODIVERGENT_BANNER.profileId)}
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
    </section>
  );
}
