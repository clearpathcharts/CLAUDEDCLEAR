import React, { useState, memo } from 'react';

function UnrestrictedMediaDeck() {
  const [activeFeed, setActiveFeed] = useState<string | null>(null);

  // You can easily swap these out later for any specific Twitch or Vimeo channel you want
  const TWITCH_CHANNEL = "coindesk"; // Heavy crypto news channel on Twitch
  const VIMEO_VIDEO_ID = "336812660"; // Institutional financial placeholder on Vimeo

  return (
    <div className="w-full p-6 bg-[#050505] border-2 border-[#00FFFF] rounded-xl mt-8 shadow-[0_0_20px_#4B0082]">
      <h2 className="text-[#FF4500] text-center text-3xl font-extrabold uppercase mb-8 drop-shadow-[0_0_8px_#FF4500] tracking-widest">
        Unrestricted Markets Network
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">

        {/* TWITCH LIVE FACADE */}
        <div className="border border-[#4B0082] rounded-lg overflow-hidden shadow-[0_0_15px_#4B0082] bg-black flex flex-col h-[400px]">
          <div className="bg-[#111111] p-3 border-b border-[#4B0082]">
            <h3 className="text-[#00FFFF] font-bold text-center tracking-wide uppercase">Live Twitch Terminal</h3>
          </div>
          <div className="w-full h-full flex items-center justify-center relative bg-black">
            {activeFeed === 'twitch' ? (
              <iframe
                className="w-full h-full"
                // The parent=clearpathtrader.com ensures it works live on your domain
                src={`https://player.twitch.tv/?channel=${TWITCH_CHANNEL}&parent=localhost&parent=clearpathtrader.com`}
                title="Twitch Live Stream"
                frameBorder="0"
                allowFullScreen
              ></iframe>
            ) : (
              <div
                onClick={() => setActiveFeed('twitch')}
                className="cursor-pointer w-full h-full flex flex-col items-center justify-center group bg-[#0a0a0a] hover:bg-[#111] transition-colors duration-300"
              >
                <div className="w-24 h-24 bg-[#9146FF] rounded-full flex items-center justify-center mb-6 shadow-[0_0_20px_#9146FF] group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white font-extrabold text-4xl">T</span>
                </div>
                <div className="bg-[#FF4500] text-white px-6 py-2 rounded-full font-bold uppercase tracking-wider shadow-[0_0_15px_#FF4500]">
                  Load Live Stream
                </div>
              </div>
            )}
          </div>
        </div>

        {/* VIMEO PRO FACADE */}
        <div className="border border-[#4B0082] rounded-lg overflow-hidden shadow-[0_0_15px_#4B0082] bg-black flex flex-col h-[400px]">
          <div className="bg-[#111111] p-3 border-b border-[#4B0082]">
            <h3 className="text-[#00FFFF] font-bold text-center tracking-wide uppercase">Vimeo Pro Terminal</h3>
          </div>
          <div className="w-full h-full flex items-center justify-center relative bg-black">
            {activeFeed === 'vimeo' ? (
              <iframe
                className="w-full h-full"
                src={`https://player.vimeo.com/video/${VIMEO_VIDEO_ID}?autoplay=1`}
                title="Vimeo Video"
                frameBorder="0"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              ></iframe>
            ) : (
              <div
                onClick={() => setActiveFeed('vimeo')}
                className="cursor-pointer w-full h-full flex flex-col items-center justify-center group bg-[#0a0a0a] hover:bg-[#111] transition-colors duration-300"
              >
                <div className="w-24 h-24 bg-[#1AB7EA] rounded-full flex items-center justify-center mb-6 shadow-[0_0_20px_#1AB7EA] group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white font-extrabold text-4xl">V</span>
                </div>
                <div className="bg-[#00FFFF] text-black px-6 py-2 rounded-full font-bold uppercase tracking-wider shadow-[0_0_15px_#00FFFF]">
                  Load Video
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default memo(UnrestrictedMediaDeck);
