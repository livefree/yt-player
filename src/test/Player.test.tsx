import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { YTPlayer } from "../player/Player";

const mockPlay = vi.fn().mockResolvedValue(undefined);
const mockPause = vi.fn();
const mockLoad = vi.fn();
const mockHlsDestroy = vi.fn();
const mockHlsLoadSource = vi.fn();
const mockHlsAttachMedia = vi.fn();
const mockHlsOn = vi.fn();
const mockSetActionHandler = vi.fn();
const mockSetPositionState = vi.fn();
const mockWakeLockRelease = vi.fn().mockResolvedValue(undefined);
const mockWakeLockRequest = vi
  .fn()
  .mockResolvedValue({ release: mockWakeLockRelease });
let coarsePointer = false;

vi.mock("hls.js", () => {
  class MockHls {
    static isSupported = vi.fn(() => true);
    static Events = {
      MANIFEST_PARSED: "manifestParsed",
      ERROR: "error",
    };

    destroy = mockHlsDestroy;
    loadSource = mockHlsLoadSource;
    attachMedia = mockHlsAttachMedia;
    on = mockHlsOn;
  }

  return {
    default: MockHls,
  };
});

Object.defineProperty(HTMLMediaElement.prototype, "play", {
  writable: true,
  value: mockPlay,
});
Object.defineProperty(HTMLMediaElement.prototype, "pause", {
  writable: true,
  value: mockPause,
});
Object.defineProperty(HTMLMediaElement.prototype, "load", {
  writable: true,
  value: mockLoad,
});

Object.defineProperty(HTMLVideoElement.prototype, "canPlayType", {
  writable: true,
  value: vi.fn(() => ""),
});

Object.defineProperty(HTMLDivElement.prototype, "setPointerCapture", {
  writable: true,
  value: vi.fn(),
});

