---
name: widget-configurator-layout
description: >
  MANDATORY before building any widget configurator in IoSense. This skill does two things:
  (1) Acts as a senior UX designer — reads the widget type and decides exactly which
  configurator sections to include, which Figma nodes to fetch, and what the final
  panel structure should look like. (2) Provides pixel-accurate visual specs for every
  UI pattern, extracted from the approved Figma designs. Read this BEFORE writing any
  configurator code. Triggers: "build a widget", "create configurator", "bar chart widget",
  "line chart widget", "pie chart widget", "data point widget", "gauge widget", "table widget",
  "add configurator", "widget configuration panel", or any task touching configurator UI.
  Pairs with: widget-datalayer-architecture, widget-bindable-fields.
---

# Widget Configurator — UX Design Intelligence + Visual Spec

---

## STEP 0 — Mandatory Workflow (read before writing a single line of code)

When asked to build a widget configurator, act as a **senior UX/UI designer + senior engineer**.
Follow these steps in order. Do not skip any step.

### Step 0a — Identify the widget type
Read the user's request and identify the widget type (line chart, pie, gauge, KPI, etc.).

### Step 0b — Query the iosense-sdk-beta MCP server ← MANDATORY
**Before writing any JSX/TSX, query the connected `iosense-sdk-beta` MCP server** to get the
exact components, props, and import paths you should use.

You are looking for the real SDK equivalents of every UI element in the configurator:
- The panel wrapper / configurator shell component
- TextInput (field label + input)
- Tabs / Tab
- Switch / Toggle
- Divider
- Accordion / ProductAccordion
- IconButton
- RadioGroup
- Checkbox
- Button (secondary/ghost for Add Chart, Save etc.)
- Any other component that matches what the Figma design shows

**Never build raw divs, custom inputs, or custom toggles that replicate what the SDK already
provides.** If the SDK has a `<TextInput />`, use it. If it has a `<Switch />`, use it.
Using SDK components is non-negotiable — it ensures consistency, theming, and accessibility
without extra work.

### Step 0c — Decide which sections belong (Section A)
Apply the widget capability matrix to decide which configurator sections to include.
Never add sections that don't serve the widget's UX purpose.

### Step 0d — Fetch relevant Figma nodes (Section B)
Call `Figma:get_design_context` for only the nodes relevant to this widget type.
Use the fetched designs as the layout and spacing reference.

### Step 0e — Generate code using SDK components + Figma spec
Combine:
- SDK components from Step 0b (for the actual UI elements)
- Figma layout/spacing spec from Section C (for dimensions, gaps, colours, structure)
- Section A decision (for which sections to include)

The result should look exactly like the Figma design AND use your real SDK components —
not custom-built replicas of them.

---

A pie chart does not need axes. A KPI widget does not need "Add Chart".
Adding irrelevant sections confuses users. Think before you build.

---

## SECTION A — UX Decision Rules by Widget Type

### Widget Capability Matrix

| Section | Line | Bar/Col | Area | Scatter | Combined | Pie/Donut | Gauge | KPI/DataPoint | Table |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Header + Tabs | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Chart Settings | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Data Source | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Axis | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Plot Line | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Plot Band | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Add Chart btn | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Time tab | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | optional | ❌ | ❌ |
| Style tab | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### Why each section is excluded (designer reasoning)

**Axis** — only for X/Y canvas charts. Pie/Gauge/KPI have no axes to configure.

**Plot Line** — only when the widget can draw reference lines across a canvas or arc.
Pie charts have no canvas. KPI shows a single number.

**Plot Band** — only when the widget shades a region between two values.
Scatter rarely needs it (omit unless asked). Pie/KPI never need it.

**Add Chart** — only when the user can add multiple independent chart series each
requiring their own API call. Pie has one data shape. Gauge shows one needle.
KPI shows one metric. None of these support multi-chart layering.

**Time tab** — only for time-series data widgets. KPI/DataPoint pulls latest value only.
Pie charts are usually categorical snapshots, not time-series.

### Data Source form fields vary by widget type

| Widget | Data Source form fields |
|---|---|
| Line / Bar / Area / Scatter | Device/Cluster/Compute type, topic path, response path, label, color, x/y field, time range |
| Combined Chart | All of the above + chart type selector (bar or line) per series |
| Pie / Donut | Category field, value field, topic path, response path, color per slice |
| Gauge | Single value path, min, max (static or bound), unit |
| KPI / Data Point | Single value path, unit, optional comparison/delta field, response path |
| Table | Column label, value key path, data type, format, width, sortable toggle |

