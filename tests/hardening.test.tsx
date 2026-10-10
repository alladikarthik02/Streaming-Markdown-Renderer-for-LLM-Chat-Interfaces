import { afterEach, expect, it, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BlockPlanner } from '../src/core/planner.js';
import { PlannedMarkdown } from '../src/render/blocks.js';
import { MarkdownController } from '../src/stream/controller.js';
import * as renderer from '../src/render/safe.js';
import * as lexer from '../src/core/lex.js';
afterEach(()=>{cleanup();vi.restoreAllMocks();});
it('preserves literal entities in code independently of the reference-render comparison', () => {
  const {container}=render(<renderer.Markdown source={'`&lt;b&gt; &amp;`\n\n```\n&lt;b&gt;\n```'} />);
  expect(container.querySelector('code')?.textContent).toBe('&lt;b&gt; &amp;');
  expect(container.querySelector('pre')?.textContent).toBe('&lt;b&gt;');
});
it('does not render unchanged completed blocks again', () => {
  const spy=vi.spyOn(renderer,'renderTokens'); const planner=new BlockPlanner();
  const view=render(<PlannedMarkdown plan={planner.append('immutable first\n\nsecond\n\nthird\n\nfourth')} />);
  const before=spy.mock.calls.filter(([ts])=>ts[0]?.raw==='immutable first').length;
  view.rerender(<PlannedMarkdown plan={planner.append(' grows')} />);
  expect(spy.mock.calls.filter(([ts])=>ts[0]?.raw==='immutable first').length).toBe(before);
  expect(before).toBeGreaterThan(0);
});
it('keeps accepted input and signals an error if parsing throws', () => {
  const stream=new MarkdownController({scheduler:{request:()=>1,cancel:()=>{}}});
  vi.spyOn(lexer,'lex').mockImplementation(()=>{throw new Error('injected parser failure');});
  stream.append('keep this'); stream.finish();
  expect(stream.getSnapshot().status).toBe('error'); expect(stream.getSnapshot().plan.source).toBe('keep this');
  const {container}=render(<PlannedMarkdown plan={stream.getSnapshot().plan} />); expect(container.textContent).toBe('keep this');
});
it('falls back to literal code above the highlight bound', () => {
  const code='const x = 1;\n'.repeat(2000); const {container}=render(<renderer.Markdown source={'```js\n'+code+'```'} />);
  expect(container.querySelector('.hljs-keyword')).toBeNull(); expect(container.querySelector('code')?.textContent).toBe(code.trimEnd());
});
it('rejects static documents over the source bound',()=>{
  const view=render(<renderer.Markdown source={'x'.repeat(1_000_001)} />); expect(view.getByRole('alert').textContent).toContain('limit');
});
const pieces=['alpha\n\nbeta\n\n','# title\n\n','```js\nconst x = 1\n```\n\n','- item\n\n  continuation\n\n- next\n\n','> quote\n>\n> more\n\n','A | B\n--|--\nx | y\n\n','[late][id]\n\n','[id]: https://example.com\n\n','😀 **bold** _em_\n\n','same\n\nsame\n\n'];
it.each(Array.from({length:30},(_,i)=>i+1))('matches intermediate full parsing under randomized partition seed %s', seed=>{
  let state=seed; const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/2**32;};
  const source=Array.from({length:8},()=>pieces[Math.floor(random()*pieces.length)]).join('');
  const planner=new BlockPlanner();let cursor=0;
  while(cursor<source.length){const end=Math.min(source.length,cursor+1+Math.floor(random()*19));const plan=planner.append(source.slice(cursor,end));cursor=end;
    expect(renderToStaticMarkup(<PlannedMarkdown plan={plan} />)).toBe(renderToStaticMarkup(<PlannedMarkdown plan={new BlockPlanner().append(source.slice(0,cursor))} />));
  }
  expect(renderToStaticMarkup(<PlannedMarkdown plan={planner.append('',true)} />)).toBe(renderToStaticMarkup(<renderer.Markdown source={source} />));
});