window.HTMLElement.prototype.scrollIntoView = vi.fn();

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn((query: string) => ({
    matches: query === "(pointer: coarse)" ? coarsePointer : false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

const TEST_SRC =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
const TEST_HLS_SRC = "https://example.com/stream.m3u8";
const EPISODES_3 = [
  { title: "Episode 1" },
  { title: "Episode 2" },
  { title: "Episode 3" },
];
const EPISODES_15 = Array.from({ length: 15 }, (_, i) => ({
  title: `Episode ${i + 1}`,
}));

function setVideoDuration(video: HTMLVideoElement, duration: number) {
  Object.defineProperty(video, "duration", {
    configurable: true,
    writable: true,
    value: duration,
  });
}

function setVideoCurrentTime(video: HTMLVideoElement, currentTime: number) {
  Object.defineProperty(video, "currentTime", {
    configurable: true,
    writable: true,
    value: currentTime,
  });
}

function setProgressRailGeometry(rail: HTMLElement, width: number) {
  Object.defineProperty(rail, "clientWidth", {
    configurable: true,
    value: width,
  });
  rail.getBoundingClientRect = vi.fn(() => ({
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: width,
    bottom: 10,
    width,
    height: 10,
    toJSON: () => ({}),
  }));
}

beforeEach(() => {
  vi.clearAllMocks();
  coarsePointer = false;
  mockPlay.mockReset().mockResolvedValue(undefined);
  mockPause.mockReset();
  mockLoad.mockReset();
  mockHlsDestroy.mockReset();
  mockHlsLoadSource.mockReset();
  mockHlsAttachMedia.mockReset();
  mockHlsOn.mockReset();
  mockSetActionHandler.mockReset();
  mockSetPositionState.mockReset();
  mockWakeLockRelease.mockReset().mockResolvedValue(undefined);
  mockWakeLockRequest.mockReset().mockResolvedValue({
    release: mockWakeLockRelease,
  });

  Object.defineProperty(navigator, "mediaSession", {
    configurable: true,
    value: {
      setActionHandler: mockSetActionHandler,
      setPositionState: mockSetPositionState,
      playbackState: "paused",
      metadata: null,
    },
  });

  Object.defineProperty(globalThis, "MediaMetadata", {
    configurable: true,
    value: class MediaMetadata {
      constructor(public init: unknown) {}
    },
  });

  Object.defineProperty(navigator, "wakeLock", {
    configurable: true,
    value: {
      request: mockWakeLockRequest,
    },
  });

  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: 1280,
  });

  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    writable: true,
    value: 720,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("YTPlayer", () => {
  it("renders without crashing", () => {
    render(<YTPlayer />);
  });

  it("renders a video element", () => {
    const { container } = render(<YTPlayer src={TEST_SRC} />);
    const video = container.querySelector("video");
    expect(video).toBeInTheDocument();
  });

  it("sets the video src prop for direct video sources", () => {
    const { container } = render(<YTPlayer src={TEST_SRC} />);
    const video = container.querySelector("video");
    expect(video).toHaveAttribute("src", TEST_SRC);
    expect(mockLoad).toHaveBeenCalled();
  });

  it("renders title and author when provided", () => {
    render(<YTPlayer title="Test Title" author="Test Author" />);
    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test Author")).toBeInTheDocument();
  });

  it("renders Play button", () => {
    render(<YTPlayer />);
    expect(screen.getByRole("button", { name: /play/i })).toBeInTheDocument();
  });

  it("renders Fullscreen button", () => {
    render(<YTPlayer />);
    expect(
      screen.getByRole("button", { name: /full screen/i }),
    ).toBeInTheDocument();
  });
});

describe("YTPlayer — source loading and fallback", () => {
  it("initializes HLS.js for m3u8 sources on non-native HLS browsers", async () => {
    const { container } = render(<YTPlayer src={TEST_HLS_SRC} />);
    const video = container.querySelector("video") as HTMLVideoElement;

    await waitFor(() => {
      expect(mockHlsLoadSource).toHaveBeenCalledWith(TEST_HLS_SRC);
      expect(mockHlsAttachMedia).toHaveBeenCalledWith(video);
    });
  });

  it("destroys the HLS instance when the player unmounts", async () => {
    const { unmount } = render(<YTPlayer src={TEST_HLS_SRC} />);

    await waitFor(() => {
      expect(mockHlsLoadSource).toHaveBeenCalledWith(TEST_HLS_SRC);
    });

    unmount();

    expect(mockHlsDestroy).toHaveBeenCalled();
  });

  it("retries autoplay in muted mode and shows the unmute prompt when sound autoplay is blocked", async () => {
    mockPlay
      .mockRejectedValueOnce(new Error("blocked"))
      .mockResolvedValueOnce(undefined);

    const { container } = render(<YTPlayer src={TEST_SRC} autoplay />);
    const video = container.querySelector("video") as HTMLVideoElement;

    await waitFor(() => {
      expect(mockPlay).toHaveBeenCalledTimes(2);
    });

    expect(video.muted).toBe(true);
    expect(
      screen.getByRole("button", { name: /^unmute$/i }),
    ).toBeInTheDocument();
  });

  it("clears the muted autoplay prompt after the user unmutes", async () => {
    mockPlay
      .mockRejectedValueOnce(new Error("blocked"))
      .mockResolvedValueOnce(undefined);

    const { container } = render(<YTPlayer src={TEST_SRC} autoplay />);
    const video = container.querySelector("video") as HTMLVideoElement;

    await screen.findByRole("button", { name: /^unmute$/i });

    await userEvent.click(screen.getByRole("button", { name: /^unmute$/i }));

    expect(video.muted).toBe(false);
    expect(
      screen.queryByRole("button", { name: /unmute/i }),
    ).not.toBeInTheDocument();
  });

  it("clears the muted autoplay prompt when the real media volume state changes back to unmuted", async () => {
    mockPlay
      .mockRejectedValueOnce(new Error("blocked"))
      .mockResolvedValueOnce(undefined);

    const { container } = render(<YTPlayer src={TEST_SRC} autoplay />);
    const video = container.querySelector("video") as HTMLVideoElement;

    await screen.findByRole("button", { name: /^unmute$/i });

    await act(async () => {
      video.muted = false;
      fireEvent(video, new Event("volumechange"));
    });

    expect(
      screen.queryByRole("button", { name: /^unmute$/i }),
    ).not.toBeInTheDocument();
  });

  it("renders the muted autoplay prompt above the gesture layer contract", async () => {
    mockPlay
      .mockRejectedValueOnce(new Error("blocked"))
      .mockResolvedValueOnce(undefined);

    render(<YTPlayer src={TEST_SRC} autoplay />);

    const promptButton = await screen.findByRole("button", { name: /^unmute$/i });
    expect(promptButton.parentElement).toHaveAttribute("data-layer", "5");
  });

  it("does not force-muted autoplay fallback after a user-initiated episode switch", async () => {
    function EpisodeHost() {
      const [src, setSrc] = useState(`${TEST_SRC}?ep=1`);

      return (
        <YTPlayer
          src={src}
          autoplay
          episodes={EPISODES_3}
          onEpisodeChange={(index) => setSrc(`${TEST_SRC}?ep=${index + 1}`)}
        />
      );
    }

    mockPlay
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("blocked after episode switch"));

    const { container } = render(<EpisodeHost />);
    const video = container.querySelector("video") as HTMLVideoElement;

    await userEvent.click(screen.getByRole("button", { name: /episodes/i }));
    await userEvent.click(screen.getByRole("option", { name: "02" }));

    await waitFor(() => {
      expect(mockPlay).toHaveBeenCalledTimes(2);
    });

    expect(video.muted).toBe(false);
    expect(
      screen.queryByRole("button", { name: /^unmute$/i }),
    ).not.toBeInTheDocument();
  });

  it("keeps the loading spinner instead of showing the generic error banner for managed HLS video errors", () => {
    const { container } = render(<YTPlayer src={TEST_HLS_SRC} />);
    const video = container.querySelector("video") as HTMLVideoElement;

    fireEvent.error(video);

    expect(screen.getByRole("status", { name: /loading/i })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("still shows the generic error banner for direct video source errors", () => {
    const { container } = render(<YTPlayer src={TEST_SRC} />);
    const video = container.querySelector("video") as HTMLVideoElement;

    fireEvent.error(video);

    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});

describe("YTPlayer — layout decision contracts", () => {
  it("defaults to desktop-default layout mode", async () => {
    const { container } = render(<YTPlayer src={TEST_SRC} />);

    await waitFor(() => {
      expect(container.firstElementChild).toHaveAttribute(
        "data-layout-mode",
        "desktop-default",
      );
    });
  });

  it("switches to desktop-compact layout and moves the episodes panel to top-right", async () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 560,
    });

    const { container } = render(<YTPlayer src={TEST_SRC} episodes={EPISODES_3} />);

    fireEvent(window, new Event("resize"));

    await waitFor(() => {
      expect(container.firstElementChild).toHaveAttribute(
        "data-layout-mode",
        "desktop-compact",
      );
    });

    await userEvent.click(screen.getByRole("button", { name: /episodes/i }));

    expect(screen.getByRole("dialog", { name: /episodes/i })).toHaveAttribute(
      "data-placement",
      "top-right",
    );
  });

  it("switches to mobile layout on coarse pointers and promotes episodes into a visible phone entry point", async () => {
    coarsePointer = true;

    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 390,
    });

    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      writable: true,
      value: 844,
    });

    const { container } = render(<YTPlayer src={TEST_SRC} episodes={EPISODES_3} />);

    fireEvent(window, new Event("resize"));

    await waitFor(() => {
      expect(container.firstElementChild).toHaveAttribute(
        "data-layout-mode",
        "mobile-portrait",
      );
    });

    const topRight = container.querySelector(
      '[data-control-slot="top-right"]',
    ) as HTMLDivElement;

    expect(
      topRight.querySelector('[data-ytp-component="episodes-btn"]'),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Volume")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /next/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /theater mode/i }),
    ).not.toBeInTheDocument();
  });
});