### Widget Quick Reference

```
Line Chart       → ALL sections. Full configurator. Fetch all nodes.
Bar/Column       → ALL sections. Same as line chart.
Area Chart       → ALL sections. Same as line chart.
Scatter          → Data Source + Axis + Plot Line + Add Chart. NO Plot Band.
Combined Chart   → ALL sections. This is the Figma reference implementation.
Pie / Donut      → Data Source only. No Axis/Plotline/Plotband/Add Chart/Time.
Gauge            → Data Source + Plot Line + Plot Band. No Axis/Add Chart. Time optional.
KPI / DataPoint  → Data Source only. Simplest configurator. No extras. No Time tab.
                   Consider showing data source inline (no accordion) since there's only one.
Table            → Data Source + Columns (custom section). No Axis/Plotline/Plotband.
                   "Add Column" button replaces "Add Chart" button.
```

---

## SECTION B — Figma Node Reference Map

**File key A:** `zaGIPEfkfstgqFrtNSfTQT` — Combined Column and Line Chart (chart widgets)
**File key B:** `V1DilToZCOgoUXVzpfu4Nx` — Image Event Config (image/event widgets)

### Fetch only what you need

| Panel | File | Node ID | Fetch when |
|---|---|---|---|
| Main panel shell (header + tabs + chart settings + accordion list) | A | `178:36478` | **Always** |
| Style tab | A | `141:24110` | **Always** |
| Add Data Source panel | A | `178:36512` | **Always** |
| Add Axis panel | A | `141:22785` | Line / Bar / Area / Scatter / Combined only |
| Add Plotline panel | A | `141:22988` | Line / Bar / Area / Combined / Gauge only |
| Add Plotband panel | A | `141:23457` | Line / Bar / Area / Combined / Gauge only |
| Time Config panel | A | `178:45010` | Time-series widgets only |
| Image Config panel | B | `234:16845` | Image widget only |

### Fetch sequence

```
1. Decide sections needed (Section A)
2. Always call get_design_context: 178:36478, 141:24110, 178:36512
3. Conditionally call get_design_context for: Axis / Plotline / Plotband / Time
4. Build using only the fetched panels — do not invent sections
```

---

## SECTION C — Visual Spec (pixel-accurate)

### C1. Main Panel

Width `280px` | Bg `white` | Radius `4px`

```
┌──────────────────────────────┐
│ ←  Widget Name    [sticky]   │  56px header, p-4
├──────────────────────────────┤  Divider
│  Data   Time   Style         │  tabs, px-4, left-aligned gap-8
├──────────────────────────────┤
│  Chart Settings              │  12px semibold #192839, p-4
│  [Chart Title *         ]    │  36px input
│  [Chart Description     ]    │
├──────────────────────────────┤  Divider
│  Data Source           [+]   │  52px row, border-b, transparent bg
│  Axis                  [+]   │  ← only if needed
│  Plot Line             [+]   │  ← only if needed
│  Plot Band             [+]   │  ← only if needed
├──────────────────────────────┤  border-t, sticky bottom
│  [+  Add Chart          ]    │  32px, rgba(108,132,157,0.12) ← only if needed
└──────────────────────────────┘
```

### C2. Header

```tsx
<div className="flex gap-2 items-center p-4 sticky top-0 bg-white w-full">
  <ArrowLeftAltIcon size={20} />
  <p className="flex-1 min-w-0 font-semibold text-[16px] leading-[24px] text-[#192839] truncate">
    {widgetName}
  </p>
</div>
<Divider />
```

### C3. Tab Bar — NOT full-width, left-aligned with gap-8

```tsx
<div className="px-4 w-full">
  <div className="flex gap-8 border-b border-[rgba(108,132,157,0.18)]">
    {tabs.map(tab => (
      <button key={tab}
        className={`py-4 font-semibold text-[14px] border-b-2 -mb-px whitespace-nowrap ${
          active === tab
            ? 'text-[#2f4050] border-[#2f4050]'   // brand color, NOT #1364F1
            : 'text-[#768ea7] border-transparent'
        }`}>
        {tab}
      </button>
    ))}
  </div>
</div>
```

