import { useCallback, useEffect } from "react";
import type { CSSProperties, KeyboardEvent, PointerEvent, RefObject } from "react";
import type {
  PanelPlacement,
  PanelSizingMode,
  ViewportBand,
} from "../hooks/useLayoutDecision";
import {
  SPEED_MAX,
  SPEED_MIN,
  SPEED_PRESETS,
  SPEED_STEP,
  clamp,
  formatRateBadge,
} from "../utils/format";
import s from "../Player.module.css";
import { ActionPanel } from "./ActionPanel";
import { YtpButton } from "./Button";

type SpeedPanelProps = {
  panelId: string;
  panelRef: RefObject<HTMLDivElement>;
  placement: PanelPlacement;
  panelSizingMode: PanelSizingMode;
  playbackRate: number;
  viewportBand: ViewportBand;
  onPlaybackRateChange: (rate: number) => void;
  onRequestClose: () => void;
};

export function SpeedPanel({
  panelId,
  panelRef,
  placement,
  panelSizingMode,
  playbackRate,
  viewportBand,
  onPlaybackRateChange,
  onRequestClose,
}: SpeedPanelProps) {
  const speedPct = ((playbackRate - SPEED_MIN) / (SPEED_MAX - SPEED_MIN)) * 100;

  const nudgePlaybackRate = useCallback(
    (delta: number) => {
      onPlaybackRateChange(clamp(playbackRate + delta, SPEED_MIN, SPEED_MAX));
    },
    [onPlaybackRateChange, playbackRate],
  );

  const getFocusableItems = useCallback(
    () =>
      Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>("input, button:not([disabled])") ??
          [],
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

  return (
    <ActionPanel
      ariaLabel="Playback speed"
      className={s.ytpSpeedPopup}
      panelId={panelId}
      panelRef={panelRef}
      panelSizingMode={panelSizingMode}
      placement={placement}
      viewportBand={viewportBand}
      style={
        {
          "--_action-panel-width": "248px",
          "--_action-panel-max-height": "248px",
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
      <div className={s.ytpSpeedPanelBody}>
        <div className={s.ytpSpeedSliderRow}>
          <YtpButton
            tooltip="Slower ([)"
            ariaLabel="Decrease playback speed"
            className={s.ytpSpeedStepButton}
            onClick={() => nudgePlaybackRate(-SPEED_STEP)}
          >
            <span className={s.ytpSpeedStepGlyph} aria-hidden="true">-</span>
          </YtpButton>
          <label className={s.ytpSpeedSliderBlock}>
            <div className={s.ytpSpeedSlider}>
              <div
                className={s.ytpSpeedSliderFill}
                style={{ width: `${speedPct}%` }}
              />
              <div
                className={s.ytpSpeedSliderHandle}
                style={{ left: `${speedPct}%` }}
              />
            </div>
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
          </label>
          <YtpButton
            tooltip="Faster (])"
            ariaLabel="Increase playback speed"
            className={s.ytpSpeedStepButton}
            onClick={() => nudgePlaybackRate(SPEED_STEP)}
          >
            <span className={s.ytpSpeedStepGlyph} aria-hidden="true">+</span>
          </YtpButton>
        </div>
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
      </div>
    </ActionPanel>
  );
}
