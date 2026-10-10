# Stream MD

A React + TypeScript Markdown renderer for streaming chat interfaces. Includes a local playground, safe token rendering, animation-frame batching, memoized completed blocks and reader-controlled scrolling.

## Run locally

Use Node **24.19.0** and pnpm **11.25.0** (versions are pinned):

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open the local URL printed by Vite. The demo uses synthetic text; no API key or network model call is needed. Set characters per chunk and chunks per second, start streaming, and scroll upward to pause following.

## Validate

```sh
pnpm check                         # types, unit/component tests, both builds
pnpm exec playwright install chromium
pnpm test:browser                  # Chromium UI and network-safety checks
pnpm verify:package                # pack, audit contents, install in clean temp consumer
```

CI additionally installs Chromium's OS dependencies. `pnpm build` produces the library in `dist/`; `pnpm build:demo` produces the demo in `demo-dist/`. React is a peer dependency, not bundled into the library. The package is ESM only and has not been published.

## Use in a React component

```tsx
import { MarkdownStream, useMarkdownStream } from '@alladikarthik/stream-md';

function Answer() {
  const stream = useMarkdownStream({ maxCharacters: 1_000_000 });
  // Feed already-decoded strings from your transport:
  // stream.append(chunk); stream.finish();
  // stream.cancel() retains accepted text; stream.reset() starts a new message.
  return <MarkdownStream stream={stream} style={{ height: 420 }} />;
}
```

The example assumes a local tarball install until publication. `useStreamSnapshot(stream)` exposes status, error, generation and the current render plan. `Markdown` renders a complete source string. `MarkdownController` offers the same lifecycle for non-hook integrations; manually owned controllers need `dispose()` on teardown. Hook options are read once per mount.

An append returns false after a terminal state or when its entire chunk exceeds the limit. Finish and cancel flush accepted text synchronously and are idempotent. Reset discards old text and queued callbacks. The hook suspends work on unmount and supports React Strict Mode. Feed decoded strings, not SSE framing or raw bytes; a transport adapter must handle those first.

## Behavior and limits

- Raw HTML is escaped. Links use an allowlist. Remote images become inert placeholders.
- JavaScript, TypeScript, Python, JSON, Bash and CSS highlight when a fence closes or the stream ends. Other languages, failures and code over 20,000 UTF-16 code units stay plain.
- Total source defaults to at most 1,000,000 UTF-16 code units, including pending input. A lower limit is configurable. Deep render recursion falls back to text; parser complexity is still input-dependent.
- GFM tables and tasks are supported. Math stays literal. The component does not supply application-specific citation widgets.
- A conservative fallback fully reparses documents containing `[` or CR, or nonexact lexer source offsets. This includes task lists and ordinary links. Large unfinished blocks can also be expensive.
- Finalization performs a full parse. Incremental speedups are conditional, not constant-time guarantees.
- Following pauses on reader scroll-up intent; Jump to latest re-enables it. The default near-bottom threshold is 40 px. Styling is consumer-owned; demo CSS is an example, not part of the package.
- Chromium and the locked React version are tested. Other browsers and the declared React 18 peer range need additional compatibility runs.

## Project records

- [Technical specification](docs/TECH_SPEC.md)
- [Tasks and validation](docs/TASKS.md)
- [Challenges and interview explanations](docs/CHALLENGES.md)
- [Chat integration adapter](docs/INTEGRATION.md)
- [Release readiness and remaining inputs](docs/RELEASE.md)
- [Safety verification](docs/SAFETY.md)

Five synthetic fixtures have been measured against full marked rendering, React Markdown and Streamdown. See [results](bench/RESULTS.md) and [methodology](bench/README.md). Results include slower reference-heavy fallback behavior; they do not establish a universal speedup or real-answer performance. Real conversation recordings and StudyChat source were not supplied. Current license status is UNLICENSED pending the owner's choice.
