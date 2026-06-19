import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

export function readIfExists(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
}

export function writeFileIfChanged(file, content) {
  if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') === content) return false;
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, content);
  return true;
}

export function listDirectories(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

export function directoryDigest(dir) {
  const hash = crypto.createHash('sha256');
  if (!fs.existsSync(dir)) return null;
  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const full = path.join(current, entry.name);
      const rel = path.relative(dir, full).replaceAll(path.sep, '/');
      if (entry.isDirectory()) {
        hash.update(`dir:${rel}\n`);
        walk(full);
      } else if (entry.isFile()) {
        hash.update(`file:${rel}\n`);
        hash.update(fs.readFileSync(full));
        hash.update('\n');
      }
    }
  };
  walk(dir);
  return hash.digest('hex');
}

export function copyDirSafe(source, destination, { force = false } = {}) {
  if (!fs.existsSync(source)) return { status: 'missing-source', source, destination };
  if (!fs.existsSync(destination)) {
    ensureDir(path.dirname(destination));
    fs.cpSync(source, destination, { recursive: true });
    return { status: 'created', source, destination };
  }
  const sourceHash = directoryDigest(source);
  const destinationHash = directoryDigest(destination);
  if (sourceHash === destinationHash) return { status: 'unchanged', source, destination };
  if (!force) return { status: 'skipped-existing-different', source, destination };
  fs.rmSync(destination, { recursive: true, force: true });
  fs.cpSync(source, destination, { recursive: true });
  return { status: 'overwritten', source, destination };
}

export function atomicWrite(file, content) {
  ensureDir(path.dirname(file));
  const tmp = `${file}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, content);
  fs.renameSync(tmp, file);
}
