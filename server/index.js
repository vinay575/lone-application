import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initSchema, findUserByEmail, insertUser, listUsers } from './db.js';
import { seed, randomPassword } from './seed.js';
import { hashPassword } from './auth.js';
import authRoutes from './routes/auth.js';
import publicRoutes from './routes/public.js';
import customerRoutes from './routes/customer.js';
import adminRoutes from './routes/admin.js';
import { requireAuth } from './middleware.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3001;
const UPLOAD_DIR = path.join(__dirname, 'uploads');

// Restrict cross-origin API access to known frontends. Requests without an
// Origin header (same-origin navigation, curl, mobile clients) are allowed.
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const app = express();
app.use(
  cors({
    origin: (origin, cb) => cb(null, !origin || ALLOWED_ORIGINS.includes(origin)),
  })
);
app.use(express.json({ limit: '1mb' }));

// Uploaded KYC documents are private: signed-in owner or admin only.
app.use(
  '/uploads',
  requireAuth,
  (req, res, next) => {
    if (req.user.role === 'admin') return next();
    let segs;
    try {
      segs = req.path
        .split('/')
        .filter(Boolean)
        .map((s) => decodeURIComponent(s));
    } catch {
      return res.status(400).json({ error: 'Bad path.' });
    }
    if (segs.includes('..') || segs[0] !== String(req.user.id)) {
      return res.status(403).json({ error: 'Access denied.' });
    }
    next();
  },
  express.static(UPLOAD_DIR)
);

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    sandbox: true,
    notice: 'LoanLedger API (sandbox mode). Payments are simulated and no live funds are captured.',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api', publicRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ error: 'Something went wrong.' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

/**
 * Creates the initial admin account from environment configuration.
 * - ADMIN_EMAIL / ADMIN_PASSWORD come from the environment (.env) only.
 * - If no password is provided, a strong random one is generated and printed ONCE.
 * - No production password is ever hardcoded in the repository.
 */
async function bootstrapAdmin() {
  const existing = await findUserByEmail((process.env.ADMIN_EMAIL || 'admin@loanledger.demo').toLowerCase());
  if (existing) return;

  const email = (process.env.ADMIN_EMAIL || 'admin@loanledger.demo').trim().toLowerCase();
  let password = process.env.ADMIN_PASSWORD || '';
  let generated = false;
  if (!password || password.length < 8) {
    password = randomPassword();
    generated = true;
  }

  await insertUser({
    fullName: 'Administrator',
    mobile: '9000000000',
    email,
    passwordHash: hashPassword(password),
    role: 'admin',
    isDemo: true,
    plansUnlocked: [],
  });

  console.log('\n----------------------------------------------');
  console.log(' Admin account created');
  console.log(`  Email:    ${email}`);
  if (generated) {
    console.log(`  Password: ${password}   (generated - set ADMIN_PASSWORD in .env to choose your own)`);
  } else {
    console.log('  Password: (the value you set in ADMIN_PASSWORD)');
  }
  console.log('  Change these before going live.');
  console.log('----------------------------------------------\n');
}

async function main() {
  await initSchema();
  await seed();
  await bootstrapAdmin();
  const users = await listUsers();
  console.log(`Database ready - ${users.length} user(s) present.`);
  app.listen(PORT, () => {
    console.log(`LoanLedger API listening on http://localhost:${PORT}`);
    console.log('Sandbox mode: payments are simulated and no live funds are captured.');
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
