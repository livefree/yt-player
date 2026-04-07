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
  type MouseEvent as ReactMouseEvent,
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
  SEEK_STEP,
  SEEK_OVERLAY_DURATION,
  EPISODES_COLS_SMALL,
  EPISODES_COLS_LARGE,
  EPISODES_COLS_THRESHOLD,
} from "./utils/format";
import { useThumbnails } from "./hooks/useThumbnails";
import { useSourceLoader } from "./hooks/useSourceLoader";
import { useProgressInteractions } from "./hooks/useProgressInteractions";
import { useGestureControls } from "./hooks/useGestureControls";
import { useChromeVisibility } from "./hooks/useChromeVisibility";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useSystemIntegrations } from "./hooks/useSystemIntegrations";
import {
  useLayoutDecision,
  type ControlId,
} from "./hooks/useLayoutDecision";
import {
  buildOverlayEntries,
  useOverlayManager,
} from "./hooks/useOverlayManager";
import { useInputRouter } from "./hooks/useInputRouter";
import { Spinner } from "./components/Spinner";
import { SeekOverlay } from "./components/SeekOverlay";
import { Bezel } from "./components/Bezel";
import { YtpButton } from "./components/Button";
import { EpisodesPanel } from "./components/EpisodesPanel";
import { SettingsPanel } from "./components/SettingsPanel";
import { ProgressBar } from "./components/ProgressBar";
import { ControlSlot } from "./components/ControlSlot";
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

