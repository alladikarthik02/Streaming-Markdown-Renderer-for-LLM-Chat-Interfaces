# Release readiness

## Implemented and locally verified

- Safe React renderer, incremental planner, frame batching, lifecycle controls and reader-aware scrolling.
- Responsive local demo, typed ESM library, locked dependencies and Node/package-manager versions.
- Adversarial, randomized, lifecycle, transport-contract and browser tests.
- Clean tarball consumer install and package-content allowlist.
- Five synthetic benchmark streams, four comparison variants, production profiling, raw measurements and CI regression comparison tooling.
- Spec, task log and interview-oriented challenge explanations.

## External prerequisites still open

1. StudyChat integration is complete and covered by eight application browser scenarios.
2. Replace the rejected server credential, restart StudyChat and capture 40 reviewed live answers using bench/capture. Zero recordings exist; the repeated provider response was HTTP 401 token_invalidated. Synthetic workloads cannot satisfy this evidence requirement.
3. Choose a license. The repository currently declares UNLICENSED; no license grant is implied.
4. Explicitly authorize npm publication and choose the final package name/account/access. Nothing has been published to npm or deployed.

These are release/evidence prerequisites, not hidden implementation work. The local renderer and demo can run without them.

## Release checks

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm test:browser
pnpm verify:package
pnpm bench
```

Run `pnpm bench:recorded` when the reviewed real corpus exists. Review GitHub Actions on the release commit and any prior-revision performance comparison. Review the npm tarball contents and documentation, and verify no private captures or credentials are included.

Version 0.1 is experimental: changes to the public API or rendering/security defaults require release notes and a minor version bump before 1.0. Patch releases should preserve those contracts. Pin consumers to a reviewed version. React 18 compatibility and non-Chromium browsers are declared limitations until tested; the tested runtime uses the locked React 19 version.

## Evidence wording

The measured synthetic benchmark supports only claims scoped to its fixtures, hardware and profiling method. Do not claim forty real recordings, a particular 45-to-7 millisecond result, dropped frames in StudyChat until those facts are verified. The table explicitly reports slower reference-heavy fallback behavior relative to full marked rendering.
