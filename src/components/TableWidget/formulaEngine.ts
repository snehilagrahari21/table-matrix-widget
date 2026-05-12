import { NumberFormat } from '../../iosense-sdk/types';
import { CellDataStore, CellId } from './CellDataStore';

// ── Number formatting ──────────────────────────────────────────────────────

export function applyNumberFormat(value: string, format: NumberFormat): string {
  if (format === 'general') return value;
  const num = parseFloat(value.replace(/,/g, ''));
  if (isNaN(num)) return value;
  switch (format) {
    case 'number':
      return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    case 'percent':
      return (num * 100).toFixed(2) + '%';
    case 'currency':
      return num.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    case 'integer':
      return Math.round(num).toLocaleString('en-US');
  }
}

// ── Formula display ────────────────────────────────────────────────────────

export function getDisplayValue(cellId: CellId, store: CellDataStore): string {
  const raw = store.getValue(cellId);
  const fmt = store.getFormat(cellId);
  if (raw.startsWith('=')) {
    const result = evalExpr(raw.slice(1), store, new Set([cellId]));
    return applyNumberFormat(result, fmt.numberFormat);
  }
  return applyNumberFormat(raw, fmt.numberFormat);
}

// ── Internal: cell-ref resolution ─────────────────────────────────────────

function refToCellId(ref: string): CellId {
  const m = /^([A-Z]+)(\d+)$/.exec(ref.toUpperCase());
  if (!m) throw new Error(`bad ref: ${ref}`);
  let col = 0;
  for (const ch of m[1]) col = col * 26 + (ch.charCodeAt(0) - 64);
  col -= 1;
  return `R${parseInt(m[2], 10) - 1}C${col}`;
}

function evalExpr(expr: string, store: CellDataStore, visiting: Set<CellId>): string {
  try {
    const withValues = expr.replace(/[A-Z]+\d+/g, (ref) => {
      let id: CellId;
      try { id = refToCellId(ref); } catch { return '0'; }
      if (visiting.has(id)) return '0';
      const v = store.getValue(id);
      const inner = v.startsWith('=')
        ? evalExpr(v.slice(1), store, new Set([...visiting, id]))
        : v;
      const n = parseFloat(inner);
      return isNaN(n) ? '0' : String(n);
    });
    return String(parseArith(withValues));
  } catch {
    return '#INVALID';
  }
}

// ── Arithmetic parser (recursive descent) ─────────────────────────────────
// Supports: numbers, +  -  *  /  **  ^  ( )  unary-minus

function parseArith(input: string): number {
  let pos = 0;
  const src = input.replace(/\s+/g, '');

  function peek(): string { return src[pos] ?? ''; }
  function consume(): string { return src[pos++]; }

  function parseExpr(): number { return parseAddSub(); }

  function parseAddSub(): number {
    let v = parseMulDiv();
    while (peek() === '+' || peek() === '-') {
      const op = consume();
      const rhs = parseMulDiv();
      v = op === '+' ? v + rhs : v - rhs;
    }
    return v;
  }

  function parseMulDiv(): number {
    let v = parsePow();
    while (peek() === '*' || peek() === '/') {
      const op = consume();
      if (op === '*' && peek() === '*') {
        consume();
        v = Math.pow(v, parsePow());
        continue;
      }
      const rhs = parsePow();
      if (op === '/') {
        if (rhs === 0) throw new Error('div/0');
        v = v / rhs;
      } else {
        v = v * rhs;
      }
    }
    return v;
  }

  function parsePow(): number {
    const base = parseUnary();
    if (peek() === '^') { consume(); return Math.pow(base, parsePow()); }
    return base;
  }

  function parseUnary(): number {
    if (peek() === '-') { consume(); return -parseUnary(); }
    if (peek() === '+') { consume(); return parseUnary(); }
    return parsePrimary();
  }

  function parsePrimary(): number {
    if (peek() === '(') {
      consume();
      const v = parseExpr();
      if (consume() !== ')') throw new Error('missing )');
      return v;
    }
    let s = '';
    while (/[\d.]/.test(peek())) s += consume();
    if (s === '' || s === '.') throw new Error(`unexpected: ${peek() || 'EOF'}`);
    return parseFloat(s);
  }

  const result = parseExpr();
  if (pos < src.length) throw new Error(`trailing: ${src.slice(pos)}`);
  return result;
}
