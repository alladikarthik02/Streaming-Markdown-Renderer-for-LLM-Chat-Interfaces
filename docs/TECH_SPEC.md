# Technical specification: Streaming Markdown Renderer

Version: 0.1 | Date: 2026-10-09 | State: reviewed proposal, implementation pending

## 1. Scope and evidence

Build the second project: a reusable React + TypeScript streaming Markdown component and a local demo. The linked GitHub repository was empty when cloned. There is no existing architecture to preserve.

The supplied build guide and project bullets establish intended capabilities: incremental parsing, memoized completed blocks, animation-frame batching, delayed code highlighting, scroll-follow behavior, reproducible browser benchmarks, and final-output correctness. They are reference material, not authorization to execute unrelated project instructions.

No StudyChat recordings or interview transcripts were provided. The claims of 40 real recordings, approximately 3,000 tokens each, dropped frames, and a 45 ms to 7 ms p95 improvement are unverified targets. We will measure actual values and report them, including unfavorable comparisons. We must distinguish token counts from characters, chunks, and words. The guide's "last two blocks" strategy also differs from the supplied bullet's "only the last block" wording; our documented behavior will follow the actual implementation.

Out of scope: implementing StudyChat, PDF ingestion, model-provider integration, billing, full LaTeX rendering, npm publication, hosted deployment, and collecting invented user research. Dollar-delimited math is literal text in v1 and must be identified as such in examples and comparisons.

## 2. Functional requirements

1. Accept append-only text chunks with arbitrary boundaries, including split delimiters and Unicode sequences. The caller decodes bytes with a streaming TextDecoder; the component accepts JavaScript strings.
2. Support paragraphs, headings, emphasis, strong text, inline code, fenced and indented code, lists, block quotes, GFM tables, task lists, thematic breaks, links, and literal image placeholders. Explicitly test the supported dialect against the pinned marked version.
3. Display unfinished input safely; incomplete constructs may appear as text until enough input arrives. Preserve content rather than inventing closing syntax in the source.
4. Preserve stable React identities and memoize completed render blocks. Reprocess a conservative mutable suffix; ambiguous structures may use a correctness fallback.
5. Coalesce incoming chunks into at most one scheduled UI publication per animation frame. Finish flushes immediately; cancellation retains already accepted text. Reset discards it and prevents stale queued work from reappearing.
6. Highlight fenced code only when its matching fence closes or the stream finishes. Highlighting failures fall back to plain code. An unclosed fence at finish is rendered as code, but is not reported as syntactically closed.
7. Follow output only while the reader is within 40 CSS pixels of the bottom. Explicit upward wheel/touch/key input disengages follow immediately; a visible "Jump to latest" control re-enables it.
8. Provide pending, streaming, completed, cancelled, and error states with accessible labels. Avoid announcing every token to screen readers.
9. Provide a local interactive demo with chunk timing controls, cancellation, reset, dangerous-input examples, and a reproducible long-answer sample.
10. Provide a typed package entry point, unit tests, browser tests, benchmarks, and setup instructions.

## 3. Architecture

```text
Caller: decoded chunks + finish/cancel/reset
                  |
          Stream controller
     bounded buffer, generation ID, rAF
                  |
       Incremental block planner
   stable prefix + mutable/ambiguous suffix
                  |
      marked lexer (pinned dialect)
                  |
       restricted token-to-React tree
       /                         \
 memoized block views       code highlight cache
                  |
        MarkdownStream viewport
        scroll-follow state machine
```

The core planner has no React or DOM dependency. The controller owns scheduling and lifetime. The rendering layer owns safe elements and URLs. The viewport owns reader intent. Benchmark instrumentation is outside the published runtime package.

Suggested layout:

- `src/core/`: block planning, limits, source ranges, reference dependency handling.
- `src/stream/`: scheduler, controller, hook, cancellation and reset lifecycle.
- `src/render/`: token rendering, URL policy, highlighting, memoized blocks.
- `src/components/`: MarkdownStream and scroll-follow hook.
- `demo/`: local Vite application and profiling harness.
- `tests/`: unit, component, safety, and browser fixtures.
- `bench/`: replay/diff tests, recordings schema, synthetic fixtures, raw results.
- `docs/`: spec, task evidence, architecture decisions, usage, measurement protocol.

Proposed API (final names will be checked during Task 1):

