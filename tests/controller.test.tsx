import { expect, it, vi } from 'vitest';
import { StrictMode } from 'react';
import { act, render } from '@testing-library/react';
import { MarkdownController, useMarkdownStream, useStreamSnapshot, type Scheduler } from '../src/index.js';
function clock() {
  let id = 0; const callbacks = new Map<number, () => void>();
  const scheduler: Scheduler = { request: cb => { callbacks.set(++id, cb); return id; }, cancel: n => { callbacks.delete(n); } };
  return { scheduler, callbacks, tick: () => { const all = [...callbacks.values()]; callbacks.clear(); all.forEach(cb => cb()); } };
}
it('batches a burst into one publication and finish flushes synchronously', () => {
  const c = clock(); const stream = new MarkdownController({scheduler: c.scheduler}); const listener = vi.fn(); stream.subscribe(listener);
  for (let i=0;i<100;i++) stream.append('x');
  expect(c.callbacks.size).toBe(1); expect(listener).not.toHaveBeenCalled(); c.tick();
  expect(listener).toHaveBeenCalledTimes(1); expect(stream.getSnapshot().plan.source.length).toBe(100);
  stream.append('last'); stream.finish(); expect(stream.getSnapshot().plan.source).toBe('x'.repeat(100)+'last');
  expect(c.callbacks.size).toBe(0); expect(stream.append('rejected')).toBe(false);
});
it('ignores stale callbacks after reset', () => {
  const c = clock(); const stream = new MarkdownController({scheduler:c.scheduler});
  stream.append('old'); const stale = [...c.callbacks.values()][0]!; stream.reset(); stream.append('new'); stale(); c.tick();
  expect(stream.getSnapshot().plan.source).toBe('new'); expect(stream.getSnapshot().generation).toBe(1);
});
it('preserves pending text on cancellation, rejects further data and resets', () => {
  const c=clock(); const stream=new MarkdownController({scheduler:c.scheduler}); stream.append('accepted'); stream.cancel(); stream.cancel();
  expect(stream.getSnapshot().plan.source).toBe('accepted'); expect(stream.getSnapshot().status).toBe('cancelled'); expect(stream.append('x')).toBe(false);
  stream.reset(); expect(stream.append('new')).toBe(true);
});
it('bounds pending input when no animation frames arrive; rejects the whole oversize chunk', () => {
  const c=clock(); const stream=new MarkdownController({scheduler:c.scheduler,maxCharacters:5});
  stream.append('123'); expect(stream.append('456')).toBe(false); expect(stream.getSnapshot().plan.source).toBe('123');
  expect(stream.getSnapshot().status).toBe('error'); expect(c.callbacks.size).toBe(0);
});
it('disposes pending callbacks and isolates instances', () => {
  const c=clock(); const one=new MarkdownController({scheduler:c.scheduler}); const two=new MarkdownController({scheduler:c.scheduler});
  one.append('one'); two.append('two'); one.dispose(); c.tick();
  expect(one.getSnapshot().plan.source).toBe(''); expect(two.getSnapshot().plan.source).toBe('two'); expect(one.append('x')).toBe(false);
});
it('handles Strict Mode cleanup/setup and suspends after unmount', () => {
  const c=clock(); let stream: MarkdownController;
  function Consumer() { stream=useMarkdownStream({scheduler:c.scheduler}); const s=useStreamSnapshot(stream); return <div>{s.plan.source}</div>; }
  const view=render(<StrictMode><Consumer /></StrictMode>);
  act(()=>{stream.append('hello'); c.tick();}); expect(view.container.textContent).toBe('hello');
  act(()=>{stream.append('later');}); view.unmount(); expect(c.callbacks.size).toBe(0);
});
it.each([0,-1,1.2,1_000_001,Infinity])('rejects invalid limit %s', maxCharacters=>expect(()=>new MarkdownController({maxCharacters})).toThrow(RangeError));
