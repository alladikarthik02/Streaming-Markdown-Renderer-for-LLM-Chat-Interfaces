# Safety verification record

The renderer treats all Markdown input as untrusted. The checks below verify specific protections; they are not a formal security audit or a guarantee against arbitrary parser CPU exhaustion.

| Spec invariant | Implemented protection | Evidence |
| --- | --- | --- |
| S1 HTML execution | HTML tokens become React text; no raw HTML sink | render payload tests; browser script/dialog checks |
| S2 unsafe links | decoded-scheme allowlist; reject controls, backslashes and protocol-relative URLs | parameterized URL attack tests |
| S3 remote images | inert text placeholders | browser request log remains local on safety sample |
| S4 highlighting | allowlisted languages; safe spans; code-size bound and catch fallback | known/unknown language, closed-fence and oversized-code tests |
| S5 bounded buffering | total accepted plus pending source limited; oversize chunk rejected atomically | fake-frame queue/source-limit tests |
| S6 lifecycle | generation/epoch checks; cancellation and unmount suspension | stale callback, Strict Mode, instance isolation and transport-reset tests |
| S7 reader control | upward gestures pause follow; explicit jump; preserve focus | real Chromium scroll, resize, key, touch and active-growth tests |
| S8 privacy | no telemetry or provider credential use; no automatic image loading; private corpus ignored | package allowlist and browser requests; human review still required for new recordings |
| S9 failure behavior | accepted source preserved, explicit error state, generic transport errors | injected parser and transport failures |
| S10 resource limits | source/highlight/render-depth bounds with documented parser limitation | bounds tests and long-unfinished-block benchmark |

Limitations: no worker isolation, no formal parser-time bound, Chromium-only browser validation, no external security audit. React 18 remains in the peer range but the locked React 19 version is what has been tested. External links are navigable when clicked and consumers control their own CSP, application routing, hosting headers and transport policies.
