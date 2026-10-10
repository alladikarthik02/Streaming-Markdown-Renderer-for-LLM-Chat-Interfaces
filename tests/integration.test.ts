import {expect,it,vi} from 'vitest';
import {MarkdownController,pipeMarkdown} from '../src/index.js';
function controller(maxCharacters?:number){return new MarkdownController({scheduler:{request:()=>1,cancel:()=>{}},maxCharacters});}
it('integrates an async decoded-text source and finishes accepted output',async()=>{
  const stream=controller();async function* source(){yield '# Hi\n';yield '\n**there**';}
  expect(await pipeMarkdown(source(),stream)).toBe('completed');expect(stream.getSnapshot().plan.source).toBe('# Hi\n\n**there**');
});
it('preserves accepted text on transport failure and hides internal exception details',async()=>{
  const stream=controller();async function* source(){yield 'partial';throw new Error('private transport internals');}
  expect(await pipeMarkdown(source(),stream)).toBe('error');expect(stream.getSnapshot().plan.source).toBe('partial');
  expect(stream.getSnapshot().error).not.toContain('private');
});
it('aborts a stalled iterator without waiting for the network',async()=>{
  const stream=controller();const abort=new AbortController();const close=vi.fn(async()=>({done:true as const,value:undefined}));
  const source={ [Symbol.asyncIterator]:()=>({next:()=>new Promise<IteratorResult<string>>(()=>{}),return:close})};
  const run=pipeMarkdown(source,stream,{signal:abort.signal});abort.abort();
  expect(await run).toBe('cancelled');expect(stream.getSnapshot().status).toBe('cancelled');expect(close).toHaveBeenCalledOnce();
});
it('does not let old transport output enter a reset generation',async()=>{
  const stream=controller();let deliver!:(value:IteratorResult<string>)=>void;
  const source={ [Symbol.asyncIterator]:()=>({next:()=>new Promise<IteratorResult<string>>(resolve=>{deliver=resolve;})})};
  const run=pipeMarkdown(source,stream);await Promise.resolve();stream.reset();stream.append('new');stream.finish();deliver({done:false,value:'old'});
  expect(await run).toBe('superseded');expect(stream.getSnapshot().plan.source).toBe('new');
});
it('stops after a source limit error without accepting excess input',async()=>{
  const stream=controller(3);async function* source(){yield 'abc';yield 'more';}
  expect(await pipeMarkdown(source(),stream)).toBe('error');expect(stream.getSnapshot().plan.source).toBe('abc');
});
it('converts iterator creation failures to an error state',async()=>{
  const stream=controller();const source={ [Symbol.asyncIterator]():AsyncIterator<string>{throw new Error('broken');} };
  expect(await pipeMarkdown(source,stream)).toBe('error');expect(stream.getSnapshot().status).toBe('error');
});
it('does not consume a new source on an already completed controller',async()=>{
  const stream=controller();stream.finish();const iterator=vi.fn();expect(await pipeMarkdown({[Symbol.asyncIterator]:iterator},stream)).toBe('completed');expect(iterator).not.toHaveBeenCalled();
});
