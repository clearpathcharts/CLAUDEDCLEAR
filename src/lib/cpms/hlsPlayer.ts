/** True when the URL points at an HLS manifest (.m3u8). */
export function isHlsStream(url: string): boolean {
  return /\.m3u8(\?|#|$)/i.test(url);
}

export interface BindVideoSourceOptions {
  autoPlay?: boolean;
  onReady?: () => void;
  onError?: (message: string) => void;
}

/**
 * Binds a stream URL to a video element. Uses hls.js for .m3u8 manifests,
 * native HLS on Safari, or progressive MP4 otherwise. Returns a cleanup fn.
 */
export function bindVideoSource(
  video: HTMLVideoElement,
  url: string,
  options: BindVideoSourceOptions = {}
): () => void {
  const { autoPlay = true, onReady, onError } = options;
  let hls: import('hls.js').default | null = null;
  let cancelled = false;

  const cleanupListeners: Array<() => void> = [];

  const addOnce = (event: keyof HTMLMediaElementEventMap, handler: () => void) => {
    const wrapped = () => {
      if (cancelled) return;
      handler();
    };
    video.addEventListener(event, wrapped, { once: true });
    cleanupListeners.push(() => video.removeEventListener(event, wrapped));
  };

  const ready = () => {
    if (cancelled) return;
    onReady?.();
    if (autoPlay) {
      video.play().catch(() => {});
    }
  };

  video.pause();
  video.removeAttribute('src');
  video.load();

  if (isHlsStream(url) && video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = url;
    addOnce('loadedmetadata', ready);
  } else if (isHlsStream(url)) {
    // Keep the 400KB HLS runtime off the initial app path. Most explainer clips
    // are progressive MP4, so browsers only fetch hls.js when an HLS URL plays.
    void import('hls.js')
      .then(({ default: Hls }) => {
        if (cancelled) return;
        if (!Hls.isSupported()) {
          onError?.('HLS playback is not supported in this browser');
          return;
        }
        hls = new Hls({ enableWorker: true, lowLatencyMode: true });
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, ready);
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (cancelled || !data.fatal) return;
          onError?.(data.type ?? 'HLS fatal error');
        });
      })
      .catch(() => {
        if (!cancelled) onError?.('HLS player failed to load');
      });
  } else {
    video.src = url;
    addOnce('loadedmetadata', ready);
  }

  return () => {
    cancelled = true;
    cleanupListeners.forEach((fn) => fn());
    if (hls) {
      hls.destroy();
      hls = null;
    }
    video.pause();
    video.removeAttribute('src');
    video.load();
  };
}
