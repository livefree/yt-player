import { useCallback, useEffect } from "react";
import type { CSSProperties, KeyboardEvent, PointerEvent, RefObject } from "react";
import type {
  PanelPlacement,
  PanelSizingMode,
  ViewportBand,
} from "../hooks/useLayoutDecision";
import s from "../Player.module.css";
import { ActionPanel } from "./ActionPanel";

const SETTINGS_ITEMS = [
  { label: "Loop playback", value: "Coming soon" },
  { label: "Autoplay next", value: "Coming soon" },
  { label: "Sleep timer", value: "Coming soon" },
  { label: "Caption style", value: "Coming soon" },
] as const;

type SettingsPanelProps = {
  isOpen: boolean;
  panelId: string;
  panelRef: RefObject<HTMLDivElement>;
  panelSizingMode: PanelSizingMode;
  placement: PanelPlacement;
  viewportBand: ViewportBand;
  onRequestClose: () => void;
};

export function SettingsPanel({
  isOpen,
  panelId,
  panelRef,
  panelSizingMode,
  placement,
  viewportBand,
  onRequestClose,
}: SettingsPanelProps) {
  const getFocusableItems = useCallback(
    () =>
      Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [],
      ),
    [panelRef],
  );

  const focusItemAt = useCallback(
    (index: number) => {
      const items = getFocusableItems();
      if (!items.length) return;
      items[(index + items.length) % items.length]?.focus();
    },
    [getFocusableItems],
  );

  useEffect(() => {
    if (!isOpen) return;
    focusItemAt(0);
  }, [focusItemAt, isOpen]);

  if (!isOpen) return null;

  return (
    <ActionPanel
      ariaLabel="Settings"
      className={s.ytpSettingsPopup}
      panelId={panelId}
      panelRef={panelRef}
      panelSizingMode={panelSizingMode}
      placement={placement}
      viewportBand={viewportBand}
      style={
        {
          "--_action-panel-width": "296px",
          "--_action-panel-max-height": "260px",
        } as CSSProperties
      }
      onPointerDown={(event: PointerEvent<HTMLDivElement>) => event.stopPropagation()}
      onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
        const items = getFocusableItems();
        const currentIndex = items.findIndex((item) => item === document.activeElement);

        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          onRequestClose();
          return;
        }

        if (!items.length) return;

        if (event.key === "Tab" || event.key === "ArrowDown") {
          event.preventDefault();
          event.stopPropagation();
          focusItemAt(currentIndex + 1);
          return;
        }

        if (event.key === "ArrowUp") {
          event.preventDefault();
          event.stopPropagation();
          focusItemAt(currentIndex - 1);
          return;
        }

        if (event.key === "Home") {
          event.preventDefault();
          event.stopPropagation();
          focusItemAt(0);
          return;
        }

        if (event.key === "End") {
          event.preventDefault();
          event.stopPropagation();
          focusItemAt(items.length - 1);
        }
      }}
    >
      <div className={s.ytpPanelMenu} role="menu">
        {SETTINGS_ITEMS.map((item) => (
          <div
            key={item.label}
            className={`${s.ytpMenuItem} ${s.ytpMenuItemPlaceholder}`}
            role="menuitem"
            tabIndex={0}
          >
            <span className={s.ytpMenuItemLabel}>{item.label}</span>
            <span className={s.ytpMenuItemValue}>{item.value}</span>
          </div>
        ))}
      </div>
    </ActionPanel>
  );
}
