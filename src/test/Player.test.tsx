import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { YTPlayer } from "../player/Player";

// HTMLMediaElement methods are not implemented in jsdom
Object.defineProperty(HTMLMediaElement.prototype, "play", {
  writable: true,
  value: vi.fn().mockResolvedValue(undefined),
});
Object.defineProperty(HTMLMediaElement.prototype, "pause", {
  writable: true,
  value: vi.fn(),
});
Object.defineProperty(HTMLMediaElement.prototype, "load", {
  writable: true,
  value: vi.fn(),
});

const TEST_SRC =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

describe("YTPlayer", () => {
  it("renders without crashing", () => {
    render(<YTPlayer />);
  });

  it("renders a video element", () => {
    const { container } = render(<YTPlayer src={TEST_SRC} />);
    const video = container.querySelector("video");
    expect(video).toBeInTheDocument();
  });

  it("sets the video src prop", () => {
    const { container } = render(<YTPlayer src={TEST_SRC} />);
    const video = container.querySelector("video");
    expect(video).toHaveAttribute("src", TEST_SRC);
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
