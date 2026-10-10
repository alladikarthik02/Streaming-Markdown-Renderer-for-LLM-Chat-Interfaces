import { StrictMode, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MarkdownStream, useMarkdownStream, useStreamSnapshot } from '../src/index.js';
import { sample, adversarial } from './sample.js';
import './style.css';
function App() {
  const stream = useMarkdownStream(); const state = useStreamSnapshot(stream);
  const [source, setSource] = useState(sample); const [size, setSize] = useState(24); const [rate, setRate] = useState(60);
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const stop = () => { clearInterval(timer.current); timer.current = undefined; };
  useEffect(() => stop, []);
  function start() {
    stop(); stream.reset(); let cursor = 0;
    timer.current = setInterval(() => {
      const accepted = stream.append(source.slice(cursor, cursor + size)); cursor += size;
      if (!accepted || cursor >= source.length) { stop(); if (accepted) stream.finish(); }
    }, 1000 / rate);
  }
  return <main>
    <header><a className="brand" href="#">s<span>↗</span>m <b>STREAM MD</b></a><span className="tag">RENDERING LAB / 01</span></header>
    <div className="intro"><span className="eyebrow">A SMALL LIBRARY FOR LONG ANSWERS</span><h1>Let the answer<br /><em>take shape.</em></h1><p>Markdown arrives in pieces. Read it as it grows.<br />A local playground for safe, incremental rendering.</p></div>
    <div className="workspace">
      <aside><div className="panel-heading"><h2>Source & controls</h2><span>01</span></div>
        <label htmlFor="source">Markdown source</label><textarea id="source" spellCheck={false} value={source} onChange={e => setSource(e.target.value)} />
        <div className="presets"><button onClick={() => setSource(sample)}>Long answer</button><button onClick={() => setSource(adversarial)}>Safety sample</button></div>
        <label htmlFor="size">Characters per chunk <output>{size}</output></label><input id="size" type="range" min="1" max="120" value={size} onChange={e=>setSize(+e.target.value)} />
        <label htmlFor="rate">Chunks per second <output>{rate}</output></label><input id="rate" type="range" min="5" max="200" value={rate} onChange={e=>setRate(+e.target.value)} />
        <div className="actions"><button className="primary" onClick={start}>Start stream ↗</button><button onClick={()=>{stop();stream.cancel();}}>Cancel</button><button onClick={()=>{stop();stream.reset();}}>Reset</button></div>
        <p className="note">Synthetic sample · runs in your browser.<br />No API key, model call, or telemetry.</p>
      </aside>
      <article><div className="panel-heading"><h2>Live output</h2><span>02</span></div>
        <MarkdownStream stream={stream} style={{height: 540}} />
        {state.status === 'pending' && <div className="empty">Your next thought starts here.<small>Choose a sample and start the stream.</small></div>}
        <footer><span>{state.plan.source.length.toLocaleString()} characters</span><span>{state.plan.fallback ? 'Full-parse fallback' : 'Mutable-suffix parsing'}</span></footer>
      </article>
    </div><div className="principles"><p><b>01 / Stable by default</b>Completed blocks retain their identity.</p><p><b>02 / Your place, preserved</b>Scroll up to pause following.</p><p><b>03 / Untrusted means untrusted</b>HTML stays text. Images stay inert.</p></div>
  </main>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
