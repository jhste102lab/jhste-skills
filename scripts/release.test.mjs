import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const retired = ["jhste-pr-review", "jhste-review-followup", "jhste-implementation-finalizer"];
const successor = "jhste-code-result-double-check";
const read = (file) => readFileSync(file, "utf8");
const temp = (t) => {
  const directory = mkdtempSync(path.join(tmpdir(), "jhste release test "));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return directory;
};
const run = (script, cwd) => spawnSync(process.execPath, [path.join(root, "scripts", script)], { cwd, encoding: "utf8" });
const snapshot = (t) => {
  const directory = temp(t);
  const pkg = JSON.parse(read(path.join(root, "package.json")));
  for (const entry of ["package.json", "scripts", ...pkg.files]) {
    cpSync(path.join(root, entry), path.join(directory, entry), { recursive: true });
  }
  return directory;
};
const reject = (result, message) => {
  assert.notEqual(result.status, 0, result.stdout);
  assert.match(result.stderr, message);
};

for (const name of retired) {
  test(`package validator rejects retired directory ${name}`, (t) => {
    const directory = snapshot(t);
    mkdirSync(path.join(directory, "skills", name));
    reject(run("validate-package.mjs", directory), /expected skills/);
  });
}

test("package validator rejects a stale successor invocation", (t) => {
  const directory = snapshot(t);
  const metadata = path.join(directory, "skills", successor, "agents/openai.yaml");
  writeFileSync(metadata, read(metadata).replace(`$${successor}`, "$jhste-implementation-finalizer"));
  reject(run("validate-package.mjs", directory), /metadata default prompt must mention/);
});

test("package validator rejects disabled implicit invocation", (t) => {
  const directory = snapshot(t);
  const metadata = path.join(directory, "skills", successor, "agents/openai.yaml");
  writeFileSync(metadata, read(metadata).replace("allow_implicit_invocation: true", "allow_implicit_invocation: false"));
  reject(run("validate-package.mjs", directory), /must allow implicit invocation/);
});

test("package validator rejects a broken successor reference", (t) => {
  const directory = snapshot(t);
  const skill = path.join(directory, "skills", successor, "SKILL.md");
  writeFileSync(skill, `${read(skill)}\n[Missing reference](references/removed.md)\n`);
  reject(run("validate-package.mjs", directory), /broken link: references\/removed.md/);
});

test("routing validator rejects a retired expected skill", (t) => {
  const directory = snapshot(t);
  const file = path.join(directory, "scripts/routing-scenarios.json");
  const fixture = JSON.parse(read(file));
  fixture.cases[0].expected_skill = "jhste-review-followup";
  writeFileSync(file, JSON.stringify(fixture));
  reject(run("validate-routing-scenarios.mjs", directory), /unknown expected skill/);
});

test("release notes select only the exact version and retain UTF-8", (t) => {
  const directory = temp(t);
  writeFileSync(path.join(directory, "package.json"), '{"version":"0.15.0"}');
  writeFileSync(path.join(directory, "CHANGELOG.md"), "# Changelog\r\n\r\n## 0.15.0 - 2026-09-12\r\n\r\n### Changed\r\n- \uac80\uc99d.\r\n\r\n## 0.14.5 - 2026-09-07\r\n\r\nOld notes.\r\n");
  const result = run("release-notes.mjs", directory);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, "### Changed\n- \uac80\uc99d.\n");
});

for (const [label, content, message] of [
  ["missing", "## 0.15.1 - date\nOther release.\n", /found 0/],
  ["duplicate", "## 0.15.0 - date\nOne.\n## 0.15.0 - date\nTwo.\n", /found 2/],
  ["empty", "## 0.15.0 - date\n\n## 0.14.5 - date\nOld.\n", /is empty/],
]) {
  test(`release notes reject a ${label} version section`, (t) => {
    const directory = temp(t);
    writeFileSync(path.join(directory, "package.json"), '{"version":"0.15.0"}');
    writeFileSync(path.join(directory, "CHANGELOG.md"), content);
    reject(run("release-notes.mjs", directory), message);
  });
}

