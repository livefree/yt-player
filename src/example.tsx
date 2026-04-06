/**
 * Example usage of YTPlayer
 *
 * Drop this in any Next.js / React page.
 * The component is fully self-contained; the only peer dep is React 18+.
 *
 * For HLS streams, pass src ending in .m3u8 — the component detects it
 * and you can wire up hls.js externally via the qualities prop if needed.
 */

import React, { useState } from "react";
import { YTPlayer } from "./player/Player";
import type { Chapter } from "./player/types";

// ─── Minimal usage ────────────────────────────────────────────────────────────

export function MinimalExample() {
  return (
    <YTPlayer
      src="/samples/local-demo.mp4"
      poster="/samples/local-demo-poster.jpg"
      title="Local Demo MP4"
      author="YTPlayer Local Sample"
    />
  );
}

// ─── Playlist ─────────────────────────────────────────────────────────────────

const LOCAL_MP4 = "/samples/local-demo.mp4";
const LOCAL_HLS = "/samples/hls/local-demo.m3u8";
const LOCAL_POSTER = "/samples/local-demo-poster.jpg";
const PUBLIC_SAMPLE_BASE =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample";

interface VideoItem {
  src: string;
  title: string;
  author: string;
  poster?: string;
  chapters?: Chapter[];
}

const PLAYLIST: VideoItem[] = [
  {
    src: LOCAL_MP4,
    title: "Local Demo MP4",
    author: "YTPlayer Local Sample",
    poster: LOCAL_POSTER,
    chapters: [
      { title: "Opening Grid", startTime: 0 },
      { title: "Middle Motion", startTime: 6 },
      { title: "Audio Sync", startTime: 12 },
      { title: "Ending Bars", startTime: 18 },
    ],
  },
  {
    src: LOCAL_HLS,
    title: "Local Demo HLS",
    author: "YTPlayer Local Sample",
    poster: LOCAL_POSTER,
    chapters: [
      { title: "Manifest Start", startTime: 0 },
      { title: "Segment Two", startTime: 8 },
      { title: "Segment Three", startTime: 16 },
    ],
  },
  {
    src: LOCAL_MP4,
    title: "Big Buck Bunny (Local Fallback)",
    author: "YTPlayer Local Sample",
    poster: LOCAL_POSTER,
    chapters: [
      { title: "Episode Intro", startTime: 0 },
      { title: "Gesture Test", startTime: 7 },
      { title: "Chrome Check", startTime: 14 },
      { title: "Wrap Up", startTime: 20 },
    ],
  },
  {
    src: `${PUBLIC_SAMPLE_BASE}/BigBuckBunny.mp4`,
    title: "Big Buck Bunny",
    author: "Blender Foundation",
    chapters: [
      { title: "Opening", startTime: 0 },
      { title: "Forest Chase", startTime: 180 },
      { title: "Revenge", startTime: 420 },
      { title: "Finale", startTime: 540 },
    ],
  },
  {
    src: `${PUBLIC_SAMPLE_BASE}/ElephantsDream.mp4`,
    title: "Elephants Dream",
    author: "Blender Foundation",
    chapters: [
      { title: "Awakening", startTime: 0 },
      { title: "The Machine", startTime: 120 },
      { title: "Confrontation", startTime: 360 },
    ],
  },
  {
    src: `${PUBLIC_SAMPLE_BASE}/ForBiggerJoyrides.mp4`,
    title: "For Bigger Joyrides",
    author: "Google",
    chapters: [
      { title: "City Run", startTime: 0 },
      { title: "Wide Shot", startTime: 15 },
      { title: "Wrap", startTime: 30 },
    ],
  },
];

// ─── Playlist item ────────────────────────────────────────────────────────────

const ITEM_BASE: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "8px 10px",
  borderRadius: 8,
  border: "none",
  background: "transparent",
  cursor: "pointer",
  textAlign: "left",
  color: "#e8eaed",
  fontFamily: "inherit",
  transition: "background 0.15s",
  width: "100%",
  boxSizing: "border-box",
};

const ITEM_ACTIVE: React.CSSProperties = {
  background: "rgba(255,255,255,0.12)",
};

