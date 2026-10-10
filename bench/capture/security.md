# Safe rendering boundaries

Original synthetic lesson authored for this benchmark. No private coursework.

1. Treat model output and uploaded document text as untrusted input. A fluent answer is not proof that markup or links are safe to execute.

2. Rendering HTML as text prevents it from becoming active elements. Passing untrusted content to an HTML insertion API introduces a different trust boundary.

3. A link policy should allow approved schemes and reject control-character or encoded attempts to introduce executable protocols.

4. A remote image can trigger a network request even without a click. Inert placeholders avoid that automatic disclosure channel.

5. Syntax highlighting can create HTML. A renderer that builds allowlisted React spans avoids inserting unsanitized highlighter HTML.

6. Resource limits should count queued input as well as displayed input. Otherwise a background tab or slow consumer can accumulate unbounded pending text.

7. Secrets belong on the server. Logging or publishing raw conversations can reveal private information even when source code contains no credentials.

8. A security test should assert both the absence of script execution and the absence of unexpected requests. Passing tests is not a formal audit of every dependency.

Example code:
const allowed = new Set(["https:", "http:", "mailto:"]);
const url = new URL(value, "https://local.invalid");
if (!allowed.has(url.protocol)) return undefined;
