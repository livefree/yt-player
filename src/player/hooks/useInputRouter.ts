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
};

export function useInputRouter({
  blocksGestures,
}: UseInputRouterParams) {
  return useMemo(() => {
    const useThreeZones = true;
    const zones: InputZone[] = ["left", "center", "right"];

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
  }, [blocksGestures]);
}
