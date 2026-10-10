# Local synthetic benchmark results

Measured on 2026-10-09. Five synthetic fixtures; no real answer recordings. Values are median of three per-run p95 measurements in milliseconds, after one warmup, Chromium under 4x CPU slowdown. These are local results, not a calibrated CI baseline.

| Fixture | Variant | React render p95 (ms) | Total update work p95 (ms) | Median update commits |
| --- | --- | ---: | ---: | ---: |
| code | stream-md | 1.20 | 1.60 | 68 |
| code | full-marked | 1.70 | 2.40 | 68 |
| code | react-markdown | 18.10 | 20.00 | 80 |
| code | streamdown | 4.00 | 4.30 | 69 |
| prose | stream-md | 0.50 | 0.90 | 69 |
| prose | full-marked | 1.30 | 1.70 | 68 |
| prose | react-markdown | 10.30 | 10.70 | 70 |
| prose | streamdown | 2.80 | 3.50 | 70 |
| references | stream-md | 8.10 | 17.70 | 68 |
| references | full-marked | 6.10 | 7.80 | 68 |
| references | react-markdown | 34.10 | 35.70 | 78 |
| references | streamdown | 18.90 | 19.80 | 69 |
| tables | stream-md | 1.00 | 2.10 | 68 |
| tables | full-marked | 3.40 | 4.60 | 68 |
| tables | react-markdown | 30.00 | 31.40 | 68 |
| tables | streamdown | 4.20 | 4.70 | 69 |
| unfinished | stream-md | 0.50 | 1.10 | 69 |
| unfinished | full-marked | 0.70 | 1.00 | 69 |
| unfinished | react-markdown | 7.50 | 7.60 | 69 |
| unfinished | streamdown | 8.60 | 8.90 | 70 |

Raw update, finalization, frame-interval and long-task samples: [2026-10-09-local.json](results/2026-10-09-local.json). Environment: Apple M1, darwin arm64, Chromium 156.0.8078.4, Node v24.19.0.

See [methodology](README.md) for workload, scheduling, feature differences, metric definitions and limitations. Bracket-containing reference fixtures deliberately take the full-parse fallback. The unfinished fixture has no completed prefix to cache. React render duration excludes incremental lexing; total update work includes it. No 45 ms to 7 ms claim, real-answer token claim, or dropped-frame claim follows from these measurements.
