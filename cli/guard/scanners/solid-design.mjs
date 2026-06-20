import { isRouteLikePath, isSourceCodePath, lineAt, violation } from './utils.mjs';

const VARIANT_BRANCH_MIN_CASES = 3;

function sourceExt(relPath) {
  return /\.(tsx?|jsx?|mjs|cjs|py)$/u.test(relPath);
}

function isGeneratedOrFixture(relPath) {
  return /(^|\/)(fixtures?|__fixtures__|tests?|__tests__|vendor|dist|build|coverage)\//i.test(relPath)
    || /fixtures?-test\.mjs$/u.test(relPath);
}

function isPolicyLikePath(relPath) {
  if (isRouteLikePath(relPath)) return false;
  if (/(^|\/)(adapters?|repositories?|repos?|queries|db|database|infra|infrastructure|clients?|sdk|scripts|migrations?|tests?|__tests__)\//i.test(relPath)) return false;
  return /(^|\/)(services?|usecases?|domain|policy|policies|core|application)\//i.test(relPath)
    || /(?:Service|Usecase|UseCase|Policy|Manager)\.(?:tsx?|jsx?|mjs|cjs)$/u.test(relPath);
}

function switchBranchCandidates(text) {
  const out = [];
  const pattern = /\bswitch\s*\(\s*([^)]{1,80})\s*\)\s*\{/gu;
  for (const match of text.matchAll(pattern)) {
    const discriminator = (match[1] || '').trim();
    if (!/\b(kind|type|variant|provider|adapter|mode|policy|strategy|channel|driver)\b/i.test(discriminator)) continue;
    const bodyStart = (match.index || 0) + match[0].length;
    const body = text.slice(bodyStart, bodyStart + 2400);
    const caseCount = [...body.matchAll(/\bcase\s+[^:]{1,120}:/gu)].length;
    if (caseCount >= VARIANT_BRANCH_MIN_CASES) {
      out.push({ index: match.index || 0, discriminator, branchCount: caseCount });
    }
  }
  return out;
}

function repeatedComparisonCandidates(text) {
  const comparisons = new Map();
  const pattern = /\b([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)?)\s*(?:===|==|!==|!=)\s*['"][^'"]{1,80}['"]/gu;
  for (const match of text.matchAll(pattern)) {
    const discriminator = match[1] || '';
    if (!/\b(kind|type|variant|provider|adapter|mode|policy|strategy|channel|driver)\b/i.test(discriminator)) continue;
    const current = comparisons.get(discriminator) || { index: match.index || 0, count: 0 };
    current.count += 1;
    comparisons.set(discriminator, current);
  }
  return [...comparisons.entries()]
    .filter(([, value]) => value.count >= VARIANT_BRANCH_MIN_CASES)
    .map(([discriminator, value]) => ({ index: value.index, discriminator, branchCount: value.count }));
}

export function scanExtensionSeamAdvisory(relPath, text) {
  if (!isSourceCodePath(relPath) || !sourceExt(relPath) || isGeneratedOrFixture(relPath)) return [];
  const candidates = [...switchBranchCandidates(text), ...repeatedComparisonCandidates(text)];
  const first = candidates.sort((left, right) => left.index - right.index)[0];
  if (!first) return [];
  return [violation({
    ruleId: 'solid.ocp.variant_branching_hotspot',
    severity: 'warning',
    relPath,
    line: lineAt(text, first.index),
    symbol: first.discriminator,
    message: `Variant branching on ${first.discriminator} has ${first.branchCount} branches; review whether an extension seam would reduce repeated core edits without adding premature abstraction.`,
    confidence: 'low',
  })];
}

function concreteDependencyCandidates(text) {
  const candidates = [
    { label: 'database client', pattern: /\b(new\s+PrismaClient\s*\(|prisma\.\w+\.|pool\.query\s*\(|client\.query\s*\(|db\.\w+\()/iu },
    { label: 'network client', pattern: /\b(fetch\s*\(|axios\.|got\s*\(|request\s*\()/iu },
    { label: 'filesystem', pattern: /\b(fs\.|readFile\s*\(|writeFile\s*\(|mkdir\s*\(|rm\s*\()/iu },
    { label: 'payment client', pattern: /\b(new\s+Stripe\s*\(|stripe\.|Payment\w*\.(?:create|charge|refund|capture|cancel)\w*\s*\()/iu },
    { label: 'notification client', pattern: /\b(sendEmail\s*\(|sendMail\s*\(|notifyUser\s*\(|Email\w*\.(?:send|deliver)\w*\s*\()/iu },
    { label: 'queue/event client', pattern: /\b(queue\.(?:send|enqueue)|eventBus\.emit|publisher\.publish|producer\.send)\s*\(/iu },
    { label: 'browser/runtime client', pattern: /\b(new\s+Browser\s*\(|chromium\.launch\s*\(|page\.goto\s*\()/iu },
  ];
  for (const candidate of candidates) {
    const match = candidate.pattern.exec(text);
    if (match) return { label: candidate.label, index: match.index || 0 };
  }
  return null;
}

export function scanDependencyBoundaryAdvisory(relPath, text) {
  if (!isSourceCodePath(relPath) || !sourceExt(relPath) || isGeneratedOrFixture(relPath) || !isPolicyLikePath(relPath)) return [];
  const candidate = concreteDependencyCandidates(text);
  if (!candidate) return [];
  return [violation({
    ruleId: 'solid.dip.concrete_side_effect_dependency',
    severity: 'warning',
    relPath,
    line: lineAt(text, candidate.index),
    symbol: candidate.label,
    message: `High-level policy/service path directly touches a ${candidate.label}; review whether the concrete side effect belongs behind an adapter, repository, injected dependency, or intentionally local seam.`,
    confidence: 'low',
  })];
}
