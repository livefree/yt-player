"use client";

/**
 * YTPlayer — built from YouTube's DOM architecture
 *
 * Layer system (mirrors data-layer="N"):
 *   0  html5-video-container      <video>
 *   1  gradient-top + chrome-top  title bar
 *   2  unmute popup               muted-autoplay notice
 *   4  overlays-container         spinner / seek-animation / bezel / error
 *   5  popup-panels               settings / speed / episodes / subtitles
 *   6  settings-menu              sub-panel of (5)
 *   9  gradient-bottom + chrome-bottom  progress-bar + controls
 *
 * Global tooltip singleton mirrors ytp-tooltip (single div, data-attribute driven).
 * Controls split into ytp-left-controls / ytp-right-controls-left / ytp-right-controls-right.
 * Progress bar has three sub-systems: normal track, hover preview, fine-scrubbing.
 * Seek animation uses two independent divs: ytp-seek-overlay-animation-back / forward.
 */

import {
  type CSSProperties,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import s from "./Player.module.css";
import { type PlayerProps, type SeekDirection, type Panel } from "./types";
import {
  clamp,
  formatTime,
  formatRate,
  SEEK_STEP,
  SPEED_PRESETS,
  SEEK_OVERLAY_DURATION,
  EPISODES_COLS_SMALL,
  EPISODES_COLS_LARGE,
  EPISODES_COLS_THRESHOLD,
  THUMB_CLAMP_PX,
} from "./utils/format";
import { useThumbnails } from "./hooks/useThumbnails";
import { useSourceLoader } from "./hooks/useSourceLoader";
import { useProgressInteractions } from "./hooks/useProgressInteractions";
import { useGestureControls } from "./hooks/useGestureControls";
import { useChromeVisibility } from "./hooks/useChromeVisibility";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useSystemIntegrations } from "./hooks/useSystemIntegrations";
import { Spinner } from "./components/Spinner";
import { SeekOverlay } from "./components/SeekOverlay";
import { Bezel } from "./components/Bezel";
import { YtpButton } from "./components/Button";
import {
  PlayIcon,
  PauseIcon,
  MuteIcon,
  VolumeIcon,
  SettingsIcon,
  SubtitlesIcon,
  TheaterIcon,
  FullscreenIcon,
  PipIcon,
  NextIcon,
  AirPlayIcon,
  EpisodesIcon,
} from "./components/icons";

// ─── Main Component ───────────────────────────────────────────────────────────

