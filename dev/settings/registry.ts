// ─── Design Inspector Registry ────────────────────────────────────────────────
// Maps data-ytp-component identifiers → their configurable CSS custom properties
//
// Three-layer button visual model (bottom → top):
//   Background (::before) — persistent contrast backdrop — --ytp-bg-*
//   Hover      (::after)  — interactive overlay          — --ytp-hover-* / --ytp-active-*
//   Icon       (content)  — SVG, no bg, inherits color   — --ytp-icon-color

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

export const REGISTRY: ComponentDef[] = [
  // ── Progress Bar ─────────────────────────────────────────────────────────
  {
    id: "progress-bar",
    label: "Progress Bar",
    vars: [
      { variable: "--ytp-brand-color",          label: "Brand / Progress Color",   type: "color", default: "#ff0000" },
      { variable: "--ytp-progress-track-bg",    label: "Track Background",          type: "color", default: "rgba(255,255,255,0.20)" },
      { variable: "--ytp-progress-buffered-bg", label: "Buffered Background",       type: "color", default: "rgba(255,255,255,0.40)" },
      { variable: "--ytp-progress-hover-bg",    label: "Hover Preview Background",  type: "color", default: "rgba(255,255,255,0.50)" },
      { variable: "--ytp-scrubber-size",        label: "Scrubber Dot Size",         type: "px",    default: "13px", min: 6, max: 24, step: 1 },
    ],
  },

  // ── Play / Pause Button ───────────────────────────────────────────────────
  // Also controls the global shared tokens that apply to ALL controls
  {
    id: "play-btn",
    label: "Play / Pause Button",
    vars: [
      // — Global / Layout
      { variable: "--ytp-btn-size",         label: "Hitbox Size",            type: "px",    default: "32px",  min: 24,  max: 56, step: 2 },
      { variable: "--ytp-btn-gap",          label: "Button Gap",             type: "px",    default: "0px",   min: 0,   max: 16, step: 1 },
      // — Icon layer
      { variable: "--ytp-icon-color",       label: "Icon Color",             type: "color", default: "#ffffff" },
      // — Background layer (shared across all controls)
      { variable: "--ytp-bg-height",        label: "BG Height (all)",        type: "px",    default: "32px",  min: 16,  max: 56, step: 2 },
      { variable: "--ytp-bg-color",         label: "BG Color (all)",         type: "color", default: "rgba(0,0,0,0.15)" },
      { variable: "--ytp-play-bg-width",    label: "Play BG Width",          type: "px",    default: "32px",  min: 16,  max: 80, step: 2 },
      // — Hover layer (shared across all controls)
      { variable: "--ytp-hover-height",     label: "Hover Height (all)",     type: "px",    default: "32px",  min: 16,  max: 56, step: 2 },
      { variable: "--ytp-hover-color",      label: "Hover Color (all)",      type: "color", default: "rgba(255,255,255,0.12)" },
      { variable: "--ytp-active-color",     label: "Click Color (all)",      type: "color", default: "rgba(255,255,255,0.22)" },
      { variable: "--ytp-play-hover-width", label: "Play Hover Width",       type: "px",    default: "32px",  min: 16,  max: 80, step: 2 },
    ],
  },

  // ── Next Button ───────────────────────────────────────────────────────────
  {
    id: "next-btn",
    label: "Next Button",
    vars: [
      { variable: "--ytp-next-bg-width",    label: "BG Width",               type: "px",    default: "32px",  min: 16, max: 80, step: 2 },
      { variable: "--ytp-next-hover-width", label: "Hover Width",            type: "px",    default: "32px",  min: 16, max: 80, step: 2 },
    ],
  },

  // ── Volume Area ───────────────────────────────────────────────────────────
  {
    id: "volume-area",
    label: "Volume Area",
    vars: [
      { variable: "--ytp-vol-width",        label: "Slider Panel Width",     type: "px",    default: "72px",  min: 40, max: 120, step: 4 },
      { variable: "--ytp-vol-track-color",  label: "Track Color",            type: "color", default: "rgba(255,255,255,0.30)" },
      { variable: "--ytp-vol-fill-color",   label: "Fill & Handle Color",    type: "color", default: "#ffffff" },
      { variable: "--ytp-vol-handle-size",  label: "Handle Dot Size",        type: "px",    default: "8px",   min: 4,  max: 16, step: 1 },
    ],
  },

  // ── Time Display ──────────────────────────────────────────────────────────
  // Inherits --ytp-bg-height, --ytp-bg-color, --ytp-icon-color from global tokens.
  // Width is content-driven; no per-component size override.
  {
    id: "time-display",
    label: "Time Display",
    vars: [
      { variable: "--ytp-bg-color",         label: "BG Color (shared)",      type: "color", default: "rgba(0,0,0,0.15)" },
      { variable: "--ytp-icon-color",       label: "Text Color (shared)",    type: "color", default: "#ffffff" },
    ],
  },

  // ── Right Controls ────────────────────────────────────────────────────────
  {
    id: "right-controls",
    label: "Right Controls",
    vars: [
      { variable: "--ytp-bg-color",         label: "Pill BG Color (shared)", type: "color", default: "rgba(0,0,0,0.15)" },
      { variable: "--ytp-hover-color",      label: "Hover Color (shared)",   type: "color", default: "rgba(255,255,255,0.12)" },
      { variable: "--ytp-active-color",     label: "Click Color (shared)",   type: "color", default: "rgba(255,255,255,0.22)" },
    ],
  },

  // ── Tooltip ───────────────────────────────────────────────────────────────
  {
    id: "__global__",
    label: "Tooltip",
    vars: [
      { variable: "--ytp-tooltip-bg",       label: "Tooltip Background",     type: "color", default: "rgba(28,28,28,0.90)" },
      { variable: "--ytp-tooltip-color",    label: "Tooltip Text Color",     type: "color", default: "#ffffff" },
    ],
  },
];

// All unique variables across all components (for export / reset)
export const ALL_VARS: string[] = [
  // Layout
  "--ytp-btn-size",
  "--ytp-btn-gap",
  // Icon
  "--ytp-icon-color",
  // Background layer
  "--ytp-bg-height",
  "--ytp-bg-color",
  "--ytp-play-bg-width",
  "--ytp-next-bg-width",
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
  "--ytp-tooltip-color",
];

export const LS_KEY = "ytp-design-inspector";
