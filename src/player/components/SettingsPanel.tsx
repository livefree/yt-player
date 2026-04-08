import { useCallback, useEffect } from "react";
import type { KeyboardEvent, PointerEvent, RefObject } from "react";
import s from "../Player.module.css";
import type {
  PanelPlacement,
  PanelSizingMode,
  ViewportBand,
} from "../hooks/useLayoutDecision";
import { PanelShell } from "./PanelShell";

const SETTINGS_PLACEHOLDERS = [
  { label: "Loop playback", value: "Coming soon" },
  { label: "Autoplay next", value: "Coming soon" },
  { label: "Sleep timer", value: "Coming soon" },
  { label: "Caption style", value: "Coming soon" },
] as const;

type SettingsPanelProps = {
  isOpen: boolean;
  panelId: string;
  onRequestClose: () => void;
  panelRef: RefObject<HTMLDivElement>;
  panelSizingMode: PanelSizingMode;
  placement: PanelPlacement;
  viewportBand: ViewportBand;
};

export function SettingsPanel({
  isOpen,
  panelId,
  onRequestClose,
  panelRef,
  panelSizingMode,
  placement,
  viewportBand,
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
    <PanelShell
      panelRef={panelRef}
      panelId={panelId}
      ariaLabel="Settings"
      className={s.ytpSettingsPanel}
      panelSizingMode={panelSizingMode}
      placement={placement}
      viewportBand={viewportBand}
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
        {SETTINGS_PLACEHOLDERS.map((item) => (
          <div
            key={item.label}
            className={`${s.ytpMenuItem} ${s.ytpMenuItemPlaceholder}`}
            role="menuitem"
            tabIndex={0}
            aria-disabled="true"
          >
            <span className={s.ytpMenuItemLabel}>{item.label}</span>
            <span className={s.ytpMenuItemValue}>{item.value}</span>
          </div>
        ))}
      </div>
    </PanelShell>
  );
}