describe("YTPlayer — overlay manager contracts", () => {
  it("marks settings as the top blocking overlay and disables gesture capture", async () => {
    vi.useFakeTimers();
    try {
      const { container } = render(<YTPlayer src={TEST_SRC} />);

      fireEvent.click(screen.getByRole("button", { name: /settings/i }));

      const root = container.firstElementChild as HTMLDivElement;
      const gestureLayer = container.querySelector('[data-layer="3"]') as HTMLDivElement;
      const video = container.querySelector("video") as HTMLVideoElement;

      expect(root).toHaveAttribute("data-overlay-top", "settings");
      expect(root).toHaveAttribute("data-overlay-gestures-blocked", "true");
      expect(gestureLayer).toHaveAttribute("data-gestures-blocked", "true");

      fireEvent.click(
        container.querySelector('[data-input-zone="center"]') as HTMLDivElement,
      );

      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      expect(mockPlay).not.toHaveBeenCalled();
      expect(video.currentTime).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("tracks unmute prompt as the top overlay without globally blocking gestures", async () => {
    mockPlay
      .mockRejectedValueOnce(new Error("blocked"))
      .mockResolvedValueOnce(undefined);

    const { container } = render(<YTPlayer src={TEST_SRC} autoplay />);

    await screen.findByRole("button", { name: /^unmute$/i });

    const root = container.firstElementChild as HTMLDivElement;
    const gestureLayer = container.querySelector('[data-layer="3"]') as HTMLDivElement;

    expect(root).toHaveAttribute("data-overlay-top", "unmute-prompt");
    expect(root).toHaveAttribute("data-overlay-gestures-blocked", "false");
    expect(gestureLayer).toHaveAttribute("data-gestures-blocked", "false");
  });

  it("promotes the error banner to the top blocking overlay", () => {
    const { container } = render(<YTPlayer src={TEST_SRC} />);
    const video = container.querySelector("video") as HTMLVideoElement;

    fireEvent.error(video);

    const root = container.firstElementChild as HTMLDivElement;
    expect(root).toHaveAttribute("data-overlay-top", "error");
    expect(root).toHaveAttribute("data-overlay-gestures-blocked", "true");
  });
});

describe("YTPlayer — input router contracts", () => {
  it("renders three gesture zones for desktop layouts", async () => {
    const { container } = render(<YTPlayer src={TEST_SRC} />);

    await waitFor(() => {
      expect(container.firstElementChild).toHaveAttribute(
        "data-input-zones",
        "left,center,right",
      );
    });

    const zones = container.querySelectorAll('[data-input-route="gesture-zone"]');
    expect(zones).toHaveLength(3);
  });

  it("renders three gesture zones for mobile portrait layouts to support double-tap seek", async () => {
    coarsePointer = true;

    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 390,
    });
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      writable: true,
      value: 844,
    });

    const { container } = render(<YTPlayer src={TEST_SRC} />);
    fireEvent(window, new Event("resize"));

    await waitFor(() => {
      expect(container.firstElementChild).toHaveAttribute(
        "data-input-zones",
        "left,center,right",
      );
    });

    const zones = container.querySelectorAll('[data-input-route="gesture-zone"]');
    expect(zones).toHaveLength(3);
    expect(zones[0]).toHaveAttribute("data-input-zone", "left");
    expect(zones[2]).toHaveAttribute("data-input-zone", "right");
  });
});

