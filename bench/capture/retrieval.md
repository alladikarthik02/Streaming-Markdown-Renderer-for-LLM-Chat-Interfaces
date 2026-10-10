# Retrieval and citation verification

Original synthetic lesson authored for this benchmark. No private coursework.

1. Retrieval selects candidate source passages before answer generation. A retrieved passage can be relevant without containing the requested fact.

2. Dense retrieval compares embedding vectors; lexical retrieval uses terms. Hybrid retrieval can combine complementary signals but still needs evaluation.

3. Metadata and physical page numbers should be distinguished. A PDF cover or metadata record must not masquerade as a cited content page.

4. An exact quotation check verifies that a quoted span appears on the specified source page. It does not prove that the answer claim logically follows from the quote.

5. Normalization can collapse whitespace and standardize Unicode before matching. Overaggressive normalization can create ambiguous matches.

6. Approximate matching tolerates small extraction differences. Its similarity score is not a calibrated probability of factual correctness.

7. Abstention can improve reported citation accuracy by refusing difficult questions. Report answer coverage alongside citation accuracy to expose that tradeoff.

8. Development questions used to tune thresholds should be separate from held-out evaluation questions. Changing gold labels after observing outcomes changes the meaning of the result.

Example code:
const coverage = answered / answerable;
const citationAccuracy = correct / evaluated;
const quoteMatches = normalizedPage.includes(normalizedQuote);
