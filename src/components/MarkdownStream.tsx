import { useCallback, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { type MarkdownController } from '../stream/controller.js';
import { useStreamSnapshot } from '../stream/hooks.js';
import { PlannedMarkdown } from '../render/blocks.js';
export interface MarkdownStreamProps { stream: MarkdownController; followThreshold?: number; className?: string; style?: CSSProperties }
export function MarkdownStream({ stream, followThreshold = 40, className, style }: MarkdownStreamProps) {
  const snapshot = useStreamSnapshot(stream);
  const viewport = useRef<HTMLDivElement>(null); const content = useRef<HTMLDivElement>(null);
  const intent = useRef(true); const lastTop = useRef(0); const touchY = useRef<number | undefined>(undefined);
  const [following, setFollowing] = useState(true);
  const setFollow = useCallback((value: boolean) => { intent.current = value; setFollowing(value); }, []);
  const toBottom = useCallback(() => {
    const el = viewport.current;
    if (el && intent.current) { el.scrollTop = el.scrollHeight; lastTop.current = el.scrollTop; }
  }, []);
  useLayoutEffect(() => { setFollow(true); toBottom(); }, [snapshot.generation, setFollow, toBottom]);
  useLayoutEffect(toBottom, [snapshot.plan, toBottom]);
  useLayoutEffect(() => {
    if (!content.current || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(toBottom); observer.observe(content.current);
    if (viewport.current) observer.observe(viewport.current);
    return () => observer.disconnect();
  }, [toBottom]);
  return <section className={className}>
    <div className="stream-state"><span role="status" aria-label="Stream status">{snapshot.status}</span><span>{following ? 'Following latest' : 'Reading earlier'}</span></div>
    {snapshot.error && <p role="alert">{snapshot.error}</p>}
    <div ref={viewport} role="region" aria-label="Markdown output" tabIndex={0}
      style={{ height: 420, overflow: 'auto', overflowAnchor: 'none', ...style }}
      onWheel={event => { if (event.deltaY < 0) setFollow(false); }}
      onTouchStart={event => { touchY.current = event.touches[0]?.clientY; }}
      onTouchMove={event => { const y = event.touches[0]?.clientY; if (y !== undefined && touchY.current !== undefined && y > touchY.current) setFollow(false); touchY.current = y; }}
      onKeyDown={event => { if (['ArrowUp', 'PageUp', 'Home'].includes(event.key)) setFollow(false); }}
      onScroll={() => {
        const el = viewport.current!; const top = el.scrollTop;
        if (top < lastTop.current - 0.5) setFollow(false);
        else if (top > lastTop.current + 0.5 && el.scrollHeight - el.clientHeight - top <= Math.max(0, followThreshold)) setFollow(true);
        lastTop.current = top;
      }}>
      <div ref={content}><PlannedMarkdown plan={snapshot.plan} /></div>
    </div>
    {!following && <button type="button" className="jump" onClick={() => { setFollow(true); toBottom(); }}>Jump to latest ↓</button>}
  </section>;
}
