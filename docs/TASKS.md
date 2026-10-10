# Tasks and implementation checkpoints

At each task boundary: run relevant checks, review safety invariants, update the challenge log, create one factual commit, explain the result to the user, and continue to the next task, per the user's updated instruction. Never include prohibited wording in commit messages.

## Task 0 — Requirements, architecture and risk review

Status: complete for specification checkpoint.

- Read the supplied guide and PDF project section.
- Confirm second-project scope and inspect remote: empty repository.
- Clone into `/Users/karthikalladi/Documents/second project`.
- Define functional requirements, safety invariants, architecture, tests and evidence gates.
- Challenge the blank-line splitting strategy, late references, performance methodology and missing corpus.
- Record persistent project workflow in AGENTS.md.

Validation: reviewed all planned capabilities against the supplied project section; every safety invariant has a proposed check. No implementation tests exist or ran at this checkpoint.

Commit: `docs: define streaming renderer architecture and implementation plan`

## Task 1 — Reproducible package and test foundation

Status: complete. Validation: typecheck, component mount/unmount, package/demo builds and package import passed. Dependencies locked with pnpm 11.25.0 on Node 24.19.0.

Deliver: React/TypeScript package, local Vite demo shell, locked versions, package scripts, unit/component test runner, Playwright setup, CI correctness workflow and minimal typed API. Confirm package availability and current official API docs before choosing versions. Keep React as a peer dependency.

Tests: clean install, typecheck, minimal render/unmount smoke test, package build and consumer import. No performance claim.

Challenge questions: Why a library plus demo? What belongs in a peer dependency? How is a clean checkout reproduced?

Commit: `chore: scaffold renderer package and validation tools`

## Task 2 — Safe full-document rendering reference

Status: pending. Depends on Task 1.

Deliver: pinned marked dialect, token-to-React renderer, link policy, literal HTML/image behavior, bounded language allowlist and plain-code fallback. This becomes the correctness reference for incremental rendering.

Tests: supported Markdown fixtures, GFM structures, S1-S5 and S9 payloads, unknown languages, links and no unsolicited image requests.

Challenge questions: Why avoid raw HTML? How does URL normalization interact with encoded attacks? Why establish correctness before optimization?

Commit: `feat: render markdown tokens with safe defaults`

## Task 3 — Incremental planner and memoized blocks

Status: pending. Depends on Task 2.

Deliver: source ranges, stable IDs, conservative mutable suffix, fence/list/table handling, late-reference fallback, memoized block views and final full-parse reconciliation.

Tests: all split points for adversarial short fixtures, seeded chunk partitions, stable-prefix render counts, duplicates, late references, giant unfinished blocks and final parity.

Challenge questions: When is a block truly immutable? Why are the last two blocks insufficient in general? What cases still cost O(n)?

Commit: `feat: add incremental block planning and stable rendering`

## Task 4 — Stream lifecycle and frame batching

Status: pending. Depends on Task 3.

Deliver: controller/hook, generation IDs, rAF coalescing, finish/cancel/reset/dispose, bounded buffer, status/error UI and delayed highlight cache.

Tests: fake-rAF burst tests, no delayed resurrection after reset, synchronous finish, cancellation preservation, hidden-tab queue bounds, Strict Mode and multiple instances. Verify S4-S6 and S9.

Challenge questions: What races exist even in single-threaded JavaScript? What happens when rAF stops in background tabs? How is cancellation different from reset?

Commit: `feat: batch stream updates and handle lifecycle boundaries`

## Task 5 — Reader-controlled viewport and demo

Status: pending. Depends on Task 4.

Deliver: 40 px follow threshold, explicit reader-intent handling, resize behavior, accessible Jump to latest, sample controls, input/status/limit indicators, and keyboard-friendly layout.

Tests: real browser scrolling while output arrives, upward wheel and keyboard intent, resize/highlight growth, focus preservation, new stream/reset and cancellation. Verify S7-S8.

Challenge questions: Why does distance-to-bottom alone misclassify user intent after content grows? How do programmatic scroll events affect state? What is announced to screen readers?

Commit: `feat: add reader-aware scrolling and interactive demo`

## Task 6 — Correctness hardening and local package delivery

Status: pending. Depends on Task 5.

Deliver: adversarial fixture corpus, expanded browser tests, typed package exports, local tarball consumer validation, usage docs, clean-checkout instructions and documented limits.

Tests: all unit/component/browser checks, build, package contents audit and full-render final parity across available fixtures. Review all S1-S10. Record actual test counts and limitations.

Challenge questions: What can final-only tests miss? How can tests accidentally share the bug under test? Which boundaries are worth property-style testing?

Commit: `test: harden stream correctness and package integration`

## Task 7 — Honest comparative performance evaluation

Status: pending; real-corpus portion awaits recordings. Depends on Task 6.

Deliver: recording schema/validation, labeled synthetic replay fixtures, full rerender and Streamdown baselines, equivalent-renderer control, production profiling harness, raw outputs, p95/long-task reports, five-stream CI gate with an explicit baseline policy.

Tests: instrumentation emits nonempty Profiler samples, timestamp/token metadata validation, final parity, 4x throttle configuration, repeats/warmups, regression calculation and missing-baseline failures. Run available local benchmarks and identify hardware limits.

Evidence gate: 40 real recordings and any 3,000-token or speedup claims remain pending until real authorized data and measured outputs exist. No invented StudyChat premise or dropped-frame assertion. Explain any comparison Streamdown wins.

Challenge questions: Does Profiler actualDuration measure end-to-end latency? How does batching bias per-update statistics? What makes CI performance thresholds noisy?

Commit: `perf: add replay benchmarks and regression reporting`

## Task 8 — Integration and release

Status: pending external inputs. Depends on Tasks 6-7.

Deliver: integration against the actual StudyChat interface when supplied, license choice from owner, release checklist, and publication only when explicitly authorized.

Tests: clean consumer install/import, actual integration smoke test, no secrets/private recordings in package, final documentation matches supported behavior and measured evidence.

Challenge questions: What API assumptions couple this library to one application? What is semantic-versioning policy? What does the public package intentionally exclude?

Commit: `docs: finalize integration and release guidance`