### C4. Text Input — always 36px, label above

```tsx
<div className="flex flex-col gap-1 w-full">
  <div className="flex gap-0.5">
    <span className="font-semibold text-[12px] leading-[18px] text-[#40566d]">{label}</span>
    {required && <span className="text-[#d92d20] text-[12px]">*</span>}
  </div>
  <div className="flex items-center h-[36px] px-3 w-full bg-white
                  border border-[#b1c1d2] rounded-[4px] focus-within:border-[#2f4050]">
    <input className="flex-1 font-normal text-[14px] text-[#40566d]
                      placeholder:text-[rgba(108,132,157,0.32)] outline-none bg-transparent"
           placeholder={placeholder} />
    {trailingIcon}
  </div>
</div>
```

### C5. Accordion Row — 52px, transparent bg, border-bottom only

```tsx
<div className="border-b border-[rgba(108,132,157,0.18)] w-full">
  <div className="flex gap-3 items-start p-4 w-full">
    <span className="flex-1 font-medium text-[14px] text-[#192839] truncate max-w-[180px]">
      {title}
    </span>
    <IconButton icon={<AddIcon size={16} />} size={16} />
  </div>
  {expanded && <div className="px-4 pb-4">{children}</div>}
</div>
```

### C6. Add Chart Button — rgba(108,132,157,0.12), NOT blue

```tsx
<div className="sticky bottom-0 bg-white border-t border-[rgba(108,132,157,0.18)] p-4">
  <button className="flex items-center justify-center gap-1 w-full h-[32px]
                     bg-[rgba(108,132,157,0.12)] rounded-[4px]
                     font-semibold text-[12px] text-[#192839]">
    <AddIcon size={16} /> Add Chart
  </button>
</div>
```

### C7. Secondary Panel (Add Data Source / Axis / Plotline / Plotband)

```tsx
<>
  <div className="flex items-center p-4 sticky top-0 bg-white">
    <span className="flex-1 font-semibold text-[16px] text-[#192839]">{title}</span>
    <IconButton icon={<CloseIcon size={20} />} onClick={onClose} />
  </div>
  <Divider />
  <div className="flex flex-col gap-4 p-4 flex-1 overflow-y-auto">{fields}</div>
  <Divider />
  <div className="p-4 sticky bottom-0 bg-white">
    <button className="w-full h-[32px] bg-[rgba(108,132,157,0.12)] rounded-[4px]
                       font-semibold text-[12px] text-[#192839]">
      {saveLabel}
    </button>
  </div>
</>
```

### C8. Style Tab — flat sections, NO gray headers

```
Style tab body — sections separated by <Divider />, no gray accordion headers
├── p-4: Widget Size (dropdown) + W/H inputs + lock icon
├── <Divider />
├── p-4: Wrap Into Card (label + Switch inline)
│         Background Color, Border Color, Border Width, Border Radius
├── <Divider />
├── p-4: Hide Widget Elements
│         ☑ Setting Icon  ☐ Export Icon  ☐ Chart Title  (Checkbox group)
├── <Divider />
└── p-4: Advanced Settings (label + Switch) → fields appear when enabled
```

### C9. Token Cheatsheet

```
PRIMARY TEXT    #192839  → titles, section labels, accordion labels, button text
SECONDARY TEXT  #40566d  → field labels, input values
TERTIARY TEXT   #768ea7  → inactive tabs, helper text
PLACEHOLDER     rgba(108,132,157,0.32)
BRAND           #2f4050  → active tab, switch ON, focus border
ERROR           #d92d20  → required asterisk
INPUT BORDER    #b1c1d2  (1px solid)
MUTED BORDER    rgba(108,132,157,0.18) → accordion, tab underline, dividers
SECONDARY BG    rgba(108,132,157,0.12) → gray buttons
WHITE           panel bg, input bg

FONT            Noto Sans, letter-spacing 0px
16px/600/24  → panel titles
14px/600/20  → tab labels
14px/500/20  → accordion row title
14px/400/20  → input text
12px/600/18  → field labels, section headers, button text

SIZES
Panel:     280px wide (main) / 300px (secondary)
Header:    56px
Input:     36px height
Accordion: 52px row height
Button:    32px height
Icon btn:  16×16px
Tab gap:   32px
Padding:   16px
Field gap: 16px
```

