# Side-effect and approval policy (shared doctrine)

Single source of truth for approval boundaries across the jhste skills, so AGENTS.md and bridge text can stay minimal. Repo-local instructions remain authoritative and override this file.

## Proceed without asking (reversible, in-scope)

Reading and searching; editing source, tests, docs, fixtures, and config within the requested scope; running local tests, guards, linters, and formatters; drafting PRDs, issues, handoffs, and review notes. For a reversible in-scope choice, make a reasonable assumption, proceed, and report it in the final summary.

## Ask first (irreversible, external, costly, or out-of-scope)

- commit, push, tag, release, or publish;
- production deploys or production data writes;
- applying DB migrations to a live database;
- destructive deletes, history rewrites, or edits to files outside the repo;
- printing, committing, or documenting real secret values;
- rotating or syncing secrets when the destination is unclear;
- creating cost-bearing cloud resources;
- adding major runtime dependencies;
- broad tracker edits (bulk close, relabel, assign, or milestone changes) on existing items;
- breaking API, schema, or architecture changes beyond the requested scope.

If a choice is irreversible, destructive, external, costly, secret-bearing, production-affecting, or materially changes existing tracker/user data, ask first. Otherwise proceed and report the assumption.

## Secrets

Do not print, commit, or document the real value of tokens, API keys, passwords, cookies, or other secrets. When a workflow legitimately touches a secret, perform the operation but keep the value out of responses, logs, commits, and docs; confirm only the key name, destination, status, or a masked hint.
