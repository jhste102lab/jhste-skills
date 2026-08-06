# Wide Migration Ticketing

Use this reference only when one broad mechanical change cannot remain integrated or verifiable as ordinary vertical slices.

## Expand, migrate, contract

1. **Expand:** introduce a compatible new form beside the old one so existing callers remain valid.
2. **Migrate:** move bounded groups of callers sized by actual blast radius, ownership, and integration risk.
3. **Contract:** remove the old form only after every caller has moved and verification covers the final state.

Each migration batch should be independently integrable and verifiable when possible. Choose grouping by package, directory, subsystem, or ownership boundary only when that grouping reduces conflict or makes evidence clearer.

When batches cannot stay green or be verified independently, do not pretend they are standalone complete outcomes. Give them one explicit shared integration target and create a final integrate-and-verify issue blocked by every batch.

Do not use this pattern for ordinary features merely because they touch several layers. Prefer coherent user- or system-visible outcomes whenever they can land safely.
