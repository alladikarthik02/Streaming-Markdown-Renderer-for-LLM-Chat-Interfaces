# HTTP and event streaming

Original synthetic lesson authored for this benchmark. No private coursework.

1. HTTP status and headers precede the response body. A client should verify the response status before treating the body as a successful event stream.

2. Server-sent events frame events as text fields separated by blank lines. A TCP read can contain part of a frame, one frame, or several frames.

3. UTF-8 decoding and SSE framing are separate stages. A decoder retains incomplete byte sequences, and the frame parser retains incomplete event text.

4. An event sequence number allows a client to detect gaps or duplicates. A request identifier prevents mixing events from different logical responses.

5. A terminal done event is different from a network connection closing. Unexpected EOF before the terminal event must not be treated as successful completion.

6. Heartbeat comments can keep idle connections active. They are transport liveness signals rather than answer content.

7. A client-side abort should cancel the network request and pending processing. A server should release upstream work when its downstream client disconnects.

8. Retries after partial output can repeat or contradict displayed content. Before-first-byte and after-first-byte recovery policies should be distinct.

Example code:
event: delta
data: {"seq": 2, "text": "hello"}

event: done
data: {"seq": 3}
