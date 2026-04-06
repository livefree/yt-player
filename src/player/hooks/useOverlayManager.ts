import { useMemo } from "react";

export type OverlayKind =
  | "spinner"
  | "error"
  | "bezel"
  | "seek-indicator"
  | "touch-seek"
  | "captions"
  | "unmute-prompt"
  | "settings"
  | "episodes";

export type OverlayEntry = {
  blocksGestures: boolean;
  interactive: boolean;
  kind: OverlayKind;
  priority: number;
  visible: boolean;
};

type UseOverlayManagerParams = {
  error: string | null;
  isEpisodesOpen: boolean;
  isLoading: boolean;
  openPanel: boolean;
  seekVisible: boolean;
  showCaptions: boolean;
  showTouchSeekIndicator: boolean;
  showUnmute: boolean;
  showBezel: boolean;
};

const OVERLAY_PRIORITY: Record<OverlayKind, number> = {
  error: 600,
  settings: 520,
  episodes: 510,
  "unmute-prompt": 450,
  spinner: 300,
  captions: 220,
  bezel: 180,
  "touch-seek": 170,
  "seek-indicator": 160,
};

export function buildOverlayEntries({
  error,
  isEpisodesOpen,
  isLoading,
  openPanel,
  seekVisible,
  showCaptions,
  showTouchSeekIndicator,
  showUnmute,
  showBezel,
}: UseOverlayManagerParams): OverlayEntry[] {
  return [
    {
      kind: "spinner",
      visible: isLoading,
      interactive: false,
      priority: OVERLAY_PRIORITY.spinner,
      blocksGestures: false,
    },
    {
      kind: "error",
      visible: !!error,
      interactive: true,
      priority: OVERLAY_PRIORITY.error,
      blocksGestures: true,
    },
    {
      kind: "bezel",
      visible: showBezel,
      interactive: false,
      priority: OVERLAY_PRIORITY.bezel,
      blocksGestures: false,
    },
    {
      kind: "seek-indicator",
      visible: seekVisible,
      interactive: false,
      priority: OVERLAY_PRIORITY["seek-indicator"],
      blocksGestures: false,
    },
    {
      kind: "touch-seek",
      visible: showTouchSeekIndicator,
      interactive: false,
      priority: OVERLAY_PRIORITY["touch-seek"],
      blocksGestures: false,
    },
    {
      kind: "captions",
      visible: showCaptions,
      interactive: false,
      priority: OVERLAY_PRIORITY.captions,
      blocksGestures: false,
    },
    {
      kind: "unmute-prompt",
      visible: showUnmute,
      interactive: true,
      priority: OVERLAY_PRIORITY["unmute-prompt"],
      blocksGestures: false,
    },
    {
      kind: "settings",
      visible: openPanel,
      interactive: true,
      priority: OVERLAY_PRIORITY.settings,
      blocksGestures: true,
    },
    {
      kind: "episodes",
      visible: isEpisodesOpen,
      interactive: true,
      priority: OVERLAY_PRIORITY.episodes,
      blocksGestures: true,
    },
  ];
}

export function useOverlayManager(params: UseOverlayManagerParams) {
  return useMemo(() => {
    const entries = buildOverlayEntries(params);
    const visibleEntries = entries
      .filter((entry) => entry.visible)
      .sort((left, right) => right.priority - left.priority);

    return {
      entries,
      visibleEntries,
      interactiveOverlayVisible: visibleEntries.some((entry) => entry.interactive),
      blocksGestures: visibleEntries.some((entry) => entry.blocksGestures),
      topOverlay: visibleEntries[0]?.kind ?? null,
      isVisible: (kind: OverlayKind) =>
        visibleEntries.some((entry) => entry.kind === kind),
    };
  }, [params]);
}
