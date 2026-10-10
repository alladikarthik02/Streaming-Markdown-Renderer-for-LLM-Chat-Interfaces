# Caches and invalidation

Original synthetic lesson authored for this benchmark. No private coursework.

1. A cache stores a value indexed by a key to avoid recomputing the value. Correctness requires the key to represent all inputs that influence the result.

2. Time-to-live bounds how long a cached result is reused. It does not guarantee freshness when the source changes before expiration.

3. Least-recently-used eviction removes the least recently accessed entry when the capacity limit is exceeded. Updating an existing entry also changes recency.

4. A cache hit avoids expensive work; a miss must compute and store a result. Hit ratio is hits divided by total lookups when total lookups is positive.

5. Negative caching stores a known absence or failure for a bounded duration. Its expiry should reflect how quickly the absent object may appear.

6. A cache stampede occurs when many clients recompute the same expired entry simultaneously. Single-flight coordination shares one computation among waiting callers.

7. Versioned keys isolate results from distinct source revisions. A version identifier must change when relevant source data or configuration changes.

8. Memory bounds, invalidation rules and observability are part of the cache design. An unbounded cache can trade compute savings for a memory failure.

Example code:
const cache = new Map();
cache.set("version:1", "result");
const hit = cache.get("version:1");
