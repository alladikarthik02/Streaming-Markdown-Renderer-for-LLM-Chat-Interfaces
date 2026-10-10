# Queues and backpressure

Original synthetic lesson authored for this benchmark. No private coursework.

1. A queue separates a producer from a consumer. If arrivals exceed departures for a sustained period, the queue grows unless admission is limited.

2. A bounded queue has a fixed capacity. On overflow a system must reject, block, drop, or persist work according to an explicit policy.

3. Backpressure communicates limited consumption capacity to a producer. It can reduce production rather than buffering indefinitely.

4. FIFO serves accepted items in arrival order. Priority queues choose an item by priority and can starve lower-priority work without fairness controls.

5. Acknowledgment records successful processing. Retrying after uncertain acknowledgment can process an item more than once.

6. An idempotency key identifies a logical operation. A durable deduplication record can prevent repeated side effects for duplicate deliveries.

7. Little's law relates average items L, average arrival rate lambda and average time W by L = lambda * W in a stable system with consistent boundaries.

8. Timeouts bound waiting but do not prove the original operation failed. Cancellation must address both the local waiter and any upstream work.

Example code:
const queue = [];
if (queue.length < 10) queue.push("job");
const next = queue.shift();
