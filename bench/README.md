# Benchmark protocol

## Reproduce

```sh
pnpm bench                    # five synthetic streams, four variants, warmup + 3 runs
pnpm bench:smoke              # five streams, incremental variant, warmup + 3 runs
pnpm bench:gate BASELINE.json CURRENT.json
REQUIRE_REAL_CORPUS=1 pnpm bench:smoke  # deliberately fails until real corpus exists
```

Outputs go to ignored `bench/results/local/current.json`. Copy a reviewed result into `bench/results/` to version it. Synthetic streams are deterministic (`pnpm bench:generate`), contain roughly 9,000 characters and have 80-character chunks scheduled at 100 chunks/s. They have **no model token count**. Recorded timing is the default; `BENCH_TIMING=tokens-100` requires validated per-chunk token accounting and a tokenizer name. `chunks-100` is explicitly not a token-rate measurement.

Real records must include publication approval, redaction status and capture description. The schema checks are a record of consent, not an automated privacy audit. Review text before committing it. Keep original private captures in ignored `bench/private/`. Forty approved real recordings with 2,500–3,500 verified tokens each are required by the separate evidence gate; none were supplied initially.

## Comparisons and fairness

All variants replay identical chunks under Chromium CDP 4x CPU slowdown, 1280×900 viewport, one worker, one complete warmup and three retained repeats. The shared output viewport is 960px wide with a 600px scrolling height. Parsing and rendering are measured without autoscroll, so the comparison isolates rendering work.

1. `stream-md`: mutable-suffix planner, safe React renderer, delayed highlighting.
2. `full-marked`: full parse through the identical safe renderer.
3. `react-markdown`: full-document rendering, GFM and the same lowlight code callback.
4. `streamdown`: pinned Streamdown, streaming mode, animation and controls disabled, the same lowlight code override.

Streamdown's default Shiki plugin is not installed; overriding code keeps the highlighting engine/languages consistent. This is a controlled configuration, not a benchmark of every default Streamdown feature. React Markdown and Streamdown may process partial code more often; Stream MD waits for fence closure. Math remains literal and no math plugin is enabled. Incomplete syntax, wrappers and sanitization differ between libraries; final DOM equivalence is only asserted for the incremental and full-marked renderers. No claim of feature-identical behavior across all libraries is made.

## Metrics

The Vite benchmark build aliases the React DOM client to the **production profiling** entry point. Every replay asserts nonempty React `<Profiler>` update samples, avoiding silent production instrumentation failures. A shared rAF policy batches all variants. `flushSync` inside frame callbacks makes end-to-end update-work timing observable; it changes scheduling relative to ordinary app integration and is the same constraint for every variant.

- `renders`: React `actualDuration` per update commit, excluding initial mount and separating explicit finish.
- `work`: frame callback wall time including lexing, rendering and synchronous commit. Stream MD lexes outside React; its render duration alone would omit parsing. **Use work alongside render duration.** This is not input-to-paint latency.
- `finalRenders` and `finalWork`: explicit finalization measured separately, so final full parsing is visible rather than silently excluded.
- `longTasks`: PerformanceObserver long tasks during replay.
- `frameIntervals`: rAF interval samples, a scheduling proxy, not definitive dropped-frame counts.
- `elapsedMs`, `characters`, `commits`: expose throughput, completion and batching differences.

Per-run p95 uses nearest rank. Tables report the median of three per-run p95 values. Raw samples remain available; there is no outlier deletion. Small timing values are noisy, especially under CPU throttling. Runs use a fixed variant order; thermal/time drift remains a limitation. Repeat on target hardware before making product claims.

## CI policy

Correctness CI runs five synthetic stream smoke replays and final parity checks. `bench:gate` fails on missing/unreviewed baselines or incompatible environments. For a reviewed baseline with matching environment and corpus, it fails when either median render p95 or median work p95 exceeds both 150% of baseline and baseline + 1 ms.

A locally measured macOS result is **not** a Linux CI baseline. CI checks out the prior revision into a separate temporary worktree and measures it on the same runner with the same three repeats. The gate compares this prior-revision result with the current result. The initial commit introducing benchmarks cannot compare against a prior revision with no harness; CI reports that case explicitly. Later commits and pull requests compare against the previous pushed revision or PR base. Source files are not copied between revisions, and the current run is never its own baseline. Environment/lockfile/corpus changes deliberately require a reviewed recalibration rather than a misleading comparison.

## Primary references

- [React Profiler and production profiling](https://react.dev/reference/react/Profiler)
- [Streamdown configuration](https://streamdown.ai/docs/configuration)
- [React Markdown component API](https://github.com/remarkjs/react-markdown)
- [Marked lexer pipeline](https://marked.js.org/using_pro)
