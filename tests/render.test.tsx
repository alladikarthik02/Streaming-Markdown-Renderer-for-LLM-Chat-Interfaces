import { render, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Markdown, safeUrl } from '../src/index.js';
import { isClosedFence, lex, renderTokens } from '../src/render/safe.js';
afterEach(cleanup);
describe('safe reference renderer', () => {
  it('renders headings, lists, tables, quotes, tasks and inline formatting', () => {
    const {container} = render(<Markdown source={'# Heading\n\n**bold** and *em* and ~~gone~~\n\n> quote\n\n- [x] done\n- pending\n\n| A | B |\n| - | - |\n| 1 | 2 |'} />);
    for (const tag of ['h1','strong','em','del','blockquote','ul','table','input:checked']) expect(container.querySelector(tag)).toBeTruthy();
  });
  it('escapes HTML and prevents image fetches and script links', () => {
    const {container} = render(<Markdown source={'<img src=x onerror="alert(1)">\n\n<script>alert(1)</script>\n\n![secret](https://evil.example/track)\n\n[bad](javascript:alert%281%29)'} />);
    expect(container.querySelector('script,img,iframe,a')).toBeNull();
    expect(container.textContent).toContain('<script>');
    expect(container.textContent).toContain('[Image: secret]');
  });
  it.each(['javascript:alert(1)', 'jav&#x61;script:alert(1)', 'data:text/html,x', 'file:///etc/passwd', '//evil.example', '\\evil.example', 'java\tscript:x', '%6aavascript:x', '%2f%2fevil.example', 'vbscript:x', '%00https://x'])('rejects %s', input => expect(safeUrl(input)).toBeUndefined());
  it.each(['https://example.com', 'http://example.com', '/docs', '#part', './page', 'mailto:a@example.com'])('allows %s', input => expect(safeUrl(input)).toBe(input));
  it('highlights only closed code while streaming and falls back for unknown languages', () => {
    const open = render(<>{renderTokens(lex('```js\nconst x = 1'), false)}</>);
    expect(open.container.querySelector('.hljs-keyword')).toBeNull(); open.unmount();
    const closed = render(<Markdown source={'```js\nconst x = 1\n```'} />);
    expect(closed.container.querySelector('.hljs-keyword')).toBeTruthy(); closed.unmount();
    const unknown = render(<Markdown source={'```unknown\n<img>\n```'} />);
    expect(unknown.container.querySelector('img')).toBeNull(); expect(unknown.container.textContent).toBe('<img>');
  });
  it('matches fence character and minimum length', () => {
    expect(isClosedFence('````js\nx\n```')).toBe(false);
    expect(isClosedFence('~~~\nx\n```')).toBe(false);
    expect(isClosedFence('~~~\nx\n~~~~')).toBe(true);
  });
  it('decodes entities without interpreting them as HTML', () => {
    const {container} = render(<Markdown source={'&lt;b&gt; &amp; `&lt;b&gt;`'} />);
    expect(container.querySelector('b')).toBeNull(); expect(container.textContent).toContain('<b> &');
  });
});