export function YTPlayer({
  src,
  qualities = [],
  activeQualityId,
  onQualityChange,
  subtitles = [],
  poster,
  title,
  author,
  chapters = [],
  onEnded,
  onTimeUpdate,
  startTime,
  autoplay = false,
  initialVolume = 1,
  defaultTheaterMode = false,
  onNext,
  episodes,
  activeEpisodeIndex = 0,
  onEpisodeChange,
  onTheaterChange,
  style,
  keepControlsVisible = false,
  thumbnailTrack,
}: PlayerProps) {
  const playerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // ── Panels ─────────────────────────────────────────────────────────────────
  const [openPanel, setOpenPanel] = useState<Panel>(null);
  const settingsPanelRef = useRef<HTMLDivElement>(null);

  // ── Playback state ─────────────────────────────────────────────────────────
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(startTime ?? 0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Volume ─────────────────────────────────────────────────────────────────
  const [volume, setVolume] = useState(initialVolume);
  const [prevVolume, setPrevVolume] = useState(initialVolume);
  const [isMuted, setIsMuted] = useState(false);
  const [volumeVisible, setVolumeVisible] = useState(false);
  const volumeTimeoutRef = useRef<number | null>(null);

  // ── Speed ──────────────────────────────────────────────────────────────────
  const [playbackRate, setPlaybackRate] = useState(1);

  // ── Subtitles ──────────────────────────────────────────────────────────────
  const [activeSubId, setActiveSubId] = useState<string | null>(
    subtitles.find((sub) => sub.default)?.id ?? null,
  );
  const [subtitleCue, setSubtitleCue] = useState("");

  // ── UI state ───────────────────────────────────────────────────────────────
  const [isTheater, setIsTheater] = useState(defaultTheaterMode);

  // ── Seek animation (layer 4) ───────────────────────────────────────────────
  const [seekDir, setSeekDir] = useState<SeekDirection>(null);
  const seekTimerRef = useRef<number | null>(null);

  // ── Bezel (center play/pause flash) ───────────────────────────────────────
  const [bezelVisible, setBezelVisible] = useState(false);
  const [bezelPaused, setBezelPaused] = useState(true);
  const bezelTimerRef = useRef<number | null>(null);

  // ── Muted-autoplay state (shown when autoplay+sound was blocked) ───────────
  const [showUnmute, setShowUnmute] = useState(false);

  const progressRailRef = useRef<HTMLDivElement>(null);
  const { getThumbnailAt } = useThumbnails(thumbnailTrack);
  const progressContainerRef = useRef<HTMLDivElement>(null);

  // ── Episodes panel ────────────────────────────────────────────────────────
  const [isEpisodesOpen, setIsEpisodesOpen] = useState(false);
  const [focusedEpisodeIndex, setFocusedEpisodeIndex] =
    useState(activeEpisodeIndex);
  const episodesPanelRef = useRef<HTMLDivElement>(null);

  const [showRemaining, setShowRemaining] = useState(false);

  const sliderId = useId();

  const { isFullscreen, airPlayAvailable } = useSystemIntegrations({
    videoRef,
    title,
    author,
    poster,
    onNext,
    isPlaying,
    duration,
    playbackRate,
    currentTime,
    setCurrentTime,
    doSeek,
    setIsPlaying,
  });

  const isImmersive = isTheater || isFullscreen;
  const hasEpisodes = (episodes?.length ?? 0) > 0;
  const episodesCols =
    (episodes?.length ?? 0) > EPISODES_COLS_THRESHOLD
      ? EPISODES_COLS_LARGE
      : EPISODES_COLS_SMALL;

  const { chromeVisible, cursorHidden, revealChrome } = useChromeVisibility({
    isImmersive,
    openPanel,
    isEpisodesOpen,
    keepControlsVisible,
  });

  const {
    hoverTime,
    hoverX,
    isProgressScrubbing,
    progressScrubActiveRef,
    handleProgressHover,
    handleProgressTouchStart,
    handleProgressTouchMove,
    handleProgressTouchEnd,
    handleProgressPointerDown,
    handleProgressPointerMove,
    handleProgressPointerUp,
    handleProgressMouseLeave,
  } = useProgressInteractions({
    duration,
    videoRef,
    progressRailRef,
    revealChrome,
    setCurrentTime,
  });

  // ─── Computed values ───────────────────────────────────────────────────────
  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPct = duration > 0 ? (buffered / duration) * 100 : 0;
  const activeChapter = useMemo(() => {
    if (!chapters.length) return null;
    for (let i = chapters.length - 1; i >= 0; i--) {
      const ch = chapters[i];
      if (ch && currentTime >= ch.startTime) return ch;
    }
    return null;
  }, [chapters, currentTime]);

  // Chapter shown in the progress-bar hover tooltip — uses hoverTime (cursor
  // position), not currentTime, so it reflects where the user is pointing.
  const hoverChapter = useMemo(() => {
    if (!chapters.length || hoverTime === null) return null;
    for (let i = chapters.length - 1; i >= 0; i--) {
      const ch = chapters[i];
      if (ch && hoverTime >= ch.startTime) return ch;
    }
    return null;
  }, [chapters, hoverTime]);

  const { retrySourceLoad } = useSourceLoader({
    videoRef,
    src,
    startTime,
    autoplay,
    setError,
    setIsLoading,
    setCurrentTime,
    setDuration,
    setBuffered,
    setIsPlaying,
    setIsMuted,
    setShowUnmute,
  });

  // ─── Volume & rate sync ────────────────────────────────────────────────────
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = volume;
    v.muted = isMuted;
  }, [volume, isMuted]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = playbackRate;
  }, [playbackRate]);

  // ─── Subtitles ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const cleanups: (() => void)[] = [];
    Array.from(video.textTracks).forEach((track) => {
      const sub = subtitles.find((st) => st.srclang === track.language);
      if (sub && sub.id === activeSubId) {
        track.mode = "hidden";
        const onCue = () => {
          const cue = track.activeCues?.[0] as VTTCue | undefined;
          setSubtitleCue(cue?.text ?? "");
        };
        track.addEventListener("cuechange", onCue);
        cleanups.push(() => track.removeEventListener("cuechange", onCue));
      } else {
        track.mode = "disabled";
      }
    });
    return () => cleanups.forEach((fn) => fn());
  }, [activeSubId, subtitles]);

  // ─── Outside-click to close panels ────────────────────────────────────────
  useEffect(() => {
    if (!openPanel) return;
    const onDown = (e: MouseEvent) => {
      if (!settingsPanelRef.current?.contains(e.target as Node)) {
        setOpenPanel(null);
      }
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [openPanel]);

  // ─── Outside-click to close episodes panel ─────────────────────────────────
  useEffect(() => {
    if (!isEpisodesOpen) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Exclude the Episodes button itself — its onClick handles the toggle
      if (
        !episodesPanelRef.current?.contains(target) &&
        !target.closest('[data-ytp-component="episodes-btn"]')
      )
        setIsEpisodesOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [isEpisodesOpen]);

  // ─── Scroll focused episode cell into view ─────────────────────────────────
  useEffect(() => {
    if (!isEpisodesOpen) return;
    episodesPanelRef.current
      ?.querySelector<HTMLElement>("[data-ep-focused]")
      ?.scrollIntoView({ block: "nearest" });
  }, [focusedEpisodeIndex, isEpisodesOpen]);

  // ─── Actions ───────────────────────────────────────────────────────────────
  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    revealChrome();
    if (v.paused) {
      v.play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
      flashBezel(false);
    } else {
      v.pause();
      setIsPlaying(false);
      flashBezel(true);
    }
  }

  function doSeek(delta: number, dir?: SeekDirection) {
    const v = videoRef.current;
    if (!v || !isFinite(v.duration)) return;
    const next = clamp(v.currentTime + delta, 0, v.duration);
    v.currentTime = next;
    setCurrentTime(next);
    revealChrome();
    const direction = dir ?? (delta > 0 ? "forward" : "back");
    showSeekOverlay(direction);
  }

  function showSeekOverlay(dir: SeekDirection) {
    setSeekDir(dir);
    if (seekTimerRef.current) window.clearTimeout(seekTimerRef.current);
    seekTimerRef.current = window.setTimeout(
      () => setSeekDir(null),
      SEEK_OVERLAY_DURATION,
    );
  }

  function flashBezel(paused: boolean) {
    setBezelPaused(paused);
    setBezelVisible(true);
    if (bezelTimerRef.current) window.clearTimeout(bezelTimerRef.current);
    bezelTimerRef.current = window.setTimeout(
      () => setBezelVisible(false),
      500,
    );
  }

  function changeVolume(next: number) {
    const safe = clamp(next, 0, 1);
    setVolume(safe);
    setIsMuted(safe <= 0.001);
    if (safe > 0) setPrevVolume(safe);
    revealVolumeSlider();
    revealChrome();
  }

  function toggleMute() {
    if (isMuted || volume <= 0.001) {
      const restored = prevVolume > 0.05 ? prevVolume : 0.65;
      setIsMuted(false);
      setVolume(restored);
    } else {
      setPrevVolume(volume);
      setIsMuted(true);
    }
    revealVolumeSlider();
    revealChrome();
  }

  function revealVolumeSlider() {
    setVolumeVisible(true);
    if (volumeTimeoutRef.current) window.clearTimeout(volumeTimeoutRef.current);
    volumeTimeoutRef.current = window.setTimeout(
      () => setVolumeVisible(false),
      1500,
    );
  }

  function toggleFullscreen() {
    const el = playerRef.current;
    const vid = videoRef.current;
    if (!el) return;

    const isCurrentlyFull =
      document.fullscreenElement === el ||
      (document as unknown as { webkitFullscreenElement: Element | null })
        .webkitFullscreenElement === el ||
      (vid as unknown as { webkitDisplayingFullscreen?: boolean })
        ?.webkitDisplayingFullscreen;

    if (isCurrentlyFull) {
      // Exit: standard → webkit prefix fallback
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else {
        (
          document as unknown as {
            webkitExitFullscreen?: () => void;
          }
        ).webkitExitFullscreen?.();
      }
    } else {
      // Enter: standard API first; on iOS Safari it throws, so fall back to
      // video.webkitEnterFullscreen() which triggers the native iOS player.
      if (el.requestFullscreen) {
        el.requestFullscreen().catch(() => {
          // Likely iOS Safari — fall back to native video fullscreen
          (
            vid as unknown as {
              webkitEnterFullscreen?: () => void;
            }
          )?.webkitEnterFullscreen?.();
        });
      } else {
        (
          vid as unknown as {
            webkitEnterFullscreen?: () => void;
          }
        )?.webkitEnterFullscreen?.();
      }
    }
    revealChrome();
  }

  function toggleTheater() {
    setIsTheater((v) => {
      onTheaterChange?.(!v);
      return !v;
    });
    setOpenPanel(null);
    revealChrome();
  }

  function cycleSubtitles() {
    if (!subtitles.length) return;
    if (!activeSubId) {
      setActiveSubId(subtitles[0]?.id ?? null);
    } else {
      const idx = subtitles.findIndex((sub) => sub.id === activeSubId);
      setActiveSubId(
        idx >= subtitles.length - 1 ? null : (subtitles[idx + 1]?.id ?? null),
      );
    }
  }

  function seekToPercent(pct: number) {
    const v = videoRef.current;
    if (!v || !isFinite(v.duration)) return;
    const next = pct * v.duration;
    v.currentTime = next;
    setCurrentTime(next);
    revealChrome();
  }

  function togglePip() {
    const v = videoRef.current;
    if (!v) return;
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture();
    } else {
      v.requestPictureInPicture?.();
    }
  }

  const {
    touchSeekDelta,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleGestureClick,
  } = useGestureControls({
    playerRef,
    chromeVisible,
    keepControlsVisible,
    revealChrome,
    togglePlay,
    changeVolume,
    doSeek,
    volume,
  });

  useKeyboardShortcuts({
    volume,
    isEpisodesOpen,
    focusedEpisodeIndex,
    episodes,
    episodesCols,
    activeEpisodeIndex,
    hasEpisodes,
    onEpisodeChange,
    onNext,
    togglePlay,
    doSeek: (delta) => doSeek(delta),
    changeVolume,
    toggleMute,
    toggleFullscreen,
    toggleTheater,
    cycleSubtitles,
    setPlaybackRate,
    setFocusedEpisodeIndex,
    setIsEpisodesOpen,
  });

  // ─── AirPlay ───────────────────────────────────────────────────────────────
  function triggerAirPlay() {
    const v = videoRef.current;
    if (!v) return;
    (
      v as unknown as { webkitShowPlaybackTargetPicker?: () => void }
    ).webkitShowPlaybackTargetPicker?.();
  }

  // ─── Chapter markers ──────────────────────────────────────────────────────
  const chapterMarkers = useMemo(() => {
    if (!chapters.length || !duration) return [];
    return chapters.slice(1).map((ch) => ({
      title: ch.title,
      pct: (ch.startTime / duration) * 100,
    }));
  }, [chapters, duration]);

  // ─── Scrubber display position (preview during touch scrub) ──────────────
  // During touch scrubbing hoverTime holds the preview position; use it so the
  // scrubber thumb and played bar follow the finger, not the media clock.
  const displayPct =
    isProgressScrubbing && hoverTime !== null && duration > 0
      ? (hoverTime / duration) * 100
      : progressPct;

  // ─── Render ────────────────────────────────────────────────────────────────
  const playerClass = [
    s.moviePlayer,
    s.ytpTransparent,
    isPlaying ? s.playingMode : s.pausedMode,
    chromeVisible || keepControlsVisible ? "" : s.ytpAutohide,
    isTheater ? s.ytpTheater : "",
    isFullscreen ? s.ytpFullscreen : "",
    cursorHidden ? s.ytpCursorHidden : "",
    openPanel || isEpisodesOpen ? s.ytpAnyPanelOpen : "",
  ]
    .filter(Boolean)
    .join(" ");

  const effectiveVolume = isMuted ? 0 : volume;

  return (
    <div
      ref={playerRef}
      className={playerClass}
      style={style}
      onPointerMove={revealChrome}
      onPointerEnter={revealChrome}
    >
      {/* ── Layer 0: video container ─────────────────────────────────────── */}
      <div className={s.html5VideoContainer} data-layer="0">
        <video
          ref={videoRef}
          className={s.html5MainVideo}
          playsInline
          poster={poster}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onLoadedMetadata={(e) => {
            const v = e.currentTarget;
            setDuration(v.duration);
            setIsLoading(false);
            if (startTime) v.currentTime = startTime;
          }}
          onTimeUpdate={(e) => {
            const v = e.currentTarget;
            setCurrentTime(v.currentTime);
            onTimeUpdate?.(v.currentTime, v.duration);
          }}
          onProgress={(e) => {
            const b = e.currentTarget.buffered;
            if (b.length > 0) setBuffered(b.end(b.length - 1));
          }}
          onWaiting={() => setIsLoading(true)}
          onCanPlay={() => setIsLoading(false)}
          onError={() => {
            setError("Video failed to load. Please try again.");
            setIsLoading(false);
          }}
          onEnded={() => {
            setIsPlaying(false);
            onEnded?.();
          }}
          onDurationChange={(e) => setDuration(e.currentTarget.duration)}
        >
          {subtitles.map((sub) => (
            <track
              key={sub.id}
              kind="subtitles"
              label={sub.label}
              srcLang={sub.srclang}
              src={sub.src}
              default={sub.id === activeSubId}
            />
          ))}
        </video>
      </div>

      {/* ── Layer 1: gradient top ─────────────────────────────────────────── */}
      <div className={s.ytpGradientTop} data-layer="1" aria-hidden="true" />

      {/* ── Layer 1: chrome top (title + author) ─────────────────────────── */}
      {(title || author) && (
        <div className={s.ytpChromeTop} data-layer="1">
          <div className={s.ytpTitle}>
            <div className={s.ytpTitleText}>
              {title && <span className={s.ytpTitleLink}>{title}</span>}
              {author && <div className={s.ytpTitleSubtext}>{author}</div>}
            </div>
          </div>
        </div>
      )}

      {/* ── Layer 2: muted-autoplay unmute prompt ─────────────────────────── */}
      {showUnmute && (
        <div className={s.ytpUnmutePrompt} data-layer="2">
          <button
            className={s.ytpUnmuteButton}
            aria-label="Unmute"
            onClick={() => {
              const v = videoRef.current;
              if (!v) return;
              v.muted = false;
              setIsMuted(false);
              setShowUnmute(false);
            }}
          >
            <MuteIcon />
            <span className={s.ytpUnmuteLabel}>Tap to unmute</span>
          </button>
        </div>
      )}

      {/* ── Layer 4: spinner ──────────────────────────────────────────────── */}
      <Spinner visible={isLoading} />

      {/* ── Layer 4: seek overlay animation ──────────────────────────────── */}
      <SeekOverlay direction={seekDir} seconds={SEEK_STEP} />

      {/* ── Layer 4: bezel (center flash) ────────────────────────────────── */}
      <Bezel visible={bezelVisible} paused={bezelPaused} />

      {/* ── Layer 4: touch seek indicator ────────────────────────────────── */}
      {touchSeekDelta !== null && (
        <div
          className={s.ytpTouchSeekIndicator}
          data-layer="4"
          aria-hidden="true"
        >
          <span className={s.ytpTouchSeekDelta}>
            {touchSeekDelta >= 0 ? "+" : ""}
            {Math.round(touchSeekDelta)}s
          </span>
          <span className={s.ytpTouchSeekTarget}>
            → {formatTime(clamp(currentTime + touchSeekDelta, 0, duration))}
          </span>
        </div>
      )}

      {/* ── Layer 4: error banner ─────────────────────────────────────────── */}
      {error && (
        <div className={s.ytpErrorDisplay} data-layer="4" role="alert">
          <div className={s.ytpErrorContent}>
            <svg viewBox="0 0 24 24" width="48" height="48" aria-hidden="true">
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
                fill="white"
              />
            </svg>
            <p>{error}</p>
            <button
              className={s.ytpErrorRetry}
              onClick={() => {
                retrySourceLoad();
              }}
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* ── Layer 4: subtitle cue ─────────────────────────────────────────── */}
      {subtitleCue && activeSubId && (
        <div
          className={`${s.ytpCaptionsWindow} ${chromeVisible ? s.ytpCaptionsWindowAbove : ""}`}
          data-layer="4"
          aria-live="polite"
        >
          <span
            className={s.ytpCaptionSegment}
            dangerouslySetInnerHTML={{ __html: subtitleCue }}
          />
        </div>
      )}

      {/* ── Layer 5: episodes panel (bottom-left, desktop only) ───────────── */}
      {isEpisodesOpen && hasEpisodes && (
        <div
          ref={episodesPanelRef}
          className={s.ytpEpisodesPanel}
          data-layer="5"
          role="dialog"
          aria-label="Episodes"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div
            className={s.ytpEpisodesGrid}
            role="listbox"
            style={
              { "--_ep-cols": episodesCols } as CSSProperties
            }
          >
            {episodes!.map((_, i) => (
              <button
                key={i}
                role="option"
                aria-selected={i === activeEpisodeIndex}
                className={`${s.ytpEpisodeItem}${i === activeEpisodeIndex ? ` ${s.ytpEpisodeActive}` : ""}${i === focusedEpisodeIndex ? ` ${s.ytpEpisodeFocused}` : ""}`}
                data-ep-focused={i === focusedEpisodeIndex ? "" : undefined}
                onClick={() => {
                  onEpisodeChange?.(i);
                  setIsEpisodesOpen(false);
                }}
                onMouseEnter={() => setFocusedEpisodeIndex(i)}
              >
                {String(i + 1).padStart(2, "0")}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Layer 5: settings panel ───────────────────────────────────────── */}
      {openPanel && (
        <div
          ref={settingsPanelRef}
          className={`${s.ytpSettingsMenu} ${s.ytpPopup}`}
          data-layer="5"
          role="dialog"
          aria-label="Settings"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className={s.ytpFocusTrap} tabIndex={0} />
          <div className={s.ytpPanelMenu} role="menu">
            {/* Main settings panel */}
            {openPanel === "settings" && (
              <>
                {qualities.length > 0 && (
                  <div
                    className={s.ytpMenuItem}
                    role="menuitem"
                    tabIndex={0}
                    onClick={() => setOpenPanel("quality")}
                    onKeyDown={(e) =>
                      e.key === "Enter" && setOpenPanel("quality")
                    }
                  >
                    <span className={s.ytpMenuItemLabel}>Quality</span>
                    <span className={s.ytpMenuItemValue}>
                      {qualities.find((q) => q.id === activeQualityId)?.label ??
                        "Auto"}
                    </span>
                    <svg
                      viewBox="0 0 24 24"
                      width="16"
                      height="16"
                      aria-hidden="true"
                      className={s.ytpMenuChevron}
                    >
                      <path
                        d="M9.71 18.71l-1.42-1.42 5.3-5.29-5.3-5.29 1.42-1.42 6.7 6.71z"
                        fill="white"
                      />
                    </svg>
                  </div>
                )}
                {subtitles.length > 0 && (
                  <div
                    className={s.ytpMenuItem}
                    role="menuitem"
                    tabIndex={0}
                    onClick={() => setOpenPanel("subtitles")}
                    onKeyDown={(e) =>
                      e.key === "Enter" && setOpenPanel("subtitles")
                    }
                  >
                    <span className={s.ytpMenuItemLabel}>Subtitles/CC</span>
                    <span className={s.ytpMenuItemValue}>
                      {activeSubId
                        ? subtitles.find((sub) => sub.id === activeSubId)?.label
                        : "Off"}
                    </span>
                    <svg
                      viewBox="0 0 24 24"
                      width="16"
                      height="16"
                      aria-hidden="true"
                      className={s.ytpMenuChevron}
                    >
                      <path
                        d="M9.71 18.71l-1.42-1.42 5.3-5.29-5.3-5.29 1.42-1.42 6.7 6.71z"
                        fill="white"
                      />
                    </svg>
                  </div>
                )}
                <div
                  className={s.ytpMenuItem}
                  role="menuitem"
                  tabIndex={0}
                  onClick={() => setOpenPanel("speed")}
                  onKeyDown={(e) => e.key === "Enter" && setOpenPanel("speed")}
                >
                  <span className={s.ytpMenuItemLabel}>Playback speed</span>
                  <span className={s.ytpMenuItemValue}>
                    {formatRate(playbackRate)}
                  </span>
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    aria-hidden="true"
                    className={s.ytpMenuChevron}
                  >
                    <path
                      d="M9.71 18.71l-1.42-1.42 5.3-5.29-5.3-5.29 1.42-1.42 6.7 6.71z"
                      fill="white"
                    />
                  </svg>
                </div>
              </>
            )}

            {/* Quality sub-panel */}
            {openPanel === "quality" && (
              <>
                <div
                  className={s.ytpMenuHeader}
                  role="menuitem"
                  tabIndex={0}
                  onClick={() => setOpenPanel("settings")}
                  onKeyDown={(e) =>
                    e.key === "Enter" && setOpenPanel("settings")
                  }
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    aria-hidden="true"
                    className={s.ytpMenuBack}
                  >
                    <path
                      d="M14.29 5.29L12.88 3.88 5.76 11l7.12 7.12 1.41-1.41L8.58 11z"
                      fill="white"
                    />
                  </svg>
                  <span>Quality</span>
                </div>
                {qualities.map((q) => (
                  <div
                    key={q.id}
                    className={`${s.ytpMenuItem} ${q.id === activeQualityId ? s.ytpMenuItemActive : ""}`}
                    role="menuitemradio"
                    aria-checked={q.id === activeQualityId}
                    tabIndex={0}
                    onClick={() => {
                      onQualityChange?.(q.id);
                      setOpenPanel("settings");
                    }}
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      (onQualityChange?.(q.id), setOpenPanel("settings"))
                    }
                  >
                    {q.id === activeQualityId && (
                      <svg
                        viewBox="0 0 24 24"
                        width="16"
                        height="16"
                        aria-hidden="true"
                        className={s.ytpMenuCheck}
                      >
                        <path
                          d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
                          fill="white"
                        />
                      </svg>
                    )}
                    <span className={s.ytpMenuItemLabel}>{q.label}</span>
                  </div>
                ))}
              </>
            )}

            {/* Subtitles sub-panel */}
            {openPanel === "subtitles" && (
              <>
                <div
                  className={s.ytpMenuHeader}
                  role="menuitem"
                  tabIndex={0}
                  onClick={() => setOpenPanel("settings")}
                  onKeyDown={(e) =>
                    e.key === "Enter" && setOpenPanel("settings")
                  }
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    aria-hidden="true"
                    className={s.ytpMenuBack}
                  >
                    <path
                      d="M14.29 5.29L12.88 3.88 5.76 11l7.12 7.12 1.41-1.41L8.58 11z"
                      fill="white"
                    />
                  </svg>
                  <span>Subtitles/CC</span>
                </div>
                <div
                  className={`${s.ytpMenuItem} ${!activeSubId ? s.ytpMenuItemActive : ""}`}
                  role="menuitemradio"
                  aria-checked={!activeSubId}
                  tabIndex={0}
                  onClick={() => {
                    setActiveSubId(null);
                    setOpenPanel("settings");
                  }}
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    (setActiveSubId(null), setOpenPanel("settings"))
                  }
                >
                  {!activeSubId && (
                    <svg
                      viewBox="0 0 24 24"
                      width="16"
                      height="16"
                      aria-hidden="true"
                      className={s.ytpMenuCheck}
                    >
                      <path
                        d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
                        fill="white"
                      />
                    </svg>
                  )}
                  <span className={s.ytpMenuItemLabel}>Off</span>
                </div>
                {subtitles.map((sub) => (
                  <div
                    key={sub.id}
                    className={`${s.ytpMenuItem} ${sub.id === activeSubId ? s.ytpMenuItemActive : ""}`}
                    role="menuitemradio"
                    aria-checked={sub.id === activeSubId}
                    tabIndex={0}
                    onClick={() => {
                      setActiveSubId(sub.id);
                      setOpenPanel("settings");
                    }}
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      (setActiveSubId(sub.id), setOpenPanel("settings"))
                    }
                  >
                    {sub.id === activeSubId && (
                      <svg
                        viewBox="0 0 24 24"
                        width="16"
                        height="16"
                        aria-hidden="true"
                        className={s.ytpMenuCheck}
                      >
                        <path
                          d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
                          fill="white"
                        />
                      </svg>
                    )}
                    <span className={s.ytpMenuItemLabel}>{sub.label}</span>
                  </div>
                ))}
              </>
            )}

            {/* Speed sub-panel */}
            {openPanel === "speed" && (
              <>
                <div
                  className={s.ytpMenuHeader}
                  role="menuitem"
                  tabIndex={0}
                  onClick={() => setOpenPanel("settings")}
                  onKeyDown={(e) =>
                    e.key === "Enter" && setOpenPanel("settings")
                  }
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    aria-hidden="true"
                    className={s.ytpMenuBack}
                  >
                    <path
                      d="M14.29 5.29L12.88 3.88 5.76 11l7.12 7.12 1.41-1.41L8.58 11z"
                      fill="white"
                    />
                  </svg>
                  <span>Playback speed</span>
                </div>
                {SPEED_PRESETS.map((rate) => (
                  <div
                    key={rate}
                    className={`${s.ytpMenuItem} ${Math.abs(playbackRate - rate) < 0.01 ? s.ytpMenuItemActive : ""}`}
                    role="menuitemradio"
                    aria-checked={Math.abs(playbackRate - rate) < 0.01}
                    tabIndex={0}
                    onClick={() => {
                      setPlaybackRate(rate);
                      setOpenPanel("settings");
                    }}
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      (setPlaybackRate(rate), setOpenPanel("settings"))
                    }
                  >
                    {Math.abs(playbackRate - rate) < 0.01 && (
                      <svg
                        viewBox="0 0 24 24"
                        width="16"
                        height="16"
                        aria-hidden="true"
                        className={s.ytpMenuCheck}
                      >
                        <path
                          d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
                          fill="white"
                        />
                      </svg>
                    )}
                    <span className={s.ytpMenuItemLabel}>
                      {formatRate(rate)}
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
          <div className={s.ytpFocusTrap} tabIndex={0} />
        </div>
      )}

      {/* ── Layer 9: gradient bottom ──────────────────────────────────────── */}
      <div className={s.ytpGradientBottom} data-layer="9" aria-hidden="true" />

      {/* ── Layer 3: gesture layer (click / touch) ────────────────────────── */}
      <div
        className={s.ytpGestureLayer}
        data-layer="3"
        aria-hidden="true"
        onClick={handleGestureClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      {/* ── Layer 9: chrome bottom ────────────────────────────────────────── */}
      <div className={s.ytpChromeBottom} data-layer="9">
        {/* ── Progress bar container ──────────────────────────────────────── */}
        <div
          ref={progressContainerRef}
          className={`${s.ytpProgressBarContainer} ${isProgressScrubbing ? s.ytpProgressBarScrubbing : ""}`}
          data-ytp-component="progress-bar"
          onTouchStart={handleProgressTouchStart}
          onTouchMove={handleProgressTouchMove}
          onTouchEnd={handleProgressTouchEnd}
        >
          <div
            ref={progressRailRef}
            className={s.ytpProgressBar}
            role="slider"
            tabIndex={0}
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={Math.floor(duration)}
            aria-valuenow={Math.floor(currentTime)}
            aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
            onPointerDown={handleProgressPointerDown}
            onPointerMove={handleProgressPointerMove}
            onPointerUp={handleProgressPointerUp}
            onPointerCancel={handleProgressPointerUp}
            onMouseMove={handleProgressHover}
            onMouseLeave={handleProgressMouseLeave}
            onClick={(e) => {
              // Skip if a pointer-drag just ended (pointerUp already seeked)
              if (progressScrubActiveRef.current) return;
              const rect = progressRailRef.current?.getBoundingClientRect();
              if (!rect) return;
              seekToPercent(clamp((e.clientX - rect.left) / rect.width, 0, 1));
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") doSeek(-SEEK_STEP);
              if (e.key === "ArrowRight") doSeek(SEEK_STEP);
            }}
          >
            <div className={s.ytpChaptersContainer}>
              <div className={s.ytpChapterHoverContainer}>
                <div className={s.ytpProgressBarPadding} />
                <div className={s.ytpProgressList}>
                  {/* Buffered */}
                  <div
                    className={s.ytpLoadProgress}
                    style={{ transform: `scaleX(${bufferedPct / 100})` }}
                  />
                  {/* Played — follows finger during touch scrubbing */}
                  <div
                    className={s.ytpPlayProgress}
                    style={{ transform: `scaleX(${displayPct / 100})` }}
                  />
                  {/* Hover ghost */}
                  {hoverTime !== null && (
                    <div
                      className={s.ytpHoverProgress}
                      style={{
                        transform: `scaleX(${hoverX / (progressRailRef.current?.clientWidth ?? 1)})`,
                      }}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Chapter markers */}
            {chapterMarkers.map((ch) => (
              <div
                key={ch.title}
                className={s.ytpChapterMarker}
                style={{ left: `${ch.pct}%` }}
                title={ch.title}
              />
            ))}

            {/* Scrubber thumb — follows finger during touch scrubbing */}
            <div
              className={s.ytpScrubberContainer}
              style={{ left: `${displayPct}%` }}
            >
              <div className={s.ytpScrubberButton} />
            </div>

            {/* Hover time tooltip (+ optional thumbnail) */}
            {hoverTime !== null && (() => {
              const thumb = getThumbnailAt(hoverTime);
              const railW = progressRailRef.current?.clientWidth ?? 300;
              const clampPx = thumb ? THUMB_CLAMP_PX : 40;
              return (
                <div
                  className={s.ytpProgressTooltipWrap}
                  style={{ left: `${clamp(hoverX, clampPx, railW - clampPx)}px` }}
                >
                  {thumb && (
                    <div className={s.ytpThumbnailPreview}>
                      <img
                        src={thumb.url}
                        className={s.ytpThumbnailImg}
                        alt=""
                        draggable={false}
                        style={
                          thumb.x !== undefined
                            ? {
                                objectFit: "none",
                                objectPosition: `-${thumb.x}px -${thumb.y}px`,
                                width: thumb.w,
                                height: thumb.h,
                              }
                            : undefined
                        }
                      />
                    </div>
                  )}
                  <div className={s.ytpTooltipProgressBar}>
                    <div className={s.ytpTooltipProgressText}>
                      {formatTime(hoverTime)}
                    </div>
                    {hoverChapter && (
                      <div className={s.ytpTooltipChapterTitle}>
                        {hoverChapter.title}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* ── Controls ───────────────────────────────────────────────────── */}
        <div className={s.ytpChromeControls}>
          {/* Left controls */}
          <div className={s.ytpLeftControls}>
            {/* Play/Pause */}
            <YtpButton
              tooltip={isPlaying ? "Pause (K)" : "Play (K)"}
              onClick={togglePlay}
              ariaLabel={isPlaying ? "Pause" : "Play"}
              className={s.ytpPlayButton}
              data-ytp-component="play-btn"
            >
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </YtpButton>

            {/* ── Next + Episodes group ─────────────────────────────────── */}
            {(onNext || hasEpisodes) && (
              <div className={s.ytpNextEpisodesGroup}>
                {/* Next — only shown when caller provides onNext */}
                {onNext && (
                  <YtpButton
                    tooltip="Next (SHIFT+N)"
                    ariaLabel="Next"
                    onClick={onNext}
                    className={s.ytpNextButton}
                    data-ytp-component="next-btn"
                  >
                    <NextIcon />
                  </YtpButton>
                )}
                {/* Episodes — slide wrapper mirrors the volume-slider reveal mechanism */}
                {hasEpisodes && (
                  <div
                    className={`${s.ytpEpisodesSlide}${onNext && !isEpisodesOpen ? ` ${s.ytpEpisodesReveal}` : ""}`}
                  >
                    <YtpButton
                      tooltip="Episodes (E)"
                      ariaLabel="Episodes"
                      onClick={() =>
                        setIsEpisodesOpen((v) => {
                          if (!v) setFocusedEpisodeIndex(activeEpisodeIndex);
                          return !v;
                        })
                      }
                      className={s.ytpEpisodesButton}
                      data-ytp-component="episodes-btn"
                    >
                      <EpisodesIcon />
                    </YtpButton>
                  </div>
                )}
              </div>
            )}

            {/* Volume area — CSS hides on pointer:coarse (mobile system handles volume) */}
            <span
              className={`${s.ytpVolumeArea} ${volumeVisible ? s.ytpVolumeAreaExpanded : ""}`}
              data-ytp-component="volume-area"
            >
              <div className={s.ytpMuteButton}>
                <YtpButton
                  tooltip={isMuted ? "Unmute (M)" : "Mute (M)"}
                  onClick={toggleMute}
                  onMouseEnter={revealVolumeSlider}
                >
                  {isMuted || volume <= 0.001 ? (
                    <MuteIcon />
                  ) : (
                    <VolumeIcon volume={volume} />
                  )}
                </YtpButton>
              </div>
              <div
                className={s.ytpVolumePanel}
                role="slider"
                aria-label="Volume"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(effectiveVolume * 100)}
                aria-valuetext={`${Math.round(effectiveVolume * 100)}% volume`}
                onMouseEnter={revealVolumeSlider}
              >
                <div className={s.ytpVolumeSlider}>
                  <input
                    id={sliderId}
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={effectiveVolume}
                    className={s.ytpVolumeInput}
                    onChange={(e) =>
                      changeVolume(Number(e.currentTarget.value))
                    }
                    aria-label="Volume"
                  />
                  <div
                    className={s.ytpVolumeSliderFill}
                    style={{ width: `${effectiveVolume * 100}%` }}
                  />
                  <div
                    className={s.ytpVolumeSliderHandle}
                    style={{ left: `${effectiveVolume * 100}%` }}
                  />
                </div>
              </div>
            </span>

            {/* Time display — click to toggle elapsed / remaining */}
            <div
              className={s.ytpTimeDisplay}
              onClick={() => setShowRemaining((v) => !v)}
              title={showRemaining ? "Show elapsed time" : "Show remaining time"}
              data-ytp-component="time-display"
            >
              <div className={s.ytpTimeWrapper}>
                <div className={s.ytpTimeContents}>
                  <span className={s.ytpTimeCurrent}>
                    {showRemaining
                      ? `-${formatTime(duration - currentTime)}`
                      : formatTime(currentTime)}
                  </span>
                  <span className={s.ytpTimeSeparator}> / </span>
                  <span className={s.ytpTimeDuration}>
                    {formatTime(duration)}
                  </span>
                </div>
              </div>
            </div>

            {/* Chapter title */}
            {activeChapter && (
              <div className={s.ytpChapterContainer}>
                <button
                  className={s.ytpChapterTitle}
                  type="button"
                  aria-label="Chapter"
                >
                  <span className={s.ytpChapterTitlePrefix} aria-hidden="true">
                    •
                  </span>
                  <span className={s.ytpChapterTitleContent}>
                    {activeChapter.title}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Right controls */}
          <div className={s.ytpRightControls} data-ytp-component="right-controls">
            <div className={s.ytpRightControlsLeft}>
              {/* Subtitles */}
              {subtitles.length > 0 && (
                <YtpButton
                  tooltip="Subtitles/closed captions (C)"
                  onClick={cycleSubtitles}
                  ariaPressed={!!activeSubId}
                >
                  <SubtitlesIcon active={!!activeSubId} />
                </YtpButton>
              )}

              {/* Settings */}
              <YtpButton
                tooltip="Settings"
                onClick={() => setOpenPanel((p) => (p ? null : "settings"))}
                ariaPressed={!!openPanel}
                className={openPanel ? s.ytpSettingsButtonActive : ""}
              >
                <SettingsIcon />
              </YtpButton>
            </div>

            <div className={s.ytpRightControlsRight}>
              {/* Theater mode — hidden in fullscreen and on touch devices (CSS) */}
              {!isFullscreen && (
                <YtpButton
                  tooltip={isTheater ? "Default view (T)" : "Theater mode (T)"}
                  onClick={toggleTheater}
                  ariaPressed={isTheater}
                  className={s.ytpTheaterButton}
                >
                  <TheaterIcon active={isTheater} />
                </YtpButton>
              )}

              {/* AirPlay — iOS Safari only */}
              {airPlayAvailable && (
                <YtpButton tooltip="AirPlay" onClick={triggerAirPlay}>
                  <AirPlayIcon />
                </YtpButton>
              )}

              {/* PiP */}
              {"pictureInPictureEnabled" in document && (
                <YtpButton tooltip="Picture-in-picture" onClick={togglePip}>
                  <PipIcon />
                </YtpButton>
              )}

              {/* Fullscreen */}
              <YtpButton
                tooltip={
                  isFullscreen ? "Exit full screen (F)" : "Full screen (F)"
                }
                onClick={toggleFullscreen}
                ariaPressed={isFullscreen}
              >
                <FullscreenIcon active={isFullscreen} />
              </YtpButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