---

## SECTION D — Widget Blueprints (copy-paste starting points)

### D1. Line / Bar / Column / Area Chart

```
Fetch: 178:36478 + 141:24110 + 178:36512 + 141:22785 + 141:22988 + 141:23457 + 178:45010

Tabs: Data | Time | Style

Data accordion:
  Data Source  [+]   ← Device/Cluster/Compute, topic, response path, label, color
  Axis         [+]   ← X-axis, Y-axis, dual axis
  Plot Line    [+]   ← horizontal/vertical reference lines
  Plot Band    [+]   ← shaded regions

Bottom: [+ Add Chart]
```

### D2. Scatter Chart

```
Fetch: 178:36478 + 141:24110 + 178:36512 + 141:22785 + 141:22988 + 178:45010

Tabs: Data | Time | Style

Data accordion:
  Data Source  [+]   ← X field, Y field, size field, label
  Axis         [+]
  Plot Line    [+]
  (no Plot Band)

Bottom: [+ Add Chart]
```

### D3. Pie / Donut Chart

```
Fetch: 178:36478 (shell only) + 141:24110 + 178:36512 (simplified form)

Tabs: Data | Style   (no Time tab)

Data accordion:
  Data Source  [+]   ← category field, value field, topic path, color per slice
  (nothing else)

Bottom: (no Add Chart button)

Note: Data Source panel uses simplified form — no Device/Cluster/Compute selector.
      Just category field, value field, response path, color.
```

### D4. Gauge Widget

```
Fetch: 178:36478 (shell) + 141:24110 + 178:36512 (single value) + 141:22988 + 141:23457

Tabs: Data | Style   (add Time tab only if gauge shows historical trend)

Data accordion:
  Data Source  [+]   ← single value path, min, max, unit
  Plot Line    [+]   ← threshold markers on arc
  Plot Band    [+]   ← green/yellow/red color bands on arc
  (no Axis, no Add Chart)

Bottom: (no Add Chart button)
```

### D5. KPI / Data Point Widget

```
Fetch: 178:36478 (shell, accordion stripped) + 141:24110 + 178:36512 (single value)

Tabs: Data | Style   (no Time tab)

Data section:
  Data Source — consider showing INLINE (no accordion toggle) since there's only one.
  Fields: single value path, unit, optional comparison field.
  (no Axis, Plotline, Plotband, Add Chart)

Bottom: (no Add Chart button)

UX note: This is the simplest configurator. Don't add complexity. If user hasn't
configured anything, show a guided empty state with a "Configure Data Source" CTA.
```

### D6. Table Widget

```
Fetch: 178:36478 (shell, accordion customized) + 141:24110 + 178:36512

Tabs: Data | Style   (Time tab: only if table supports time filtering)

Data accordion:
  Data Source  [+]   ← API endpoint, response path
  Columns      [+]   ← column label, key path, type, format, width, sortable

Bottom: [+ Add Column]   (NOT "Add Chart")

UX note: "Columns" is a custom accordion section that doesn't exist in the Figma
reference. Model its style on the existing accordion row pattern from node 178:36478.
The "Add Column" button uses the same gray style as "Add Chart".
```

---

## SECTION E — Anti-Patterns (reject these as a senior designer would)

```
❌ Plotline on Pie chart            → pies have no reference line concept
❌ "Add Chart" on KPI widget        → single metric, not multi-chart
❌ Axis section on Gauge            → gauges have arcs, not X/Y axes
❌ Time tab on Data Point widget    → latest-value widgets don't need time config
❌ Full-width equal tabs (flex-1)   → tabs are left-aligned with gap-8
❌ Gray accordion headers (#F3F4F6) → rows are transparent bg, border-bottom only
❌ Blue (#1364F1) active tab        → use brand #2f4050
❌ Floating labels inside inputs    → labels always above, 12px semibold #40566d
❌ Input height != 36px             → always exactly 36px
❌ Accordion row height != 52px     → always exactly 52px
❌ Blue/dark save/add buttons       → always rgba(108,132,157,0.12) gray
❌ All sections regardless of type  → think, decide, then build only what's needed
❌ Building raw divs/inputs/toggles when the SDK has the component → always use SDK
❌ Skipping iosense-sdk-beta MCP query → always query before writing any code
```

---

