import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { YTPlayer } from "../../src/player/Player";
import { REGISTRY, ALL_VARS, LS_KEY, type ComponentDef, type VarSpec } from "./registry";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SAMPLE_SRC =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

function loadFromStorage(): Record<string, string> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function parseColorToHex(value: string): string {
  // For color inputs we need a hex value. Try to parse rgba / hex.
  if (value.startsWith("#")) return value;
  // rgba(r, g, b, a) → approximate hex (ignores alpha for the picker)
  const m = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (m) {
    const hex = (n: number) => n.toString(16).padStart(2, "0");
    return `#${hex(Number(m[1]))}${hex(Number(m[2]))}${hex(Number(m[3]))}`;
  }
  return "#ffffff";
}

function parsePxValue(value: string): number {
  return parseFloat(value) || 0;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ColorControl({
  spec,
  current,
  onChange,
}: {
  spec: VarSpec;
  current: string;
  onChange: (v: string) => void;
}) {
  const hex = parseColorToHex(current || spec.default);
  return (
    <div style={styles.controlRow}>
      <label style={styles.controlLabel}>{spec.label}</label>
      <div style={styles.controlRight}>
        <input
          type="color"
          value={hex}
          onChange={(e) => onChange(e.currentTarget.value)}
          style={styles.colorInput}
        />
        <span style={styles.controlValue}>{current || spec.default}</span>
      </div>
    </div>
  );
}

function PxControl({
  spec,
  current,
  onChange,
}: {
  spec: VarSpec;
  current: string;
  onChange: (v: string) => void;
}) {
  const px = parsePxValue(current || spec.default);
  const min = spec.min ?? 0;
  const max = spec.max ?? 100;
  const step = spec.step ?? 1;
  return (
    <div style={styles.controlRow}>
      <label style={styles.controlLabel}>{spec.label}</label>
      <div style={styles.controlRight}>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={px}
          onChange={(e) => onChange(`${e.currentTarget.value}px`)}
          style={styles.rangeInput}
        />
        <span style={styles.controlValue}>{current || spec.default}</span>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export function App() {
  const [overrides, setOverrides] = useState<Record<string, string>>(
    loadFromStorage
  );
  const [activeComponentId, setActiveComponentId] = useState<string>(
    REGISTRY[0].id
  );
  const interceptRef = useRef<HTMLDivElement>(null);

  // Build inline style object for the player
  const playerStyle = Object.fromEntries(
    Object.entries(overrides).map(([k, v]) => [k, v])
  ) as React.CSSProperties;

  // Active component definition
  const activeDef: ComponentDef =
    REGISTRY.find((c) => c.id === activeComponentId) ?? REGISTRY[0];

  // Handle click on transparent intercept overlay
  const handleInterceptClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      const el = target.closest("[data-ytp-component]") as HTMLElement | null;
      if (el?.dataset.ytpComponent) {
        const id = el.dataset.ytpComponent;
        if (REGISTRY.some((c) => c.id === id)) {
          setActiveComponentId(id);
          return;
        }
      }
      // Fallback: global
      setActiveComponentId("__global__");
    },
    []
  );

  const setVar = useCallback((variable: string, value: string) => {
    setOverrides((prev) => ({ ...prev, [variable]: value }));
  }, []);

  const handleSave = () => {
    localStorage.setItem(LS_KEY, JSON.stringify(overrides));
  };

  const handleReset = () => {
    setOverrides({});
    localStorage.removeItem(LS_KEY);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(overrides, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ytp-theme.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result as string) as Record<
            string,
            string
          >;
          // Validate keys are --ytp-* variables
          const safe = Object.fromEntries(
            Object.entries(parsed).filter(([k]) => k.startsWith("--ytp-"))
          );
          setOverrides(safe);
        } catch {
          alert("Invalid JSON file");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // CSS source snippet for current component
  const sourceSnippet = [
    `/* Apply via style prop: */`,
    `<YTPlayer`,
    `  style={{`,
    ...activeDef.vars.map(
      (v) => `    "${v.variable}": "${overrides[v.variable] ?? v.default}",`
    ),
    `  }}`,
    `/>`,
  ].join("\n");

  return (
    <div style={styles.root}>
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div style={styles.toolbar}>
        <a href="/index.html" style={styles.backBtn}>
          ← Back
        </a>
        <span style={styles.toolbarTitle}>Design Inspector</span>
        <div style={styles.toolbarActions}>
          <button style={styles.toolBtn} onClick={handleImport}>
            Import
          </button>
          <button style={styles.toolBtn} onClick={handleExport}>
            Export
          </button>
          <button style={styles.toolBtn} onClick={handleSave}>
            Save
          </button>
          <button
            style={{ ...styles.toolBtn, color: "#f66" }}
            onClick={handleReset}
          >
            Reset
          </button>
        </div>
      </div>

      {/* ── Player Preview ───────────────────────────────────────────────── */}
      <div style={styles.previewArea}>
        <YTPlayer
          src={SAMPLE_SRC}
          title="Big Buck Bunny"
          author="Blender Foundation"
          style={playerStyle as never}
        />
        {/* Transparent intercept layer over the player */}
        <div
          ref={interceptRef}
          style={styles.intercept}
          onClick={handleInterceptClick}
          title="Click any component to edit its settings"
        />
      </div>

      {/* ── Settings Panel ───────────────────────────────────────────────── */}
      <div style={styles.settingsPanel}>
        {/* Component tabs */}
        <div style={styles.tabs}>
          {REGISTRY.map((comp) => (
            <button
              key={comp.id}
              style={{
                ...styles.tab,
                ...(comp.id === activeComponentId ? styles.tabActive : {}),
              }}
              onClick={() => setActiveComponentId(comp.id)}
            >
              {comp.label}
            </button>
          ))}
        </div>

        <div style={styles.panelBody}>
          {/* Controls */}
          <div style={styles.controls}>
            <div style={styles.sectionTitle}>{activeDef.label}</div>
            {activeDef.vars.map((spec) => {
              const current = overrides[spec.variable] ?? "";
              const onChange = (v: string) => setVar(spec.variable, v);
              if (spec.type === "color") {
                return (
                  <ColorControl
                    key={spec.variable}
                    spec={spec}
                    current={current}
                    onChange={onChange}
                  />
                );
              }
              return (
                <PxControl
                  key={spec.variable}
                  spec={spec}
                  current={current}
                  onChange={onChange}
                />
              );
            })}
          </div>

          {/* Source snippet */}
          <div style={styles.snippet}>
            <div style={styles.snippetTitle}>Code Snippet</div>
            <pre style={styles.snippetPre}>{sourceSnippet}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  root: {
    display: "flex",
    flexDirection: "column" as const,
    height: "100vh",
    background: "#111",
    color: "#e0e0e0",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: "13px",
    overflow: "hidden",
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "0 16px",
    height: "44px",
    background: "#1a1a1a",
    borderBottom: "1px solid #333",
    flexShrink: 0,
  },
  backBtn: {
    color: "#aaa",
    textDecoration: "none",
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "12px",
  },
  toolbarTitle: {
    flex: 1,
    fontWeight: 600,
    fontSize: "14px",
  },
  toolbarActions: {
    display: "flex",
    gap: "8px",
  },
  toolBtn: {
    background: "#2a2a2a",
    border: "1px solid #444",
    borderRadius: "4px",
    color: "#ddd",
    cursor: "pointer",
    fontSize: "12px",
    padding: "4px 10px",
  },
  previewArea: {
    position: "relative" as const,
    flex: "0 0 auto",
    height: "50vh",
    background: "#000",
    display: "flex",
    alignItems: "stretch",
  },
  intercept: {
    position: "absolute" as const,
    inset: 0,
    cursor: "crosshair",
    zIndex: 9999,
  },
  settingsPanel: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    overflow: "hidden",
    borderTop: "1px solid #333",
  },
  tabs: {
    display: "flex",
    gap: "0",
    borderBottom: "1px solid #333",
    background: "#1a1a1a",
    flexShrink: 0,
    overflowX: "auto" as const,
  },
  tab: {
    background: "none",
    border: "none",
    borderBottom: "2px solid transparent",
    color: "#888",
    cursor: "pointer",
    fontSize: "12px",
    padding: "8px 14px",
    whiteSpace: "nowrap" as const,
    transition: "color 0.15s, border-color 0.15s",
  },
  tabActive: {
    borderBottom: "2px solid #f00",
    color: "#fff",
  },
  panelBody: {
    flex: 1,
    display: "flex",
    gap: "0",
    overflow: "hidden",
  },
  controls: {
    flex: "0 0 380px",
    padding: "16px",
    overflowY: "auto" as const,
    borderRight: "1px solid #2a2a2a",
  },
  sectionTitle: {
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: "#666",
    marginBottom: "12px",
  },
  controlRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "12px",
    gap: "8px",
  },
  controlLabel: {
    flex: "0 0 160px",
    color: "#bbb",
    fontSize: "12px",
  },
  controlRight: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    gap: "8px",
    justifyContent: "flex-end",
  },
  colorInput: {
    width: "32px",
    height: "24px",
    border: "1px solid #444",
    borderRadius: "3px",
    cursor: "pointer",
    padding: "0",
    background: "none",
  },
  rangeInput: {
    flex: 1,
    accentColor: "#f00",
  },
  controlValue: {
    color: "#888",
    fontSize: "11px",
    minWidth: "80px",
    textAlign: "right" as const,
    fontFamily: "monospace",
  },
  snippet: {
    flex: 1,
    padding: "16px",
    overflowY: "auto" as const,
  },
  snippetTitle: {
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: "#666",
    marginBottom: "12px",
  },
  snippetPre: {
    background: "#0d0d0d",
    border: "1px solid #2a2a2a",
    borderRadius: "4px",
    color: "#aef",
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: "11px",
    lineHeight: 1.6,
    padding: "12px",
    overflowX: "auto" as const,
    whiteSpace: "pre" as const,
  },
} as const;
