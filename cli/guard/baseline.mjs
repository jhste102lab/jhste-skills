import fs from 'node:fs';
import path from 'node:path';
import { readJsonFile, validateJsonObject } from '../json-file.mjs';
import { nowIso, relativeDisplay } from '../shared.mjs';

export function loadBaseline(repoRoot, baselinePath, callbacks = {}) {
  const failConfig = callbacks.failConfig || ((message) => { throw new Error(message); });
  if (!fs.existsSync(baselinePath)) return new Map();
  try {
    const data = readJsonFile(baselinePath, {
      description: `baseline ${relativeDisplay(repoRoot, baselinePath)}`,
      validate: validateJsonObject,
    });
    const items = Array.isArray(data.violations) ? data.violations : [];
    return new Map(items.filter((item) => typeof item.fingerprint === 'string').map((item) => [item.fingerprint, item]));
  } catch (error) {
    failConfig(`Failed to parse baseline ${relativeDisplay(repoRoot, baselinePath)}.`, [error instanceof Error ? error.message : String(error)]);
  }
  return new Map();
}

export function writeBaseline(baselinePath, violations, existingBaseline = new Map()) {
  fs.mkdirSync(path.dirname(baselinePath), { recursive: true });
  const now = nowIso();
  const rowsByFingerprint = new Map();
  for (const item of violations) {
    const existing = existingBaseline.get(item.fingerprint) || {};
    rowsByFingerprint.set(item.fingerprint, {
      fingerprint: item.fingerprint,
      occurrence_key: item.occurrence_key,
      rule_id: item.rule_id,
      path: item.path,
      severity: item.severity,
      first_seen: existing.first_seen || now,
      last_seen: now,
      reason: existing.reason || 'remediation queue item; fix or explicitly keep tracking before enforcing',
      owner: existing.owner || null,
      expires_at: existing.expires_at || null,
      fix_tracking: existing.fix_tracking || null,
    });
  }
  const rows = [...rowsByFingerprint.values()];
  fs.writeFileSync(baselinePath, `${JSON.stringify({ version: 1, created_at: now, updated_at: now, violations: rows }, null, 2)}\n`);
}

export function applyBaseline(violations, baselineMap, mode, callbacks = {}) {
  const failConfig = callbacks.failConfig || ((message) => { throw new Error(message); });
  if (!['off', 'use', 'update', 'ratchet'].includes(mode)) failConfig(`Unsupported --baseline ${mode}. Use off, use, update, or ratchet.`);
  if (mode === 'off' || mode === 'update') return violations.map((item) => ({ ...item, baseline_status: 'unmanaged' }));
  return violations.map((item) => {
    const baseline = baselineMap.get(item.fingerprint);
    if (!baseline) return { ...item, baseline_status: 'new' };
    return {
      ...item,
      baseline_status: 'matched',
      baseline_reason: baseline.reason || '',
      baseline_first_seen: baseline.first_seen || null,
      baseline_last_seen: baseline.last_seen || null,
      baseline_owner: baseline.owner || null,
      baseline_expires_at: baseline.expires_at || null,
      baseline_fix_tracking: baseline.fix_tracking || null,
    };
  });
}