describe("YTPlayer — slot composition contracts", () => {
  it("keeps settings in the bottom-right slot for desktop-default layouts", async () => {
    const { container } = render(<YTPlayer src={TEST_SRC} />);

    await waitFor(() => {
      expect(container.firstElementChild).toHaveAttribute(
        "data-layout-mode",
        "desktop-default",
      );
    });

    const bottomRight = container.querySelector(
      '[data-control-slot="bottom-right"]',
    ) as HTMLDivElement;

    expect(
      bottomRight.querySelector('[data-ytp-component="settings-btn"]'),
    ).toBeInTheDocument();
  });

  it("moves settings and episodes into the top-right slot for desktop-compact layouts", async () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 560,
    });

    const { container } = render(<YTPlayer src={TEST_SRC} episodes={EPISODES_3} />);
    fireEvent(window, new Event("resize"));

    await waitFor(() => {
      expect(container.firstElementChild).toHaveAttribute(
        "data-layout-mode",
        "desktop-compact",
      );
    });

    const topRight = container.querySelector(
      '[data-control-slot="top-right"]',
    ) as HTMLDivElement;

    expect(
      topRight.querySelector('[data-ytp-component="settings-btn"]'),
    ).toBeInTheDocument();
    expect(
      topRight.querySelector('[data-ytp-component="episodes-btn"]'),
    ).toBeInTheDocument();
    expect(container.firstElementChild).toHaveAttribute(
      "data-top-controls-interactive",
      "true",
    );
    expect(
      container.querySelector('[data-input-route="gesture-zone"]')?.parentElement,
    ).toHaveStyle({ "--ytp-gesture-top": "52px" });
  });

  it("keeps the next/episodes reveal group in the bottom-left slot for desktop-default layouts", async () => {
    const { container } = render(
      <YTPlayer src={TEST_SRC} episodes={EPISODES_3} onNext={vi.fn()} />,
    );

    await waitFor(() => {
      expect(container.firstElementChild).toHaveAttribute(
        "data-layout-mode",
        "desktop-default",
      );
    });

    const bottomLeft = container.querySelector(
      '[data-control-slot="bottom-left"]',
    ) as HTMLDivElement;

    expect(
      bottomLeft.querySelector('[data-ytp-component="next-episodes-group"]'),
    ).toBeInTheDocument();
    expect(
      bottomLeft.querySelector('[data-ytp-component="next-btn"]'),
    ).toBeInTheDocument();
    expect(
      bottomLeft.querySelector('[data-ytp-component="episodes-btn"]'),
    ).toBeInTheDocument();
  });

  it("keeps play before the next/episodes group in the bottom-left slot", async () => {
    const { container } = render(
      <YTPlayer src={TEST_SRC} episodes={EPISODES_3} onNext={vi.fn()} />,
    );

    await waitFor(() => {
      expect(container.firstElementChild).toHaveAttribute(
        "data-layout-mode",
        "desktop-default",
      );
    });

    const bottomLeft = container.querySelector(
      '[data-control-slot="bottom-left"]',
    ) as HTMLDivElement;

    const childComponents = Array.from(bottomLeft.children).map((child) =>
      child.getAttribute("data-ytp-component") ?? child.firstElementChild?.getAttribute("data-ytp-component"),
    );

    expect(childComponents[0]).toBe("play-btn");
    expect(childComponents[1]).toBe("next-episodes-group");
  });
});

