import { Profiler, type ComponentProps, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Streamdown } from 'streamdown';
import { MarkdownController, Markdown, PlannedMarkdown, useStreamSnapshot } from '../src/index.js';
import { codeContent } from '../src/render/safe.js';
import { BlockPlanner } from '../src/core/planner.js';
import { renderToStaticMarkup } from 'react-dom/server';
export type Variant='stream-md'|'full-marked'|'react-markdown'|'streamdown';
export interface Chunk {text:string;atMs:number;tokenCount?:number}
export interface Measurement {renders:number[];work:number[];finalRenders:number[];finalWork:number[];longTasks:number[];frameIntervals:number[];elapsedMs:number;characters:number;commits:number;html:string}
function InlineCode({className,children}:ComponentProps<'code'>){const language=/language-(\S+)/.exec(className??'')?.[1]??'';return <code>{codeContent(String(children??'').replace(/\n$/,''),language,true)}</code>;}
const components={code:InlineCode}; const plugins=[remarkGfm];
function Live({controller}:{controller:MarkdownController}){const s=useStreamSnapshot(controller);return <PlannedMarkdown plan={s.plan}/>;}
const output=document.getElementById('output')!;
const wait=(ms:number)=>new Promise<void>(resolve=>setTimeout(resolve,Math.max(0,ms)));
async function run(variant:Variant,chunks:Chunk[]):Promise<Measurement>{
  const root=createRoot(output);let active=false,finishing=false,source='',frame:number|undefined;
  const result:Measurement={renders:[],work:[],finalRenders:[],finalWork:[],longTasks:[],frameIntervals:[],elapsedMs:0,characters:0,commits:0,html:''};
  const measure=(fn:()=>void)=>{const start=performance.now();flushSync(fn);if(active)(finishing?result.finalWork:result.work).push(performance.now()-start);};
  const controller=new MarkdownController({scheduler:{request:cb=>requestAnimationFrame(()=>measure(cb)),cancel:cancelAnimationFrame}});
  const profiled=(node:ReactNode)=><Profiler id={variant} onRender={(_id,phase,duration)=>{if(active&&phase!=='mount')(finishing?result.finalRenders:result.renders).push(duration);}}>{node}</Profiler>;
  function view(){
    switch(variant){
      case 'stream-md':return <Live controller={controller}/>;
      case 'full-marked':return <Markdown source={source}/>;
      case 'react-markdown':return <ReactMarkdown remarkPlugins={plugins} components={components}>{source}</ReactMarkdown>;
      case 'streamdown':return <Streamdown mode="streaming" animated={false} controls={false} components={components}>{source}</Streamdown>;
    }
  }
  flushSync(()=>root.render(profiled(view())));
  const observer=new PerformanceObserver(list=>{if(active)result.longTasks.push(...list.getEntries().map(e=>e.duration));});
  observer.observe({type:'longtask'});
  let raf=0,last=0;const frameTick=(now:number)=>{if(last&&active)result.frameIntervals.push(now-last);last=now;raf=requestAnimationFrame(frameTick);};raf=requestAnimationFrame(frameTick);
  active=true;const started=performance.now();
  for(const chunk of chunks){
    await wait(started+chunk.atMs-performance.now());
    source+=chunk.text;
    if(variant==='stream-md')controller.append(chunk.text);
    else if(frame===undefined)frame=requestAnimationFrame(()=>{frame=undefined;measure(()=>root.render(profiled(view())));});
  }
  // Allow the final scheduled publication before measuring explicit finalization separately.
  await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));
  finishing=true;
  if(variant==='stream-md')measure(controller.finish);
  else if(frame!==undefined){cancelAnimationFrame(frame);measure(()=>root.render(profiled(view())));}
  await wait(50);
  result.longTasks.push(...observer.takeRecords().map(e=>e.duration));
  result.elapsedMs=performance.now()-started;result.characters=source.length;result.commits=result.renders.length;result.html=output.innerHTML;
  active=false;cancelAnimationFrame(raf);observer.disconnect();controller.dispose();flushSync(()=>root.unmount());
  if(result.renders.length===0)throw new Error('No update Profiler samples: production profiling is not enabled');
  return result;
}
function diff(chunks:Chunk[]){const planner=new BlockPlanner();for(const chunk of chunks)planner.append(chunk.text);const plan=planner.append('',true);return {incremental:renderToStaticMarkup(<PlannedMarkdown plan={plan}/>),full:renderToStaticMarkup(<Markdown source={chunks.map(c=>c.text).join('')}/>)};}
declare global {interface Window {bench:{run:typeof run;diff:typeof diff}}}
window.bench={run,diff};
