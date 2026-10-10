export const sample = `# Small chunks. Complete thoughts.

A streaming answer should feel calm, even when the syntax is still arriving. This laboratory lets you inspect **incremental rendering**, code, tables, and reader-controlled scrolling.

## A little code

\`\`\`typescript
const stream = useMarkdownStream();
for await (const chunk of response) {
  stream.append(chunk);
}
stream.finish();
\`\`\`

## What happens along the way?

| Input | Behavior |
| --- | --- |
| New chunks | Batched each animation frame |
| Completed blocks | Kept stable when safe |
| Reader scrolls up | Following pauses |
| Unsafe HTML | Displayed as literal text |

> Good streaming is as much about preserving attention as it is about rendering text.

${Array.from({length: 18}, (_, i) => `### Observation ${i + 1}\n\nThis is a synthetic demonstration paragraph. Finished content stays readable while the next section arrives. Try scrolling upward, cancelling the stream, or changing the chunk size.\n`).join('\n')}

**You reached the end.**
`;
export const adversarial = '# Untrusted content\n\n<script>alert("executed")</script>\n\n<img src="https://example.invalid/tracker" onerror="alert(1)">\n\n[Unsafe link](javascript:alert%281%29)\n\n![Remote image](https://example.invalid/pixel)\n\n```html\n<img onerror="alert(1)">\n```';
