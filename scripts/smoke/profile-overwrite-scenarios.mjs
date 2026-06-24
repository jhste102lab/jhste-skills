import fs from 'node:fs';
import path from 'node:path';
import { fail, run, runAny } from './helpers.mjs';

function initRepo(repo) {
  fs.mkdirSync(repo, { recursive: true });
  run('git', ['init'], { cwd: repo });
}

function customProfileText() {
  return 'version: 1\nmode: strict\n# custom profile should survive\n';
}

function legacyGeneratedProfileText() {
  return `version: 1
mode: advisory
installed_at: "<installed_at>"
adapters:
  codex: auto
  claude: auto
rules:
  file_size_advisory:
    mode: advisory
    source_file_warning_lines: 300
    source_file_review_lines: 300
  responsibility_budget:
    next_page_review_lines: 200
    client_module_review_lines: 200
    route_review_lines: 250
    import_ops_script_review_lines: 280
    python_orchestrator_review_lines: 600
  single_responsibility_advisory:
    mode: advisory
    function_review_lines: 80
    mixed_responsibility_hints: 3
    module_export_family_hints: 4
  extension_seam_advisory:
    mode: advisory
  dependency_boundary_advisory:
    mode: advisory
baseline:
  enabled: false
  path: .jhste/baseline.json
guard:
  default_scope: changed
  default_format: text
  exit_codes:
    pass: 0
    violation_failure: 1
    guard_runtime_failure: 2
    config_failure: 3
deep_scan:
  last_run: null
  report: .jhste/deep-scan-report.md
  recommended_profile: .jhste/profile.recommended.yaml
workflow:
  final_review:
    auto_for_non_trivial_code_changes: true
    skip_when:
      - docs_only
      - comment_only
      - formatting_only
      - trivial_rename_only
    max_fix_review_cycles: 2
`;
}

