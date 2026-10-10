import { Lexer, type Token } from 'marked';
export function lex(source: string): Token[] {
  return Lexer.lex(source, { gfm: true, breaks: false, pedantic: false });
}
