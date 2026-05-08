#!/usr/bin/env node
/**
 * CI/CD wrapper for the deploy-review checklist.
 * Uses the Anthropic SDK directly — runs non-interactively in GitHub Actions etc.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... node scripts/pre-deploy-review.js
 *
 * Exit codes:
 *   0 — all critical checks passed (warnings may still exist)
 *   1 — critical issues found OR build failed
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function read(relPath) {
  const abs = join(ROOT, relPath);
  return existsSync(abs) ? readFileSync(abs, 'utf8') : `[FILE NOT FOUND: ${relPath}]`;
}

function log(msg) {
  process.stdout.write(msg + '\n');
}

function fail(msg) {
  process.stderr.write('\n❌ ' + msg + '\n');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Step 1: Production build
// ---------------------------------------------------------------------------

log('\n▶ Step 1 — Production build (npm run build:bundle)');

try {
  execSync('npm run build:bundle', { cwd: ROOT, stdio: 'inherit' });
  log('✓ Build succeeded\n');
} catch {
  fail('Production build failed. Fix build errors before running deploy-review.');
}

// ---------------------------------------------------------------------------
// Step 2: Assemble context for reviewer
// ---------------------------------------------------------------------------

log('▶ Step 2 — Reading source files for review…');

const sourceFiles = {
  '.claude/skills/Bindable.md':                        read('.claude/skills/Bindable.md'),
  '.claude/skills/Envelope.md':                        read('.claude/skills/Envelope.md'),
  '.claude/skills/MiniEngine.md':                      read('.claude/skills/MiniEngine.md'),
  '.claude/skills/DevHarness.md':                      read('.claude/skills/DevHarness.md'),
  'webpack.config.js':                                 read('webpack.config.js'),
  'src/iosense-sdk/types.ts':                          read('src/iosense-sdk/types.ts'),
  'src/iosense-sdk/mini-engine.ts':                    read('src/iosense-sdk/mini-engine.ts'),
  'src/iosense-sdk/api.ts':                            read('src/iosense-sdk/api.ts'),
  'src/components/Gauge/Gauge.tsx':                    read('src/components/Gauge/Gauge.tsx'),
  'src/components/Gauge/index.ts':                     read('src/components/Gauge/index.ts'),
  'src/components/GaugeConfiguration/GaugeConfiguration.tsx': read('src/components/GaugeConfiguration/GaugeConfiguration.tsx'),
  'src/components/GaugeConfiguration/index.ts':        read('src/components/GaugeConfiguration/index.ts'),
  'src/App.tsx':                                       read('src/App.tsx'),
};

const fileBlock = Object.entries(sourceFiles)
  .map(([path, content]) => `### ${path}\n\`\`\`\n${content}\n\`\`\``)
  .join('\n\n');

// ---------------------------------------------------------------------------
// Step 3: Run reviewer via Claude API
// ---------------------------------------------------------------------------

log('▶ Step 3 — Running production-readiness review via Claude API…\n');

const SYSTEM_PROMPT = `You are a production-readiness reviewer for an IOsense widget.
Your job is to check source code against 5 architecture categories and return a JSON report.
Return ONLY a valid JSON object — no prose, no markdown fences, no explanation.`;

const USER_PROMPT = `Review the following widget source files against the 5-category checklist.

${fileBlock}

---

## Checklist

### Category 1 — Envelope Compliance
- C1.1: dynamicBindingPathList always present in buildEnvelope() output (even [])
- C1.2: No apiConfig field emitted in the envelope
- C1.3: dynamicBindingPathList[n].topic has NO {{ }} braces
- C1.4: Array keys use bracket notation: plotLines[0].value NOT plotLines.0.value
- C1.5: uiConfig stores bindable fields WITH {{ }} intact

### Category 2 — Widget Purity
- C2.1: No fetch(), axios, XMLHttpRequest in Gauge.tsx
- C2.2: No import of mini-engine.ts or api.ts in Gauge.tsx
- C2.3: All bindable values read via getValue(key, config, data)
- C2.4: config prop typed as GaugeUIConfig | undefined and guarded before access
- C2.5: Skeleton shown when hasLiveBinding && data.length === 0
- C2.6: User interactions use onEvent() — no inline data fetching

### Category 3 — Self-Registration
- C3.1: window.ReactWidgets['Gauge'] = { mount, update, unmount } in Gauge/index.ts
- C3.2: window.ReactWidgets['GaugeConfiguration'] = { mount, update, unmount } in GaugeConfiguration/index.ts
- C3.3: mount, update, unmount all fully implemented (not empty stubs)
- C3.4: createRoot used — NOT ReactDOM.render
- C3.5: container.setAttribute('data-zone-ignore', '') called in mount

### Category 4 — Build Compliance
- C4.1: React, ReactDOM listed as externals in webpack.config.js
- C4.2: No localStorage reads inside Gauge.tsx or GaugeConfiguration.tsx
- C4.3: No hardcoded secrets or tokens in any src/ file
- C4.4: src/App.tsx NOT imported by widget or configurator

### Category 5 — Configurator Compliance
- C5.1: buildDynamicBindingPathList(uiConfig) called inside buildEnvelope()
- C5.2: Bindable TextInput fields have placeholder showing {{topic}} example
- C5.3: config (GaugeEnvelope | undefined) guarded — no crash when config.uiConfig undefined
- C5.4: onChange called with complete envelope: { _id, type, general, uiConfig, dynamicBindingPathList }

## Output format (JSON only, no prose)

{
  "passed": ["C1.1", "C1.2"],
  "issues": [
    {
      "id": "C2.1",
      "category": 2,
      "file": "src/components/Gauge/Gauge.tsx",
      "line": 42,
      "severity": "critical",
      "issue": "fetch() call found inside widget component",
      "fix_hint": "Remove fetch(). Widget must never fetch data. Use getValue(key, config, data)."
    }
  ]
}

severity: "critical" = breaks production. "warning" = bad practice but won't immediately break.`;

const client = new Anthropic();

let report;
try {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: USER_PROMPT }],
  });

  const raw = message.content[0].type === 'text' ? message.content[0].text : '';
  report = JSON.parse(raw);
} catch (err) {
  fail(`Review API call failed: ${err.message}`);
}

// ---------------------------------------------------------------------------
// Step 4: Evaluate results
// ---------------------------------------------------------------------------

const critical = (report.issues ?? []).filter(i => i.severity === 'critical');
const warnings = (report.issues ?? []).filter(i => i.severity === 'warning');
const passed   = report.passed ?? [];

log(`Results:`);
log(`  ✓ Passed:   ${passed.length} checks`);
log(`  ⚠ Warnings: ${warnings.length}`);
log(`  ✗ Critical: ${critical.length}`);

if (warnings.length > 0) {
  log('\nWarnings (non-blocking):');
  warnings.forEach(w => log(`  [${w.id}] ${w.file}:${w.line} — ${w.issue}`));
}

if (critical.length === 0) {
  log('\n✅ DEPLOY APPROVED — all critical checks passed.\n');
  process.exit(0);
}

log('\nCritical issues (blocking deploy):');
critical.forEach(c => {
  log(`\n  [${c.id}] ${c.file}:${c.line}`);
  log(`  Issue:    ${c.issue}`);
  log(`  Fix hint: ${c.fix_hint}`);
});

log('\n');
fail(`${critical.length} critical issue(s) found. Fix them and re-run npm run deploy.`);
