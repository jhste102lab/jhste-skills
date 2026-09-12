import { readFileSync } from "node:fs";

const { version } = JSON.parse(readFileSync("package.json", "utf8"));
const lines = readFileSync("CHANGELOG.md", "utf8").split(/\r?\n/);
const heading = `## ${version} - `;
const matches = lines.flatMap((line, index) => line.startsWith(heading) ? [index] : []);
if (matches.length !== 1) {
  throw new Error(`Expected one changelog section for ${version}; found ${matches.length}`);
}
const start = matches[0] + 1;
const next = lines.findIndex((line, index) => index >= start && line.startsWith("## "));
const notes = lines.slice(start, next === -1 ? undefined : next).join("\n").trim();
if (!notes) throw new Error(`Changelog section for ${version} is empty`);
process.stdout.write(`${notes}\n`);
