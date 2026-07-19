import React, { Suspense, lazy, useState } from 'react';
import { MediaTile } from './MediaTile';
import { FacebookIntel } from './FacebookIntel';
import { InstagramSignals } from './InstagramSignals';
import { CarAndDriverFeed } from './CarAndDriverFeed';
import { Globe } from 'lucide-react';

// Lazy load the Bloomberg Live Component for performance optimization
const BloombergLive = lazy(() => import('./BloombergLive'));

const BloombergFallback = () => (
  <div className="h-[200px] bg-zinc-950/60 rounded-xl border border-white/5 flex items-center justify-center p-4">
    <div className="flex flex-col items-center gap-2 text-zinc-500 font-mono text-[10px] uppercase">
      <div className="w-1.5 h-1.5 rounded-full bg-[#ff1493] animate-ping" />
      <span>SYNCING TV DECK FEED...</span>
    </div>
  </div>
);

interface MediaGridProps {
  onConfigureYwc?: () => void;
}

export const MediaGrid: React.FC<MediaGridProps> = React.memo(({ onConfigureYwc }) => {
  const [activeTab, setActiveTab] = useState<'facebook' | 'instagram'>('facebook');

  return (
    <div className="space-y-6 w-full flex flex-col h-auto">
      {/* Title block of the Grid */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-4">
        <div className="space-y-1">
          {/* h3 under Auth ecosystem h2 so tile titles can be h4 without skipping levels */}
          <h3 className="text-lg md:text-xl font-black font-serif italic flex items-center gap-2 uppercase tracking-tight" style={{ color: 'var(--cpt-pink)' }}>
            <Globe size={18} style={{ color: 'var(--cpt-pink)' }} />
            YOUR WORLD CONNECTED™ — PREMIUM MEDIA HUB
          </h3>
          <p className="text-[10px] md:text-xs text-zinc-400 font-sans leading-normal mt-1 max-w-2xl">
            Trading on a phone means waiting for every site to load — social, video, magazines, then hunting for your chart again. Your World Connected™ puts social media, online video, and your favorite reads (fashion, cars, and more) next to a movable live chart on the same screen so you can watch both without tab-hopping.
          </p>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          {onConfigureYwc && (
            <button
              type="button"
              onClick={onConfigureYwc}
              className="py-1 px-3 bg-[#ff1493]/10 hover:bg-[#ff1493] text-[#ff1493] hover:text-white border border-[#ff1493]/35 rounded-xl font-mono text-[9px] font-black uppercase tracking-widest transition-all duration-300 cursor-pointer"
            >
              Curation Settings
            </button>
          )}
          <span className="font-mono text-[9px] bg-purple-950/25 text-[#B026FF] border border-[#B026FF]/20 px-2.5 py-1 rounded-full uppercase font-black tracking-widest">
            LIVE BROADCAST SYNCED
          </span>
        </div>
      </div>

      {/* Exploded layout instead of 3-Card Grid */}
      <div className="flex flex-col gap-6 w-full items-stretch">
        
        {/* Card 1: Sovereign Communities (Facebook / Instagram Toggled) */}
        <MediaTile id="communities-tile">
          <div className="flex flex-col h-auto justify-start gap-4">
            {/* Elegant, high-end Segmented Segment Swapper for Social Channels */}
            <div
              role="tablist"
              aria-label="Social channel"
              className="flex items-center justify-between p-1 bg-black/60 rounded-xl border border-white/5 shadow-inner"
            >
              <button
                type="button"
                role="tab"
                id="media-tab-facebook"
                aria-selected={activeTab === 'facebook'}
                aria-controls="media-panel-social"
                tabIndex={activeTab === 'facebook' ? 0 : -1}
                onClick={() => setActiveTab('facebook')}
                className={`flex-1 py-1 px-3.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all duration-300 cursor-pointer text-center ${
                  activeTab === 'facebook'
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-extrabold shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
                }`}
              >
                Facebook Intel
              </button>
              <button
                type="button"
                role="tab"
                id="media-tab-instagram"
                aria-selected={activeTab === 'instagram'}
                aria-controls="media-panel-social"
                tabIndex={activeTab === 'instagram' ? 0 : -1}
                onClick={() => setActiveTab('instagram')}
                className={`flex-1 py-1 px-3.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all duration-300 cursor-pointer text-center ${
                  activeTab === 'instagram'
                    ? 'bg-pink-600/20 text-pink-400 border border-[#ff1493]/30 font-extrabold shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
                }`}
              >
                Instagram Signals
              </button>
            </div>

            {/* Render the selected community component */}
            <div
              id="media-panel-social"
              role="tabpanel"
              aria-labelledby={activeTab === 'facebook' ? 'media-tab-facebook' : 'media-tab-instagram'}
              className="flex-1 flex flex-col justify-start"
            >
              {activeTab === 'facebook' ? <FacebookIntel /> : <InstagramSignals />}
            </div>
          </div>
        </MediaTile>

        {/* Card 2: Bloomberg Live TV Broadcast */}
        <MediaTile id="bloomberg-tv-tile">
          <Suspense fallback={<BloombergFallback />}>
            <BloombergLive />
          </Suspense>
        </MediaTile>

        {/* Card 3: Car & Driver Luxury Drivetrains */}
        <MediaTile id="car-driver-tile">
          <CarAndDriverFeed />
        </MediaTile>

      </div>
    </div>
  );
});

MediaGrid.displayName = 'MediaGrid';
export default MediaGrid;
