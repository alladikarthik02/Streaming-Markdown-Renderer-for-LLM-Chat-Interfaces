"""Create original, publishable teaching material and 40 model-answer workloads."""
import json
from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Preformatted

TOPICS = [
    ('streaming', 'Streaming text interfaces', [
        'A transport chunk is an arbitrary fragment, not necessarily a model token or a complete UTF-8 character. Decode byte streams with a streaming decoder before parsing text.',
        'An append-only message controller accumulates accepted text. Finish flushes pending text. Cancel preserves accepted text but rejects later deltas. Reset clears the message and advances a generation identifier.',
        'requestAnimationFrame coalesces many arriving chunks into a single publication per animation frame. It does not guarantee that parsing or rendering finishes within the frame budget.',
        'Completed Markdown blocks can retain stable identities. The trailing block may still change interpretation when a delimiter, table row or reference definition arrives.',
        'A late reference definition can change an earlier link. Conservative full parsing is a correct fallback. An unfinished long code fence can still cause work that grows with source length.',
        'Scroll following should reflect reader intent. Upward gestures disengage it, and an explicit jump action re-enables it. Content growth is not evidence of reader movement.',
        'Measure React actualDuration separately from parsing outside React. Total synchronous update work includes parsing, rendering and commit work, but is not full input-to-paint latency.',
        'Latency percentile calculations require a stated sample unit. For sorted n samples, nearest-rank p95 selects the element at ceil(0.95*n).'],
        'const generation = 1;\nconst pending = [];\npending.push("hello");\nconst text = pending.join("");'),
    ('caching', 'Caches and invalidation', [
        'A cache stores a value indexed by a key to avoid recomputing the value. Correctness requires the key to represent all inputs that influence the result.',
        'Time-to-live bounds how long a cached result is reused. It does not guarantee freshness when the source changes before expiration.',
        'Least-recently-used eviction removes the least recently accessed entry when the capacity limit is exceeded. Updating an existing entry also changes recency.',
        'A cache hit avoids expensive work; a miss must compute and store a result. Hit ratio is hits divided by total lookups when total lookups is positive.',
        'Negative caching stores a known absence or failure for a bounded duration. Its expiry should reflect how quickly the absent object may appear.',
        'A cache stampede occurs when many clients recompute the same expired entry simultaneously. Single-flight coordination shares one computation among waiting callers.',
        'Versioned keys isolate results from distinct source revisions. A version identifier must change when relevant source data or configuration changes.',
        'Memory bounds, invalidation rules and observability are part of the cache design. An unbounded cache can trade compute savings for a memory failure.'],
        'const cache = new Map();\ncache.set("version:1", "result");\nconst hit = cache.get("version:1");'),
    ('queues', 'Queues and backpressure', [
        'A queue separates a producer from a consumer. If arrivals exceed departures for a sustained period, the queue grows unless admission is limited.',
        'A bounded queue has a fixed capacity. On overflow a system must reject, block, drop, or persist work according to an explicit policy.',
        'Backpressure communicates limited consumption capacity to a producer. It can reduce production rather than buffering indefinitely.',
        'FIFO serves accepted items in arrival order. Priority queues choose an item by priority and can starve lower-priority work without fairness controls.',
        'Acknowledgment records successful processing. Retrying after uncertain acknowledgment can process an item more than once.',
        'An idempotency key identifies a logical operation. A durable deduplication record can prevent repeated side effects for duplicate deliveries.',
        'Little\'s law relates average items L, average arrival rate lambda and average time W by L = lambda * W in a stable system with consistent boundaries.',
        'Timeouts bound waiting but do not prove the original operation failed. Cancellation must address both the local waiter and any upstream work.'],
        'const queue = [];\nif (queue.length < 10) queue.push("job");\nconst next = queue.shift();'),
    ('transactions', 'Transactions and concurrency', [
        'A transaction groups database operations. Atomicity means the group commits as a whole or its changes are rolled back.',
        'Consistency refers to preservation of specified database invariants. It does not automatically validate every application rule.',
        'Isolation controls how concurrent transactions observe one another. Serial execution is a useful reference model but is not the implementation of every isolation level.',
        'Durability means a committed transaction survives the failures covered by the database persistence guarantees.',
        'A read-then-update sequence can lose updates when concurrent transactions read the same starting value. An atomic update or suitable locking prevents that specific race.',
        'Optimistic concurrency checks a version before writing. A stale writer must detect the mismatch and resolve or retry instead of overwriting silently.',
        'A deadlock involves transactions waiting cyclically for resources. Consistent lock ordering reduces the risk, and databases may abort a participant to make progress.',
        'Retries must preserve idempotency and use a bounded policy. A timeout after sending a commit leaves uncertainty about whether the transaction succeeded.'],
        'UPDATE counters SET value = value + 1 WHERE id = 1;\nUPDATE records SET value = 9, version = 3 WHERE id = 1 AND version = 2;'),
    ('http', 'HTTP and event streaming', [
        'HTTP status and headers precede the response body. A client should verify the response status before treating the body as a successful event stream.',
        'Server-sent events frame events as text fields separated by blank lines. A TCP read can contain part of a frame, one frame, or several frames.',
        'UTF-8 decoding and SSE framing are separate stages. A decoder retains incomplete byte sequences, and the frame parser retains incomplete event text.',
        'An event sequence number allows a client to detect gaps or duplicates. A request identifier prevents mixing events from different logical responses.',
        'A terminal done event is different from a network connection closing. Unexpected EOF before the terminal event must not be treated as successful completion.',
        'Heartbeat comments can keep idle connections active. They are transport liveness signals rather than answer content.',
        'A client-side abort should cancel the network request and pending processing. A server should release upstream work when its downstream client disconnects.',
        'Retries after partial output can repeat or contradict displayed content. Before-first-byte and after-first-byte recovery policies should be distinct.'],
        'event: delta\ndata: {"seq": 2, "text": "hello"}\n\nevent: done\ndata: {"seq": 3}\n'),
    ('testing', 'Testing streamed software', [
        'A unit test isolates a behavior; an integration test verifies collaboration between components; a browser test exercises actual DOM and layout behavior.',
        'Testing every possible split of a short input can expose delimiter-boundary bugs. Randomized chunk partitions extend coverage to longer inputs.',
        'Final-output parity is necessary but does not detect every intermediate flicker, omission or duplicate. Intermediate snapshots need separate assertions.',
        'A deterministic random seed makes a failure reproducible. Save the seed and minimal failing input rather than only the pass count.',
        'A test oracle should not merely reproduce the implementation. Independent expected output can expose a bug shared by optimized and reference paths.',
        'Fault injection forces error conditions such as parser failure, stalled transport and lost connection. The accepted content and terminal state should remain explicit.',
        'Performance tests need warmups, repeated runs, raw samples, a hardware description and a stated percentile method. A smaller median is not automatically a p95 improvement.',
        'Synthetic inputs are useful for deterministic coverage. Live captured responses test real output patterns but do not alone represent all production traffic.'],
        'for (let split = 0; split <= source.length; split++) {\n  feed(source.slice(0, split));\n  feed(source.slice(split));\n  assertFinalEqualsReference();\n}'),
    ('retrieval', 'Retrieval and citation verification', [
        'Retrieval selects candidate source passages before answer generation. A retrieved passage can be relevant without containing the requested fact.',
        'Dense retrieval compares embedding vectors; lexical retrieval uses terms. Hybrid retrieval can combine complementary signals but still needs evaluation.',
        'Metadata and physical page numbers should be distinguished. A PDF cover or metadata record must not masquerade as a cited content page.',
        'An exact quotation check verifies that a quoted span appears on the specified source page. It does not prove that the answer claim logically follows from the quote.',
        'Normalization can collapse whitespace and standardize Unicode before matching. Overaggressive normalization can create ambiguous matches.',
        'Approximate matching tolerates small extraction differences. Its similarity score is not a calibrated probability of factual correctness.',
        'Abstention can improve reported citation accuracy by refusing difficult questions. Report answer coverage alongside citation accuracy to expose that tradeoff.',
        'Development questions used to tune thresholds should be separate from held-out evaluation questions. Changing gold labels after observing outcomes changes the meaning of the result.'],
        'const coverage = answered / answerable;\nconst citationAccuracy = correct / evaluated;\nconst quoteMatches = normalizedPage.includes(normalizedQuote);'),
    ('security', 'Safe rendering boundaries', [
        'Treat model output and uploaded document text as untrusted input. A fluent answer is not proof that markup or links are safe to execute.',
        'Rendering HTML as text prevents it from becoming active elements. Passing untrusted content to an HTML insertion API introduces a different trust boundary.',
        'A link policy should allow approved schemes and reject control-character or encoded attempts to introduce executable protocols.',
        'A remote image can trigger a network request even without a click. Inert placeholders avoid that automatic disclosure channel.',
        'Syntax highlighting can create HTML. A renderer that builds allowlisted React spans avoids inserting unsanitized highlighter HTML.',
        'Resource limits should count queued input as well as displayed input. Otherwise a background tab or slow consumer can accumulate unbounded pending text.',
        'Secrets belong on the server. Logging or publishing raw conversations can reveal private information even when source code contains no credentials.',
        'A security test should assert both the absence of script execution and the absence of unexpected requests. Passing tests is not a formal audit of every dependency.'],
        'const allowed = new Set(["https:", "http:", "mailto:"]);\nconst url = new URL(value, "https://local.invalid");\nif (!allowed.has(url.protocol)) return undefined;'),
]