## SECTION F — SDK Component Usage Rules

### F1. The Golden Rule

**If the iosense-sdk-beta MCP server has a component for it, use that component.**
Never hand-roll a UI element that the SDK already provides — not even if it's "simpler"
or "faster". Inconsistency in one widget breaks the whole platform.

### F2. Mandatory MCP Query Pattern

At the start of every configurator task, query the `iosense-sdk-beta` MCP server for
the components you need. Use queries like:

```
"TextInput component API"
"Switch toggle component"
"Accordion or ProductAccordion component"
"Tabs component"
"Divider component"
"IconButton component"
"RadioGroup component"
"Checkbox component"
"Button secondary variant"
```

Read the returned component API (props, imports, variants) before writing any code.

### F3. SDK Component → Figma Design Mapping

The Figma design shows what things should look like. The SDK is how to build them.
Use this mapping table to connect the two:

| What you see in Figma design | What you use in code |
|---|---|
| Text Input (label + input field, 36px) | SDK `TextInput` component |
| Switch / Toggle (blue when on) | SDK `Switch` component |
| Divider (horizontal line) | SDK `Divider` component |
| Product Accordion row (52px, border-b) | SDK `Accordion` or `ProductAccordion` |
| Tabs (Data / Time / Style) | SDK `Tabs` + `Tab` components |
| Icon Button (16×16, + icon) | SDK `IconButton` component |
| Radio Group (Device/Cluster/Compute) | SDK `RadioGroup` component |
| Checkbox (hide elements section) | SDK `Checkbox` component |
| Add Chart / Save button (32px gray) | SDK `Button` secondary/ghost variant |
| Arrow left icon in header | SDK icon from icon library |
| Close (✕) icon | SDK icon from icon library |

> Query the MCP to get the exact prop names, import paths, and variant names for each.
> The table above maps intent — the MCP gives you the exact API.

### F4. What to do when the SDK has no matching component

If you query the MCP and genuinely find no SDK component for something specific
(e.g. a custom color swatch input, a W/H size pair, a drag handle):

1. Build only that specific sub-element from scratch
2. Use the Section C token values for its styling
3. Leave a `// TODO: replace with SDK component when available` comment
4. Wrap it in a named component so it's easy to swap later

```tsx
// TODO: replace with SDK ColorInput when available in iosense-sdk-beta
function ColorInput({ label, value, onChange }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-semibold text-[12px] text-[#40566d]">{label}</span>
      <div className="flex items-center h-[36px] px-3 border border-[#b1c1d2] rounded-[4px]">
        <input className="flex-1 text-[14px] text-[#40566d] outline-none" value={value} onChange={onChange} />
        <div className="size-4 rounded border border-[#e2e2e2]" style={{ background: value }} />
      </div>
    </div>
  );
}
```

### F5. Import discipline

Always import from the SDK package, never from relative paths to internal copies.
If the MCP tells you the import is `@iosense/design-sdk`, use exactly that:

```tsx
// ✅ Correct
import { TextInput, Switch, Divider, Tabs, Tab } from '@iosense/design-sdk';
import { IconButton } from '@iosense/design-sdk';

// ❌ Wrong — never copy SDK components or import from internal paths
import { TextInput } from '../../components/TextInput';
import { Switch } from '../common/Switch';
```

### F6. Props from the design, not from memory

When you use an SDK component, pass props that match the Figma design state — don't
guess or use default props blindly. For example, if the Figma shows a required field:

```tsx
// ✅ Read from Figma: label is "Chart Title", marked required, placeholder "Enter chart title"
<TextInput
  label="Chart Title"
  isRequired
  placeholder="Enter chart title"
  value={chartTitle}
  onChange={(e) => setChartTitle(e.target.value)}
/>

// ❌ Guessing props — may not match design or SDK API
<TextInput label="title" />
```

### F7. Section C values are fallbacks, not replacements

The pixel values in Section C (colors, heights, gaps) exist so you understand the design
intent when the SDK abstracts them. If the SDK `TextInput` already handles its own 36px
height and `#b1c1d2` border internally, you do NOT override those styles. Trust the SDK.

Only apply raw Section C values when:
- Building a custom element the SDK doesn't cover (Section F4)
- Laying out the panel structure itself (the wrapper, gaps between sections, header)
- Overriding SDK defaults that conflict with the Figma design (document why)