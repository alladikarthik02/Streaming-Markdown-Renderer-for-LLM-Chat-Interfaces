# Architecture review and challenge log

This log distinguishes observed facts, design decisions and open hypotheses. Interview questions below are preparation prompts, not claims about interviews the user actually attended. No interview transcripts were supplied.

## C01 — Empty repository and unavailable starting folder

Observed at Task 0: the linked remote has no commits; the chat's configured First Project directory does not exist. Commands succeeded with an existing temporary working directory. The repository was cloned into the user's requested separate Documents/second project directory.

Decision: build a standalone package from the spec, preserving the remote. No existing implementation was overwritten. The spec is the first deliverable.

Evidence: successful empty-repository clone and clean unborn main branch. No application behavior exists yet.

## C02 — A blank line does not finalize Markdown

Design review: blank lines occur inside lists, quotes and fenced code. Setext headings and table delimiter rows retroactively change the preceding line. A simplistic splitter freezes incorrect output.

Decision: use the lexer plus conservative source-boundary classification, keep a mutable suffix, and extend it for ambiguous enclosing constructs. Use full parsing as the final reconciliation contract.

Alternatives: full rerender is simpler and will be retained as a baseline; a handwritten full Markdown parser adds unnecessary grammar risk.

Pending proof: chunk-partition tests, render counts and intermediate-state assertions in Task 3.

Interview prompt: Explain a case where optimizing before defining a correctness invariant produces a subtle regression.

## C03 — Late references can invalidate the whole prefix

Design review: `[answer][ref]` can appear near the start and `[ref]: https://example.com` at the end. Two mutable trailing blocks cannot resolve this dependency alone.

Decision: detect reference definitions conservatively, including split definitions, and invalidate with a full-lex fallback in v1. Document the loss of incremental speed on this path.

Pending proof: late-definition and redefinition tests; profiler comparison. A dependency index may be worthwhile later if recordings show heavy reference usage.

Interview prompt: When is a correct slow path preferable to a more complex cache invalidation scheme?

## C04 — A final full parse can hide streaming bugs

Design review: final HTML parity can pass even if characters disappear, duplicate or flash in the middle of a stream.

Decision: test intermediate accepted source, snapshots, stable identities, lifecycle states and final output separately. Keep final reconciliation as a backstop, not the only correctness test.

Pending proof: Task 3-4 tests across every split position and reset-before-frame races.

## C05 — Existing performance numbers are not evidence

Observed at Task 0: the supplied material includes 45 ms/7 ms targets and 40 real answers, but no recordings or raw measurements accompany it.

Decision: label synthetic fixtures; report measured results with environment and raw samples; retain Streamdown even if it wins. Verify production profiling actually emits React timings. Measure long tasks and frame intervals separately from render durations.

Pending input: authorized real recording corpus and real StudyChat performance observation. This does not block the library, but blocks the corresponding empirical claims.

Interview prompt: How would you defend the benchmark against cherry-picking and feature mismatch?

## C06 — Memoization does not bound unfinished-block work

Design review: an unclosed code fence or huge paragraph keeps growing. Parsing just the suffix can still be O(n) for each update and O(n²) over the stream.

Decision: bound total input and highlight size, skip incomplete highlighting, batch frames, and expose this limitation. Measure adversarial inputs. Consider a worker only after evidence of unacceptable stalls.

Pending proof: resource-limit tests and long mutable-block runs. Resource bounds are not a formal execution-time guarantee.

Interview prompt: Distinguish typical-case speed from worst-case complexity.

## C07 — Scroll position is not the same as reader intent

Design review: inserting content increases distance to bottom even when the reader did not scroll. Programmatic scrolling also emits events. Testing distance only after growth can turn following off incorrectly.

Decision: maintain follow intent, evaluate user gestures and pre-growth proximity, and use a deliberate Jump to latest action. Avoid focus changes and continuous token announcements.

Pending proof: real-browser tests during growth, resize and keyboard navigation.

Interview prompt: How would you reproduce a race that is visible only under fast streaming?

## C08 — Rendering is an untrusted-content boundary

Design review: raw HTML, hostile URL schemes, remote images and highlighter HTML are independent attack surfaces.

Decision: render safe React elements; escape HTML; validate destinations; use inert image placeholders; allowlist highlighter languages; provide plain-text fallbacks. Document default restrictions for consumers.

Pending proof: unit payload corpus plus browser no-execution/no-network assertions.

Interview prompt: Why is sanitizing one output path insufficient if plugins introduce new output paths?

## Future entry template

- Task / date:
- Reproduction or evidence:
- User-visible consequence:
- Root cause:
- Options and tradeoffs:
- Implemented fix (or clearly marked proposal):
- Validation and result:
- Remaining limitations:
- Interview explanation:

## Task 1 outcome

Established a separate library build and demo build, with React as a peer and development dependency. Dependency versions are exact and locked. The initial component mount/unmount test, type checking, both builds and public import passed. The latest user instruction supersedes checkpoint pauses; commits and explanations remain required.

## Task 2 outcome

Implemented a token-to-React renderer with no raw HTML sink. URL validation rejects encoded and control-character schemes; remote image Markdown becomes inert text. Highlighting uses a six-language allowlist and safe spans. Unclosed fences remain plain during streaming. 23 tests and both builds pass. The direct highlight.js dependency is declared explicitly rather than relying on lowlight transitively.

