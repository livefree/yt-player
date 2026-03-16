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
  useCallback,
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
  VOLUME_STEP,
  SPEED_STEP,
  SPEED_PRESETS,
  CHROME_HIDE_DELAY,
  IMMERSIVE_HIDE_DELAY,
  SEEK_OVERLAY_DURATION,
  DOUBLE_TAP_THRESHOLD,
} from "./utils/format";
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [chromeVisible, setChromeVisible] = useState(true);
  const [cursorHidden, setCursorHidden] = useState(false);
  const chromeTimerRef = useRef<number | null>(null);

  // ── Seek animation (layer 4) ───────────────────────────────────────────────
  const [seekDir, setSeekDir] = useState<SeekDirection>(null);
  const seekTimerRef = useRef<number | null>(null);

  // ── Bezel (center play/pause flash) ───────────────────────────────────────
  const [bezelVisible, setBezelVisible] = useState(false);
  const [bezelPaused, setBezelPaused] = useState(true);
  const bezelTimerRef = useRef<number | null>(null);

  // ── Double-tap detection (mobile) ─────────────────────────────────────────
  const tapTimerRef = useRef<number | null>(null);
  const tapCountRef = useRef(0);
  const tapXRef = useRef(0);

  // ── Progress hover tooltip ────────────────────────────────────────────────
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState(0);
  const progressRailRef = useRef<HTMLDivElement>(null);

  // ── Touch gesture state ────────────────────────────────────────────────────
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(
    null,
  );
  const touchGestureRef = useRef<"seek" | "volume" | "none" | null>(null);
  const [touchSeekDelta, setTouchSeekDelta] = useState<number | null>(null);
  const [showRemaining, setShowRemaining] = useState(false);

  const sliderId = useId();

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

  const isImmersive = isTheater || isFullscreen;

  // ─── Chrome auto-hide ──────────────────────────────────────────────────────
  const revealChrome = useCallback(() => {
    setChromeVisible(true);
    setCursorHidden(false);
    if (chromeTimerRef.current) window.clearTimeout(chromeTimerRef.current);
    chromeTimerRef.current = window.setTimeout(
      () => {
        if (openPanel) return;
        setChromeVisible(false);
        if (isImmersive) setCursorHidden(true);
      },
      isImmersive ? IMMERSIVE_HIDE_DELAY : CHROME_HIDE_DELAY,
    );
  }, [isImmersive, openPanel]);

  // Reset timer when panel opens/closes
  useEffect(() => {
    if (openPanel) {
      setChromeVisible(true);
      if (chromeTimerRef.current) window.clearTimeout(chromeTimerRef.current);
    } else {
      revealChrome();
    }
  }, [openPanel]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Fullscreen sync ───────────────────────────────────────────────────────
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // ─── Video source loading ──────────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;
    setError(null);
    setIsLoading(true);
    setCurrentTime(startTime ?? 0);
    setDuration(0);
    setBuffered(0);
    setIsPlaying(false);
    video.pause();
    video.src = src;
    video.load();
    if (startTime) video.currentTime = startTime;
    if (autoplay) {
      video
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    }
  }, [src]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // ─── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      switch (e.key) {
        case " ":
        case "k":
        case "K":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
          e.preventDefault();
          doSeek(-SEEK_STEP);
          break;
        case "ArrowRight":
          e.preventDefault();
          doSeek(SEEK_STEP);
          break;
        case "ArrowUp":
          e.preventDefault();
          changeVolume(volume + VOLUME_STEP);
          break;
        case "ArrowDown":
          e.preventDefault();
          changeVolume(volume - VOLUME_STEP);
          break;
        case "m":
        case "M":
          e.preventDefault();
          toggleMute();
          break;
        case "f":
        case "F":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "t":
        case "T":
          e.preventDefault();
          toggleTheater();
          break;
        case "c":
        case "C":
          e.preventDefault();
          cycleSubtitles();
          break;
        case "[":
          e.preventDefault();
          setPlaybackRate((r) => clamp(r - SPEED_STEP, 0.25, 2));
          break;
        case "]":
          e.preventDefault();
          setPlaybackRate((r) => clamp(r + SPEED_STEP, 0.25, 2));
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [volume, subtitles, activeSubId]); // eslint-disable-line react-hooks/exhaustive-deps

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
    if (!el) return;
    if (document.fullscreenElement === el) {
      document.exitFullscreen();
    } else {
      el.requestFullscreen();
    }
    revealChrome();
  }

  function toggleTheater() {
    setIsTheater((v) => !v);
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

  // ─── Touch handlers ────────────────────────────────────────────────────────
  function handleTouchStart(e: React.TouchEvent) {
    if (e.touches.length !== 1) return;
    touchStartRef.current = {
      x: e.touches[0]?.clientX ?? 0,
      y: e.touches[0]?.clientY ?? 0,
      time: Date.now(),
    };
    touchGestureRef.current = null;
    tapXRef.current = e.touches[0]?.clientX ?? 0;
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!touchStartRef.current || e.touches.length !== 1) return;
    const touch = e.touches[0];
    if (!touch) return;
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;

    if (!touchGestureRef.current) {
      if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy)) {
        touchGestureRef.current = "seek";
      } else if (Math.abs(dy) > 12) {
        const rect = playerRef.current?.getBoundingClientRect();
        touchGestureRef.current =
          rect && touch.clientX > rect.left + rect.width / 2
            ? "volume"
            : "none";
      }
    }

    if (touchGestureRef.current === "seek") {
      const delta = clamp(dx / 8, -120, 120);
      setTouchSeekDelta(delta);
      e.preventDefault();
    }

    if (touchGestureRef.current === "volume") {
      changeVolume(volume - dy / 150);
      touchStartRef.current = {
        ...touchStartRef.current,
        y: touch.clientY,
      };
    }
  }

  function handleTouchEnd() {
    if (touchGestureRef.current === "seek" && touchSeekDelta !== null) {
      doSeek(touchSeekDelta, touchSeekDelta > 0 ? "forward" : "back");
      setTouchSeekDelta(null);
    }
    touchStartRef.current = null;
    touchGestureRef.current = null;
  }

  // ─── Gesture layer click (single/double tap) ───────────────────────────────
  function handleGestureClick(e: React.MouseEvent) {
    tapCountRef.current += 1;
    tapXRef.current = e.clientX;

    if (tapCountRef.current === 1) {
      tapTimerRef.current = window.setTimeout(() => {
        tapCountRef.current = 0;
        togglePlay();
      }, DOUBLE_TAP_THRESHOLD);
    } else {
      if (tapTimerRef.current) window.clearTimeout(tapTimerRef.current);
      tapCountRef.current = 0;
      const rect = playerRef.current?.getBoundingClientRect();
      if (rect) {
        const isRight = tapXRef.current > rect.left + rect.width / 2;
        doSeek(isRight ? SEEK_STEP : -SEEK_STEP, isRight ? "forward" : "back");
      }
    }
  }

  // ─── Progress bar hover ────────────────────────────────────────────────────
  function handleProgressHover(e: React.MouseEvent) {
    const rail = progressRailRef.current;
    if (!rail || !duration) return;
    const rect = rail.getBoundingClientRect();
    const ratio = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    setHoverTime(ratio * duration);
    setHoverX(e.clientX - rect.left);
  }

  // ─── Chapter markers ──────────────────────────────────────────────────────
  const chapterMarkers = useMemo(() => {
    if (!chapters.length || !duration) return [];
    return chapters.slice(1).map((ch) => ({
      title: ch.title,
      pct: (ch.startTime / duration) * 100,
    }));
  }, [chapters, duration]);

  // ─── Render ────────────────────────────────────────────────────────────────
  const playerClass = [
    s.moviePlayer,
    s.ytpTransparent,
    isPlaying ? s.playingMode : s.pausedMode,
    chromeVisible ? "" : s.ytpAutohide,
    isTheater ? s.ytpTheater : "",
    isFullscreen ? s.ytpFullscreen : "",
    cursorHidden ? s.ytpCursorHidden : "",
  ]
    .filter(Boolean)
    .join(" ");

  const effectiveVolume = isMuted ? 0 : volume;

  return (
    <div
      ref={playerRef}
      className={playerClass}
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
                setError(null);
                if (videoRef.current && src) {
                  videoRef.current.src = src;
                  videoRef.current.load();
                }
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
        <div className={s.ytpProgressBarContainer}>
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
            onMouseMove={handleProgressHover}
            onMouseLeave={() => setHoverTime(null)}
            onClick={(e) => {
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
                  {/* Played */}
                  <div
                    className={s.ytpPlayProgress}
                    style={{ transform: `scaleX(${progressPct / 100})` }}
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

            {/* Scrubber thumb */}
            <div
              className={s.ytpScrubberContainer}
              style={{ left: `${progressPct}%` }}
            >
              <div className={s.ytpScrubberButton} />
            </div>

            {/* Hover time tooltip */}
            {hoverTime !== null && (
              <div
                className={s.ytpTooltipProgressBar}
                style={{
                  left: `${clamp(hoverX, 40, (progressRailRef.current?.clientWidth ?? 300) - 40)}px`,
                }}
              >
                <div className={s.ytpTooltipProgressText}>
                  {formatTime(hoverTime)}
                </div>
                {activeChapter && (
                  <div className={s.ytpTooltipChapterTitle}>
                    {activeChapter.title}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Controls ───────────────────────────────────────────────────── */}
        <div className={s.ytpChromeControls}>
          {/* Left controls */}
          <div className={s.ytpLeftControls}>
            {/* Play/Pause */}
            <YtpButton
              tooltip={isPlaying ? "Pause (k)" : "Play (k)"}
              onClick={togglePlay}
              ariaLabel={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </YtpButton>

            {/* Next */}
            <YtpButton tooltip="Next (SHIFT+N)" ariaLabel="Next">
              <NextIcon />
            </YtpButton>

            {/* Volume area */}
            <span
              className={`${s.ytpVolumeArea} ${volumeVisible ? s.ytpVolumeAreaExpanded : ""}`}
            >
              <div className={s.ytpMuteButton}>
                <YtpButton
                  tooltip={isMuted ? "Unmute (m)" : "Mute (m)"}
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
                    style={{ left: `${effectiveVolume * 52}px` }}
                  />
                </div>
              </div>
            </span>

            {/* Time display — click to toggle elapsed / remaining */}
            <div
              className={s.ytpTimeDisplay}
              onClick={() => setShowRemaining((v) => !v)}
              title={showRemaining ? "Show elapsed time" : "Show remaining time"}
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
          <div className={s.ytpRightControls}>
            <div className={s.ytpRightControlsLeft}>
              {/* Subtitles */}
              {subtitles.length > 0 && (
                <YtpButton
                  tooltip="Subtitles/closed captions (c)"
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
              {/* Theater mode */}
              <YtpButton
                tooltip={isTheater ? "Default view (t)" : "Theater mode (t)"}
                onClick={toggleTheater}
                ariaPressed={isTheater}
              >
                <TheaterIcon active={isTheater} />
              </YtpButton>

              {/* PiP */}
              {"pictureInPictureEnabled" in document && (
                <YtpButton tooltip="Picture-in-picture" onClick={togglePip}>
                  <PipIcon />
                </YtpButton>
              )}

              {/* Fullscreen */}
              <YtpButton
                tooltip={
                  isFullscreen ? "Exit full screen (f)" : "Full screen (f)"
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
