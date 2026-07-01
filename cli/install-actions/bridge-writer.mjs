import fs from 'node:fs';
import path from 'node:path';
import { BRIDGE_BLOCK, BRIDGE_END, BRIDGE_START, MANAGED_BRIDGE_BLOCK, MANAGED_GLOBAL_BRIDGE_BLOCK, ensureDir, readIfExists } from '../shared.mjs';

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function bridgeTargetNames(plan) {
  if (!plan.writeBridge || !plan.repoRoot) return [];
  const names = ['AGENTS.md', 'CLAUDE.md'];
  const existing = names.filter((name) => fs.existsSync(path.join(plan.repoRoot, name)));
  return existing.length ? existing : ['AGENTS.md'];
}

export function bridgeStatus(repoRoot, fileName) {
  const target = path.join(repoRoot, fileName);
  const existing = readIfExists(target);
  if (existing === null) return { fileName, path: target, status: 'will-create' };
  if (existing.includes(BRIDGE_START) && existing.includes(BRIDGE_END)) {
    return existing.includes(MANAGED_BRIDGE_BLOCK)
      ? { fileName, path: target, status: 'already-managed' }
      : { fileName, path: target, status: 'will-update-managed' };
  }
  if (existing.includes(BRIDGE_BLOCK)) return { fileName, path: target, status: 'will-migrate-legacy' };
  if (/^##\s+Agent skills\s*$/m.test(existing) || /jhste skills/i.test(existing)) return { fileName, path: target, status: 'manual-review' };
  return { fileName, path: target, status: 'will-append-managed' };
}

// Write/refresh the agent-neutral global bridge in an absolute instruction file,
// creating parent directories and the file when absent. Marker-managed and idempotent.
export function writeManagedGlobalBridge(targetPath) {
  ensureDir(path.dirname(targetPath));
  const existing = readIfExists(targetPath);
  if (existing === null) {
    fs.writeFileSync(targetPath, `${MANAGED_GLOBAL_BRIDGE_BLOCK}\n`);
    return { status: 'created', path: targetPath };
  }
  if (existing.includes(BRIDGE_START) && existing.includes(BRIDGE_END)) {
    const pattern = new RegExp(`${escapeRegExp(BRIDGE_START)}[\\s\\S]*?${escapeRegExp(BRIDGE_END)}`);
    const updated = existing.replace(pattern, MANAGED_GLOBAL_BRIDGE_BLOCK);
    if (updated === existing) return { status: 'unchanged', path: targetPath };
    fs.writeFileSync(targetPath, updated);
    return { status: 'updated-managed', path: targetPath };
  }
  const prefix = existing.endsWith('\n') ? existing : `${existing}\n`;
  fs.writeFileSync(targetPath, `${prefix}\n${MANAGED_GLOBAL_BRIDGE_BLOCK}\n`);
  return { status: 'appended-managed', path: targetPath };
}

// Remove a marker-managed bridge block from an absolute instruction file. Deletes the
// file only if it becomes empty and was created solely for the bridge.
export function removeManagedGlobalBridge(targetPath) {
  const existing = readIfExists(targetPath);
  if (existing === null) return { status: 'absent', path: targetPath };
  if (!(existing.includes(BRIDGE_START) && existing.includes(BRIDGE_END))) return { status: 'no-managed-block', path: targetPath };
  const pattern = new RegExp(`\\n?${escapeRegExp(BRIDGE_START)}[\\s\\S]*?${escapeRegExp(BRIDGE_END)}\\n?`);
  const updated = existing.replace(pattern, '\n').replace(/^\n+/, '').replace(/\n{3,}/g, '\n\n');
  if (updated.trim() === '') {
    fs.rmSync(targetPath, { force: true });
    return { status: 'removed-empty-file', path: targetPath };
  }
  fs.writeFileSync(targetPath, updated);
  return { status: 'removed-managed-block', path: targetPath };
}

export function writeManagedBridge(repoRoot, fileName) {
  const target = path.join(repoRoot, fileName);
  const existing = readIfExists(target);
  if (existing === null) {
    fs.writeFileSync(target, `${MANAGED_BRIDGE_BLOCK}\n`);
    return { status: 'created', path: target };
  }
  if (existing.includes(BRIDGE_START) && existing.includes(BRIDGE_END)) {
    const pattern = new RegExp(`${escapeRegExp(BRIDGE_START)}[\\s\\S]*?${escapeRegExp(BRIDGE_END)}`);
    const updated = existing.replace(pattern, MANAGED_BRIDGE_BLOCK);
    if (updated === existing) return { status: 'unchanged', path: target };
    fs.writeFileSync(target, updated);
    return { status: 'updated-managed', path: target };
  }
  if (existing.includes(BRIDGE_BLOCK)) {
    fs.writeFileSync(target, existing.replace(BRIDGE_BLOCK, MANAGED_BRIDGE_BLOCK));
    return { status: 'migrated-legacy', path: target };
  }
  if (/^##\s+Agent skills\s*$/m.test(existing) || /jhste skills/i.test(existing)) return { status: 'manual-review', path: target, snippet: MANAGED_BRIDGE_BLOCK };
  const prefix = existing.endsWith('\n') ? existing : `${existing}\n`;
  fs.writeFileSync(target, `${prefix}\n${MANAGED_BRIDGE_BLOCK}\n`);
  return { status: 'appended-managed', path: target };
}
