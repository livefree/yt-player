import { useMemo } from "react";

export type InputZone = "left" | "center" | "right";

export type InputRoute = {
  blocksGestures: boolean;
  interactive: boolean;
  kind: "gesture-zone";
  zone: InputZone;
};

type UseInputRouterParams = {
  blocksGestures: boolean;
  layoutMode: string;
};

export function useInputRouter({
  blocksGestures,
  layoutMode,
}: UseInputRouterParams) {
  return useMemo(() => {
    const useThreeZones = layoutMode !== "mobile-portrait";
    const zones: InputZone[] = useThreeZones
      ? ["left", "center", "right"]
      : ["center"];

    const routes: InputRoute[] = zones.map((zone) => ({
      kind: "gesture-zone",
      zone,
      interactive: !blocksGestures,
      blocksGestures,
    }));

    return {
      routes,
      zones,
      useThreeZones,
      gestureSurfaceDisabled: blocksGestures,
    };
  }, [blocksGestures, layoutMode]);
}