type LoadingState = "idle" | "initial" | "buffering";

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
  const autoplayContextRef = useRef<"implicit" | "user-initiated">("implicit");
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const episodesButtonRef = useRef<HTMLButtonElement>(null);
  const prevOpenPanelRef = useRef<Panel | null>(null);
  const prevEpisodesOpenRef = useRef(false);

  // ── Panels ─────────────────────────────────────────────────────────────────
  const [openPanel, setOpenPanel] = useState<Panel>(null);
  const settingsPanelRef = useRef<HTMLDivElement>(null);

  // ── Playback state ─────────────────────────────────────────────────────────
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(startTime ?? 0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
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
  const settingsPanelId = useId();
  const episodesPanelId = useId();

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

  const hasEpisodes = (episodes?.length ?? 0) > 0;
  const hasNext = !!onNext;
  const episodesCols =
    (episodes?.length ?? 0) > EPISODES_COLS_THRESHOLD
      ? EPISODES_COLS_LARGE
      : EPISODES_COLS_SMALL;
  const layoutDecision = useLayoutDecision({
    playerRef,
    isFullscreen,
    isTheater,
    hasEpisodes,
    hasNext,
  });

  const { chromeVisible, cursorHidden, revealChrome } = useChromeVisibility({
    chromeVisibilityPolicy: layoutDecision.chromeVisibilityPolicy,
    isPlaying,
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
    autoplayContextRef,
    src,
    startTime,
    autoplay,
    setError,
    setLoadingState,
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
    const video = videoRef.current;
    if (!video) return;

    const syncVolumeState = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
      if (!video.muted) setShowUnmute(false);
    };

    video.addEventListener("volumechange", syncVolumeState);
    return () => video.removeEventListener("volumechange", syncVolumeState);
  }, []);

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
      const target = e.target as HTMLElement;
      if (
        !settingsPanelRef.current?.contains(target) &&
        !target.closest('[data-ytp-component="settings-btn"]')
      ) {
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

  useEffect(() => {
    if (prevOpenPanelRef.current && !openPanel) {
      settingsButtonRef.current?.focus();
    }
    prevOpenPanelRef.current = openPanel;
  }, [openPanel]);

  useEffect(() => {
    if (prevEpisodesOpenRef.current && !isEpisodesOpen) {
      episodesButtonRef.current?.focus();
    }
    prevEpisodesOpenRef.current = isEpisodesOpen;
  }, [isEpisodesOpen]);

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
    setShowUnmute(false);
    if (safe > 0) setPrevVolume(safe);
    revealVolumeSlider();
    revealChrome();
  }

  function toggleMute() {
    setShowUnmute(false);
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

  function handleProgressClick(event: ReactMouseEvent<HTMLDivElement>) {
    const rect = progressRailRef.current?.getBoundingClientRect();
    if (!rect) return;
    seekToPercent(clamp((event.clientX - rect.left) / rect.width, 0, 1));
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

  const gestureBlockingOverlayVisible = buildOverlayEntries({
    chromeVisible,
    loadingState,
    error,
    hasTopChrome:
      (layoutDecision.slots["top-left"].includes("title") && !!(title || author)) ||
      layoutDecision.slots["top-right"].length > 0,
    showBezel: bezelVisible,
    seekVisible: seekDir !== null,
    showTouchSeekIndicator: false,
    showCaptions: !!subtitleCue && !!activeSubId,
    showUnmute,
    openPanel: !!openPanel,
    isEpisodesOpen,
    settingsPlacement: layoutDecision.placements.settingsPanel,
    episodesPlacement: layoutDecision.placements.episodesPanel,
  }).some((entry) => entry.visible && entry.blocksGestures);

  const {
    touchSeekDelta,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleGestureClick,
  } = useGestureControls({
    allowVolumeGesture: !layoutDecision.mode.startsWith("mobile"),
    playerRef,
    gesturesBlocked: gestureBlockingOverlayVisible,
    revealChrome,
    togglePlay,
    changeVolume,
    doSeek,
    volume,
  });

  const {
    captionPlacement,
    blocksGestures,
    promptPlacement,
    stackMode,
    topOverlay,
    isVisible: isOverlayVisible,
  } = useOverlayManager({
    chromeVisible,
    loadingState,
    error,
    hasTopChrome:
      (layoutDecision.slots["top-left"].includes("title") && !!(title || author)) ||
      layoutDecision.slots["top-right"].length > 0,
    showBezel: bezelVisible,
    seekVisible: seekDir !== null,
    showTouchSeekIndicator: touchSeekDelta !== null,
    showCaptions: !!subtitleCue && !!activeSubId,
    showUnmute,
    openPanel: !!openPanel,
    isEpisodesOpen,
    settingsPlacement: layoutDecision.placements.settingsPanel,
    episodesPlacement: layoutDecision.placements.episodesPanel,
  });
  const inputRouter = useInputRouter({
    blocksGestures,
    chromeVisible,
    interactionPolicy: layoutDecision.interactionPolicy,
    keepControlsVisible,
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

  function handleEpisodeChange(nextIndex: number) {
    autoplayContextRef.current = "user-initiated";
    onEpisodeChange?.(nextIndex);
  }

  const isManagedHlsSource =
    !!src &&
    src.includes(".m3u8") &&
    videoRef.current?.canPlayType("application/vnd.apple.mpegurl") === "";

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
  const toggleEpisodes = () =>
    setIsEpisodesOpen((value) => {
      if (!value) setFocusedEpisodeIndex(activeEpisodeIndex);
      return !value;
    });

  const renderControl = (control: ControlId) => {
    switch (control) {
      case "play":
        return (
          <YtpButton
            key="play"
            tooltip={isPlaying ? "Pause (K)" : "Play (K)"}
            onClick={togglePlay}
            ariaLabel={isPlaying ? "Pause" : "Play"}
            className={s.ytpPlayButton}
            data-ytp-component="play-btn"
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </YtpButton>
        );
      case "next":
        return hasNext ? (
          <YtpButton
            key="next"
            tooltip="Next (SHIFT+N)"
            ariaLabel="Next"
            onClick={onNext}
            className={s.ytpNextButton}
            data-ytp-component="next-btn"
          >
            <NextIcon />
          </YtpButton>
        ) : null;
      case "episodes": {
        if (!hasEpisodes) return null;
        const inBottomLeft = layoutDecision.slots["bottom-left"].includes("episodes");
        return (
          <div
            key="episodes"
            className={
              inBottomLeft
                ? `${s.ytpEpisodesSlide}${hasNext && !isEpisodesOpen ? ` ${s.ytpEpisodesReveal}` : ""}`
                : ""
            }
          >
            <YtpButton
              tooltip="Episodes (E)"
              ariaLabel="Episodes"
              onClick={toggleEpisodes}
              className={s.ytpEpisodesButton}
              data-ytp-component="episodes-btn"
              ref={episodesButtonRef}
              aria-haspopup="dialog"
              aria-expanded={isEpisodesOpen}
              aria-controls={episodesPanelId}
          >
              <EpisodesIcon />
            </YtpButton>
          </div>
        );
      }
      case "volume":
        return (
          <span
            key="volume"
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
                  onChange={(e) => changeVolume(Number(e.currentTarget.value))}
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
        );
      case "time":
        return (
          <div
            key="time"
            className={s.ytpTimeDisplay}
            onClick={() => setShowRemaining((value) => !value)}
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
                <span className={s.ytpTimeDuration}>{formatTime(duration)}</span>
              </div>
            </div>
          </div>
        );
      case "chapter":
        return activeChapter ? (
          <div key="chapter" className={s.ytpChapterContainer}>
            <button className={s.ytpChapterTitle} type="button" aria-label="Chapter">
              <span className={s.ytpChapterTitlePrefix} aria-hidden="true">
                •
              </span>
              <span className={s.ytpChapterTitleContent}>{activeChapter.title}</span>
            </button>
          </div>
        ) : null;
      case "subtitles":
        return subtitles.length > 0 ? (
          <YtpButton
            key="subtitles"
            tooltip="Subtitles/closed captions (C)"
            onClick={cycleSubtitles}
            ariaPressed={!!activeSubId}
            data-ytp-component="subtitles-btn"
          >
            <SubtitlesIcon active={!!activeSubId} />
          </YtpButton>
        ) : null;
      case "settings":
        return (
          <YtpButton
            key="settings"
            tooltip="Settings"
            onClick={() => setOpenPanel((panel) => (panel ? null : "settings"))}
            ariaPressed={!!openPanel}
            className={openPanel ? s.ytpSettingsButtonActive : ""}
            data-ytp-component="settings-btn"
            ref={settingsButtonRef}
            aria-haspopup="dialog"
            aria-expanded={!!openPanel}
            aria-controls={settingsPanelId}
          >
            <SettingsIcon />
          </YtpButton>
        );
      case "theater":
        return (
          <YtpButton
            key="theater"
            tooltip={isTheater ? "Default view (T)" : "Theater mode (T)"}
            onClick={toggleTheater}
            ariaPressed={isTheater}
            className={s.ytpTheaterButton}
            data-ytp-component="theater-btn"
          >
            <TheaterIcon active={isTheater} />
          </YtpButton>
        );
      case "airplay":
        return airPlayAvailable ? (
          <YtpButton
            key="airplay"
            tooltip="AirPlay"
            onClick={triggerAirPlay}
            data-ytp-component="airplay-btn"
          >
            <AirPlayIcon />
          </YtpButton>
        ) : null;
      case "pip":
        return "pictureInPictureEnabled" in document ? (
          <YtpButton
            key="pip"
            tooltip="Picture-in-picture"
            onClick={togglePip}
            data-ytp-component="pip-btn"
          >
            <PipIcon />
          </YtpButton>
        ) : null;
      case "fullscreen":
        return (
          <YtpButton
            key="fullscreen"
            tooltip={isFullscreen ? "Exit full screen (F)" : "Full screen (F)"}
            onClick={toggleFullscreen}
            ariaPressed={isFullscreen}
            data-ytp-component="fullscreen-btn"
          >
            <FullscreenIcon active={isFullscreen} />
          </YtpButton>
        );
      case "title":
        return null;
      default:
        return null;
    }
  };
  const topRightControls = layoutDecision.slots["top-right"]
    .map(renderControl)
    .filter(Boolean);
  const bottomLeftSlot = layoutDecision.slots["bottom-left"];
  const playControl = bottomLeftSlot.includes("play") ? renderControl("play") : null;
  const bottomLeftControls = bottomLeftSlot
    .filter(
      (control) =>
        control !== "play" && control !== "next" && control !== "episodes",
    )
    .map(renderControl)
    .filter(Boolean);
  const bottomRightControls = layoutDecision.slots["bottom-right"]
    .map(renderControl)
    .filter(Boolean);
  const hasTopInteractiveControls = topRightControls.length > 0;
  const showNextEpisodesGroup =
    bottomLeftSlot.includes("next") || bottomLeftSlot.includes("episodes");
  const nextControl = bottomLeftSlot.includes("next") ? renderControl("next") : null;
  const episodesControl = bottomLeftSlot.includes("episodes")
    ? renderControl("episodes")
    : null;

  return (
    <div
      ref={playerRef}
      className={playerClass}
      data-layout-mode={layoutDecision.mode}
      data-layout-panels={layoutDecision.compactPanels ? "compact" : "default"}
      data-layout-density={layoutDecision.density}
      data-layout-profile={layoutDecision.profile}
      data-interaction-policy={layoutDecision.interactionPolicy}
      data-chrome-policy={layoutDecision.chromePolicy}
      data-chrome-pause-behavior={
        layoutDecision.chromeVisibilityPolicy.pausedBehavior
      }
      data-chrome-hide-delay={String(
        layoutDecision.chromeVisibilityPolicy.hideDelayMs,
      )}
      data-layout-width={layoutDecision.constraints.width}
      data-layout-height={layoutDecision.constraints.height}
      data-loading-state={loadingState}
      data-overlay-top={topOverlay ?? undefined}
      data-overlay-stack={stackMode}
      data-overlay-gestures-blocked={blocksGestures ? "true" : "false"}
      data-overlay-caption-placement={captionPlacement}
      data-overlay-prompt-placement={promptPlacement}
      data-input-device-policy={inputRouter.devicePolicy}
      data-input-zones={inputRouter.zones.join(",")}
      data-top-controls-interactive={hasTopInteractiveControls ? "true" : "false"}
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
          onPlay={() => {
            setIsPlaying(true);
            setLoadingState("idle");
          }}
          onPlaying={() => {
            setIsPlaying(true);
            setLoadingState("idle");
          }}
          onPause={() => setIsPlaying(false)}
          onLoadStart={() => {
            setLoadingState("initial");
            setError(null);
          }}
          onLoadedMetadata={(e) => {
            const v = e.currentTarget;
            setDuration(v.duration);
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
          onWaiting={() =>
            setLoadingState((value) =>
              value === "initial" ? value : "buffering",
            )
          }
          onCanPlay={() => setLoadingState("idle")}
          onError={() => {
            if (isManagedHlsSource) return;
            setError("Video failed to load. Please try again.");
            setLoadingState("idle");
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
      {(layoutDecision.slots["top-left"].includes("title") && (title || author)) ||
      topRightControls.length > 0 ? (
        <div className={s.ytpChromeTop} data-layer="1">
          {layoutDecision.slots["top-left"].includes("title") && (title || author) && (
            <div className={s.ytpTitle}>
              <div className={s.ytpTitleText}>
                {title && <span className={s.ytpTitleLink}>{title}</span>}
                {author && <div className={s.ytpTitleSubtext}>{author}</div>}
              </div>
            </div>
          )}
          {topRightControls.length > 0 && (
            <ControlSlot slot="top-right">{topRightControls}</ControlSlot>
          )}
        </div>
      ) : null}

      {/* ── Layer 5: muted-autoplay unmute prompt ─────────────────────────── */}
      {isOverlayVisible("unmute-prompt") && (
        <div
          className={[
            s.ytpUnmutePrompt,
            promptPlacement === "below-top-chrome-right"
              ? s.ytpUnmutePromptBelowTopChrome
              : "",
            promptPlacement === "below-top-chrome-left"
              ? s.ytpUnmutePromptBelowTopChromeLeft
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
          data-layer="5"
        >
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
      <Spinner visible={isOverlayVisible("spinner")} state={loadingState} />

      {/* ── Layer 4: seek overlay animation ──────────────────────────────── */}
      <SeekOverlay
        direction={isOverlayVisible("seek-indicator") ? seekDir : null}
        seconds={SEEK_STEP}
      />

      {/* ── Layer 4: bezel (center flash) ────────────────────────────────── */}
      <Bezel visible={isOverlayVisible("bezel")} paused={bezelPaused} />

      {/* ── Layer 4: touch seek indicator ────────────────────────────────── */}
      {isOverlayVisible("touch-seek") && touchSeekDelta !== null && (
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
      {isOverlayVisible("error") && error && (
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
      {isOverlayVisible("captions") && subtitleCue && activeSubId && (
        <div
          className={[
            s.ytpCaptionsWindow,
            captionPlacement === "above-chrome" ? s.ytpCaptionsWindowAbove : "",
            captionPlacement === "raised-for-bottom-overlay"
              ? s.ytpCaptionsWindowRaised
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
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
      <EpisodesPanel
        panelRef={episodesPanelRef}
        panelId={episodesPanelId}
        episodes={episodes}
        isOpen={isEpisodesOpen}
        placement={layoutDecision.placements.episodesPanel}
        episodesCols={episodesCols}
        activeEpisodeIndex={activeEpisodeIndex}
        focusedEpisodeIndex={focusedEpisodeIndex}
        onEpisodeChange={handleEpisodeChange}
        onFocusEpisode={setFocusedEpisodeIndex}
        onClose={() => setIsEpisodesOpen(false)}
      />

      {/* ── Layer 5: settings panel ───────────────────────────────────────── */}
      <SettingsPanel
        panelRef={settingsPanelRef}
        panelId={settingsPanelId}
        openPanel={openPanel}
        placement={layoutDecision.placements.settingsPanel}
        qualities={qualities}
        activeQualityId={activeQualityId}
        onQualityChange={onQualityChange}
        subtitles={subtitles}
        activeSubId={activeSubId}
        onSubtitleChange={setActiveSubId}
        playbackRate={playbackRate}
        onPlaybackRateChange={setPlaybackRate}
        onOpenPanel={setOpenPanel}
        onRequestClose={() => setOpenPanel(null)}
      />

      {/* ── Layer 9: gradient bottom ──────────────────────────────────────── */}
      <div className={s.ytpGradientBottom} data-layer="9" aria-hidden="true" />

      {/* ── Layer 3: gesture layer (click / touch) ────────────────────────── */}
      <div
        className={s.ytpGestureSurface}
        data-layer="3"
        data-gestures-blocked={inputRouter.gestureSurfaceDisabled ? "true" : "false"}
        data-zone-count={inputRouter.zones.length}
        aria-hidden="true"
        style={
          hasTopInteractiveControls
            ? ({ "--ytp-gesture-top": "52px" } as React.CSSProperties)
            : undefined
        }
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {inputRouter.routes.map((route) => (
          <div
            key={route.zone}
            className={s.ytpGestureZone}
            data-input-route="gesture-zone"
            data-input-zone={route.zone}
            data-input-intent={route.intent}
            data-input-device-policy={route.devicePolicy}
            onClick={() => handleGestureClick(route.intent)}
          />
        ))}
      </div>

      {/* ── Layer 9: chrome bottom ────────────────────────────────────────── */}
      <div className={s.ytpChromeBottom} data-layer="9">
        {/* ── Progress bar container ──────────────────────────────────────── */}
        <ProgressBar
          progressContainerRef={progressContainerRef}
          progressRailRef={progressRailRef}
          progressScrubActiveRef={progressScrubActiveRef}
          isScrubbing={isProgressScrubbing}
          duration={duration}
          currentTime={currentTime}
          bufferedPct={bufferedPct}
          displayPct={displayPct}
          hoverTime={hoverTime}
          hoverX={hoverX}
          hoverChapterTitle={hoverChapter?.title}
          chapterMarkers={chapterMarkers}
          getThumbnailAt={getThumbnailAt}
          handlePointerDown={handleProgressPointerDown}
          handlePointerMove={handleProgressPointerMove}
          handlePointerUp={handleProgressPointerUp}
          handleProgressHover={handleProgressHover}
          handleMouseLeave={handleProgressMouseLeave}
          handleProgressTouchStart={handleProgressTouchStart}
          handleProgressTouchMove={handleProgressTouchMove}
          handleProgressTouchEnd={handleProgressTouchEnd}
          handleProgressClick={handleProgressClick}
          onSeekStep={doSeek}
        />

        {/* ── Controls ───────────────────────────────────────────────────── */}
        <div className={s.ytpChromeControls}>
          <ControlSlot className={s.ytpLeftControls} slot="bottom-left">
            {playControl}
            {showNextEpisodesGroup && (
              <div
                className={s.ytpNextEpisodesGroup}
                data-ytp-component="next-episodes-group"
              >
                {nextControl}
                {episodesControl}
              </div>
            )}
            {bottomLeftControls}
          </ControlSlot>

          <ControlSlot className={s.ytpRightControls} slot="bottom-right">
            {bottomRightControls}
          </ControlSlot>
        </div>
      </div>
    </div>
  );
}
