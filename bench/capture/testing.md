# Testing streamed software

Original synthetic lesson authored for this benchmark. No private coursework.

1. A unit test isolates a behavior; an integration test verifies collaboration between components; a browser test exercises actual DOM and layout behavior.

2. Testing every possible split of a short input can expose delimiter-boundary bugs. Randomized chunk partitions extend coverage to longer inputs.

3. Final-output parity is necessary but does not detect every intermediate flicker, omission or duplicate. Intermediate snapshots need separate assertions.

4. A deterministic random seed makes a failure reproducible. Save the seed and minimal failing input rather than only the pass count.

5. A test oracle should not merely reproduce the implementation. Independent expected output can expose a bug shared by optimized and reference paths.

6. Fault injection forces error conditions such as parser failure, stalled transport and lost connection. The accepted content and terminal state should remain explicit.

7. Performance tests need warmups, repeated runs, raw samples, a hardware description and a stated percentile method. A smaller median is not automatically a p95 improvement.

8. Synthetic inputs are useful for deterministic coverage. Live captured responses test real output patterns but do not alone represent all production traffic.

Example code:
for (let split = 0; split <= source.length; split++) {
  feed(source.slice(0, split));
  feed(source.slice(split));
  assertFinalEqualsReference();
}
