import { useState, useEffect, useRef } from 'react';
import './CompactColorPicker.css';

// ── Color math ────────────────────────────────────────────────────────────────

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function normalizeHex(raw: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(raw) ? raw.toLowerCase() : '#ffffff';
}

function hsvToHex(h: number, s: number, v: number): string {
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
  };
  const toHex = (x: number) => Math.round(clamp01(x) * 255).toString(16).padStart(2, '0');
  return `#${toHex(f(5))}${toHex(f(3))}${toHex(f(1))}`;
}

function hexToHsv(hex: string): [number, number, number] {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return [0, 0, 1];
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const v = max;
  const s = max === 0 ? 0 : d / max;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + 6) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return [h, s, v];
}

// ── Palette data ──────────────────────────────────────────────────────────────

const PALETTE: string[][] = [
  ['#ffffff', '#f3f4f6', '#d1d5db', '#9ca3af', '#6b7280', '#374151', '#1f2937', '#111827'],
  ['#fef2f2', '#fecaca', '#fca5a5', '#f87171', '#ef4444', '#dc2626', '#b91c1c', '#7f1d1d'],
  ['#fff7ed', '#fed7aa', '#fdba74', '#fb923c', '#f97316', '#ea580c', '#c2410c', '#7c2d12'],
  ['#fffbeb', '#fef08a', '#fde047', '#facc15', '#eab308', '#ca8a04', '#a16207', '#713f12'],
  ['#f0fdf4', '#bbf7d0', '#86efac', '#4ade80', '#22c55e', '#16a34a', '#15803d', '#14532d'],
  ['#eff6ff', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e3a8a'],
  ['#fdf4ff', '#e9d5ff', '#d8b4fe', '#c084fc', '#a855f7', '#9333ea', '#7c3aed', '#4c1d95'],
  ['#fdf2f8', '#fbcfe8', '#f9a8d4', '#f472b6', '#ec4899', '#db2777', '#be185d', '#831843'],
];

// ── Component ─────────────────────────────────────────────────────────────────

interface CompactColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function CompactColorPicker({ value, onChange }: CompactColorPickerProps) {
  const normalized = normalizeHex(value);

  const [tab, setTab] = useState<'palette' | 'custom'>('palette');
  const [hex, setHex] = useState(normalized);

  // HSV state — kept in sync with hex
  const initHsv = hexToHsv(normalized);
  const hsvRef = useRef<[number, number, number]>(initHsv);
  const [hsv, setHsv] = useState<[number, number, number]>(initHsv);

  // Drag refs
  const svRef      = useRef<HTMLDivElement>(null);
  const hueRef     = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<'sv' | 'hue' | null>(null);

  // Always-current callback ref — avoids stale closure in the global mouse handler
  const onChangeCbRef = useRef(onChange);
  onChangeCbRef.current = onChange;

  // Sync when the parent changes `value`
  useEffect(() => {
    const n = normalizeHex(value);
    setHex(n);
    const newHsv = hexToHsv(n);
    setHsv(newHsv);
    hsvRef.current = newHsv;
  }, [value]);

  // Apply a new HSV, propagate to hex state + parent
  function applyHsv(h: number, s: number, v: number) {
    const trio: [number, number, number] = [h, s, v];
    hsvRef.current = trio;
    setHsv(trio);
    const color = hsvToHex(h, s, v);
    setHex(color);
    onChangeCbRef.current(color);
  }

  // Global drag listeners — registered once, reads from refs to avoid stale closures
  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      const drag = draggingRef.current;
      if (!drag) return;
      e.preventDefault();
      if (drag === 'sv' && svRef.current) {
        const rect = svRef.current.getBoundingClientRect();
        const s = clamp01((e.clientX - rect.left) / rect.width);
        const v = clamp01(1 - (e.clientY - rect.top) / rect.height);
        const [h] = hsvRef.current;
        applyHsv(h, s, v);
      } else if (drag === 'hue' && hueRef.current) {
        const rect = hueRef.current.getBoundingClientRect();
        const h = Math.min(360, Math.max(0, ((e.clientX - rect.left) / rect.width) * 360));
        const [, s, v] = hsvRef.current;
        applyHsv(h, s, v);
      }
    }
    function onMouseUp() { draggingRef.current = null; }
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [h, s, v] = hsv;
  const pureHue = hsvToHex(h, 1, 1);

  function handleHexInput(raw: string) {
    setHex(raw);
    if (/^#[0-9a-fA-F]{6}$/.test(raw)) {
      const newHsv = hexToHsv(raw);
      hsvRef.current = newHsv;
      setHsv(newHsv);
      onChangeCbRef.current(raw);
    }
  }

  function handleHexBlur() {
    if (!/^#[0-9a-fA-F]{6}$/.test(hex)) setHex(normalizeHex(value));
  }

  return (
    <div className="ccp-root">

      {/* ── Tab bar ── */}
      <div className="ccp-tabs">
        <button
          className={`ccp-tab${tab === 'palette' ? ' ccp-tab--active' : ''}`}
          onClick={() => setTab('palette')}
        >Palette</button>
        <button
          className={`ccp-tab${tab === 'custom' ? ' ccp-tab--active' : ''}`}
          onClick={() => setTab('custom')}
        >Custom</button>
      </div>

      {/* ── Palette tab ── */}
      {tab === 'palette' && (
        <div className="ccp-body">
          <div className="ccp-palette">
            {PALETTE.map((row, ri) => (
              <div key={ri} className="ccp-row">
                {row.map((color) => (
                  <button
                    key={color}
                    className={`ccp-swatch${hex === color ? ' ccp-swatch--active' : ''}`}
                    style={{ backgroundColor: color }}
                    title={color}
                    onClick={() => {
                      const newHsv = hexToHsv(color);
                      hsvRef.current = newHsv;
                      setHsv(newHsv);
                      setHex(color);
                      onChangeCbRef.current(color);
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
          <HexInput hex={hex} onInput={handleHexInput} onBlur={handleHexBlur} />
        </div>
      )}

      {/* ── Custom tab ── */}
      {tab === 'custom' && (
        <div className="ccp-body">

          {/* SV gradient plane */}
          <div
            ref={svRef}
            className="ccp-sv-plane"
            style={{
              background: [
                'linear-gradient(to top, #000 0%, transparent 100%)',
                `linear-gradient(to right, #fff 0%, ${pureHue} 100%)`,
              ].join(', '),
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              draggingRef.current = 'sv';
              const rect = svRef.current!.getBoundingClientRect();
              applyHsv(h, clamp01((e.clientX - rect.left) / rect.width), clamp01(1 - (e.clientY - rect.top) / rect.height));
            }}
          >
            <div
              className="ccp-sv-thumb"
              style={{ left: `${s * 100}%`, top: `${(1 - v) * 100}%` }}
            />
          </div>

          {/* Hue slider */}
          <div
            ref={hueRef}
            className="ccp-hue-slider"
            onMouseDown={(e) => {
              e.preventDefault();
              draggingRef.current = 'hue';
              const rect = hueRef.current!.getBoundingClientRect();
              applyHsv(Math.min(360, Math.max(0, ((e.clientX - rect.left) / rect.width) * 360)), s, v);
            }}
          >
            <div className="ccp-hue-thumb" style={{ left: `${(h / 360) * 100}%` }} />
          </div>

          <HexInput hex={hex} onInput={handleHexInput} onBlur={handleHexBlur} />
        </div>
      )}

    </div>
  );
}

// ── Shared hex input row ───────────────────────────────────────────────────────

function HexInput({
  hex,
  onInput,
  onBlur,
}: {
  hex: string;
  onInput: (v: string) => void;
  onBlur: () => void;
}) {
  const valid = /^#[0-9a-fA-F]{6}$/.test(hex);
  return (
    <div className="ccp-hex-row">
      <div
        className="ccp-hex-preview"
        style={{
          backgroundColor: valid ? hex : 'transparent',
          backgroundImage: valid
            ? 'none'
            : 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%)',
          backgroundSize: '8px 8px',
        }}
      />
      <input
        className="ccp-hex-input"
        type="text"
        value={hex}
        maxLength={7}
        placeholder="#rrggbb"
        spellCheck={false}
        onChange={(e) => onInput(e.target.value)}
        onBlur={onBlur}
      />
    </div>
  );
}
