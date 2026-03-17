// ─── Design Inspector Registry ────────────────────────────────────────────────
// Maps data-ytp-component identifiers → their configurable CSS custom properties
//
// Three-layer button visual model (bottom → top):
//   Background (::before) — persistent contrast backdrop — --ytp-bg-*
//   Hover      (::after)  — interactive overlay          — --ytp-hover-* / --ytp-active-*
//   Icon       (content)  — SVG, no bg, inherits color   — --ytp-icon-color
//
// Default size hierarchy:
//   bg-height (36px) > btn-size/hitbox (32px) > hover-height (28px)
//   Background is slightly larger than the hitbox; hover sits inside the background.
//
// Container components (Volume Area, Time Display) use ::before for background
// so the bg can extend horizontally beyond the element via --ytp-*-bg-px offsets.
//
// Design: each component tab is self-contained — it shows ALL vars that affect
// that component (both component-specific and shared global tokens). Shared tokens
// edited in one component panel are reflected everywhere simultaneously.

export type ControlType = "color" | "range" | "px" | "opacity";

export interface VarSpec {
  variable: string;   // e.g. "--ytp-brand-color"
  label: string;      // human-readable label
  type: ControlType;
  default: string;
  min?: number;       // for range / px
  max?: number;
  step?: number;
}

export interface ComponentDef {
  id: string;           // matches data-ytp-component value
  label: string;        // display name
  vars: VarSpec[];
}

// ── Shared token specs (reused across multiple component defs) ────────────────

const SHARED_LAYOUT: VarSpec[] = [
  { variable: "--ytp-btn-size", label: "Hitbox Size",  type: "px",    default: "32px", min: 24, max: 56, step: 2 },
  { variable: "--ytp-btn-gap",  label: "Button Gap",   type: "px",    default: "12px", min: 0,  max: 24, step: 1 },
];

const SHARED_ICON: VarSpec[] = [
  { variable: "--ytp-icon-color", label: "Icon / Text Color", type: "color", default: "#ffffff" },
];

const SHARED_BG: VarSpec[] = [
  { variable: "--ytp-bg-height", label: "BG Height",   type: "px",    default: "36px", min: 16, max: 56, step: 2 },
  { variable: "--ytp-bg-color",  label: "BG Color",    type: "color", default: "rgba(0,0,0,0.15)" },
];

const SHARED_HOVER: VarSpec[] = [
  { variable: "--ytp-hover-height", label: "Hover Height",  type: "px",    default: "28px", min: 16, max: 56, step: 2 },
  { variable: "--ytp-hover-color",  label: "Hover Color",   type: "color", default: "rgba(255,255,255,0.12)" },
  { variable: "--ytp-active-color", label: "Click Color",   type: "color", default: "rgba(255,255,255,0.22)" },
];

// ── Component definitions ─────────────────────────────────────────────────────

