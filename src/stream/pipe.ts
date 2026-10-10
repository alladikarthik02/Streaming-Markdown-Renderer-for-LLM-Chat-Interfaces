import type { MarkdownController } from './controller.js';
export type PipeResult = 'completed' | 'cancelled' | 'superseded' | 'error';
/** Consume decoded text deltas. Protocol parsing and transport abort belong to the caller. */
export async function pipeMarkdown(source: AsyncIterable<string>, controller: MarkdownController, options: { signal?: AbortSignal } = {}): Promise<PipeResult> {
  const initial = controller.getSnapshot();
  if (initial.status === 'completed') return 'completed';
  if (initial.status === 'cancelled' || initial.status === 'error') return initial.status;
  const generation = initial.generation;
  const current = () => controller.getSnapshot().generation === generation;
  const stop = new AbortController();
  const abort = () => { if (current()) controller.cancel(); stop.abort(); };
  const unsubscribe = controller.subscribe(() => {
    if (!current() || ['cancelled', 'error', 'completed'].includes(controller.getSnapshot().status)) stop.abort();
  });
  options.signal?.addEventListener('abort', abort, { once: true });
  let iterator: AsyncIterator<string> | undefined;
  let exhausted = false;
  try {
    iterator = source[Symbol.asyncIterator]();
    if (options.signal?.aborted) abort();
    while (!stop.signal.aborted) {
      // Racing abort also handles a stalled iterator. Promise handlers remain attached
      // so a later transport rejection does not become an unhandled rejection.
      const next = await new Promise<IteratorResult<string> | undefined>((resolve, reject) => {
        const stopped = () => resolve(undefined);
        stop.signal.addEventListener('abort', stopped, { once: true });
        Promise.resolve().then(() => iterator!.next()).then(resolve, reject).finally(() => stop.signal.removeEventListener('abort', stopped));
        if (stop.signal.aborted) stopped();
      });
      if (!current()) return 'superseded';
      if (stop.signal.aborted || !next) break;
      if (next.done) { exhausted = true; controller.finish(); return controller.getSnapshot().status === 'error' ? 'error' : 'completed'; }
      if (!controller.append(next.value)) break;
    }
    if (!current()) return 'superseded';
    return controller.getSnapshot().status === 'error' ? 'error' : 'cancelled';
  } catch {
    if (!current()) return 'superseded';
    if (stop.signal.aborted) return controller.getSnapshot().status === 'error' ? 'error' : 'cancelled';
    controller.fail('Stream transport failed; accepted text is preserved.');
    return 'error';
  } finally {
    unsubscribe(); options.signal?.removeEventListener('abort', abort);
    // A non-cooperative iterator may never resolve return(); do not block abort on it.
    if (!exhausted && iterator?.return) { try { void Promise.resolve(iterator.return()).catch(() => {}); } catch { /* caller owns transport teardown */ } }
  }
}
