# Streaming text interfaces

Original synthetic lesson authored for this benchmark. No private coursework.

1. A transport chunk is an arbitrary fragment, not necessarily a model token or a complete UTF-8 character. Decode byte streams with a streaming decoder before parsing text.

2. An append-only message controller accumulates accepted text. Finish flushes pending text. Cancel preserves accepted text but rejects later deltas. Reset clears the message and advances a generation identifier.

3. requestAnimationFrame coalesces many arriving chunks into a single publication per animation frame. It does not guarantee that parsing or rendering finishes within the frame budget.

4. Completed Markdown blocks can retain stable identities. The trailing block may still change interpretation when a delimiter, table row or reference definition arrives.

5. A late reference definition can change an earlier link. Conservative full parsing is a correct fallback. An unfinished long code fence can still cause work that grows with source length.

6. Scroll following should reflect reader intent. Upward gestures disengage it, and an explicit jump action re-enables it. Content growth is not evidence of reader movement.

7. Measure React actualDuration separately from parsing outside React. Total synchronous update work includes parsing, rendering and commit work, but is not full input-to-paint latency.

8. Latency percentile calculations require a stated sample unit. For sorted n samples, nearest-rank p95 selects the element at ceil(0.95*n).

Example code:
const generation = 1;
const pending = [];
pending.push("hello");
const text = pending.join("");