describe("YTPlayer — panel toggle contracts", () => {
  it("closes settings when the settings button is clicked again", async () => {
    render(<YTPlayer src={TEST_SRC} />);

    const settingsButton = screen.getByRole("button", { name: "Settings" });

    fireEvent.click(settingsButton);

    await waitFor(() => {
      expect(screen.getByRole("dialog", { name: "Settings" })).toBeInTheDocument();
    });

    fireEvent.mouseDown(settingsButton);
    fireEvent.click(settingsButton);

    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: "Settings" }),
      ).not.toBeInTheDocument();
    });
  });
});

describe("YTPlayer — progress and gesture regressions", () => {
  it("seeks on progress-bar click based on pointer position", () => {
    const { container } = render(<YTPlayer src={TEST_SRC} />);
    const video = container.querySelector("video") as HTMLVideoElement;
    const seekBar = screen.getByRole("slider", { name: "Seek" });

    setVideoDuration(video, 200);
    setVideoCurrentTime(video, 0);
    setProgressRailGeometry(seekBar, 400);

    fireEvent.click(seekBar, { clientX: 300 });

    expect(video.currentTime).toBe(150);
    expect(seekBar).toHaveAttribute("aria-valuenow", "150");
  });

  it("commits touch scrubbing on touch end", () => {
    const { container } = render(<YTPlayer src={TEST_SRC} />);
    const video = container.querySelector("video") as HTMLVideoElement;
    const progressBarContainer = container.querySelector(
      '[data-ytp-component="progress-bar"]',
    ) as HTMLDivElement;
    const seekBar = screen.getByRole("slider", { name: "Seek" });

    setVideoDuration(video, 90);
    setVideoCurrentTime(video, 0);
    setProgressRailGeometry(seekBar, 300);
    fireEvent.durationChange(video);

    fireEvent.touchStart(progressBarContainer, {
      touches: [{ clientX: 30, clientY: 0 }],
    });
    fireEvent.touchMove(progressBarContainer, {
      touches: [{ clientX: 210, clientY: 0 }],
    });
    fireEvent.touchEnd(progressBarContainer);

    expect(video.currentTime).toBeCloseTo(63, 5);
  });

  it("double-clicking the right half of the gesture layer seeks forward", async () => {
    const { container } = render(<YTPlayer src={TEST_SRC} />);
    const video = container.querySelector("video") as HTMLVideoElement;
    const rightZone = container.querySelector(
      '[data-input-zone="right"]',
    ) as HTMLDivElement;

    setVideoDuration(video, 120);
    setVideoCurrentTime(video, 20);

    fireEvent.click(rightZone);
    fireEvent.click(rightZone);

    expect(video.currentTime).toBe(30);
  });

  it("double-clicking the right zone also seeks forward on mobile portrait", async () => {
    coarsePointer = true;
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 390,
    });
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      writable: true,
      value: 844,
    });

    const { container } = render(<YTPlayer src={TEST_SRC} />);
    const video = container.querySelector("video") as HTMLVideoElement;
    fireEvent(window, new Event("resize"));

    await waitFor(() => {
      expect(container.firstElementChild).toHaveAttribute(
        "data-layout-mode",
        "mobile-portrait",
      );
    });

    const rightZone = container.querySelector(
      '[data-input-zone="right"]',
    ) as HTMLDivElement;

    setVideoDuration(video, 120);
    setVideoCurrentTime(video, 20);

    fireEvent.click(rightZone);
    fireEvent.click(rightZone);

    expect(video.currentTime).toBe(30);
  });

  it("does not change volume on vertical right-side swipes in mobile portrait", async () => {
    coarsePointer = true;
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 390,
    });
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      writable: true,
      value: 844,
    });

    const { container } = render(<YTPlayer src={TEST_SRC} />);
    const video = container.querySelector("video") as HTMLVideoElement;
    fireEvent(window, new Event("resize"));

    await waitFor(() => {
      expect(container.firstElementChild).toHaveAttribute(
        "data-layout-mode",
        "mobile-portrait",
      );
    });

    const initialVolume = video.volume;
    const gestureSurface = container.querySelector('[data-layer="3"]') as HTMLDivElement;

    fireEvent.touchStart(gestureSurface, {
      touches: [{ clientX: 320, clientY: 500 }],
    });
    fireEvent.touchMove(gestureSurface, {
      touches: [{ clientX: 322, clientY: 380 }],
    });
    fireEvent.touchEnd(gestureSurface);

    await waitFor(() => {
      expect(video.volume).toBe(initialVolume);
    });
  });
});