DEST=Path(__file__).resolve().parent
styles=getSampleStyleSheet()
workloads=[]
for topic,title,facts,code in TOPICS:
    sections=[f'# {title}', 'Original synthetic lesson authored for this benchmark. No private coursework.', *[f'{i+1}. {fact}' for i,fact in enumerate(facts)], 'Example code:\n'+code]
    (DEST/f'{topic}.md').write_text('\n\n'.join(sections).rstrip()+'\n')
    story=[Paragraph(escape(title),styles['Title']),Spacer(1,16)]
    for i,fact in enumerate(facts):
        story.extend([Paragraph(f'{i+1}. {escape(fact)}',styles['BodyText']),Spacer(1,12)])
    story.extend([Paragraph('Illustrative code',styles['Heading2']),Preformatted(code,styles['Code'])])
    SimpleDocTemplate(str(DEST/f'{topic}.pdf'),title=title,author='Original benchmark material').build(story)
    for index,focus in enumerate(['a study guide organized by all eight concepts','a design review with concrete failure cases','a worked tutorial with code and a comparison table','an interview preparation explanation with questions and answers','a test plan connecting invariants, failure modes and expected behavior']):
        workloads.append({'id':f'recorded-{len(workloads)+1:03d}-{topic}','topic':topic,'question':f'Using the {title} lesson, write {focus}. Cover every concept in the lesson in depth. Aim for roughly 3,000 output tokens, not a short summary. Use Markdown headings, a comparison table, the provided code where appropriate, and literal formulas when the lesson supplies them. Explain the relationships step by step without adding unsupported outside facts. Include the required page quotations. Be detailed about the specific examples and tradeoffs asked for; avoid repetitive padding.'})
(DEST/'workloads.json').write_text(json.dumps(workloads,indent=2)+'\n')
print(f'Prepared {len(TOPICS)} original lesson PDFs and {len(workloads)} workloads')
