import { useEffect, useMemo, useState, type RefObject } from "react";

export type LayoutMode =
  | "desktop-default"
  | "desktop-compact"
  | "mobile-portrait"
  | "mobile-landscape"
  | "fullscreen-immersive";

export type ControlId =
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

export type ControlSlot =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "center-overlay"
  | "edge-left"
  | "edge-right";

export type PanelPlacement = "bottom-left" | "bottom-right" | "top-right";
export type LayoutProfile =
  | "default"
  | "short-height"
  | "medium-width"
  | "narrow-width";
export type InteractionPolicy = "desktop-pointer" | "tablet-touch" | "phone-touch";
export type ChromePolicy =
  | "hover-autohide"
  | "touch-autohide"
  | "touch-persistent-paused";

type UseLayoutDecisionParams = {
  hasEpisodes: boolean;
  hasNext: boolean;
  isFullscreen: boolean;
  isTheater: boolean;
  playerRef: RefObject<HTMLDivElement>;
};

export type LayoutDecision = {
  chromePolicy: ChromePolicy;
  compactPanels: boolean;
  constraints: {
    height: "short" | "tall";
    width: "narrow" | "medium" | "wide";
  };
  density: "collapsed" | "comfortable" | "condensed";
  hiddenControls: ControlId[];
  interactionPolicy: InteractionPolicy;
  mode: LayoutMode;
  profile: LayoutProfile;
  placements: {
    episodesPanel: PanelPlacement;
    settingsPanel: PanelPlacement;
  };
  slots: Record<ControlSlot, ControlId[]>;
};

const DESKTOP_COLLAPSED_WIDTH = 560;
const DESKTOP_COMPACT_WIDTH = 760;
const SHORT_HEIGHT = 460;

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

function createTabletTouchSlots(hasEpisodes: boolean) {
  return {
    "top-left": ["title"],
    "top-right": [
      ...(hasEpisodes ? (["episodes"] as ControlId[]) : []),
      "settings",
      "subtitles",
    ],
    "bottom-left": ["play", "time"],
    "bottom-right": ["fullscreen"],
    "center-overlay": [],
    "edge-left": [],
    "edge-right": [],
  } satisfies Record<ControlSlot, ControlId[]>;
}

function createPhoneTouchSlots(hasEpisodes: boolean) {
  return {
    "top-left": ["title"],
    "top-right": ["settings"],
    "bottom-left": ["play"],
    "bottom-right": [...(hasEpisodes ? (["episodes"] as ControlId[]) : []), "fullscreen"],
    "center-overlay": [],
    "edge-left": [],
    "edge-right": [],
  } satisfies Record<ControlSlot, ControlId[]>;
}

function cloneSlots(
  slots: Record<ControlSlot, ControlId[]>,
): Record<ControlSlot, ControlId[]> {
  return Object.fromEntries(
    Object.entries(slots).map(([slot, controls]) => [slot, [...controls]]),
  ) as Record<ControlSlot, ControlId[]>;
}

function removeControl(
  slots: Record<ControlSlot, ControlId[]>,
  control: ControlId,
) {
  Object.keys(slots).forEach((slot) => {
    const typedSlot = slot as ControlSlot;
    slots[typedSlot] = slots[typedSlot].filter((value) => value !== control);
  });
}

function ensureControlInSlot(
  slots: Record<ControlSlot, ControlId[]>,
  control: ControlId,
  slot: ControlSlot,
) {
  removeControl(slots, control);
  slots[slot].push(control);
}

function applyDesktopCollapsePolicy({
  slots,
  profile,
  hasEpisodes,
}: {
  profile: LayoutProfile;
  hasEpisodes: boolean;
  slots: Record<ControlSlot, ControlId[]>;
}) {
  if (profile === "default") return slots;

  const promoteCompactControls = () => {
    ensureControlInSlot(slots, "settings", "top-right");
    if (hasEpisodes) {
      ensureControlInSlot(slots, "episodes", "top-right");
    }
  };

  if (profile === "short-height") {
    removeControl(slots, "chapter");
    removeControl(slots, "theater");
    promoteCompactControls();
    return slots;
  }

  removeControl(slots, "volume");
  removeControl(slots, "chapter");
  promoteCompactControls();

  if (profile === "narrow-width") {
    removeControl(slots, "theater");
    removeControl(slots, "airplay");
    removeControl(slots, "pip");
  }

  return slots;
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
    const widthBand =
      viewport.width > 0 && viewport.width <= DESKTOP_COMPACT_WIDTH
        ? viewport.width <= DESKTOP_COLLAPSED_WIDTH
          ? "narrow"
          : "medium"
        : "wide";
    const heightBand = viewport.height > 0 && viewport.height <= SHORT_HEIGHT ? "short" : "tall";
    let density: LayoutDecision["density"] = "comfortable";
    let profile: LayoutProfile = "default";
    let interactionPolicy: InteractionPolicy = "desktop-pointer";
    let chromePolicy: ChromePolicy = "hover-autohide";

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

    if (isCoarsePointer) {
      interactionPolicy =
        viewport.width > viewport.height ? "tablet-touch" : "phone-touch";
      chromePolicy =
        interactionPolicy === "phone-touch"
          ? "touch-persistent-paused"
          : "touch-autohide";
    }

    if (!isCoarsePointer && !isFullscreen) {
      if (widthBand === "narrow") {
        density = "collapsed";
        profile = "narrow-width";
      } else if (widthBand === "medium" || heightBand === "short") {
        density = "condensed";
        profile = widthBand === "medium" ? "medium-width" : "short-height";
      }
    }

    const baseSlots =
      interactionPolicy === "tablet-touch"
        ? createTabletTouchSlots(hasEpisodes)
        : interactionPolicy === "phone-touch"
          ? createPhoneTouchSlots(hasEpisodes)
          : !isCoarsePointer && !isFullscreen
        ? createDesktopDefaultSlots(hasEpisodes, hasNext)
        : createPhoneTouchSlots(hasEpisodes);
    const slots =
      !isCoarsePointer && !isFullscreen
        ? applyDesktopCollapsePolicy({
            profile,
            hasEpisodes,
            slots: cloneSlots(baseSlots),
          })
        : baseSlots;

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
      profile,
      interactionPolicy,
      chromePolicy,
      hiddenControls,
      density,
      constraints: {
        width: widthBand,
        height: heightBand,
      },
      slots,
      placements: {
        episodesPanel: slots["top-right"].includes("episodes")
          ? "top-right"
          : slots["bottom-right"].includes("episodes")
            ? "bottom-right"
            : "bottom-left",
        settingsPanel: slots["top-right"].includes("settings")
          ? "top-right"
          : "bottom-right",
      },
      compactPanels: density !== "comfortable" || mode !== "desktop-default",
    } satisfies LayoutDecision;
  }, [hasEpisodes, hasNext, isCoarsePointer, isFullscreen, viewport.height, viewport.width]);
}
