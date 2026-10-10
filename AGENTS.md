# Project working agreement

- Work on the streaming Markdown renderer and its explicitly authorized integration into Downloads/study chat. Keep both repositories reproducible and commit integration changes separately.
- Follow docs/TECH_SPEC.md and docs/TASKS.md. At each numbered task boundary, explain changes, test results, challenges, and limitations, continue to the next task without pausing, per the user's latest instruction.
- Commit each completed checkpoint with a factual, neutral message. Commit messages must not contain the word "resume" or the phrase "built by chatgpt".
- Keep docs/CHALLENGES.md current with observed problems, decisions, alternatives, evidence, and unresolved tradeoffs. Do not invent personal interview history or user research.
- Treat streamed Markdown as untrusted input. Maintain the safety requirements in the specification.
- Never present target performance numbers or generated fixtures as measured results or real recordings.
- Tests must verify behavior across adversarial chunk boundaries, not simply duplicate implementation logic.
- Keep dependencies locked, record runtime versions, and provide reproducible commands.
- Push completed task commits to origin as requested. Do not publish a package or deploy without authorization for that action.
