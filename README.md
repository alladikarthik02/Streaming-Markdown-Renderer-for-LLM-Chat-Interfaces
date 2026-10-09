# Streaming Markdown Renderer

A planned React and TypeScript component for progressively displaying LLM responses, with stable completed blocks, animation-frame batching, and reader-controlled scrolling.

**Status: specification checkpoint. There is no implementation or benchmark result yet.**

- [Technical specification](docs/TECH_SPEC.md)
- [Implementation tasks and checkpoints](docs/TASKS.md)
- [Architecture review and challenge log](docs/CHALLENGES.md)

The intended implementation uses React, TypeScript, the marked lexer, a restricted Markdown-to-React renderer, and Playwright. It will include a local demonstration and a package suitable for integration into an existing chat application.

Performance targets are hypotheses until measured. Synthetic fixtures will be labeled as synthetic. Recorded conversations must be explicitly supplied and checked for private information before being committed. Publishing and external integration are later release steps.
