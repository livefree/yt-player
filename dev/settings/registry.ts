// ─── Design Inspector Registry ────────────────────────────────────────────────
// Maps data-ytp-component identifiers → their configurable CSS custom properties

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
  {
    id: "progress-bar",
    label: "Progress Bar",
    vars: [
      {
        variable: "--ytp-brand-color",
        label: "Brand / Progress Color",
        type: "color",
        default: "#ff0000",
      },
      {
        variable: "--ytp-progress-track-bg",
        label: "Track Background",
        type: "color",
        default: "rgba(255,255,255,0.20)",
      },
      {
        variable: "--ytp-progress-buffered-bg",
        label: "Buffered Background",
        type: "color",
        default: "rgba(255,255,255,0.40)",
      },
      {
        variable: "--ytp-progress-hover-bg",
        label: "Hover Preview Background",
        type: "color",
        default: "rgba(255,255,255,0.50)",
      },
      {
        variable: "--ytp-scrubber-size",
        label: "Scrubber Dot Size",
        type: "px",
        default: "13px",
        min: 6,
        max: 24,
        step: 1,
      },
    ],
  },
  {
    id: "play-btn",
    label: "Play / Pause Button",
    vars: [
      {
        variable: "--ytp-btn-size",
        label: "Button Size",
        type: "px",
        default: "32px",
        min: 24,
        max: 56,
        step: 2,
      },
      {
        variable: "--ytp-btn-bg",
        label: "Button Background",
        type: "color",
        default: "rgba(0,0,0,0.15)",
      },
      {
        variable: "--ytp-btn-hover-bg",
        label: "Button Hover Background",
        type: "color",
        default: "rgba(0,0,0,0.30)",
      },
      {
        variable: "--ytp-btn-ring-color",
        label: "Button Ring Color",
        type: "color",
        default: "rgba(0,0,0,0.10)",
      },
      {
        variable: "--ytp-btn-ring-size",
        label: "Button Ring Size",
        type: "px",
        default: "4px",
        min: 0,
        max: 12,
        step: 1,
      },
    ],
  },
  {
    id: "next-btn",
    label: "Next Button",
    vars: [
      {
        variable: "--ytp-btn-size",
        label: "Button Size",
        type: "px",
        default: "32px",
        min: 24,
        max: 56,
        step: 2,
      },
      {
        variable: "--ytp-btn-bg",
        label: "Button Background",
        type: "color",
        default: "rgba(0,0,0,0.15)",
      },
      {
        variable: "--ytp-btn-hover-bg",
        label: "Button Hover Background",
        type: "color",
        default: "rgba(0,0,0,0.30)",
      },
    ],
  },
  {
    id: "volume-area",
    label: "Volume Area",
    vars: [
      {
        variable: "--ytp-pill-bg",
        label: "Pill Background",
        type: "color",
        default: "rgba(0,0,0,0.15)",
      },
      {
        variable: "--ytp-pill-btn-hover-bg",
        label: "Pill Button Hover",
        type: "color",
        default: "rgba(255,255,255,0.12)",
      },
      {
        variable: "--ytp-volume-panel-width",
        label: "Volume Panel Width",
        type: "px",
        default: "72px",
        min: 40,
        max: 120,
        step: 4,
      },
      {
        variable: "--ytp-volume-track-bg",
        label: "Volume Track Background",
        type: "color",
        default: "rgba(255,255,255,0.30)",
      },
      {
        variable: "--ytp-volume-handle-size",
        label: "Volume Handle Size",
        type: "px",
        default: "8px",
        min: 4,
        max: 16,
        step: 1,
      },
    ],
  },
  {
    id: "time-display",
    label: "Time Display",
    vars: [
      {
        variable: "--ytp-pill-bg",
        label: "Pill Background",
        type: "color",
        default: "rgba(0,0,0,0.15)",
      },
      {
        variable: "--ytp-btn-size",
        label: "Pill Height",
        type: "px",
        default: "32px",
        min: 24,
        max: 48,
        step: 2,
      },
    ],
  },
  {
    id: "right-controls",
    label: "Right Controls",
    vars: [
      {
        variable: "--ytp-pill-bg",
        label: "Pill Background",
        type: "color",
        default: "rgba(0,0,0,0.15)",
      },
      {
        variable: "--ytp-pill-btn-hover-bg",
        label: "Button Hover Background",
        type: "color",
        default: "rgba(255,255,255,0.12)",
      },
      {
        variable: "--ytp-btn-size",
        label: "Pill Height",
        type: "px",
        default: "32px",
        min: 24,
        max: 48,
        step: 2,
      },
    ],
  },
  {
    id: "__global__",
    label: "Global / Tooltip",
    vars: [
      {
        variable: "--ytp-tooltip-bg",
        label: "Tooltip Background",
        type: "color",
        default: "rgba(28,28,28,0.90)",
      },
      {
        variable: "--ytp-tooltip-color",
        label: "Tooltip Text Color",
        type: "color",
        default: "#ffffff",
      },
    ],
  },
];

// All unique variables across all components (for export/reset)
export const ALL_VARS: string[] = [
  "--ytp-brand-color",
  "--ytp-btn-size",
  "--ytp-btn-bg",
  "--ytp-btn-hover-bg",
  "--ytp-btn-ring-color",
  "--ytp-btn-ring-size",
  "--ytp-pill-bg",
  "--ytp-pill-btn-hover-bg",
  "--ytp-progress-track-bg",
  "--ytp-progress-buffered-bg",
  "--ytp-progress-hover-bg",
  "--ytp-scrubber-size",
  "--ytp-scrubber-scale",
  "--ytp-volume-panel-width",
  "--ytp-volume-track-bg",
  "--ytp-volume-handle-size",
  "--ytp-tooltip-bg",
  "--ytp-tooltip-color",
];

export const LS_KEY = "ytp-design-inspector";
