#!/usr/bin/env node
import path from 'node:path';
import {
  fail,
  guardJson,
  hasRule,
  makeRepo,
  write,
} from './guard-fixtures/helpers.mjs';

{
  const repo = makeRepo('responsibility-mixed');
  write(path.join(repo, 'src/components/EventPanel.tsx'), `"use client";
export function EventPanel() {
  const cached = localStorage.getItem('event');
  fetch('/api/events');
  toast.success(cached);
  return <Dialog open={true} />;
}
`);
  write(path.join(repo, 'src/app/api/events/route.ts'), `const schema = { safeParse(value) { return { success: true, data: value }; } };
export async function POST(request) {
  const user = await requireUser();
  const body = schema.safeParse(await request.json());
  const rows = await prisma.event.findMany({ where: { userId: user.id } });
  return Response.json({ body, rows });
}
`);
  write(path.join(repo, 'scripts/import/events.ts'), `import fs from 'node:fs';
export async function main() {
  const file = process.argv[2];
  const rows = JSON.parse(fs.readFileSync(file, 'utf8')).map((row) => row.id);
  await fetch('https://example.test/events');
  console.log(rows.length);
}
`);
  const result = guardJson(repo);
  if (!hasRule(result, 'responsibility.client.mixed', 'EventPanel.tsx')) fail('mixed client responsibility was not reported by guard');
  if (!hasRule(result, 'responsibility.route.mixed', 'events/route.ts')) fail('mixed route responsibility was not reported by guard');
  if (!hasRule(result, 'responsibility.script.mixed', 'scripts/import/events.ts')) fail('mixed script responsibility was not reported by guard');
  for (const ruleId of ['responsibility.client.mixed', 'responsibility.route.mixed', 'responsibility.script.mixed']) {
    const item = result.violations.find((violation) => violation.rule_id === ruleId);
    if (item.confidence !== 'low' || item.severity !== 'warning') fail(`${ruleId} should be low-confidence warning`);
  }
}

console.log('responsibility-budget-fixtures-test passed: mixed responsibility candidates verified.');