## Task 3 outcome

The planner preserves completed token objects and reparses the last two top-level tokens, retaining entire enclosing lists and quotes. 13 adversarial fixtures pass both every split position and every intermediate character against full parsing. A conservative fallback activates for any opening square bracket (possible reference syntax), CR-normalized input or nonexact lexer source offsets. This intentionally sacrifices speed for all bracket-containing documents, including inline links and task lists, until a proven dependency-aware optimization exists. Source offsets identify blocks; duplicate text cannot collide. 51 tests pass.

## Task 4 outcome

An epoch guard prevents cancelled frame callbacks from publishing into a reset stream. Limits count accepted plus queued input and reject an oversized chunk atomically, including when background tabs suppress rAF. Cancel flushes accepted text and stops new appends; reset starts a new generation. Hook cleanup suspends rather than permanently disposing, so React Strict Mode can reactivate the same instance. Code views cache highlight results in per-instance React memoization, releasing them on unmount. 62 tests pass, including bursts, stale callbacks, cancellation, bounds and Strict Mode.

## Task 5 outcome

Scroll following tracks reader intent rather than checking distance only after content grows. Wheel-up, upward touch and navigation keys pause following; output growth and resize preserve the paused position and focus. Jump to latest re-enables it. Browser tests initially found an ambiguous status locator because HTML output elements also expose status roles; the stream status now has an explicit accessible name. Corrected the test Touch constructor to supply its required identifier and target. All three browser scenarios pass, covering active growth, resize, focus and zero remote requests for malicious content. Desktop and mobile screenshots were inspected.

## Task 6 outcome

An independent literal-code assertion exposed entity decoding inside code spans: marked leaves their text literal, so decoding it changed content. Removed that decoding and added a golden DOM assertion. Thirty seeded randomized partition cases now compare every intermediate state, in addition to fixed split fixtures. Verified actual memoization with render-call instrumentation, injected parser failure with accepted-text fallback, highlight/source bounds, and installed the packed artifact into a clean temporary consumer. 97 unit/component tests, 3 browser scenarios, type checking, both builds and the 18-entry package allowlist pass. Other browsers and React 18 are not yet empirically tested.

## Task 7 outcome

The first production profiling attempt aliased both react-dom and react-dom/client. That broke server-renderer internals on the parity page. Restricting the alias to the client fixed it; page startup now fails within 10 seconds instead of hanging. All 11 parity/benchmark cases pass. Recorded 60 measured replays plus 20 warmups across five synthetic workloads and four variants at 4x CPU slowdown.

React actualDuration excludes the controller's parsing work, so the harness additionally measures the complete synchronous update callback for all variants. Controlled rAF batching and flushSync improve comparability but are not normal application scheduling; both limitations are documented. Reference-heavy full fallback is slower than full-marked in this run, and the unfinished paragraph offers no useful speedup. Reported these alongside successful prose/code/table improvements. Raw samples and source digests are committed.

CI comparison uses a prior-revision worktree on the same runner, avoiding a misleading macOS-to-Linux baseline. The first harness commit explicitly has no prior comparison; subsequent comparable revisions enforce both render and total-work regressions at 50% with a 1 ms noise floor. The separate real-corpus gate fails until 40 approved, token-accounted recordings exist. No real recordings have been fabricated.

## Task 8 outcome

A transport iterator can stall while the reader cancels or starts a different answer. The decoded-text adapter races cancellation against next(), tracks controller generation, and performs best-effort iterator cleanup without waiting forever for a noncooperative return(). The caller still owns network abort and SSE decoding. Tests prove a late old chunk cannot enter a reset stream, errors preserve accepted text without exposing internal exception details, limits stop ingestion, and completed controllers do not consume another source.

Final local validation: 107 unit/component tests, 3 Chromium scenarios, type checking, library/demo builds and a clean tarball install (20 allowed entries) pass. Release documentation explicitly separates the verified adapter contract from actual StudyChat integration. No StudyChat source, real recordings or license choice has arrived; npm publication is not authorized. The implementation is usable locally and on GitHub, while these external release/evidence requirements remain open.

## StudyChat integration and evidence capture — 2026-10-10

The answer has two lifecycles: provisional stream text and a final citation-verified replacement. Finishing on the last delta could leave unsupported text visible as verified. The integration resets and finishes the renderer with the verified answer only after the complete valid event sequence, keeping citation chips separate. A browser test checks both phases, including formatted code and tables.

Frame-batched child updates no longer trigger parent state changes on every token. That also removes the old parent-driven scroll signal. A ResizeObserver on the chat content now follows rendered growth while respecting the reader's existing pause state; the app retains one viewport.

A relative vendored tarball makes a clean StudyChat checkout reproducible without publishing a package or depending on an absolute workstation path. Its version and checksum are recorded beside it.

Real capture failed during lesson ingestion despite successful local PDF extraction. A minimal provider request isolated HTTP 401 token_invalidated; a user-requested retry confirmed the same result. No fixture output is substituted for live evidence. The authored 40 questions, capture client and token accounting are ready; collecting and benchmarking actual responses requires a valid key. Token totals describe visible text rather than billing usage. Citations containing brackets still activate the renderer's conservative full-parse fallback, so integration alone proves no speedup for those answers.
