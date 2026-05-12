# Widget Build Tracker

## Active Task
Build TableWidget v1 with title, export button, div-grid table, CellDataStore + VirtualGrid architecture — started 2026-05-10

## Agent 1 Log (Builder)
- 2026-05-10 — initial dispatch — building types.ts, TableWidget.tsx, VirtualGrid.tsx, CellDataStore.ts, TableWidgetConfiguration.tsx + CSS files
- 2026-05-10 — DONE — 8 files written, tsc --noEmit exits clean

## Agent 2 Log (Figma Fetch)
(none)

## Decisions
- 2026-05-10 — No `data.length === 0` skeleton gate for v1 — widget has zero UNS bindings in this scope; mini-engine always returns data:[] for empty dynamicBindingPathList; widget must render from config alone
- 2026-05-10 — CellDataStore in src/components/TableWidget/ — co-located with widget, not a shared lib, because only TableWidget owns it
- 2026-05-10 — VirtualGrid tracks visible rows via onScroll + row height; renders only DOM for visible range; store holds all cell values
- 2026-05-10 — title, rows, columns are NOT bindable fields (structural/display only); dynamicBindingPathList always [] in v1
- 2026-05-10 — CounterInput used for rows/columns in configurator (verified: onChange: ({name, value: number|null}) => void, min/max props exist)
- 2026-05-10 — Button verified: label, variant, color, size, onClick via ButtonHTMLAttributes — no separate onClick prop
- 2026-05-10 — TextInput verified: onChange: ({name, value: string}) => void

## Open Questions
(none)
