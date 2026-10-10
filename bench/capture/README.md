# Capturing actual StudyChat answers

These 40 questions and eight lessons are **original synthetic workloads**, not student interviews or private coursework. Responses must come from the real live StudyChat HTTP endpoint to be labeled recorded. Generated questions are not themselves answer recordings.

1. Install the pinned capture dependencies in a Python environment.
2. Run `python bench/capture/prepare.py` to generate eight original PDF lessons and the workload list. PDFs are reproducible inputs and ignored; their Markdown sources are committed.
3. Start StudyChat with its valid server-side key, live mode, a migrated database and `STUDYCHAT_CHAT_TIMEOUT_SECONDS=180`, listening on port 8001.
4. Run `python bench/capture/record.py --limit 1` for a pilot. Resolve provider/ingestion failures rather than silently changing to fixture mode.
5. Run `python bench/capture/record.py --limit 40` to collect the full corpus. Existing successful files are retained; failures are recorded separately. There are no automatic paid retries.
6. Review captured text under ignored `bench/private/captures` before publication. Only reviewed records belong in `bench/recordings`; set publicationApproved/redacted true and describe whether any redaction was necessary after review. Never publish private-coursework responses through this path.
7. Run `pnpm bench:recorded` for final parity and the full comparison at 100 visible-text tokens/s. The evidence gate requires 40 reviewed recordings near the planned 3,000-token target. Shorter/longer real outputs must be reported honestly; do not pad, truncate or relabel them to satisfy a claim.

Live requests incur normal configured API charges. The capture program never reads or prints the API key; only StudyChat's server holds it. It uploads these newly authored lessons with explicit transmission consent and never selects existing course documents.

Timing is measured using the capture client's monotonic clock. Transport chunks remain exactly as received. `o200k_base` counts full-text tokens, attributing each token to the first arriving chunk containing its final UTF-8 byte. Counts refer to visible text, not provider billing or hidden reasoning tokens. Run `python -m unittest discover -s bench/capture -p 'test_*.py'` for accounting tests.

References: [Responses streaming](https://developers.openai.com/api/docs/guides/streaming-responses), [configured GPT-5.4 mini model](https://developers.openai.com/api/docs/models/gpt-5.4-mini).

Current capture status: the pilot on 2026-10-10 failed because the configured credential returned HTTP 401 `token_invalidated`. No real answer recording was produced. Replace the server-side key locally and restart the live API before retrying.