export function runProfileOverwriteScenarios({ root, tmp, skillsDir }) {
  const customKeepRepo = path.join(tmp, 'custom-profile-force-keep');
  const customKeepSkills = path.join(tmp, 'custom-profile-force-keep-skills');
  initRepo(customKeepRepo);
  fs.mkdirSync(path.join(customKeepRepo, '.jhste'), { recursive: true });
  fs.writeFileSync(path.join(customKeepRepo, '.jhste', 'profile.yaml'), customProfileText());
  const customKeep = run(process.execPath, [path.join(root, 'cli/install.mjs'), '--yes', '--repo', customKeepRepo, '--skills-dir', customKeepSkills, '--skip-deep-scan', '--force'], { cwd: customKeepRepo });
  if (!customKeep.stdout.includes('will-keep-modified') || !customKeep.stdout.includes('skipped-modified')) fail('install --force did not report modified profile preservation');
  if (fs.readFileSync(path.join(customKeepRepo, '.jhste', 'profile.yaml'), 'utf8') !== customProfileText()) fail('install --force overwrote a modified profile');

  const customOverwriteRepo = path.join(tmp, 'custom-profile-force-overwrite');
  const customOverwriteSkills = path.join(tmp, 'custom-profile-force-overwrite-skills');
  initRepo(customOverwriteRepo);
  fs.mkdirSync(path.join(customOverwriteRepo, '.jhste'), { recursive: true });
  fs.writeFileSync(path.join(customOverwriteRepo, '.jhste', 'profile.yaml'), customProfileText());
  run(process.execPath, [path.join(root, 'cli/install.mjs'), '--yes', '--repo', customOverwriteRepo, '--skills-dir', customOverwriteSkills, '--skip-deep-scan', '--force', '--allow-profile-overwrite'], { cwd: customOverwriteRepo });
  const overwrittenProfile = fs.readFileSync(path.join(customOverwriteRepo, '.jhste', 'profile.yaml'), 'utf8');
  if (!/^mode: advisory$/m.test(overwrittenProfile) || overwrittenProfile.includes('# custom profile should survive')) fail('install --force --allow-profile-overwrite did not replace modified profile');
  if (overwrittenProfile.includes('exit_codes:')) fail('explicitly overwritten generated profile should not include guard.exit_codes');

  const generatedRefreshRepo = path.join(tmp, 'generated-profile-refresh');
  const generatedRefreshSkills = path.join(tmp, 'generated-profile-refresh-skills');
  initRepo(generatedRefreshRepo);
  run(process.execPath, [path.join(root, 'cli/install.mjs'), '--yes', '--repo', generatedRefreshRepo, '--skills-dir', generatedRefreshSkills, '--skip-deep-scan'], { cwd: generatedRefreshRepo });
  run(process.execPath, [path.join(root, 'cli/install.mjs'), '--yes', '--repo', generatedRefreshRepo, '--skills-dir', generatedRefreshSkills, '--skip-deep-scan', '--force', '--line-limit', '321'], { cwd: generatedRefreshRepo });
  const refreshedProfile = fs.readFileSync(path.join(generatedRefreshRepo, '.jhste', 'profile.yaml'), 'utf8');
  if (!refreshedProfile.includes('source_file_warning_lines: 321') || !refreshedProfile.includes('source_file_review_lines: 321')) fail('install --force did not refresh managed generated profile');

  const legacyRefreshRepo = path.join(tmp, 'legacy-generated-profile-refresh');
  const legacyRefreshSkills = path.join(tmp, 'legacy-generated-profile-refresh-skills');
  initRepo(legacyRefreshRepo);
  fs.mkdirSync(path.join(legacyRefreshRepo, '.jhste'), { recursive: true });
  fs.writeFileSync(path.join(legacyRefreshRepo, '.jhste', 'profile.yaml'), legacyGeneratedProfileText());
  run(process.execPath, [path.join(root, 'cli/install.mjs'), '--yes', '--repo', legacyRefreshRepo, '--skills-dir', legacyRefreshSkills, '--skip-deep-scan', '--force'], { cwd: legacyRefreshRepo });
  const legacyRefreshedProfile = fs.readFileSync(path.join(legacyRefreshRepo, '.jhste', 'profile.yaml'), 'utf8');
  if (legacyRefreshedProfile.includes('exit_codes:')) fail('legacy generated profile was not refreshed to current generated shape');


  const generatedLikeModifiedRepo = path.join(tmp, 'generated-like-modified-profile-keep');
  const generatedLikeModifiedSkills = path.join(tmp, 'generated-like-modified-profile-keep-skills');
  initRepo(generatedLikeModifiedRepo);
  fs.mkdirSync(path.join(generatedLikeModifiedRepo, '.jhste'), { recursive: true });
  const generatedLikeModified = legacyGeneratedProfileText().replace('    source_file_review_lines: 300\n', '    source_file_review_lines: 300\n    custom_threshold: 999\n');
  fs.writeFileSync(path.join(generatedLikeModifiedRepo, '.jhste', 'profile.yaml'), generatedLikeModified);
  run(process.execPath, [path.join(root, 'cli/install.mjs'), '--yes', '--repo', generatedLikeModifiedRepo, '--skills-dir', generatedLikeModifiedSkills, '--skip-deep-scan', '--force'], { cwd: generatedLikeModifiedRepo });
  if (fs.readFileSync(path.join(generatedLikeModifiedRepo, '.jhste', 'profile.yaml'), 'utf8') !== generatedLikeModified) fail('install --force overwrote a generated-like modified profile');

  const allowWithoutForce = runAny(process.execPath, [path.join(root, 'cli/install.mjs'), '--yes', '--repo', legacyRefreshRepo, '--skills-dir', legacyRefreshSkills, '--skip-deep-scan', '--allow-profile-overwrite'], { cwd: legacyRefreshRepo });
  if (allowWithoutForce.status !== 3) fail(`install --allow-profile-overwrite without --force should exit 3, got ${allowWithoutForce.status}`);

  const connectKeepRepo = path.join(tmp, 'connect-custom-profile-force-keep');
  initRepo(connectKeepRepo);
  fs.mkdirSync(path.join(connectKeepRepo, '.jhste'), { recursive: true });
  fs.writeFileSync(path.join(connectKeepRepo, '.jhste', 'profile.yaml'), customProfileText());
  run(process.execPath, [path.join(root, 'cli/connect.mjs'), '--yes', '--repo', connectKeepRepo, '--skills-dir', skillsDir, '--skip-deep-scan', '--force'], { cwd: connectKeepRepo });
  if (fs.readFileSync(path.join(connectKeepRepo, '.jhste', 'profile.yaml'), 'utf8') !== customProfileText()) fail('connect --force overwrote a modified profile');

  const syncKeepRepo = path.join(tmp, 'sync-custom-profile-force-keep');
  const syncKeepSkills = path.join(tmp, 'sync-custom-profile-force-keep-skills');
  initRepo(syncKeepRepo);
  run(process.execPath, [path.join(root, 'cli/install.mjs'), '--yes', '--repo', syncKeepRepo, '--skills-dir', syncKeepSkills, '--skip-deep-scan'], { cwd: syncKeepRepo });
  fs.writeFileSync(path.join(syncKeepRepo, '.jhste', 'profile.yaml'), customProfileText());
  run(process.execPath, [path.join(root, 'cli/sync.mjs'), '--yes', '--repo', syncKeepRepo, '--skills-dir', syncKeepSkills, '--force'], { cwd: syncKeepRepo });
  if (fs.readFileSync(path.join(syncKeepRepo, '.jhste', 'profile.yaml'), 'utf8') !== customProfileText()) fail('sync --force overwrote a modified profile');
  run(process.execPath, [path.join(root, 'cli/update.mjs'), '--yes', '--repo', syncKeepRepo, '--skills-dir', syncKeepSkills, '--force'], { cwd: syncKeepRepo });
  if (fs.readFileSync(path.join(syncKeepRepo, '.jhste', 'profile.yaml'), 'utf8') !== customProfileText()) fail('update --force overwrote a modified profile');
  const syncAllowWithoutForce = runAny(process.execPath, [path.join(root, 'cli/sync.mjs'), '--yes', '--repo', syncKeepRepo, '--skills-dir', syncKeepSkills, '--allow-profile-overwrite'], { cwd: syncKeepRepo });
  if (syncAllowWithoutForce.status !== 3) fail(`sync --allow-profile-overwrite without --force should exit 3, got ${syncAllowWithoutForce.status}`);
}
