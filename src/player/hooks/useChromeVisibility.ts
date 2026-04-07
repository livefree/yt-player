import { useCallback, useEffect, useRef, useState } from "react";
import { CHROME_HIDE_DELAY, IMMERSIVE_HIDE_DELAY } from "../utils/format";
import type { ChromePolicy } from "./useLayoutDecision";

interface UseChromeVisibilityParams {
  chromePolicy: ChromePolicy;
  isImmersive: boolean;
  isPlaying: boolean;
  openPanel: string | null;
  isEpisodesOpen: boolean;
  keepControlsVisible: boolean;
}

export function useChromeVisibility({
  chromePolicy,
  isImmersive,
  isPlaying,
  openPanel,
  isEpisodesOpen,
  keepControlsVisible,
}: UseChromeVisibilityParams) {
  const [chromeVisible, setChromeVisible] = useState(true);
  const [cursorHidden, setCursorHidden] = useState(false);
  const chromeTimerRef = useRef<number | null>(null);

  const revealChrome = useCallback(() => {
    setChromeVisible(true);
    setCursorHidden(false);
    if (keepControlsVisible) return;
    if (chromeTimerRef.current) window.clearTimeout(chromeTimerRef.current);
    chromeTimerRef.current = window.setTimeout(
      () => {
        if (openPanel || isEpisodesOpen) return;
        setChromeVisible(false);
        if (isImmersive) setCursorHidden(true);
      },
      isImmersive ? IMMERSIVE_HIDE_DELAY : CHROME_HIDE_DELAY,
    );
  }, [isEpisodesOpen, isImmersive, keepControlsVisible, openPanel]);

  useEffect(() => {
    if (openPanel || isEpisodesOpen) {
      setChromeVisible(true);
      setCursorHidden(false);
      if (chromeTimerRef.current) window.clearTimeout(chromeTimerRef.current);
    } else if (keepControlsVisible) {
      setChromeVisible(true);
      setCursorHidden(false);
      if (chromeTimerRef.current) window.clearTimeout(chromeTimerRef.current);
    } else if (chromePolicy === "touch-persistent-paused" && !isPlaying) {
      setChromeVisible(true);
      setCursorHidden(false);
      if (chromeTimerRef.current) window.clearTimeout(chromeTimerRef.current);
    } else {
      revealChrome();
    }
  }, [chromePolicy, isEpisodesOpen, isPlaying, keepControlsVisible, openPanel, revealChrome]);

  return { chromeVisible, cursorHidden, revealChrome };
}
