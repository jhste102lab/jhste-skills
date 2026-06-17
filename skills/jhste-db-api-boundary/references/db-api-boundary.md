# DB/API boundary reference

Routes and controllers should be thin enough to read as orchestration. Persistence details belong behind query, repository, or service seams chosen by the repository.

Raw SQL must not concatenate or interpolate untrusted values. Prefer parameter binding and return domain or public DTO values rather than raw storage rows when exposing responses.
