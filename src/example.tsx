/**
 * Example usage of YTPlayer
 *
 * Drop this in any Next.js / React page.
 * The component is fully self-contained; the only peer dep is React 18+.
 *
 * For HLS streams, pass src ending in .m3u8 — the component detects it
 * and you can wire up hls.js externally via the qualities prop if needed.
 */

import { YTPlayer } from "./player/Player";

// ─── Minimal usage ────────────────────────────────────────────────────────────

export function MinimalExample() {
  return (
    <YTPlayer
      src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
      poster="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Camponotus_flavomarginatus_ant.jpg/320px-Camponotus_flavomarginatus_ant.jpg"
      title="Big Buck Bunny"
      author="Blender Foundation"
    />
  );
}

// ─── Full-featured usage ──────────────────────────────────────────────────────

export function FullExample() {
  return (
    <YTPlayer
      src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
      poster="https://peach.blender.org/wp-content/uploads/title_anouncement.jpg"
      title="Big Buck Bunny — Full Feature"
      author="Blender Foundation"
      startTime={0}
      autoplay={false}
      initialVolume={0.8}
      qualities={[
        {
          id: "auto",
          label: "Auto",
          src: "https://example.com/auto.m3u8",
          isHls: true,
        },
        { id: "1080p", label: "1080p", src: "https://example.com/1080p.mp4" },
        { id: "720p", label: "720p", src: "https://example.com/720p.mp4" },
        { id: "480p", label: "480p", src: "https://example.com/480p.mp4" },
      ]}
      activeQualityId="auto"
      onQualityChange={(id) => console.log("Quality changed to", id)}
      subtitles={[
        {
          id: "zh",
          label: "中文",
          srclang: "zh",
          src: "/subtitles/zh.vtt",
          default: true,
        },
        {
          id: "en",
          label: "English",
          srclang: "en",
          src: "/subtitles/en.vtt",
        },
      ]}
      chapters={[
        { title: "Introduction", startTime: 0 },
        { title: "Act 1", startTime: 120 },
        { title: "Act 2", startTime: 360 },
        { title: "Finale", startTime: 540 },
      ]}
      onEnded={() => console.log("Video ended")}
      onTimeUpdate={(_currentTime, _duration) => {
        // throttled to ~4Hz internally
      }}
    />
  );
}
