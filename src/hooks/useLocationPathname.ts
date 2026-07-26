import { useEffect, useState } from "react";

const LOCATION_EVENT = "clearpath-location";

/** Notify SPA listeners after programmatic history changes. */
export function notifyLocationChange(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(LOCATION_EVENT));
  // Also fire popstate so existing listeners (Encyclopedia, Dashboard) stay in sync
  window.dispatchEvent(new Event("popstate"));
}

/**
 * pushState + notify so React views refresh on in-app page clicks.
 * Native pushState does not fire popstate by itself.
 */
export function navigatePath(path: string, state: object = {}): void {
  if (typeof window === "undefined") return;
  window.history.pushState(state, "", path);
  notifyLocationChange();
}

/** Reactive pathname for client-side encyclopedia / SPA routes. */
export function useLocationPathname(): string {
  const [pathname, setPathname] = useState(() =>
    typeof window !== "undefined" ? window.location.pathname : "/"
  );

  useEffect(() => {
    const sync = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", sync);
    window.addEventListener(LOCATION_EVENT, sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener(LOCATION_EVENT, sync);
    };
  }, []);

  return pathname;
}
