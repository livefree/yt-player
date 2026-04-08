import type {
  CSSProperties,
  KeyboardEventHandler,
  PointerEventHandler,
  ReactNode,
  RefObject,
} from "react";
import s from "../Player.module.css";
import type {
  PanelPlacement,
  PanelSizingMode,
  ViewportBand,
} from "../hooks/useLayoutDecision";

type ActionPanelProps = {
  ariaLabel: string;
  children: ReactNode;
  className?: string;
  panelId: string;
  panelRef: RefObject<HTMLDivElement>;
  panelSizingMode: PanelSizingMode;
  placement: PanelPlacement;
  style?: CSSProperties;
  viewportBand: ViewportBand;
  onKeyDown?: KeyboardEventHandler<HTMLDivElement>;
  onPointerDown?: PointerEventHandler<HTMLDivElement>;
};

export function ActionPanel({
  ariaLabel,
  children,
  className = "",
  panelId,
  panelRef,
  panelSizingMode,
  placement,
  style,
  viewportBand,
  onKeyDown,
  onPointerDown,
}: ActionPanelProps) {
  return (
    <div
      ref={panelRef}
      id={panelId}
      className={`${s.ytpActionPanel} ${className} ${s.ytpPanelSurface}`.trim()}
      data-layer="5"
      data-panel-height="content-driven"
      data-panel-sizing={panelSizingMode}
      data-placement={placement}
      data-viewport-band={viewportBand}
      role="dialog"
      aria-label={ariaLabel}
      aria-modal="false"
      style={style}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
    >
      <div className={s.ytpPanelScroller}>{children}</div>
    </div>
  );
}
