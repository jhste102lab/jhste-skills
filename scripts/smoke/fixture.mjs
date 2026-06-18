import fs from 'node:fs';
import path from 'node:path';
import { run } from './helpers.mjs';

function unsafeProfileRouteSource() {
  const bodyRead = 'const body = await request.' + 'json();';
  const createCall = 'service.create' + 'Profile(body)';
  return `export async function POST(request) {\n  ${bodyRead}\n  return Response.json(await ${createCall});\n}\n`;
}

export function createPrimaryTarget({ root, tmp }) {
  const repo = path.join(tmp, 'repo');
  const skillsDir = path.join(tmp, 'home-skills');
  fs.mkdirSync(repo, { recursive: true });
  run('git', ['init'], { cwd: repo });
  fs.writeFileSync(path.join(repo, 'AGENTS.md'), '# Repo instructions\n\nLocal guidance wins.\n');
  fs.writeFileSync(path.join(repo, 'package.json'), '{"name":"smoke-target","scripts":{"test":"echo ok"}}\n');
  fs.writeFileSync(path.join(repo, 'package-lock.json'), '{"lockfileVersion":3}\n');
  for (const dir of [
    'src',
    'src/app/dashboard',
    'src/app/orders',
    'src/app/api/orders',
    'src/app/api/profile',
  ]) {
    fs.mkdirSync(path.join(repo, dir), { recursive: true });
  }
  const emptyCatchFixture = 'catch ' + '{}';
  fs.writeFileSync(path.join(repo, 'src', 'route.ts'), `export async function GET() {\n  try {\n    return Response.json({ ok: true });\n  } ${emptyCatchFixture}\n}\n`);
  fs.writeFileSync(
    path.join(repo, 'src', 'app', 'dashboard', 'page.tsx'),
    `export default function Page() {\n  return <main>dashboard</main>;\n}\n${Array.from({ length: 205 }, (_, index) => `// page shell line ${index + 1}`).join('\n')}\n`,
  );
  fs.writeFileSync(
    path.join(repo, 'src', 'app', 'orders', 'client.tsx'),
    ordersClientSource(),
  );
  fs.writeFileSync(
    path.join(repo, 'src', 'app', 'api', 'orders', 'route.ts'),
    `export async function POST(request) {\n  const session = await auth();\n  const body = await request.json();\n  const order = await prisma.order.update({ data: body });\n  return Response.json(order);\n}\n`,
  );
  fs.writeFileSync(path.join(repo, 'src', 'app', 'api', 'profile', 'route.ts'), unsafeProfileRouteSource());
  return { root, tmp, repo, skillsDir };
}

function ordersClientSource() {
  const envAccess = 'process.env.' + 'NEXT_PUBLIC_API_URL';
  return `"use client";\nimport { useEffect } from "react";\nconst apiBase = ${envAccess};\nexport default function OrdersClient({ items }) {\n  useEffect(() => {\n    fetch(apiBase + "/orders");\n    fetch(apiBase + "/orders");\n  }, []);\n  return <ul>{items!.map((item) => <li key={item.id}>{item.name}</li>)}</ul>;\n}\n`;
}
