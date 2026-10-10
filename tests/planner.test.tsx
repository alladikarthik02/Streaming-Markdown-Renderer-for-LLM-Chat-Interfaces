import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { BlockPlanner } from '../src/core/planner.js';
import { PlannedMarkdown } from '../src/render/blocks.js';
import { Markdown } from '../src/render/safe.js';
const fixtures = [
  'hello\n\nworld\n\nlast', 'title\n===\n\nnext', '| A | B |\n| - | - |\n| x | y |',
  '````js\nconst x = 1;\n```\ninside\n````\n\nafter', '~~~py\nx = 1\n~~~',
  '- a\n\n  more\n\n- b\n\noutside', '> quote\n>\n> ```js\n> x\n> ```\n\noutside',
  '[first][id]\n\nother\n\n[id]: https://example.com', 'same\n\nsame\n\nsame\n\nsame',
  'one\r\n\r\ntwo\r\n\r\nthree', 'emoji 😀 and **bold**\n\n    indented\n\nend',
  '\n\n# Hi\n\n<script>x</script>\n\nlast', '* item\n  continuation\n\n    code\n\nend',
];
const html = (p: ReturnType<BlockPlanner['append']>) => renderToStaticMarkup(<PlannedMarkdown plan={p} />);
describe('block planner', () => {
  it.each(fixtures)('matches full rendering at every split: %s', source => {
    for (let split = 0; split <= source.length; split++) {
      const planner = new BlockPlanner();
      planner.append(source.slice(0, split));
      const next = planner.append(source.slice(split));
      expect(next.source).toBe(source);
      expect(html(planner.append('', true))).toBe(renderToStaticMarkup(<Markdown source={source} />));
    }
  });
  it.each(fixtures)('retains exact intermediate source and rendering one character at a time: %s', source => {
    const planner = new BlockPlanner(); let accepted = '';
    for (const char of source) {
      accepted += char;
      const plan = planner.append(char);
      expect(plan.source).toBe(accepted);
      const full = new BlockPlanner().append(accepted);
      expect(html(plan)).toBe(html(full));
    }
  });
  it('reuses stable objects and parses only a suffix', () => {
    const planner = new BlockPlanner();
    const first = planner.append('first\n\nsecond\n\nthird\n\nfourth\n\n');
    const next = planner.append('fifth');
    expect(next.blocks[0]).toBe(first.blocks[0]);
    expect(next.parsedCharacters).toBeLessThan(next.source.length);
    expect(new Set(next.blocks.map(b => b.id)).size).toBe(next.blocks.length);
  });
  it('invalidates earlier links when a late definition arrives', () => {
    const planner = new BlockPlanner();
    planner.append('[link][id]\n\none\n\ntwo\n\n');
    const next = planner.append('[id]: https://example.com');
    expect(next.fallback).toBe(true);
    expect(html(next)).toContain('href="https://example.com"');
  });
});
