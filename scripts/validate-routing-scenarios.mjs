import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const fixturePaths = [
  "scripts/routing-scenarios.json",
  "scripts/routing-scenarios-orchestration.json",
  "scripts/routing-scenarios-0.14.json",
];
const documents = fixturePaths.map((fixturePath) =>
  JSON.parse(fs.readFileSync(path.join(root, fixturePath), "utf8")),
);

for (const [index, document] of documents.entries()) {
  if (!document.validation_scope?.includes("does not invoke a model")) {
    throw new Error(`${fixturePaths[index]} must state its static validation limit`);
  }
}

const skillNames = new Set(
  fs
    .readdirSync(path.join(root, "skills"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name),
);
const changedSkills = new Set(documents.flatMap((document) => document.changed_skills ?? []));
const cases = documents.flatMap((document) => document.cases ?? []);
const ids = new Set();
const requiredKinds = new Map([
  ["trigger", 2],
  ["non-trigger", 2],
  ["handoff", 1],
  ["external-write", 1],
]);
const allowedWritePolicies = new Set([
  "none",
  "local-only",
  "draft-only",
  "authorized-by-request",
  "forbidden-by-request",
]);

for (const skill of changedSkills) {
  if (!skillNames.has(skill)) throw new Error(`unknown changed skill: ${skill}`);
}

for (const scenario of cases) {
  for (const field of ["id", "source_skill", "kind", "request", "write_policy", "rationale"]) {
    if (typeof scenario[field] !== "string" || scenario[field].trim() === "") {
      throw new Error(`routing scenario is missing ${field}: ${JSON.stringify(scenario)}`);
    }
  }

  if (ids.has(scenario.id)) throw new Error(`duplicate routing scenario id: ${scenario.id}`);
  ids.add(scenario.id);

  if (!changedSkills.has(scenario.source_skill)) {
    throw new Error(`${scenario.id} targets an unchanged skill: ${scenario.source_skill}`);
  }
  if (!requiredKinds.has(scenario.kind)) {
    throw new Error(`${scenario.id} has unsupported kind: ${scenario.kind}`);
  }
  if (
    scenario.expected_skill !== null &&
    (typeof scenario.expected_skill !== "string" || !skillNames.has(scenario.expected_skill))
  ) {
    throw new Error(`${scenario.id} has unknown expected skill: ${scenario.expected_skill}`);
  }
  if (!allowedWritePolicies.has(scenario.write_policy)) {
    throw new Error(`${scenario.id} has unsupported write policy: ${scenario.write_policy}`);
  }

  if (scenario.kind === "trigger" && scenario.expected_skill !== scenario.source_skill) {
    throw new Error(`${scenario.id} trigger must route to ${scenario.source_skill}`);
  }
  if (
    (scenario.kind === "non-trigger" || scenario.kind === "handoff") &&
    scenario.expected_skill === scenario.source_skill
  ) {
    throw new Error(`${scenario.id} ${scenario.kind} must route away from ${scenario.source_skill}`);
  }
  if (scenario.kind === "external-write" && scenario.write_policy === "none") {
    throw new Error(`${scenario.id} external-write case needs an explicit policy`);
  }
}

for (const skill of changedSkills) {
  const skillCases = cases.filter((scenario) => scenario.source_skill === skill);
  for (const [kind, minimum] of requiredKinds) {
    const count = skillCases.filter((scenario) => scenario.kind === kind).length;
    if (count < minimum) {
      throw new Error(`${skill} needs ${minimum} ${kind} scenarios; found ${count}`);
    }
  }
}

console.log(
  `validated ${cases.length} static routing scenarios across ${changedSkills.size} changed skills`,
);
