import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

// scrollIntoView is not implemented in jsdom
window.HTMLElement.prototype.scrollIntoView = vi.fn();

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

// ─── Episodes panel ────────────────────────────────────────────────────────────

const EPISODES_3 = [{ title: "Episode 1" }, { title: "Episode 2" }, { title: "Episode 3" }];
const EPISODES_15 = Array.from({ length: 15 }, (_, i) => ({ title: `Episode ${i + 1}` }));

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
      <YTPlayer episodes={EPISODES_3} activeEpisodeIndex={0} onEpisodeChange={onEpisodeChange} />
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

  it("keyboard shortcut E opens the panel", async () => {
    const { container } = render(<YTPlayer episodes={EPISODES_3} />);
    // Focus the player wrapper so key events are captured
    fireEvent.keyDown(container.firstElementChild!, { key: "e" });
    expect(screen.getByRole("dialog", { name: /episodes/i })).toBeInTheDocument();
  });

  it("keyboard shortcut Escape closes the panel", async () => {
    const { container } = render(<YTPlayer episodes={EPISODES_3} />);
    fireEvent.keyDown(container.firstElementChild!, { key: "e" });
    expect(screen.getByRole("dialog", { name: /episodes/i })).toBeInTheDocument();
    fireEvent.keyDown(container.firstElementChild!, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: /episodes/i })).not.toBeInTheDocument();
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