export const REGISTRY: ComponentDef[] = [
  // ── Progress Bar ─────────────────────────────────────────────────────────
  {
    id: "progress-bar",
    label: "Progress Bar",
    vars: [
      { variable: "--ytp-brand-color",          label: "Brand / Progress Color", type: "color", default: "#ff0000" },
      { variable: "--ytp-progress-track-bg",    label: "Track Color",            type: "color", default: "rgba(255,255,255,0.20)" },
      { variable: "--ytp-progress-buffered-bg", label: "Buffered Color",         type: "color", default: "rgba(255,255,255,0.40)" },
      { variable: "--ytp-progress-hover-bg",    label: "Hover Preview Color",    type: "color", default: "rgba(255,255,255,0.50)" },
      { variable: "--ytp-scrubber-size",        label: "Scrubber Dot Size",      type: "px",    default: "13px", min: 6, max: 24, step: 1 },
    ],
  },

  // ── Play / Pause Button ───────────────────────────────────────────────────
  {
    id: "play-btn",
    label: "Play / Pause Button",
    vars: [
      // Layout (shared)
      ...SHARED_LAYOUT,
      // Icon (shared)
      ...SHARED_ICON,
      // Background layer — shared height/color + play-specific width
      ...SHARED_BG,
      { variable: "--ytp-play-bg-width",    label: "BG Width",      type: "px", default: "36px", min: 16, max: 80, step: 2 },
      // Hover layer — shared height/color + play-specific width
      ...SHARED_HOVER,
      { variable: "--ytp-play-hover-width", label: "Hover Width",   type: "px", default: "28px", min: 16, max: 80, step: 2 },
    ],
  },

  // ── Next Button ───────────────────────────────────────────────────────────
  {
    id: "next-btn",
    label: "Next Button",
    vars: [
      // Background layer
      ...SHARED_BG,
      { variable: "--ytp-next-bg-width",    label: "BG Width",      type: "px", default: "36px", min: 16, max: 80, step: 2 },
      // Hover layer
      ...SHARED_HOVER,
      { variable: "--ytp-next-hover-width", label: "Hover Width",   type: "px", default: "28px", min: 16, max: 80, step: 2 },
    ],
  },

  // ── Volume Area ───────────────────────────────────────────────────────────
  // Background (::before) extends beyond the content edge via --ytp-vol-bg-px.
  // Hover (::after) is left:0/right:0 = matches content edge → sits inside bg.
  {
    id: "volume-area",
    label: "Volume Area",
    vars: [
      // Container bg/hover extension (unique to this component)
      { variable: "--ytp-vol-bg-px",       label: "BG Extension",        type: "px",    default: "4px",   min: 0,  max: 16, step: 1 },
      // Volume slider-specific
      { variable: "--ytp-vol-width",       label: "Slider Panel Width",  type: "px",    default: "72px",  min: 40, max: 120, step: 4 },
      { variable: "--ytp-vol-track-color", label: "Track Color",         type: "color", default: "rgba(255,255,255,0.30)" },
      { variable: "--ytp-vol-fill-color",  label: "Fill & Handle Color", type: "color", default: "#ffffff" },
      { variable: "--ytp-vol-handle-size", label: "Handle Dot Size",     type: "px",    default: "8px",   min: 4, max: 16, step: 1 },
    ],
  },

  // ── Time Display ──────────────────────────────────────────────────────────
  // Background (::before) extends beyond the padded element via --ytp-time-bg-px.
  // Hover (::after) is left:0/right:0 = matches element edge → sits inside bg.
  // Width is otherwise content-driven (text length determines element width).
  {
    id: "time-display",
    label: "Time Display",
    vars: [
      // Container bg extension (unique to this component)
      { variable: "--ytp-time-bg-px",  label: "BG Extension",        type: "px",    default: "4px",  min: 0,  max: 16, step: 1 },
      // Icon/text color (shown here for convenience; also in Global)
      ...SHARED_ICON,
    ],
  },

  // ── Right Controls ────────────────────────────────────────────────────────
  {
    id: "right-controls",
    label: "Right Controls",
    vars: [
      // Layout
      ...SHARED_LAYOUT,
      // Pill horizontal padding (adds breathing room at left/right pill edges)
      { variable: "--ytp-right-bg-px", label: "Icon Spacing (Pill Padding)", type: "px", default: "6px", min: 0, max: 20, step: 1 },
      // Background (right controls pill uses shared bg vars)
      ...SHARED_BG,
      // Hover (per-button ::after inside the pill)
      ...SHARED_HOVER,
    ],
  },

  // ── Global — unified overview of all shared tokens ────────────────────────
  {
    id: "__global__",
    label: "Global",
    vars: [
      ...SHARED_LAYOUT,
      ...SHARED_ICON,
      ...SHARED_BG,
      ...SHARED_HOVER,
      { variable: "--ytp-tooltip-bg",         label: "Tooltip BG Color",   type: "color",   default: "#1c1c1c" },
      { variable: "--ytp-tooltip-bg-opacity", label: "Tooltip BG Opacity", type: "opacity", default: "0.90"    },
      { variable: "--ytp-tooltip-color",      label: "Tooltip Text Color", type: "color",   default: "#ffffff"  },
    ],
  },
];

// All unique variables across all components (for export / reset)
export const ALL_VARS: string[] = [
  // Layout
  "--ytp-btn-size",
  "--ytp-btn-gap",
  "--ytp-right-bg-px",
  // Icon
  "--ytp-icon-color",
  // Background layer
  "--ytp-bg-height",
  "--ytp-bg-color",
  "--ytp-play-bg-width",
  "--ytp-next-bg-width",
  "--ytp-vol-bg-px",
  "--ytp-time-bg-px",
  // Hover layer
  "--ytp-hover-height",
  "--ytp-hover-color",
  "--ytp-active-color",
  "--ytp-play-hover-width",
  "--ytp-next-hover-width",
  // Volume
  "--ytp-vol-width",
  "--ytp-vol-track-color",
  "--ytp-vol-fill-color",
  "--ytp-vol-handle-size",
  // Progress
  "--ytp-brand-color",
  "--ytp-progress-track-bg",
  "--ytp-progress-buffered-bg",
  "--ytp-progress-hover-bg",
  "--ytp-scrubber-size",
  "--ytp-scrubber-scale",
  // Tooltip
  "--ytp-tooltip-bg",
  "--ytp-tooltip-bg-opacity",
  "--ytp-tooltip-color",
];

export const LS_KEY = "ytp-design-inspector";
