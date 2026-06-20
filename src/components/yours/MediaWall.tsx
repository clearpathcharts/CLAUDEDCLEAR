import React from "react";
import SocialPanel from "./SocialPanel";

interface Props {
  socials: Record<string, any> | null | undefined;
}

export default function MediaWall({
  socials
}: Props) {
  if (!socials) {
    return (
      <div className="text-center py-12 text-sm text-gray-500 font-mono">
        No active social connections.
      </div>
    );
  }

  // Filter out null, undefined, or empty URLs
  const activeEntries = Object.entries(socials).filter(([_, url]) => {
    return typeof url === "string" && url.trim().length > 0;
  });

  if (activeEntries.length === 0) {
    return (
      <div className="text-center py-20 bg-white/5 border border-white/10 rounded-[28px] p-8 backdrop-blur-md">
        <div className="text-4xl mb-4 select-none">🌐</div>
        <h3 className="text-lg font-orbitron font-bold text-white mb-2 uppercase tracking-wider">No Connected Channels</h3>
        <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
          Configure external streams (Website, Youtube, Twitter, LinkedIn, etc.) inside your Profile Tab to unlock your Live Media Wall.
        </p>
      </div>
    );
  }

  return (
    <div
      className="
        grid
        grid-cols-1
        sm:grid-cols-2
        lg:grid-cols-3
        gap-6
      "
    >
      {activeEntries.map(
        ([platform, url]) => (
          <SocialPanel
            key={platform}
            platform={platform}
            url={url as string}
          />
        )
      )}
    </div>
  );
}
