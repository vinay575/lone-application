import path from 'path';
import os from 'os';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Vercel's filesystem is read-only except for /tmp, so uploads must go there
// when running as a serverless function. Set UPLOAD_DIR to use object storage
// or another writable location in production.
const isServerless = Boolean(process.env.VERCEL);
export const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : isServerless
    ? path.join(os.tmpdir(), 'loanledger-uploads')
    : path.join(__dirname, 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