function PlaylistItem({
  item,
  idx,
  total,
  active,
  horizontal,
  onClick,
}: {
  item: VideoItem;
  idx: number;
  total: number;
  active: boolean;
  horizontal: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  const numStyle: React.CSSProperties = {
    flexShrink: 0,
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: active ? "#ff4444" : "rgba(255,255,255,0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 700,
    color: "#fff",
    lineHeight: 1,
  };

  const infoStyle: React.CSSProperties = horizontal
    ? { minWidth: 0 }
    : { minWidth: 0, flex: 1 };

  const titleStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: active ? 600 : 400,
    color: active ? "#fff" : "#e8eaed",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    lineHeight: 1.3,
  };

  const authorStyle: React.CSSProperties = {
    fontSize: 11,
    color: "rgba(255,255,255,0.50)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    marginTop: 2,
  };

  const style: React.CSSProperties = horizontal
    ? {
        ...ITEM_BASE,
        flexDirection: "column",
        alignItems: "flex-start",
        width: 140,
        flexShrink: 0,
        ...(active || hovered ? ITEM_ACTIVE : {}),
      }
    : {
        ...ITEM_BASE,
        ...(active || hovered ? ITEM_ACTIVE : {}),
      };

  return (
    <button
      style={style}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-current={active ? "true" : undefined}
      title={`${idx + 1} / ${total}  —  ${item.title}`}
    >
      <div style={numStyle}>{idx + 1}</div>
      <div style={infoStyle}>
        <div style={titleStyle}>{item.title}</div>
        <div style={authorStyle}>{item.author}</div>
      </div>
    </button>
  );
}

// ─── Full-featured usage with playlist ────────────────────────────────────────

export function FullExample() {
  const [index, setIndex] = useState(0);
  const [isTheater, setIsTheater] = useState(false);
  const video = PLAYLIST[index] ?? PLAYLIST[0]!;
  const hasNext = index < PLAYLIST.length - 1;

  const goTo = (i: number) => setIndex(i);

  // In default view: player left, playlist right (side-by-side when ≥ 900 px)
  // In theater mode: player top, playlist bottom (horizontal scroll)
  const wrapStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: isTheater ? "column" : "row",
    flexWrap: isTheater ? "nowrap" : "wrap",
    gap: 12,
    width: "100%",
    boxSizing: "border-box",
    padding: 16,
    background: "#0f0f0f",
    minHeight: "100vh",
    fontFamily: "system-ui, -apple-system, sans-serif",
  };

  const playerWrapStyle: React.CSSProperties = isTheater
    ? { width: "100%" }
    : { flex: "1 1 580px", minWidth: 0 };

  const listWrapStyle: React.CSSProperties = isTheater
    ? {
        display: "flex",
        flexDirection: "row",
        gap: 4,
        overflowX: "auto",
        overflowY: "hidden",
        paddingBottom: 8,
        width: "100%",
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(255,255,255,0.25) transparent",
      }
    : {
        flex: "0 0 260px",
        display: "flex",
        flexDirection: "column",
        gap: 2,
        overflowY: "auto",
        maxHeight: 520,
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(255,255,255,0.25) transparent",
      };

  return (
    <div style={wrapStyle}>
      <div style={playerWrapStyle}>
        <YTPlayer
          key={index}
          src={video.src}
          poster={video.poster}
          title={`${index + 1} / ${PLAYLIST.length}  —  ${video.title}`}
          author={video.author}
          chapters={video.chapters}
          autoplay={index > 0}
          initialVolume={0.8}
          onNext={hasNext ? () => goTo(index + 1) : undefined}
          onEnded={() => { if (hasNext) goTo(index + 1); }}
          onTheaterChange={setIsTheater}
          onTimeUpdate={() => { /* throttled 4Hz */ }}
          episodes={PLAYLIST.map((item) => ({ title: item.title }))}
          activeEpisodeIndex={index}
          onEpisodeChange={goTo}
        />
      </div>

      <div style={listWrapStyle}>
        {PLAYLIST.map((item, i) => (
          <PlaylistItem
            key={i}
            item={item}
            idx={i}
            total={PLAYLIST.length}
            active={i === index}
            horizontal={isTheater}
            onClick={() => goTo(i)}
          />
        ))}
      </div>
    </div>
  );
}
