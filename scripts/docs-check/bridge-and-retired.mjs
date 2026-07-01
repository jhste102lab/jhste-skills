import path from 'node:path';

export function assertBridgeAndRetiredNames({ root, read, walk, relPath, fail, retiredSkillNames, fullLoopSentinels }) {
  const bridgeText = 'Repo-local instructions in this file remain authoritative.';
  for (const rel of ['adapters/codex/README.md', 'docs/CONFLICT_RESOLUTION.md', 'cli/shared/templates.mjs']) {
    const text = read(rel);
    if (!text.includes(bridgeText)) fail(`${rel} must include authoritative repo-local bridge wording`);
    for (const requiredText of ['ask-jhste', 'jhste-preflight', 'jhste-redteam']) {
      if (!text.includes(requiredText)) fail(`${rel} must mention ${requiredText} in shared workflow guidance`);
    }
    if (/approval boundary in \\?`_shared\/side-effect-policy\.md\\?`/.test(text)) fail(`${rel} must not point bridge readers at a bare _shared side-effect policy path`);
    if (!text.includes("installed skills directory's") || !text.includes('_shared/side-effect-policy.md')) fail(`${rel} must point bridge readers at the installed skills directory side-effect policy`);
    for (const sentinel of fullLoopSentinels) {
      if (text.includes(sentinel)) fail(`${rel} bridge must delegate the core loop to skills/_shared/core-loop.md, not restate it ("${sentinel}")`);
    }
  }

  const rootAgents = read('AGENTS.md');
  for (const requiredText of ['ask-jhste', 'jhste-preflight', 'jhste-redteam', 'side-effect-policy.md']) {
    if (!rootAgents.includes(requiredText)) fail(`AGENTS.md must mention ${requiredText}`);
  }
  if (/approval boundary in `_shared\/side-effect-policy\.md`/.test(rootAgents)) fail('AGENTS.md must not point bridge readers at a bare _shared side-effect policy path');
  for (const sentinel of fullLoopSentinels) {
    if (rootAgents.includes(sentinel)) fail(`AGENTS.md must delegate the core loop to the installed skills, not restate it ("${sentinel}")`);
  }

  const retiredNameSurfaces = walk(path.join(root, 'skills'), (file) => file.endsWith('.md')).map(relPath);
  retiredNameSurfaces.push('AGENTS.md', 'cli/shared/templates.mjs');
  for (const rel of retiredNameSurfaces) {
    const text = read(rel);
    for (const oldName of retiredSkillNames) {
      if (text.includes(oldName)) fail(`${rel} references retired skill name ${oldName}; update it to the current topology`);
    }
  }
}
