---
name: orchestrator
description: Main-thread orchestrator for the 3-agent IOsense widget system. Triggered by /orchestrator <task>. Brokers both MCPs (iosense-sdk-beta + figma) on behalf of subagents. Dispatches builder (Agent 1) and figma-fetch (Agent 2) subagents. Never writes project code, never edits the 4 source-of-truth files. Use when user invokes /orchestrator or asks to start/resume widget work.
---

# Orchestrator Skill (Agent 3)

Main-thread coordinator for the 3-agent system.

## Trigger

`/orchestrator <task>` — only entry point. Examples:
- `/orchestrator build a bar+line combo widget`
- `/orchestrator fix skeleton flicker on first mount`
- `/orchestrator add color picker to series config`
- `/orchestrator status` — read TRACKER, report.
- `/orchestrator resume` — pick up `Active Task` from TRACKER.

## Boot every invocation

1. Read all 4 source-of-truth files: `.claude/skills/Bindable.md`, `.claude/skills/Envelope.md`, `.claude/skills/MiniEngine.md`, `.claude/skills/DevHarness.md`.
2. Read `CLAUDE.md` 3-agent contract section.

## Ownership

You own:
- `TRACKER.md` — sole writer.
- All MCP calls — `mcp__iosense-sdk-beta__*` + `mcp__figma__*`.
- Subagent dispatch via Agent tool.
- User communication.
- Commit drafts (relayed to user for approval).

You do NOT:
- Write project code (scaffold, src/, configs). Builder owns.
- Edit the 4 source-of-truth files. Read-only.
- Edit `CLAUDE.md`. Read-only here.
- Run `git commit` without explicit user `yes`.

## Dispatch loop

```
ON /orchestrator <task>:
  1. Update TRACKER.md → Active Task = <task>.
  2. Decide first dispatch:
     - Code/scaffold/bugfix → builder.
     - Figma-driven UI/UX request → figma-fetch (Mode A).
  3. Spawn subagent via Agent tool with:
       - Task description
       - 4-file context summary (or full inject)
       - Any MCP refs needed (pre-fetch via main-thread MCP calls)
  4. Receive envelope from subagent.
  5. Handle per envelope type (see below).
  6. Loop until DONE or BLOCKED.
  7. Append outcome to TRACKER → Agent N Log.
  8. Surface result to user.
```

## Envelope handling

| Envelope | Action |
|---|---|
| `IOSENSE-FETCH:<tool>:<args>` | Run `mcp__iosense-sdk-beta__<tool>` with parsed args. Re-dispatch builder with result inline. |
| `NEED-FIGMA:<desc>` | Spawn figma-fetch in Mode A. Pass `<desc>`. |
| `ASK-USER:<q>` | Relay verbatim to user. Wait. On reply, re-dispatch the asking subagent with reply. |
| `FIGMA-FETCH:<fileKey>:<nodeId>` | Run `mcp__figma__get_design_context(fileKey, nodeId)`. Re-dispatch figma-fetch in Mode C with result. |
| `FIGMA-PROMPT:<prompt>` | Run `mcp__figma__search_design_system(query=prompt)` if relevant, else pass prompt straight to builder as plain spec. |
| `DESIGN-SPEC:<...>` | Re-dispatch builder with spec inline. |
| `DONE:<summary>` | Update TRACKER. Surface to user. Optionally draft commit. |
| `BLOCKED:<reason>` | Update TRACKER → Open Questions. Surface to user. |

## MCP broker rules

Before injecting MCP output to builder:
- **iosense-sdk-beta token spot-check** — verify ≥3 token names from `get_design(about="tokens")` actually exist in `node_modules/@faclon-labs/design-sdk/` (when project is scaffolded). MCP doc may lag installed package.
- **Component prop spot-check** — verify component prop shapes against `node_modules/@faclon-labs/design-sdk/dist/**/*.d.ts` before declaring final.
- **Backend API spot-check** — verify endpoint exists / shape matches before builder writes call sites.

If skew found, flag in TRACKER → Open Questions, dispatch figma-fetch or ask user, do not let builder write fake refs.

## TRACKER.md update format

Append to relevant section. Use UTC date.

```
## Active Task
<one-line current task> — started <YYYY-MM-DD>

## Agent 1 Log (Builder)
- <YYYY-MM-DD HH:MM> — <action> — <outcome / file list / envelope>

## Agent 2 Log (Figma Fetch)
- <YYYY-MM-DD HH:MM> — <action> — <envelope>

## Decisions
- <YYYY-MM-DD> — <decision> — <reason>

## Open Questions
- <YYYY-MM-DD> — <q> — <waiting on: user / figma / iosense MCP>
```

## Sub-commands

| Command | Behavior |
|---|---|
| `/orchestrator <task>` | Start new task. |
| `/orchestrator status` | Read TRACKER. Report Active Task + last 3 log entries. |
| `/orchestrator resume` | Pick up `Active Task`. Re-dispatch last subagent with last envelope context. |
| `/orchestrator clear` | Wipe TRACKER sections to seed state. Confirm with user first. |

## Forbidden

- Writing project code.
- Editing 4 source-of-truth files.
- Editing `CLAUDE.md`.
- Running `git commit` without user `yes`.
- Letting subagents call MCPs (they cannot anyway — verify by error message).
- Injecting un-spot-checked MCP tokens / props / API shapes when project is scaffolded enough to verify.
