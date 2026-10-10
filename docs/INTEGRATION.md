# Chat application integration

StudyChat integration is implemented in the StudyChat repository. Its existing SSE decoder feeds one MarkdownController per answer; AnswerMarkdown subscribes directly to frame-batched plans. Successful verification replaces provisional text before citation chips appear. Cancellation preserves accepted text, and the existing outer viewport follows content growth only while reader following is enabled.

Validation on 2026-10-10: 118 backend tests, 11 frontend tests and eight Chromium scenarios pass, including streamed headings/code/tables followed by verified replacement, cancellation, safe HTML, PDF citations and reader scrolling. The frontend build passes. Live answer capture remains blocked by the configured provider credential returning HTTP 401 token_invalidated, confirmed on a requested retry.

## Decoded text adapter

```tsx
import { useEffect } from 'react';
import { MarkdownStream, pipeMarkdown, useMarkdownStream } from '@alladikarthik/stream-md';

export function Answer({ openTextStream }: {
  openTextStream: (signal: AbortSignal) => AsyncIterable<string>;
}) {
  const stream = useMarkdownStream();
  useEffect(() => {
    const abort = new AbortController();
    stream.reset();
    void pipeMarkdown(openTextStream(abort.signal), stream, { signal: abort.signal });
    return () => abort.abort();
  }, [openTextStream, stream]);
  return <MarkdownStream stream={stream} />;
}
```

Keep `openTextStream` stable with `useCallback` or a module-level definition. It must yield only decoded Markdown deltas, not raw SSE `data:` lines or JSON. Handle HTTP status, SSE event boundaries, provider-specific delta extraction, and `[DONE]` in the application's transport adapter. Use a streaming TextDecoder for UTF-8 bytes so split multibyte characters survive. Pass the same AbortSignal to the fetch operation.

`pipeMarkdown` finishes the controller on exhaustion, preserves accepted text on cancellation or transport failure, and stops when reset creates a new generation. It races cancellation against a stalled iterator. Iterator `return()` is best effort and is not awaited on abort; the application must also abort the underlying transport. Internal exception messages are not exposed. `controller.fail(message)` lets an application report its own safe user-facing failure. Use one active producer per controller.

## StudyChat integration checklist

- Locate the actual message component and SSE/transport decoder.
- Confirm the delta event schema and completion/error semantics with a captured test fixture.
- Mount a controller per message; do not share one across different answers.
- Feed decoded deltas, finish on completion, abort the network and controller on cancellation.
- Connect retry/new-message behavior to reset or a new component instance.
- Style the output in the app; preserve the scroll viewport rather than introducing nested competing autoscrollers.
- Test citation chips separately: this package does not interpret StudyChat's citation syntax.
- Run an application-level streaming, cancellation, retry and scrolling test.
- Capture authorized/redacted real answers only after the real integration is exercised.

## Local package install

Run `pnpm build` and `pnpm pack` here, then install the resulting tarball into the consuming project. `pnpm verify:package` automates this against a disposable clean consumer, without publishing. Supported package entry points and declarations are exercised by that check.
