# jhste-skills

[한국어](README.md) | ENG

A tiny personal coding-discipline skill.

This repository provides one skill:

- `jhste-coding`: a lightweight SOLID-first coding discipline for repository code edits.

It does not vendor workflow skills. Use `mattpocock/skills` separately for broader planning, issue, PRD, debugging, architecture, or review workflows.

## Install user-wide from npm

This package does not provide a CLI. The npm package is a small distribution bundle for the skill file.

```sh
npm install -g jhste-skills
mkdir -p "$HOME/.agents/skills"
cp -R "$(npm root -g)/jhste-skills/skills/jhste-coding" "$HOME/.agents/skills/"
```

After updating the npm package, run the copy command again to refresh the installed skill.

## Install user-wide from the repository

```sh
mkdir -p "$HOME/.agents/skills"
cp -R skills/jhste-coding "$HOME/.agents/skills/"
```

For repository-scoped use, copy the skill from this checkout into the target repository's `.agents/skills` directory.

```sh
mkdir -p /path/to/target-repo/.agents/skills
cp -R skills/jhste-coding /path/to/target-repo/.agents/skills/
```

If another agent expects a different skills directory, copy `skills/jhste-coding/` there instead. Restart Codex if the updated skill does not appear.

## SOLID-first discipline

`jhste-coding` keeps code changes small and practical, with SOLID as the main lens:

- **Single Responsibility:** keep each changed unit centered on one clear job.
- **Open/Closed:** add extension seams only when real variation would otherwise keep changing the same core logic.
- **Liskov Substitution:** preserve caller-facing expectations such as return shape, nullability, errors, and side effects.
- **Interface Segregation:** depend on the smallest useful contract.
- **Dependency Inversion:** keep business rules separate from concrete side effects when it improves clarity.

The skill is for active coding discipline, not broader process automation or review pipelines.