describe("YTPlayer — panel regressions", () => {
  it("opens the settings panel and closes it on outside click", async () => {
    render(<YTPlayer subtitles={[{ id: "en", label: "English", srclang: "en", src: "/en.vtt" }]} />);

    await userEvent.click(screen.getByRole("button", { name: /settings/i }));
    expect(screen.getByRole("dialog", { name: /settings/i })).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("dialog", { name: /settings/i })).not.toBeInTheDocument();
  });

  it("moves focus into settings and returns it to the trigger on Escape", async () => {
    render(
      <YTPlayer
        subtitles={[{ id: "en", label: "English", srclang: "en", src: "/en.vtt" }]}
      />,
    );

    const settingsButton = screen.getByRole("button", { name: /settings/i });
    await userEvent.click(settingsButton);

    const settingsDialog = screen.getByRole("dialog", { name: /settings/i });
    expect(settingsDialog).toBeInTheDocument();
    await waitFor(() => {
      expect(document.activeElement).toHaveAttribute("role", "menuitem");
    });

    fireEvent.keyDown(settingsDialog, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: /settings/i })).not.toBeInTheDocument();
      expect(document.activeElement).toBe(settingsButton);
    });
  });
});

describe("YTPlayer — Episodes panel", () => {
  it("does NOT render Episodes button when episodes prop is omitted", () => {
    render(<YTPlayer />);
    expect(screen.queryByRole("button", { name: /episodes/i })).not.toBeInTheDocument();
  });

  it("renders Episodes button when episodes prop is provided", () => {
    render(<YTPlayer episodes={EPISODES_3} />);
    expect(screen.getByRole("button", { name: /episodes/i })).toBeInTheDocument();
  });

  it("panel is hidden initially", () => {
    render(<YTPlayer episodes={EPISODES_3} />);
    expect(screen.queryByRole("dialog", { name: /episodes/i })).not.toBeInTheDocument();
  });

  it("opens panel when Episodes button is clicked", async () => {
    render(<YTPlayer episodes={EPISODES_3} />);
    await userEvent.click(screen.getByRole("button", { name: /episodes/i }));
    expect(screen.getByRole("dialog", { name: /episodes/i })).toBeInTheDocument();
  });

  it("renders episode items with zero-padded numbers", async () => {
    render(<YTPlayer episodes={EPISODES_3} />);
    await userEvent.click(screen.getByRole("button", { name: /episodes/i }));
    expect(screen.getByRole("option", { name: "01" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "02" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "03" })).toBeInTheDocument();
  });

  it("marks the active episode with aria-selected=true", async () => {
    render(<YTPlayer episodes={EPISODES_3} activeEpisodeIndex={1} />);
    await userEvent.click(screen.getByRole("button", { name: /episodes/i }));
    const items = screen.getAllByRole("option");
    expect(items[0]).toHaveAttribute("aria-selected", "false");
    expect(items[1]).toHaveAttribute("aria-selected", "true");
    expect(items[2]).toHaveAttribute("aria-selected", "false");
  });

  it("calls onEpisodeChange with correct index when an episode is clicked", async () => {
    const onEpisodeChange = vi.fn();
    render(
      <YTPlayer
        episodes={EPISODES_3}
        activeEpisodeIndex={0}
        onEpisodeChange={onEpisodeChange}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /episodes/i }));
    await userEvent.click(screen.getByRole("option", { name: "02" }));
    expect(onEpisodeChange).toHaveBeenCalledOnce();
    expect(onEpisodeChange).toHaveBeenCalledWith(1);
  });

  it("closes the panel after an episode is selected", async () => {
    render(<YTPlayer episodes={EPISODES_3} />);
    await userEvent.click(screen.getByRole("button", { name: /episodes/i }));
    await userEvent.click(screen.getByRole("option", { name: "01" }));
    expect(screen.queryByRole("dialog", { name: /episodes/i })).not.toBeInTheDocument();
  });

  it("toggles panel closed when Episodes button is clicked a second time", async () => {
    render(<YTPlayer episodes={EPISODES_3} />);
    const btn = screen.getByRole("button", { name: /episodes/i });
    await userEvent.click(btn);
    expect(screen.getByRole("dialog", { name: /episodes/i })).toBeInTheDocument();
    await userEvent.click(btn);
    expect(screen.queryByRole("dialog", { name: /episodes/i })).not.toBeInTheDocument();
  });

  it("keyboard shortcut E opens the panel", () => {
    const { container } = render(<YTPlayer episodes={EPISODES_3} />);
    fireEvent.keyDown(container.firstElementChild!, { key: "e" });
    expect(screen.getByRole("dialog", { name: /episodes/i })).toBeInTheDocument();
  });

  it("keyboard shortcut Escape closes the panel", () => {
    const { container } = render(<YTPlayer episodes={EPISODES_3} />);
    fireEvent.keyDown(container.firstElementChild!, { key: "e" });
    expect(screen.getByRole("dialog", { name: /episodes/i })).toBeInTheDocument();
    fireEvent.keyDown(container.firstElementChild!, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: /episodes/i })).not.toBeInTheDocument();
  });

  it("moves focus into episodes and returns it to the trigger on Escape", async () => {
    render(<YTPlayer episodes={EPISODES_3} />);

    const episodesButton = screen.getByRole("button", { name: /episodes/i });
    await userEvent.click(episodesButton);

    const episodesDialog = screen.getByRole("dialog", { name: /episodes/i });
    expect(episodesDialog).toBeInTheDocument();
    await waitFor(() => {
      expect(document.activeElement).toHaveAttribute("role", "option");
      expect(document.activeElement).toHaveTextContent("01");
    });

    fireEvent.keyDown(episodesDialog, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: /episodes/i })).not.toBeInTheDocument();
      expect(document.activeElement).toBe(episodesButton);
    });
  });

  it("renders all 15 episode items for a large list", async () => {
    render(<YTPlayer episodes={EPISODES_15} />);
    await userEvent.click(screen.getByRole("button", { name: /episodes/i }));
    const items = screen.getAllByRole("option");
    expect(items).toHaveLength(15);
    expect(items[14]).toHaveTextContent("15");
  });

  it("does NOT render Next button when only episodes provided (no onNext)", () => {
    render(<YTPlayer episodes={EPISODES_3} />);
    expect(screen.queryByRole("button", { name: /next/i })).not.toBeInTheDocument();
  });

  it("renders both Next and Episodes buttons when both props are provided", () => {
    render(<YTPlayer episodes={EPISODES_3} onNext={vi.fn()} />);
    expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /episodes/i })).toBeInTheDocument();
  });
});
