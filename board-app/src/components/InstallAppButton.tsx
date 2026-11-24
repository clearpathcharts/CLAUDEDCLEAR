"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * Footer CTA: add / download Clear Path Trader to the phone (PWA install).
 * Chromium: native beforeinstallprompt. iOS Safari: Share → Add to Home Screen tip.
 */
export function InstallAppButton() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [iosHint, setIosHint] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    if (standalone) {
      setInstalled(true);
      return;
    }

    const ua = navigator.userAgent;
    const isIos = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|Chrome|Chromium/.test(ua);
    if (isIos) setIosHint(true);

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
      setNote(null);
    };
    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("appinstalled", onInstalled);
    if (isIos && isSafari) {
      /* tip ready */
    }
    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) {
    return (
      <p className="install-app-status" role="status">
        Installed on this device
      </p>
    );
  }

  const onClick = async () => {
    if (deferred) {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      setDeferred(null);
      if (choice.outcome === "accepted") setInstalled(true);
      return;
    }
    if (iosHint) {
      setNote("On iPhone: tap Share → Add to Home Screen.");
      return;
    }
    setNote("Use your browser menu → Install app / Add to Home screen.");
  };

  return (
    <div className="install-app">
      <button type="button" className="install-app-btn" onClick={() => void onClick()}>
        ADD AS DOWNLOAD TO YOUR PHONE
      </button>
      {note ? <p className="install-app-hint">{note}</p> : null}
    </div>
  );
}
