import { createElement, Fragment, type ReactNode } from 'react';
import { Lexer, type Token, type Tokens } from 'marked';
import { decodeHTML } from 'entities';
import { createLowlight } from 'lowlight';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';
import css from 'highlight.js/lib/languages/css';

const highlighter = createLowlight({ javascript, typescript, python, json, bash, css });
const aliases: Record<string, string> = { js: 'javascript', ts: 'typescript', py: 'python', sh: 'bash' };
export const MAX_CHARACTERS = 1_000_000;
export const MAX_HIGHLIGHT = 20_000;

export function safeUrl(input: string): string | undefined {
  const value = decodeHTML(input).trim();
  let probe = value;
  // Conservatively reject obfuscated schemes, even though browsers do not decode all of these.
  for (let i = 0; i < 3; i++) {
    try { const next = decodeURIComponent(probe); if (next === probe) break; probe = next; }
    catch { return undefined; }
  }
  if (/[\u0000-\u0020\u007f-\u009f\\]/u.test(probe) || probe.startsWith('//')) return undefined;
  const scheme = /^([a-z][a-z\d+.-]*):/i.exec(probe)?.[1]?.toLowerCase();
  if (scheme && !['http', 'https', 'mailto'].includes(scheme)) return undefined;
  try {
    const url = new URL(probe, 'https://local.invalid/');
    if (!['http:', 'https:', 'mailto:'].includes(url.protocol)) return undefined;
    return value;
  } catch { return undefined; }
}

export function lex(source: string): Token[] {
  return Lexer.lex(source, { gfm: true, breaks: false, pedantic: false });
}

export function isClosedFence(raw: string): boolean {
  const lines = raw.replace(/\r\n?/g, '\n').split('\n');
  const opener = /^ {0,3}(`{3,}|~{3,})/.exec(lines[0] ?? '')?.[1];
  if (!opener) return false;
  const closer = new RegExp('^ {0,3}' + (opener[0] === '`' ? '`' : '~') + '{' + opener.length + ',}[ \\t]*$');
  return lines.slice(1).some(line => closer.test(line));
}

type HighlightNode = { type: string; value?: string; tagName?: string; properties?: { className?: (string | number)[] }; children?: HighlightNode[] };
function spans(nodes: HighlightNode[]): ReactNode {
  return nodes.map((node, i) => node.type === 'text' ? node.value :
    <span key={i} className={node.properties?.className?.join(' ')}>{spans(node.children ?? [])}</span>);
}

export function codeContent(text: string, language: string, enabled: boolean): ReactNode {
  const name = aliases[language] ?? language;
  if (!enabled || text.length > MAX_HIGHLIGHT || !highlighter.registered(name)) return text;
  try { return spans(highlighter.highlight(name, text).children as HighlightNode[]); }
  catch { return text; }
}

export function renderTokens(tokens: Token[], final = true, depth = 0): ReactNode {
  if (depth > 100) return tokens.map(t => t.raw).join('');
  const child = (ts: Token[] | undefined) => renderTokens(ts ?? [], final, depth + 1);
  return tokens.map((token, key) => {
    let result: ReactNode;
    switch (token.type) {
      case 'space': case 'def': result = null; break;
      case 'paragraph': result = <p>{child((token as Tokens.Paragraph).tokens)}</p>; break;
      case 'heading': { const t = token as Tokens.Heading; result = createElement(`h${t.depth}`, null, child(t.tokens)); break; }
      case 'text': { const t = token as Tokens.Text; result = t.tokens ? child(t.tokens) : decodeHTML(t.text); break; }
      case 'escape': result = decodeHTML((token as Tokens.Escape).text); break;
      case 'html': result = token.raw; break;
      case 'strong': result = <strong>{child((token as Tokens.Strong).tokens)}</strong>; break;
      case 'em': result = <em>{child((token as Tokens.Em).tokens)}</em>; break;
      case 'del': result = <del>{child((token as Tokens.Del).tokens)}</del>; break;
      case 'codespan': result = <code>{decodeHTML((token as Tokens.Codespan).text)}</code>; break;
      case 'br': result = <br />; break;
      case 'hr': result = <hr />; break;
      case 'blockquote': result = <blockquote>{child((token as Tokens.Blockquote).tokens)}</blockquote>; break;
      case 'link': {
        const t = token as Tokens.Link; const href = safeUrl(t.href);
        result = href ? <a href={href} title={t.title ?? undefined} rel="noopener noreferrer">{child(t.tokens)}</a> : child(t.tokens);
        break;
      }
      case 'image': { const t = token as Tokens.Image; result = <span className="md-image">[Image: {decodeHTML(t.text)}]</span>; break; }
      case 'code': {
        const t = token as Tokens.Code; const language = (t.lang ?? '').split(/\s/)[0] ?? '';
        result = <pre><code>{codeContent(t.text, language, final || isClosedFence(t.raw))}</code></pre>; break;
      }
      case 'list': {
        const t = token as Tokens.List;
        const items = t.items.map((item, i) => <li key={i}>
          {item.task && <input type="checkbox" checked={!!item.checked} disabled aria-label={item.checked ? 'Completed task' : 'Incomplete task'} />}
          {child(item.tokens)}
        </li>);
        result = t.ordered ? <ol start={typeof t.start === 'number' ? t.start : undefined}>{items}</ol> : <ul>{items}</ul>; break;
      }
      case 'table': {
        const t = token as Tokens.Table;
        result = <table><thead><tr>{t.header.map((cell, i) => <th key={i} style={{ textAlign: t.align[i] ?? undefined }}>{child(cell.tokens)}</th>)}</tr></thead>
          <tbody>{t.rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j} style={{ textAlign: t.align[j] ?? undefined }}>{child(cell.tokens)}</td>)}</tr>)}</tbody></table>; break;
      }
      default: result = token.raw;
    }
    return <Fragment key={key}>{result}</Fragment>;
  });
}

export function Markdown({ source }: { source: string }) {
  if (source.length > MAX_CHARACTERS) return <div role="alert">Markdown exceeds the character limit.</div>;
  try { return <div className="markdown">{renderTokens(lex(source))}</div>; }
  catch { return <div className="markdown"><span role="alert">Formatting unavailable.</span><pre>{source}</pre></div>; }
}
