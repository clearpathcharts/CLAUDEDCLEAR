import React from 'react';

interface MediaTileProps {
  id: string;
  children: React.ReactNode;
}

export const MediaTile: React.FC<MediaTileProps> = React.memo(({
  id,
  children
}) => {
  return (
    <div
      id={id}
      className="group relative flex flex-col justify-between p-5 md:p-6 rounded-[24px] overflow-hidden select-text transition-all duration-300 ease-out transform hover:-translate-y-1 w-full h-auto bg-neutral-950/90 border border-purple-500/30 hover:border-cyan-400/50 shadow-[0_0_25px_rgba(138,43,226,0.12)] hover:shadow-[0_0_35px_rgba(0,255,255,0.22)] backdrop-blur-xl"
    >
      {/* Background elegant floating gradient */}
      <div className="absolute -top-16 -right-16 w-32 h-32 bg-[#ff1493]/5 rounded-full blur-3xl group-hover:bg-[#00ffff]/10 transition-all duration-500 pointer-events-none" />
      
      {/* Inner Area */}
      <div className="relative z-10 flex flex-col h-auto justify-start gap-4">
        {children}
      </div>
    </div>
  );
});

MediaTile.displayName = 'MediaTile';
export default MediaTile;