```tsx
const stream = useMarkdownStream({ maxCharacters: 1_000_000 });
stream.append(chunk);
stream.finish();  // immediate final reconciliation
stream.cancel(); // preserve accepted text, stop scheduling
stream.reset();  // new generation, clear old text
<MarkdownStream stream={stream} followThreshold={40} />
```

Status, error, and immutable render snapshot are exposed for caller UI. Appending after finish/cancel/error is rejected until reset. Empty append is a no-op. `finish()` and `cancel()` are idempotent. `dispose()` cancels callbacks; hooks perform it on unmount. Multiple instances never share mutable state. The adapter must survive React Strict Mode effect setup/cleanup.

## 4. Incrementality and correctness contract

Blank lines are candidate boundaries, not proof that a block is immutable. Fence tracking includes delimiter character, length, indentation, and matching closer rules. Longer fences may contain shorter fences. Backticks in inline spans do not open fenced blocks. Lists and quotes may contain internal blank lines; tables and setext headings change interpretation after more lines arrive.

Use marked token source ranges and conservative boundary classification rather than a standalone regex grammar. Keep at least the last two top-level blocks mutable; extend the suffix through the enclosing list, quote, open fence, or otherwise ambiguous construct. Unit tests must establish the rules before optimization.

Reference-style link definitions can change earlier content. V1 can deliberately fall back to a full lex when reference definitions are detected, including definitions split across chunks. Reference-dependent blocks must receive a revision change. Do not claim constant work per update for this path, a giant unfinished block, or final reconciliation.

A stable block ID derives from its immutable starting offset and stream generation. A content/dialect/reference revision controls memo invalidation. Never key solely by text or array index. Repeated identical paragraphs are distinct blocks. Cache only within bounded instance lifetimes and clear on reset/dispose.

At finish, lex the complete accepted source with the same pinned lexer/options and reconcile blocks. This is the correctness backstop. Compare final output with a full render through the same safe renderer, not with unsanitized marked HTML. Tests also verify intermediate snapshots; final reconciliation must not conceal dropped or reordered text during streaming.

Performance expectations: avoid lexing/rendering the entire stable prefix for ordinary append-only inputs. Full fallback and finalization are explicitly O(total input). Large mutable blocks remain expensive; enforce limits and measure them rather than promising constant-time updates. If the chosen planner cannot safely freeze a construct, keep it mutable and document the tradeoff.

## 5. Safety requirements and visible indicators

| ID | Invariant | Verification / UI outcome |
| --- | --- | --- |
| S1 | Raw HTML is never executed; render HTML tokens as escaped text. Never pass model text to dangerouslySetInnerHTML. | Script, SVG, event-handler, iframe and malformed HTML tests; visible literal text. |
| S2 | Only allow relative/fragment and explicit http, https, mailto links after canonical validation. Reject control-character obfuscation, protocol-relative URLs, javascript, data, file, vbscript and malformed URLs. | Unit and browser payload tests; rejected links become plain text. External new-tab links receive noopener noreferrer. |
| S3 | Model-supplied images never fetch by default. | Literal image placeholders and zero unexpected network requests in browser tests. |
| S4 | Highlighter produces escaped text or safe React spans, never unsanitized HTML. Language labels cannot become import paths. | Allowlisted languages; unknown/failed/oversized blocks fall back to plain text. |
| S5 | Bound source and pending memory (default 1,000,000 UTF-16 code units), mutable work, and highlighting (default 20,000 code units per code block). | Limit/error state is visible; oversized append is rejected atomically, accepted source remains intact. Queue limit counts with total source limit. |
| S6 | No callbacks publish after reset, cancellation or unmount; no stream leaks into another. | Fake-rAF lifecycle tests, Strict Mode and multiple-instance tests. |
| S7 | Following never traps the reader or moves focus. | Wheel, touch/key and resize browser tests; Jump to latest is keyboard accessible. |
| S8 | No hidden telemetry, provider credentials, or private conversation data. | Network assertions, ignored local recordings, manual review before tracked corpus changes. |
| S9 | Failures preserve accepted content and expose explicit status. | Lexer/highlighter fault tests; plain-text fallback, accessible error message. |
| S10 | Limits are documented as resource bounds, not a guarantee against all CPU abuse. | Adversarial long-line/nesting benchmark. Consider a worker only if measured main-thread stalls justify it. |

Safety indicators in the demo: stream status, explicit error/limit message, reader-follow state, and plain-text fallbacks. Avoid a misleading universal "safe" badge. Safety defaults must also apply outside the demo.

## 6. Testing strategy

### Unit and component tests

