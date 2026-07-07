/** Bundled CPMS IPTV paths (copied to dist/tv/ on build). */
export const CPMS_TV_HOME = '/tv/index.html';
export const CPMS_TV_PLAYER = '/tv/player.html';

/** Navigate to the standalone CPMS TV IPTV shell (news/live HLS channels). */
export function openCpmsTv(target: 'home' | 'player' = 'home'): void {
  const url = target === 'player' ? CPMS_TV_PLAYER : CPMS_TV_HOME;
  window.location.assign(url);
}
