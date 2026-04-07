import { useEffect } from "react";
import type { CSSProperties, KeyboardEvent, PointerEvent, RefObject } from "react";
import s from "../Player.module.css";
import type { PanelPlacement } from "../hooks/useLayoutDecision";

type EpisodesPanelProps = {
  activeEpisodeIndex: number;
  episodesCols: number;
  focusedEpisodeIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onEpisodeChange?: (index: number) => void;
  onFocusEpisode: (index: number) => void;
  panelRef: RefObject<HTMLDivElement>;
  placement: PanelPlacement;
  episodes?: Array<{ title?: string }>;
};

export function EpisodesPanel({
  activeEpisodeIndex,
  episodes,
  episodesCols,
  focusedEpisodeIndex,
  isOpen,
  onClose,
  onEpisodeChange,
  onFocusEpisode,
  panelRef,
  placement,
}: EpisodesPanelProps) {
  useEffect(() => {
    if (!isOpen || !episodes?.length) return;
    panelRef.current
      ?.querySelector<HTMLElement>("[data-ep-focused], [role='option']")
      ?.focus();
  }, [episodes?.length, focusedEpisodeIndex, isOpen, panelRef]);

  if (!isOpen || !episodes?.length) return null;

  return (
    <div
      ref={panelRef}
      className={s.ytpEpisodesPanel}
      data-layer="5"
      data-placement={placement}
      role="dialog"
      aria-label="Episodes"
      onPointerDown={(event: PointerEvent<HTMLDivElement>) => event.stopPropagation()}
      onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onClose();
        }
      }}
    >
      <div
        className={s.ytpEpisodesGrid}
        role="listbox"
        style={{ "--_ep-cols": episodesCols } as CSSProperties}
      >
        {episodes.map((_, index) => (
          <button
            key={index}
            role="option"
            aria-selected={index === activeEpisodeIndex}
            className={`${s.ytpEpisodeItem}${index === activeEpisodeIndex ? ` ${s.ytpEpisodeActive}` : ""}${index === focusedEpisodeIndex ? ` ${s.ytpEpisodeFocused}` : ""}`}
            data-ep-focused={index === focusedEpisodeIndex ? "" : undefined}
            onClick={() => {
              onEpisodeChange?.(index);
              onClose();
            }}
            onMouseEnter={() => onFocusEpisode(index)}
            onFocus={() => onFocusEpisode(index)}
          >
            {String(index + 1).padStart(2, "0")}
          </button>
        ))}
      </div>
    </div>
  );
}