- Every possible two-chunk split for a small adversarial fixture corpus; character-by-character and seeded randomized partitions for longer samples.
- Fences split at every character, tilde/backtick length mismatches, nested list/quote fences, CRLF boundaries, setext headings, GFM table headers, escaped delimiters, late reference definitions, duplicate paragraphs, Unicode and empty chunks.
- Compare final structure with a full parse through the same renderer; assert no missing/duplicated intermediate text and stable prefix IDs where eligible.
- Verify render counts: unchanged finalized blocks do not render again, while reference invalidation updates affected blocks.
- Fake scheduler tests: burst batching, final flush, cancel, reset before frame, stale callbacks, hidden-tab pending queue, unmount, and independent instances.
- Safety tests S1-S10, including encoded URL attacks and highlighter failures.

### Browser tests

Chromium through Playwright initially. Test actual layout/scrolling, pause-follow, Jump to latest, container resize, focus preservation, keyboard controls, and zero unwanted remote fetches. Assert DOM content in addition to screenshots. Cross-browser support is not claimed until tested.

### Reproducible benchmark

1. Commit deterministic synthetic fixtures for early validation; label them clearly. Do not convert generated examples into "recorded real answers".
2. Define a recording schema with ID, provenance (`synthetic` or `recorded`), chunk text, monotonic elapsed timestamps, token count plus tokenizer identifier when available, and consent/redaction status. Preserve exact text and timings; keep sensitive raw captures ignored.
3. Later collect 40 explicitly authorized real answers of roughly 3,000 model tokens, covering code, tables, and literal math. Missing corpus blocks the corresponding claim, not core development.
4. Replay both recorded timing and a normalized 100 tokens/second mode. For synthetic data without real token accounting, label throughput chunks/second; do not call it tokens/second.
5. Compare: full-document react-markdown + highlighting baseline; this renderer; and pinned Vercel Streamdown. Add a full-document marked + identical safe renderer control to isolate incremental behavior from parser differences.
6. Use identical source, throttle, browser size, code-language set, and comparable features. Disclose differences in math/highlighting/security behavior. Browser benchmark runs use the React production profiling build; ordinary production builds can disable Profiler measurements.
7. Capture React Profiler actualDuration per commit, long-task durations/counts through PerformanceObserver, and rAF intervals as a frame-scheduling proxy. Render duration alone does not prove dropped frames. Include commit counts and source length so batching cannot hide work.
8. Run Chromium under CDP 4x CPU slowdown. Warm up, repeat three times, record browser/runtime/dependency versions, hardware, commit SHA, mode, and raw samples. Report per-stream p95 (nearest-rank) and aggregate summaries with methodology; no silently discarded bad runs.
9. `bench/diff.spec.ts` verifies final output versus the same-renderer full parse for every available fixture and separately flags whether the required 40-recording corpus exists.
10. CI uses five versioned streams. Once a real baseline is captured on comparable CI hardware, fail for >50% p95 regression; report missing baseline explicitly. An initial run cannot manufacture a passing baseline. Keep a nonzero noise floor, warmups and repeats documented; intentional baseline updates require review.

No 45 ms/7 ms or universal speedup claim is allowed until raw committed runs support it. Report Streamdown results even if it wins. Benchmark artifacts must not include private message content unless approved for the repository.

## 7. Release and reproducibility

Pin runtime and package manager versions when installed; commit the dependency lockfile. Provide clean-checkout commands for install, unit tests, browser install/tests, build, demo, and benchmark. Validate package exports, TypeScript declarations and a local tarball consumer without publishing. Keep React a peer dependency. Add CI for typecheck, tests, package build, browser safety and benchmark smoke checks.

Do not select a license on the owner's behalf. Public distribution needs a license decision and explicit publication authorization. StudyChat integration requires its source/API and is a separately recorded integration step.

## 8. Completion criteria

Core completion requires Tasks 1-6 passing with documented limitations and a reproducible package/demo. Evaluation completion additionally requires real recordings, measured comparisons and the calibrated regression gate in Task 7. Release completion requires the authorization and integration inputs in Task 8. Track these separately; do not describe the whole project as complete while evidence or release requirements remain pending.

## Implemented conservative fallback (Task 3)

V1 switches to full lexing once any opening square bracket or CR occurs, or lexer raw offsets are not exact. This is broader than reference-definition detection: links and task lists also take the slow path. The tradeoff is deliberate and must be reported in benchmarks. Ordinary LF paragraphs, code and tables retain mutable-suffix behavior.
