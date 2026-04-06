import type { KeyboardEvent, PointerEvent, ReactNode, RefObject } from "react";
import s from "../Player.module.css";
import type { Panel, QualityLevel, SubtitleTrack } from "../types";
import { SPEED_PRESETS, formatRate } from "../utils/format";
import { MenuBackIcon, MenuCheckIcon, MenuChevronIcon } from "./icons";

type SettingsPanelProps = {
  activeQualityId?: string;
  activeSubId: string | null;
  onOpenPanel: (panel: Panel) => void;
  onPlaybackRateChange: (rate: number) => void;
  onQualityChange?: (id: string) => void;
  onSubtitleChange: (subtitleId: string | null) => void;
  openPanel: Panel;
  panelRef: RefObject<HTMLDivElement>;
  playbackRate: number;
  qualities: QualityLevel[];
  subtitles: SubtitleTrack[];
};

type MenuItemProps = {
  children: ReactNode;
  className?: string;
  onActivate: () => void;
  role?: string;
  tabIndex?: number;
  ariaChecked?: boolean;
};

function MenuItem({
  ariaChecked,
  children,
  className = "",
  onActivate,
  role = "menuitem",
  tabIndex = 0,
}: MenuItemProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter") onActivate();
  };

  return (
    <div
      className={`${s.ytpMenuItem} ${className}`.trim()}
      role={role}
      tabIndex={tabIndex}
      aria-checked={ariaChecked}
      onClick={onActivate}
      onKeyDown={handleKeyDown}
    >
      {children}
    </div>
  );
}

function MenuHeader({
  label,
  onBack,
}: {
  label: string;
  onBack: () => void;
}) {
  return (
    <div
      className={s.ytpMenuHeader}
      role="menuitem"
      tabIndex={0}
      onClick={onBack}
      onKeyDown={(event) => {
        if (event.key === "Enter") onBack();
      }}
    >
      <MenuBackIcon className={s.ytpMenuBack} />
      <span>{label}</span>
    </div>
  );
}

export function SettingsPanel({
  activeQualityId,
  activeSubId,
  onOpenPanel,
  onPlaybackRateChange,
  onQualityChange,
  onSubtitleChange,
  openPanel,
  panelRef,
  playbackRate,
  qualities,
  subtitles,
}: SettingsPanelProps) {
  if (!openPanel) return null;

  const activeQualityLabel =
    qualities.find((quality) => quality.id === activeQualityId)?.label ?? "Auto";
  const activeSubtitleLabel = activeSubId
    ? (subtitles.find((subtitle) => subtitle.id === activeSubId)?.label ?? "Off")
    : "Off";

  return (
    <div
      ref={panelRef}
      className={`${s.ytpSettingsMenu} ${s.ytpPopup}`}
      data-layer="5"
      role="dialog"
      aria-label="Settings"
      onPointerDown={(event: PointerEvent<HTMLDivElement>) => event.stopPropagation()}
    >
      <div className={s.ytpFocusTrap} tabIndex={0} />
      <div className={s.ytpPanelMenu} role="menu">
        {openPanel === "settings" && (
          <>
            {qualities.length > 0 && (
              <MenuItem onActivate={() => onOpenPanel("quality")}>
                <span className={s.ytpMenuItemLabel}>Quality</span>
                <span className={s.ytpMenuItemValue}>{activeQualityLabel}</span>
                <MenuChevronIcon className={s.ytpMenuChevron} />
              </MenuItem>
            )}
            {subtitles.length > 0 && (
              <MenuItem onActivate={() => onOpenPanel("subtitles")}>
                <span className={s.ytpMenuItemLabel}>Subtitles/CC</span>
                <span className={s.ytpMenuItemValue}>{activeSubtitleLabel}</span>
                <MenuChevronIcon className={s.ytpMenuChevron} />
              </MenuItem>
            )}
            <MenuItem onActivate={() => onOpenPanel("speed")}>
              <span className={s.ytpMenuItemLabel}>Playback speed</span>
              <span className={s.ytpMenuItemValue}>{formatRate(playbackRate)}</span>
              <MenuChevronIcon className={s.ytpMenuChevron} />
            </MenuItem>
          </>
        )}

        {openPanel === "quality" && (
          <>
            <MenuHeader label="Quality" onBack={() => onOpenPanel("settings")} />
            {qualities.map((quality) => (
              <MenuItem
                key={quality.id}
                className={
                  quality.id === activeQualityId ? s.ytpMenuItemActive : ""
                }
                role="menuitemradio"
                ariaChecked={quality.id === activeQualityId}
                onActivate={() => {
                  onQualityChange?.(quality.id);
                  onOpenPanel("settings");
                }}
              >
                {quality.id === activeQualityId && (
                  <MenuCheckIcon className={s.ytpMenuCheck} />
                )}
                <span className={s.ytpMenuItemLabel}>{quality.label}</span>
              </MenuItem>
            ))}
          </>
        )}

        {openPanel === "subtitles" && (
          <>
            <MenuHeader label="Subtitles/CC" onBack={() => onOpenPanel("settings")} />
            <MenuItem
              className={!activeSubId ? s.ytpMenuItemActive : ""}
              role="menuitemradio"
              ariaChecked={!activeSubId}
              onActivate={() => {
                onSubtitleChange(null);
                onOpenPanel("settings");
              }}
            >
              {!activeSubId && <MenuCheckIcon className={s.ytpMenuCheck} />}
              <span className={s.ytpMenuItemLabel}>Off</span>
            </MenuItem>
            {subtitles.map((subtitle) => (
              <MenuItem
                key={subtitle.id}
                className={
                  subtitle.id === activeSubId ? s.ytpMenuItemActive : ""
                }
                role="menuitemradio"
                ariaChecked={subtitle.id === activeSubId}
                onActivate={() => {
                  onSubtitleChange(subtitle.id);
                  onOpenPanel("settings");
                }}
              >
                {subtitle.id === activeSubId && (
                  <MenuCheckIcon className={s.ytpMenuCheck} />
                )}
                <span className={s.ytpMenuItemLabel}>{subtitle.label}</span>
              </MenuItem>
            ))}
          </>
        )}

        {openPanel === "speed" && (
          <>
            <MenuHeader
              label="Playback speed"
              onBack={() => onOpenPanel("settings")}
            />
            {SPEED_PRESETS.map((rate) => {
              const isActive = Math.abs(playbackRate - rate) < 0.01;
              return (
                <MenuItem
                  key={rate}
                  className={isActive ? s.ytpMenuItemActive : ""}
                  role="menuitemradio"
                  ariaChecked={isActive}
                  onActivate={() => {
                    onPlaybackRateChange(rate);
                    onOpenPanel("settings");
                  }}
                >
                  {isActive && <MenuCheckIcon className={s.ytpMenuCheck} />}
                  <span className={s.ytpMenuItemLabel}>{formatRate(rate)}</span>
                </MenuItem>
              );
            })}
          </>
        )}
      </div>
      <div className={s.ytpFocusTrap} tabIndex={0} />
    </div>
  );
}
