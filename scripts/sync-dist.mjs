import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Vercel can resolve the "Output Directory" either from the repository root or
// from the frontend workspace depending on the project's Root Directory
// setting. Keep a copy in both places so the build always matches.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const source = path.join(repoRoot, 'frontend', 'dist');
const target = path.join(repoRoot, 'dist');

console.log(`[sync-dist] cwd=${process.cwd()}`);
console.log(`[sync-dist] source=${source}`);

if (!fs.existsSync(source)) {
  console.error('[sync-dist] frontend/dist was not created by the build.');
  process.exit(1);
}

fs.rmSync(target, { recursive: true, force: true });
fs.cpSync(source, target, { recursive: true });
console.log(`[sync-dist] copied build output to ${target}`);
