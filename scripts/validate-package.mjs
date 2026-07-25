import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const expectedSkills = [
  "jhste-coding",
  "jhste-diagnosing-bugs",
  "jhste-domain-modeling",
  "jhste-grill",
  "jhste-pr-review",
  "jhste-review-followup",
  "jhste-to-spec",
  "jhste-to-tickets",
];

const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");
const exists = (relativePath) => fs.existsSync(path.join(root, relativePath));

const pkg = JSON.parse(read("package.json"));
const actualSkills = fs
  .readdirSync(path.join(root, "skills"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

if (JSON.stringify(actualSkills) !== JSON.stringify(expectedSkills)) {
  throw new Error(
    `expected skills ${expectedSkills.join(", ")}; found ${actualSkills.join(", ")}`,
  );
}

for (const skill of expectedSkills) {
  const skillPath = `skills/${skill}/SKILL.md`;
  const metadataPath = `skills/${skill}/agents/openai.yaml`;

  if (!exists(skillPath) || !exists(metadataPath)) {
    throw new Error(`${skill} is missing SKILL.md or agents/openai.yaml`);
  }

  const skillText = read(skillPath);
  const frontmatter = skillText.match(/^---\n([\s\S]*?)\n---\n/);
  if (!frontmatter) throw new Error(`${skill} has invalid frontmatter`);

  const frontmatterLines = frontmatter[1].split("\n");
  if (
    frontmatterLines.length !== 2 ||
    frontmatterLines[0] !== `name: ${skill}` ||
    !frontmatterLines[1].startsWith("description: ")
  ) {
    throw new Error(`${skill} frontmatter must contain only name and description`);
  }

  const metadata = read(metadataPath);
  const shortDescription = metadata.match(/^  short_description: "([^"]+)"$/m)?.[1];
  if (!shortDescription || shortDescription.length < 25 || shortDescription.length > 64) {
    throw new Error(`${skill} short_description must be 25-64 characters`);
  }
  if (!metadata.includes(`$${skill}`)) {
    throw new Error(`${skill} metadata default prompt must mention $${skill}`);
  }
  if (!metadata.includes("allow_implicit_invocation: true")) {
    throw new Error(`${skill} must allow implicit invocation`);
  }
}

for (const requiredPath of [
  "skills",
  "README.md",
  "README.en.md",
  "CHANGELOG.md",
  "LICENSE",
  "THIRD_PARTY_NOTICES.md",
]) {
  if (!pkg.files.includes(requiredPath) || !exists(requiredPath)) {
    throw new Error(`package file is missing or not published: ${requiredPath}`);
  }
}

for (const readme of ["README.md", "README.en.md"]) {
  const body = read(readme);
  for (const skill of expectedSkills) {
    if (!body.includes(skill)) throw new Error(`${readme} does not mention ${skill}`);
  }

  for (const match of body.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    const href = match[1];
    if (!/^(https?:|mailto:|#)/.test(href) && !exists(href.split("#")[0])) {
      throw new Error(`${readme} has broken link: ${href}`);
    }
  }
}

if (!read("CHANGELOG.md").includes(`## ${pkg.version} -`)) {
  throw new Error(`CHANGELOG.md is missing release ${pkg.version}`);
}

const notices = read("THIRD_PARTY_NOTICES.md");
for (const requiredNotice of ["Matt Pocock", "MIT License", "Copyright (c) 2026 Matt Pocock"]) {
  if (!notices.includes(requiredNotice)) {
    throw new Error(`THIRD_PARTY_NOTICES.md is missing: ${requiredNotice}`);
  }
}

console.log(`validated ${expectedSkills.length} skills for jhste-skills ${pkg.version}`);
