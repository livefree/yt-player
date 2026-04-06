import { useEffect, useMemo, useState, type RefObject } from "react";

type LayoutMode =
  | "desktop-default"
  | "desktop-compact"
  | "mobile-portrait"
  | "mobile-landscape"
  | "fullscreen-immersive";

type ControlId =
  | "title"
  | "play"
  | "next"
  | "episodes"
  | "volume"
  | "time"
  | "chapter"
  | "subtitles"
  | "settings"
  | "theater"
  | "airplay"
  | "pip"
  | "fullscreen";

type ControlSlot =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "center-overlay"
  | "edge-left"
  | "edge-right";

export type PanelPlacement = "bottom-left" | "bottom-right" | "top-right";

type UseLayoutDecisionParams = {
  hasEpisodes: boolean;
  hasNext: boolean;
  isFullscreen: boolean;
  isTheater: boolean;
  playerRef: RefObject<HTMLDivElement>;
};

export type LayoutDecision = {
  compactPanels: boolean;
  hiddenControls: ControlId[];
  mode: LayoutMode;
  placements: {
    episodesPanel: PanelPlacement;
    settingsPanel: PanelPlacement;
  };
  slots: Record<ControlSlot, ControlId[]>;
};

const DESKTOP_COMPACT_WIDTH = 640;

function createDesktopDefaultSlots(hasEpisodes: boolean, hasNext: boolean) {
  const bottomLeft: ControlId[] = ["play"];
  if (hasNext) bottomLeft.push("next");
  if (hasEpisodes) bottomLeft.push("episodes");
  bottomLeft.push("volume", "time", "chapter");

  return {
    "top-left": ["title"],
    "top-right": [],
    "bottom-left": bottomLeft,
    "bottom-right": ["subtitles", "settings", "theater", "airplay", "pip", "fullscreen"],
    "center-overlay": [],
    "edge-left": [],
    "edge-right": [],
  } satisfies Record<ControlSlot, ControlId[]>;
}

function createDesktopCompactSlots(hasEpisodes: boolean, hasNext: boolean) {
  const topRight: ControlId[] = ["settings"];
  if (hasEpisodes) topRight.push("episodes");

  const bottomLeft: ControlId[] = ["play"];
  if (hasNext) bottomLeft.push("next");
  bottomLeft.push("time", "chapter");

  return {
    "top-left": ["title"],
    "top-right": topRight,
    "bottom-left": bottomLeft,
    "bottom-right": ["subtitles", "airplay", "pip", "fullscreen", "theater"],
    "center-overlay": [],
    "edge-left": [],
    "edge-right": [],
  } satisfies Record<ControlSlot, ControlId[]>;
}

function createMobileSlots(hasNext: boolean) {
  const bottomLeft: ControlId[] = ["play"];
  if (hasNext) bottomLeft.push("next");
  bottomLeft.push("time");

  return {
    "top-left": ["title"],
    "top-right": ["settings", "subtitles"],
    "bottom-left": bottomLeft,
    "bottom-right": ["airplay", "pip", "fullscreen"],
    "center-overlay": [],
    "edge-left": [],
    "edge-right": [],
  } satisfies Record<ControlSlot, ControlId[]>;
}

export function useLayoutDecision({
  hasEpisodes,
  hasNext,
  isFullscreen,
  playerRef,
}: UseLayoutDecisionParams): LayoutDecision {
  const [isCoarsePointer, setIsCoarsePointer] = useState(false);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (typeof window === "undefined" || !("matchMedia" in window)) return;

    const mediaQuery = window.matchMedia("(pointer: coarse)");
    const syncPointerType = () => setIsCoarsePointer(mediaQuery.matches);

    syncPointerType();

    if ("addEventListener" in mediaQuery) {
      mediaQuery.addEventListener("change", syncPointerType);
      return () => mediaQuery.removeEventListener("change", syncPointerType);
    }

    const legacyMediaQuery = mediaQuery as MediaQueryList & {
      addListener?: (listener: (event: MediaQueryListEvent) => void) => void;
      removeListener?: (listener: (event: MediaQueryListEvent) => void) => void;
    };
    legacyMediaQuery.addListener?.(syncPointerType);
    return () => legacyMediaQuery.removeListener?.(syncPointerType);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const measureViewport = () => {
      const rect = playerRef.current?.getBoundingClientRect();
      const width = rect?.width || window.innerWidth;
      const height = rect?.height || window.innerHeight;

      setViewport((current) => {
        if (current.width === width && current.height === height) return current;
        return { width, height };
      });
    };

    measureViewport();
    window.addEventListener("resize", measureViewport);

    const observer =
      typeof ResizeObserver !== "undefined" && playerRef.current
        ? new ResizeObserver(measureViewport)
        : null;
    if (observer && playerRef.current) observer.observe(playerRef.current);

    return () => {
      window.removeEventListener("resize", measureViewport);
      observer?.disconnect();
    };
  }, [playerRef]);

  return useMemo(() => {
    let mode: LayoutMode = "desktop-default";

    if (isFullscreen) {
      mode = "fullscreen-immersive";
    } else if (isCoarsePointer) {
      mode =
        viewport.width > 0 && viewport.width > viewport.height
          ? "mobile-landscape"
          : "mobile-portrait";
    } else if (viewport.width > 0 && viewport.width <= DESKTOP_COMPACT_WIDTH) {
      mode = "desktop-compact";
    }

    const slots =
      mode === "desktop-default"
        ? createDesktopDefaultSlots(hasEpisodes, hasNext)
        : mode === "desktop-compact"
          ? createDesktopCompactSlots(hasEpisodes, hasNext)
          : createMobileSlots(hasNext);

    const visibleControls = new Set(
      Object.values(slots).flatMap((slotControls) => slotControls),
    );

    const allControls: ControlId[] = [
      "title",
      "play",
      "next",
      "episodes",
      "volume",
      "time",
      "chapter",
      "subtitles",
      "settings",
      "theater",
      "airplay",
      "pip",
      "fullscreen",
    ];

    const hiddenControls = allControls.filter((control) => {
      if (control === "episodes" && !hasEpisodes) return true;
      if (control === "next" && !hasNext) return true;
      return !visibleControls.has(control);
    });

    return {
      mode,
      compactPanels: mode !== "desktop-default",
      hiddenControls,
      slots,
      placements: {
        episodesPanel: mode === "desktop-default" ? "bottom-left" : "top-right",
        settingsPanel: mode === "desktop-default" ? "bottom-right" : "top-right",
      },
    } satisfies LayoutDecision;
  }, [hasEpisodes, hasNext, isCoarsePointer, isFullscreen, viewport.height, viewport.width]);
}