test("current release notes can be generated before publication", () => {
  const result = run("release-notes.mjs", root);
  assert.equal(result.status, 0, result.stderr);
  assert.ok(result.stdout.trim());
  assert.doesNotMatch(result.stdout, /^## \d+\.\d+\.\d+ -/m);
});

const upgradeBlock = (name) => {
  const match = read(path.join(root, name)).match(/<!-- BEGIN COPY UPGRADE -->\n```sh\n([\s\S]*?)\n```\n<!-- END COPY UPGRADE -->/);
  assert.ok(match, `${name} needs the documented copy-upgrade block`);
  return match[1];
};

test("bilingual copy-upgrade commands remain identical", () => {
  assert.equal(upgradeBlock("README.md"), upgradeBlock("README.en.md"));
});

const installation = (t) => {
  const home = temp(t);
  const npmRoot = path.join(home, "npm modules");
  const source = path.join(npmRoot, "jhste-skills/skills");
  const destination = path.join(home, ".agents/skills");
  const bin = path.join(home, "bin");
  mkdirSync(bin);
  mkdirSync(destination, { recursive: true });
  cpSync(path.join(root, "skills"), source, { recursive: true });
  writeFileSync(path.join(bin, "npm"), '#!/bin/sh\n[ "$1" = root ] && [ "$2" = -g ] || exit 2\nprintf "%s\\n" "$TEST_NPM_ROOT"\n', { mode: 0o755 });
  const env = { ...process.env, HOME: home, TEST_NPM_ROOT: npmRoot, PATH: `${bin}${path.delimiter}${process.env.PATH}` };
  const execute = () => spawnSync("sh", ["-c", upgradeBlock("README.md")], { env, encoding: "utf8" });
  return { home, source, destination, execute };
};

test("copy upgrade preserves edits and unrelated skills, retires old names, and is repeatable", { skip: process.platform === "win32" }, (t) => {
  const { home, source, destination, execute } = installation(t);
  const current = readdirSync(source).sort();
  for (const name of [...current, ...retired]) {
    const folder = path.join(destination, name);
    mkdirSync(folder);
    writeFileSync(path.join(folder, "SKILL.md"), `local edits: ${name}`);
  }
  const unrelated = path.join(destination, "my-private-skill");
  mkdirSync(unrelated);
  writeFileSync(path.join(unrelated, "SKILL.md"), "keep me");
  // Moving a retired symlink must not modify or delete its external target.
  const target = path.join(home, "external-skill");
  mkdirSync(target);
  writeFileSync(path.join(target, "SKILL.md"), "external edits");
  rmSync(path.join(destination, retired[0]), { recursive: true });
  symlinkSync(target, path.join(destination, retired[0]), "dir");

  const first = execute();
  assert.equal(first.status, 0, first.stderr);
  const backup = first.stdout.trim().replace(/^Backup: /, "");
  assert.ok(backup.startsWith(path.join(home, "jhste-skills-backup.")));
  assert.equal(read(path.join(backup, successor, "SKILL.md")), `local edits: ${successor}`);
  assert.equal(read(path.join(backup, retired[0], "SKILL.md")), "external edits");
  assert.equal(read(path.join(target, "SKILL.md")), "external edits");
  for (const name of retired) assert.equal(existsSync(path.join(destination, name)), false);
  for (const name of current) assert.equal(read(path.join(destination, name, "SKILL.md")), read(path.join(source, name, "SKILL.md")));
  assert.equal(read(path.join(unrelated, "SKILL.md")), "keep me");

  const second = execute();
  assert.equal(second.status, 0, second.stderr);
  assert.notEqual(second.stdout, first.stdout);
  assert.deepEqual(readdirSync(destination).sort(), [...current, "my-private-skill"].sort());
  assert.equal(read(path.join(backup, successor, "SKILL.md")), `local edits: ${successor}`);
});

test("copy upgrade refuses a missing successor before moving existing skills", { skip: process.platform === "win32" }, (t) => {
  const { source, destination, execute } = installation(t);
  rmSync(path.join(source, successor), { recursive: true });
  const old = path.join(destination, retired[0]);
  mkdirSync(old);
  writeFileSync(path.join(old, "SKILL.md"), "keep me");
  assert.notEqual(execute().status, 0);
  assert.equal(read(path.join(old, "SKILL.md")), "keep me");
});

test("npm payload contains only current skill entrypoints and resolves packaged Markdown links", () => {
  const [manifest] = JSON.parse(execFileSync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts"], { cwd: root, encoding: "utf8", shell: process.platform === "win32" }));
  const files = new Set(manifest.files.map((file) => file.path));
  const actual = [...files].flatMap((file) => file.match(/^skills\/([^/]+)\/SKILL\.md$/)?.slice(1) ?? []).sort();
  const expected = readdirSync(path.join(root, "skills"), { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  assert.deepEqual(actual, expected);
  assert.ok(actual.includes(successor));
  for (const name of retired) assert.equal(actual.includes(name), false);
  assert.equal([...files].some((file) => file.startsWith("scripts/")), false);
  for (const file of files) {
    if (!file.endsWith(".md")) continue;
    for (const match of read(path.join(root, file)).matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
      const href = match[1];
      if (/^(https?:|mailto:|#)/.test(href)) continue;
      const target = path.posix.normalize(path.posix.join(path.posix.dirname(file), href.split("#")[0]));
      assert.ok(files.has(target) || [...files].some((entry) => entry.startsWith(`${target}/`)), `${file}: ${href} is missing from npm`);
    }
  }
});
