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

type PanelShellProps = {
  ariaLabel: string;
  children: ReactNode;
  className?: string;
  panelHeight?: "content-driven";
  panelId: string;
  panelRef: RefObject<HTMLDivElement>;
  panelSizingMode: PanelSizingMode;
  placement: PanelPlacement;
  style?: CSSProperties;
  viewportBand: ViewportBand;
  onKeyDown?: KeyboardEventHandler<HTMLDivElement>;
  onPointerDown?: PointerEventHandler<HTMLDivElement>;
};

export function PanelShell({
  ariaLabel,
  children,
  className = "",
  panelHeight = "content-driven",
  panelId,
  panelRef,
  panelSizingMode,
  placement,
  style,
  viewportBand,
  onKeyDown,
  onPointerDown,
}: PanelShellProps) {
  return (
    <div
      ref={panelRef}
      id={panelId}
      className={`${s.ytpPanelPopup} ${s.ytpPanelSurface} ${className}`.trim()}
      data-layer="5"
      data-panel-height={panelHeight}
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
