# Transactions and concurrency

Original synthetic lesson authored for this benchmark. No private coursework.

1. A transaction groups database operations. Atomicity means the group commits as a whole or its changes are rolled back.

2. Consistency refers to preservation of specified database invariants. It does not automatically validate every application rule.

3. Isolation controls how concurrent transactions observe one another. Serial execution is a useful reference model but is not the implementation of every isolation level.

4. Durability means a committed transaction survives the failures covered by the database persistence guarantees.

5. A read-then-update sequence can lose updates when concurrent transactions read the same starting value. An atomic update or suitable locking prevents that specific race.

6. Optimistic concurrency checks a version before writing. A stale writer must detect the mismatch and resolve or retry instead of overwriting silently.

7. A deadlock involves transactions waiting cyclically for resources. Consistent lock ordering reduces the risk, and databases may abort a participant to make progress.

8. Retries must preserve idempotency and use a bounded policy. A timeout after sending a commit leaves uncertainty about whether the transaction succeeded.

Example code:
UPDATE counters SET value = value + 1 WHERE id = 1;
UPDATE records SET value = 9, version = 3 WHERE id = 1 AND version = 2;
