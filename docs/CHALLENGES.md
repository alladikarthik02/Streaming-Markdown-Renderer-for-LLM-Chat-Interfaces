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
