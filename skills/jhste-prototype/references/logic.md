# Logic Prototype Guidance

Use this reference only when the prototype question concerns state, business rules, data shape, or an API or module contract.

## Choose the smallest driver

Keep the decision-bearing logic behind a small interface such as a reducer, state machine, pure functions, fixture-driven module, or bounded stateful object. Keep the driver thin and separate from the logic being judged.

For developer-only review, use the host-native surface that exposes the answer with the least setup. Show relevant before-and-after state and exercise the cases that distinguish the alternatives, including an invalid or surprising transition when useful.

## Make non-developer review self-contained

When a product owner, designer, operator, or domain expert must judge the model, prefer one self-contained HTML file that opens directly without a build or server.

Use domain language rather than implementation names. Include:

- a plain-language statement of the question;
- labelled, readable current state rather than a raw implementation dump;
- free-play actions so the reviewer can explore in any order; and
- short guided scenarios that reset to a known state and walk through the important edge cases.

Render the relevant state after every action and make rejected or illegal actions visible. The interesting evidence is where the reviewer says the model permits, forbids, or represents something differently than intended.

## Keep it disposable

Use in-memory or fixture-backed state unless persistence is the question. Do not connect real mutations merely to make the demo realistic. Do not generalize beyond the question.

The driver and presentation are disposable. Even when the internal logic shape is useful evidence, production implementation must be rebuilt under normal contracts, error handling, compatibility, and verification requirements.
