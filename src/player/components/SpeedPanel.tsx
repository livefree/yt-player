import { useCallback, useEffect } from "react";
import type { KeyboardEvent, PointerEvent, RefObject } from "react";
import s from "../Player.module.css";
import type { PanelPlacement } from "../hooks/useLayoutDecision";
import {
  SPEED_MAX,
  SPEED_MIN,
  SPEED_PRESETS,
  SPEED_STEP,
  formatRateBadge,
} from "../utils/format";

type SpeedPanelProps = {
  panelId: string;
  panelRef: RefObject<HTMLDivElement>;
  placement: PanelPlacement;
  playbackRate: number;
  onPlaybackRateChange: (rate: number) => void;
  onRequestClose: () => void;
};

export function SpeedPanel({
  panelId,
  panelRef,
  placement,
  playbackRate,
  onPlaybackRateChange,
  onRequestClose,
}: SpeedPanelProps) {
  const getFocusableItems = useCallback(
    () =>
      Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          'input, button:not([disabled])',
        ) ?? [],
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
    focusItemAt(0);
  }, [focusItemAt]);

  const helpTextId = `${panelId}-help`;

  return (
    <div
      ref={panelRef}
      id={panelId}
      className={`${s.ytpSpeedPanel} ${s.ytpPanelSurface} ${s.ytpPopup}`}
      data-layer="5"
      data-placement={placement}
      role="dialog"
      aria-label="Playback speed"
      aria-describedby={helpTextId}
      aria-modal="false"
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

        if (event.key === "Tab") {
          event.preventDefault();
          event.stopPropagation();
          focusItemAt(currentIndex + (event.shiftKey ? -1 : 1));
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
      <div
        className={s.ytpFocusTrap}
        tabIndex={0}
        onFocus={() => focusItemAt(-1)}
      />
      <div className={s.ytpPanelMenu}>
        <div className={s.ytpSpeedPanelHeader}>
          <span className={s.ytpSpeedPanelTitle}>Playback speed</span>
          <span className={s.ytpSpeedPanelValue}>{formatRateBadge(playbackRate)}</span>
        </div>
        <div className={s.ytpSpeedPanelBody}>
          <label className={s.ytpSpeedSliderBlock}>
            <span className={s.ytpSpeedSliderLabel}>Adjust speed</span>
            <input
              className={s.ytpSpeedRange}
              type="range"
              min={SPEED_MIN}
              max={SPEED_MAX}
              step={SPEED_STEP}
              value={playbackRate}
              aria-label="Playback speed"
              onChange={(event) => onPlaybackRateChange(Number(event.currentTarget.value))}
            />
            <div className={s.ytpSpeedScale}>
              <span>{formatRateBadge(SPEED_MIN)}</span>
              <span>{formatRateBadge(SPEED_MAX)}</span>
            </div>
          </label>
          <div className={s.ytpSpeedPresets} role="group" aria-label="Speed presets">
            {SPEED_PRESETS.map((rate) => {
              const isActive = Math.abs(playbackRate - rate) < 0.01;
              return (
                <button
                  key={rate}
                  type="button"
                  className={`${s.ytpSpeedPreset} ${isActive ? s.ytpSpeedPresetActive : ""}`.trim()}
                  aria-pressed={isActive}
                  onClick={() => onPlaybackRateChange(rate)}
                >
                  {formatRateBadge(rate)}
                </button>
              );
            })}
          </div>
          <div id={helpTextId} className={s.ytpSpeedHelp}>
            Keyboard shortcuts: <kbd>[</kbd> slower, <kbd>]</kbd> faster
          </div>
        </div>
      </div>
      <div
        className={s.ytpFocusTrap}
        tabIndex={0}
        onFocus={() => focusItemAt(0)}
      />
    </div>
  );
}
