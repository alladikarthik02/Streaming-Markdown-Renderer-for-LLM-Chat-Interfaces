import type { Token } from 'marked';
import { lex } from '../render/safe.js';

export type Block = Readonly<{ id: string; token: Token; start: number; end: number }>;
export type Plan = Readonly<{ blocks: readonly Block[]; source: string; final: boolean; parsedCharacters: number; fallback: boolean }>;

/** Mutable-suffix planner. Reference-capable documents deliberately take a full-lex path. */
export class BlockPlanner {
  private source = '';
  private stable: Block[] = [];
  private offset = 0;
  private full = false;
  constructor(private generation = 0) {}
  append(delta: string, final = false): Plan {
    this.source += delta;
    // Any '[' could start a late reference. CR normalization changes raw offsets.
    // These uncommon paths deliberately prefer correctness to incremental parsing.
    this.full ||= /[\[\r]/.test(delta);
    const offset = final || this.full ? 0 : this.offset;
    const suffix = this.source.slice(offset);
    const tokens = lex(suffix);
    let cursor = offset;
    let exact = true;
    const blocks = tokens.map(token => {
      if (!this.source.startsWith(token.raw, cursor)) exact = false;
      const start = cursor; cursor += token.raw.length;
      return { id: `${this.generation}:${start}`, token, start, end: cursor };
    });
    exact &&= cursor === this.source.length;
    if (!exact && offset !== 0) {
      this.full = true;
      return this.append('', final);
    }
    const combined = offset === 0 ? blocks : [...this.stable, ...blocks];
    if (!this.full && exact && !final) {
      const visible = blocks.map((b, i) => b.token.type === 'space' ? -1 : i).filter(i => i >= 0);
      const keepFrom = visible[Math.max(0, visible.length - 2)] ?? 0;
      // A lexer token includes its enclosing list/quote; retaining two whole tokens
      // therefore never splits an open container at an internal blank line.
      this.stable = [...(offset ? this.stable : []), ...blocks.slice(0, keepFrom)];
      this.offset = blocks[keepFrom]?.start ?? offset;
    } else if (!exact) this.full = true;
    return { blocks: combined, source: this.source, final, parsedCharacters: suffix.length, fallback: this.full || !exact };
  }
}
