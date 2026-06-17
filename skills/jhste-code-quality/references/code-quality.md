# Code quality reference

Prefer small, explicit changes. Validate data at boundaries such as user input, API payloads, files, environment variables, database rows, and third-party responses.

Failure handling must be observable. Empty catches and ignored promise rejections need a clear reason, a typed fallback, or redacted logging.

Logging should help diagnose behavior without exposing sensitive values. When reporting secret-like matches, show only file, line, and a redacted summary.
