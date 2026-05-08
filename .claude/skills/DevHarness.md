---
name: widget-dev-harness
description: >
  Use this skill whenever setting up or updating the App.tsx dev harness for a widget.
  Triggers include: "wire up the widget preview", "connect configurator to widget",
  "set up App.tsx", "preview widget locally", or any task that involves rendering a widget
  alongside its configurator in development. Always read alongside widget-datalayer-architecture
  and mini-engine skills.
---

# Widget Dev Harness Skill

## What the Dev Harness Does

The dev harness (`App.tsx`) wires:

1. **Configurator** → produces `DataPointEnvelope` with `dynamicBindingPathList`
2. **Mini-Engine** → calls `resolve(envelope, { authentication })` → real `resolveAndCompute` API call
3. **Widget** → receives `config = envelope.uiConfig` and `data = DataEntry[]`, renders as it would in production

It simulates the full DataLayer → Widget flow with real backend calls. No dummy data.

---

## Auth Flow

Visit `http://localhost:3000/?token=<SSO_TOKEN>` once to exchange an SSO token for a JWT. The JWT is stored in `localStorage.bearer_token` and reused across sessions.

> Implementation: see `src/App.tsx` lines 16–32.

---

## Full App.tsx Template

> See `src/App.tsx` for the complete working harness. The source also includes `timeOverride` state and a `TIME_CHANGE` event handler.

---

## Console Logs to Expect

| Log | When | What it shows |
|---|---|---|
| `[App] resolving envelope:` | Every config change | `dynamicBindingPathList` array with `{ key, topic }` entries |
| `[App] resolved data:` | After resolveAndCompute returns | `DataEntry[]` with resolved values |
| `[DataPoint] config received` | Config prop changes | Raw `uiConfig`, topic string, sources |
| `[DataPoint] data received` | Data prop changes | Each entry + resolved variable value |
| `[DataPointConfiguration] envelope` | Any configurator change | Full envelope JSON |
| `[Widget Event]` | User interaction | `TIME_CHANGE`, `FILTER_CHANGE`, etc. |

---

## Rules

- `resolve()` is always called with the real bearer token — no dummy data
- Pass `config={envelope.uiConfig}` — never the whole envelope
- `data={[]}` when no envelope or no auth — widget shows loading skeleton
- `onEvent` logs to console in dev; real DataLayer handles it in production
- Auth token comes from `localStorage.bearer_token` — populated by SSO exchange via `?token=` query param
- `setData([])` is NOT called between config changes — widget holds last resolved value while re-fetching

---

## Checklist

- [ ] `auth` state initialised from `localStorage.getItem('bearer_token')`
- [ ] SSO token exchange runs once on mount via `?token=` query param
- [ ] `resolve()` called in `useEffect` on `[envelope, auth]` changes
- [ ] Widget receives `config={envelope.uiConfig}` — not the whole envelope
- [ ] `data={[]}` default when no envelope — widget skeleton shows correctly
- [ ] `onEvent` logs events to console
- [ ] App logs `dynamicBindingPathList` and resolved data on every config change
