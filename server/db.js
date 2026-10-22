import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error(
    'DATABASE_URL is not set. Copy .env.example to .env and add your TiDB/MySQL connection string.'
  );
  process.exit(1);
}

const parsed = new URL(DATABASE_URL);

export const pool = mysql.createPool({
  host: parsed.hostname,
  port: Number(parsed.port || 3306),
  user: decodeURIComponent(parsed.username),
  password: decodeURIComponent(parsed.password),
  database: parsed.pathname.replace(/^\//, '') || 'sys',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 20000,
  // TiDB Cloud requires TLS; validate certificates against system CAs.
  ssl: { rejectUnauthorized: true },
  timezone: 'Z',
  dateStrings: false,
  // Keep idle connections alive and recycle them before the remote
  // server/firewall drops them, which otherwise surfaces as ECONNRESET.
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  maxIdle: 4,
  idleTimeout: 60000,
});

pool.on('error', (err) => {
  console.error('MySQL pool error:', err.code || err.message);
});

export const APP_STATUSES = [
  'Draft',
  'Submitted',
  'Under Review',
  'Additional Information Required',
  'Completed',
];

export const now = () => new Date();

/* ----------------------------- query helpers ----------------------------- */

const RETRIABLE_CODES = new Set([
  'ECONNRESET',
  'ECONNREFUSED',
  'ETIMEDOUT',
  'PROTOCOL_CONNECTION_LOST',
  'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR',
]);

async function query(sql, params = []) {
  try {
    return await pool.query(sql, params);
  } catch (err) {
    // Dead pooled connection (idle timeout / server dropped it) — retry once
    // on a fresh connection. Never retry writes: a statement that actually
    // committed before the connection died could be applied twice.
    if (!err || (!err.fatal && !RETRIABLE_CODES.has(err.code))) throw err;
    if (!/^\s*(select|show|desc|explain)\b/i.test(String(sql))) throw err;
    return await pool.query(sql, params);
  }
}

export async function many(sql, params = []) {
  const [rows] = await query(sql, params);
  return rows;
}

export async function one(sql, params = []) {
  const [rows] = await query(sql, params);
  return rows[0] || null;
}

export async function run(sql, params = []) {
  const [result] = await query(sql, params);
  return result;
}

export function toJson(value) {
  return value === undefined || value === null ? null : JSON.stringify(value);
}

export function fromJson(value, fallback = null) {
  if (value === undefined || value === null) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

/* ------------------------------- schema ---------------------------------- */

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  mobile VARCHAR(15) NOT NULL,
  email VARCHAR(160) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'customer',
  is_demo TINYINT(1) NOT NULL DEFAULT 1,
  plans_unlocked JSON NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  UNIQUE KEY uniq_users_email (email),
  UNIQUE KEY uniq_users_mobile (mobile)
);

CREATE TABLE IF NOT EXISTS plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(10) NOT NULL,
  name VARCHAR(160) NOT NULL,
  max_amount INT NOT NULL,
  demo_unlock_amount INT NOT NULL,
  tenure_months INT NOT NULL DEFAULT 6,
  demo_rate_label VARCHAR(160) NOT NULL DEFAULT '',
  summary TEXT NULL,
  features JSON NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  is_demo TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  UNIQUE KEY uniq_plans_code (code)
);

CREATE TABLE IF NOT EXISTS applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ref_number VARCHAR(40) NOT NULL,
  user_id INT NOT NULL,
  status VARCHAR(48) NOT NULL DEFAULT 'Draft',
  plan_code VARCHAR(10) NULL,
  personal JSON NULL,
  address JSON NULL,
  employment JSON NULL,
  loan JSON NULL,
  documents JSON NULL,
  internal_notes JSON NULL,
  history JSON NULL,
  submitted_at DATETIME(3) NULL,
  is_demo TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  UNIQUE KEY uniq_apps_ref (ref_number),
  KEY idx_apps_user (user_id),
  KEY idx_apps_status (status)
);

CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  application_id INT NULL,
  plan_code VARCHAR(10) NULL,
  amount INT NOT NULL DEFAULT 0,
  method VARCHAR(60) NOT NULL DEFAULT 'UPI (Sandbox)',
  status VARCHAR(40) NOT NULL DEFAULT 'Completed',
  description VARCHAR(255) NULL,
  is_demo TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  KEY idx_payments_user (user_id)
);

CREATE TABLE IF NOT EXISTS chatbot_responses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  keywords JSON NULL,
  response TEXT NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  is_demo TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  KEY idx_notif_user (user_id)
);

CREATE TABLE IF NOT EXISTS settings (
  skey VARCHAR(60) PRIMARY KEY,
  svalue JSON NOT NULL,
  updated_at DATETIME(3) NOT NULL
);
`;

export async function initSchema() {
  // Support tickets, contact messages and FAQs are no longer stored —
  // drop the legacy tables if an older database still has them.
  for (const legacy of ['tickets', 'contact_messages', 'faqs']) {
    await pool.query(`DROP TABLE IF EXISTS ${legacy}`);
  }
  const statements = SCHEMA.split(';')
    .map((s) => s.trim())
    .filter(Boolean);
  for (const stmt of statements) {
    await pool.query(stmt);
  }
}

/* ------------------------------- mappers --------------------------------- */

export const mapUser = (r) =>
  r && {
    id: r.id,
    fullName: r.full_name,
    mobile: r.mobile,
    email: r.email,
    passwordHash: r.password_hash,
    role: r.role,
    isDemo: Boolean(r.is_demo),
    plansUnlocked: fromJson(r.plans_unlocked, []),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };

export const mapPlan = (r) =>
  r && {
    id: r.id,
    code: r.code,
    name: r.name,
    maxAmount: r.max_amount,
    demoUnlockAmount: r.demo_unlock_amount,
    tenureMonths: r.tenure_months,
    demoRateLabel: r.demo_rate_label,
    summary: r.summary,
    features: fromJson(r.features, []),
    active: Boolean(r.active),
    sort: r.sort_order,
    isDemo: Boolean(r.is_demo),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };

export const mapApplication = (r) =>
  r && {
    id: r.id,
    refNumber: r.ref_number,
    userId: r.user_id,
    status: r.status,
    planCode: r.plan_code,
    personal: fromJson(r.personal, {}),
    address: fromJson(r.address, {}),
    employment: fromJson(r.employment, {}),
    loan: fromJson(r.loan, {}),
    documents: fromJson(r.documents, { pan: { uploaded: false }, aadhaar: { uploaded: false }, photo: { uploaded: false } }),
    internalNotes: fromJson(r.internal_notes, []),
    history: fromJson(r.history, []),
    submittedAt: r.submitted_at,
    isDemo: Boolean(r.is_demo),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };

export const mapPayment = (r) =>
  r && {
    id: r.id,
    userId: r.user_id,
    applicationId: r.application_id,
    planCode: r.plan_code,
    amount: r.amount,
    method: r.method,
    status: r.status,
    description: r.description,
    isDemo: Boolean(r.is_demo),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };

export const mapChat = (r) =>
  r && {
    id: r.id,
    keywords: fromJson(r.keywords, []),
    response: r.response,
    active: Boolean(r.active),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };

export const mapNotification = (r) =>
  r && {
    id: r.id,
    userId: r.user_id,
    title: r.title,
    body: r.body,
    read: Boolean(r.is_read),
    isDemo: Boolean(r.is_demo),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };

/* -------------------------------- users ---------------------------------- */

export async function insertUser({ fullName, mobile, email, passwordHash, role = 'customer', isDemo = true, plansUnlocked = [] }) {
  const t = now();
  const [result] = await query(
    `INSERT INTO users (full_name, mobile, email, password_hash, role, is_demo, plans_unlocked, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [fullName, mobile, email, passwordHash, role, isDemo ? 1 : 0, toJson(plansUnlocked), t, t]
  );
  return findUserById(result.insertId);
}

export async function findUserById(id) {
  return mapUser(await one('SELECT * FROM users WHERE id = ?', [id]));
}

export async function findUserByEmail(email) {
  return mapUser(await one('SELECT * FROM users WHERE email = ?', [String(email).toLowerCase()]));
}

export async function findUserByMobile(mobile) {
  return mapUser(await one('SELECT * FROM users WHERE mobile = ?', [mobile]));
}

export async function listUsers(q = '') {
  const rows = q
    ? await many(
        `SELECT * FROM users WHERE LOWER(full_name) LIKE ? OR LOWER(email) LIKE ? OR mobile LIKE ?
         ORDER BY created_at DESC LIMIT 500`,
        [`%${q}%`, `%${q}%`, `%${q}%`]
      )
    : await many('SELECT * FROM users ORDER BY created_at DESC LIMIT 500');
  return rows.map(mapUser);
}

export async function updateUser(id, patch) {
  const sets = [];
  const params = [];
  const cols = {
    fullName: 'full_name',
    mobile: 'mobile',
    email: 'email',
    passwordHash: 'password_hash',
    role: 'role',
    plansUnlocked: 'plans_unlocked',
  };
  for (const [key, col] of Object.entries(cols)) {
    if (patch[key] !== undefined) {
      sets.push(`${col} = ?`);
      params.push(key === 'plansUnlocked' ? toJson(patch[key]) : patch[key]);
    }
  }
  if (!sets.length) return findUserById(id);
  sets.push('updated_at = ?');
  params.push(now(), id);
  await run(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, params);
  return findUserById(id);
}

/* -------------------------------- plans ---------------------------------- */

export async function listPlans({ activeOnly = false } = {}) {
  // Public plan list is always shown low-to-high by demo loan amount.
  const rows = activeOnly
    ? await many('SELECT * FROM plans WHERE active = 1 ORDER BY max_amount ASC, id ASC')
    : await many('SELECT * FROM plans ORDER BY max_amount ASC, id ASC');
  return rows.map(mapPlan);
}

export async function findPlanById(id) {
  return mapPlan(await one('SELECT * FROM plans WHERE id = ?', [id]));
}

export async function findPlanByCode(code) {
  return mapPlan(await one('SELECT * FROM plans WHERE code = ? AND active = 1', [code]));
}

export async function insertPlan(p) {
  const t = now();
  const [result] = await query(
    `INSERT INTO plans (code, name, max_amount, demo_unlock_amount, tenure_months, demo_rate_label, summary, features, active, sort_order, is_demo, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    [
      p.code,
      p.name,
      p.maxAmount,
      p.demoUnlockAmount,
      p.tenureMonths ?? 6,
      p.demoRateLabel ?? '',
      p.summary ?? '',
      toJson(p.features ?? []),
      p.active === false ? 0 : 1,
      p.sort ?? 0,
      t,
      t,
    ]
  );
  return findPlanById(result.insertId);
}

export async function updatePlan(id, patch) {
  const sets = [];
  const params = [];
  const cols = {
    name: 'name',
    maxAmount: 'max_amount',
    demoUnlockAmount: 'demo_unlock_amount',
    tenureMonths: 'tenure_months',
    demoRateLabel: 'demo_rate_label',
    summary: 'summary',
    features: 'features',
    active: 'active',
    sort: 'sort_order',
  };
  for (const [key, col] of Object.entries(cols)) {
    if (patch[key] !== undefined) {
      sets.push(`${col} = ?`);
      if (key === 'features') params.push(toJson(patch[key]));
      else if (key === 'active') params.push(patch[key] ? 1 : 0);
      else params.push(patch[key]);
    }
  }
  if (!sets.length) return findPlanById(id);
  sets.push('updated_at = ?');
  params.push(now(), id);
  await run(`UPDATE plans SET ${sets.join(', ')} WHERE id = ?`, params);
  return findPlanById(id);
}

export async function deletePlan(id) {
  const result = await run('DELETE FROM plans WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

/* ----------------------------- applications ------------------------------ */

export async function insertApplication(app) {
  const t = now();
  // Unique per-row placeholder: the ref column is UNIQUE, so a constant
  // 'PLACEHOLDER' makes concurrent creates collide with ER_DUP_ENTRY.
  const placeholder = `TMP-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const [result] = await query(
    `INSERT INTO applications (ref_number, user_id, status, plan_code, personal, address, employment, loan, documents, internal_notes, history, submitted_at, is_demo, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      placeholder,
      app.userId,
      app.status ?? 'Draft',
      app.planCode ?? null,
      toJson(app.personal ?? {}),
      toJson(app.address ?? {}),
      toJson(app.employment ?? {}),
      toJson(app.loan ?? {}),
      toJson(app.documents ?? {}),
      toJson(app.internalNotes ?? []),
      toJson(app.history ?? []),
      app.submittedAt ?? null,
      app.isDemo === false ? 0 : 1,
      t,
      t,
    ]
  );
  const id = result.insertId;
  const refNumber = `LN-${new Date().getFullYear()}-${String(id).padStart(5, '0')}`;
  await run('UPDATE applications SET ref_number = ? WHERE id = ?', [refNumber, id]);
  return findApplicationById(id);
}

export async function findApplicationById(id) {
  return mapApplication(await one('SELECT * FROM applications WHERE id = ?', [id]));
}

export async function findApplicationByRef(refNumber) {
  return mapApplication(
    await one('SELECT * FROM applications WHERE ref_number = ?', [String(refNumber).toUpperCase()])
  );
}

export async function listApplicationsByUser(userId) {
  const rows = await many('SELECT * FROM applications WHERE user_id = ? ORDER BY created_at DESC', [userId]);
  return rows.map(mapApplication);
}

export async function listApplications({ q = '', status = '' } = {}) {
  const like = `%${q.toLowerCase()}%`;
  const rows = await many(
    `SELECT a.*, u.full_name AS owner_name, u.email AS owner_email
     FROM applications a LEFT JOIN users u ON u.id = a.user_id
     WHERE (? = '' OR LOWER(a.ref_number) LIKE ? OR LOWER(u.full_name) LIKE ? OR LOWER(u.email) LIKE ?)
       AND (? = '' OR a.status = ?)
     ORDER BY a.created_at DESC LIMIT 500`,
    [q, like, like, like, status, status]
  );
  return rows.map((r) => {
    const app = mapApplication(r);
    return {
      id: app.id,
      userId: app.userId,
      refNumber: app.refNumber,
      status: app.status,
      planCode: app.planCode,
      isDemo: app.isDemo,
      requestedAmount: app.loan?.requestedAmount,
      applicant: r.owner_name || 'Unknown',
      email: r.owner_email,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
      docsComplete: ['pan', 'aadhaar', 'photo'].every((d) => app.documents?.[d]?.uploaded),
    };
  });
}

export async function updateApplication(id, patch) {
  const sets = [];
  const params = [];
  const jsonCols = ['personal', 'address', 'employment', 'loan', 'documents', 'internal_notes', 'history'];
  const cols = {
    status: 'status',
    planCode: 'plan_code',
    personal: 'personal',
    address: 'address',
    employment: 'employment',
    loan: 'loan',
    documents: 'documents',
    internalNotes: 'internal_notes',
    history: 'history',
    submittedAt: 'submitted_at',
  };
  for (const [key, col] of Object.entries(cols)) {
    if (patch[key] !== undefined) {
      sets.push(`${col} = ?`);
      params.push(jsonCols.includes(col) ? toJson(patch[key]) : patch[key]);
    }
  }
  if (!sets.length) return findApplicationById(id);
  sets.push('updated_at = ?');
  params.push(now(), id);
  await run(`UPDATE applications SET ${sets.join(', ')} WHERE id = ?`, params);
  return findApplicationById(id);
}

/* -------------------------------- payments -------------------------------- */

export async function insertPayment(p) {
  const t = now();
  const [result] = await query(
    `INSERT INTO payments (user_id, application_id, plan_code, amount, method, status, description, is_demo, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    [p.userId, p.applicationId ?? null, p.planCode ?? null, p.amount ?? 0, p.method ?? 'UPI (Sandbox)', p.status ?? 'Completed', p.description ?? '', t, t]
  );
  return mapPayment(await one('SELECT * FROM payments WHERE id = ?', [result.insertId]));
}

export async function listPaymentsByUser(userId) {
  const rows = await many('SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC', [userId]);
  return rows.map(mapPayment);
}

export async function listAllPayments() {
  const rows = await many(
    `SELECT p.*, u.full_name AS owner_name, u.email AS owner_email, a.ref_number
     FROM payments p
     LEFT JOIN users u ON u.id = p.user_id
     LEFT JOIN applications a ON a.id = p.application_id
     ORDER BY p.created_at DESC LIMIT 500`
  );
  return rows.map((r) => ({
    ...mapPayment(r),
    customer: r.owner_name || 'Unknown',
    email: r.owner_email,
    refNumber: r.ref_number,
  }));
}

export async function listPaymentsForApplication(applicationId) {
  const rows = await many('SELECT * FROM payments WHERE application_id = ? ORDER BY created_at DESC', [applicationId]);
  return rows.map(mapPayment);
}

/* ----------------------------- chatbot entries ---------------------------- */

export async function listChatbot({ activeOnly = false } = {}) {
  const rows = activeOnly
    ? await many('SELECT * FROM chatbot_responses WHERE active = 1 ORDER BY id')
    : await many('SELECT * FROM chatbot_responses ORDER BY id');
  return rows.map(mapChat);
}

export async function findChatById(id) {
  return mapChat(await one('SELECT * FROM chatbot_responses WHERE id = ?', [id]));
}

export async function insertChat({ keywords, response, active = true }) {
  const t = now();
  const [result] = await query(
    'INSERT INTO chatbot_responses (keywords, response, active, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
    [toJson(keywords), response, active ? 1 : 0, t, t]
  );
  return findChatById(result.insertId);
}

export async function updateChat(id, patch) {
  const sets = [];
  const params = [];
  if (patch.keywords !== undefined) { sets.push('keywords = ?'); params.push(toJson(patch.keywords)); }
  if (patch.response !== undefined) { sets.push('response = ?'); params.push(patch.response); }
  if (patch.active !== undefined) { sets.push('active = ?'); params.push(patch.active ? 1 : 0); }
  if (!sets.length) return findChatById(id);
  sets.push('updated_at = ?');
  params.push(now(), id);
  await run(`UPDATE chatbot_responses SET ${sets.join(', ')} WHERE id = ?`, params);
  return findChatById(id);
}

export async function deleteChat(id) {
  const result = await run('DELETE FROM chatbot_responses WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

/* ----------------------------- notifications ------------------------------ */

export async function insertNotification({ userId, title, body, read = false, isDemo = true }) {
  const t = now();
  const [result] = await query(
    `INSERT INTO notifications (user_id, title, body, is_read, is_demo, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [userId, title, body, read ? 1 : 0, isDemo ? 1 : 0, t, t]
  );
  return mapNotification(await one('SELECT * FROM notifications WHERE id = ?', [result.insertId]));
}

export async function listNotificationsByUser(userId) {
  const rows = await many('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 100', [userId]);
  return rows.map(mapNotification);
}

export async function markNotificationsRead(userId) {
  await run('UPDATE notifications SET is_read = 1, updated_at = ? WHERE user_id = ?', [now(), userId]);
}

/* -------------------------------- settings -------------------------------- */

export const DEFAULT_SETTINGS = {
  company: {
    name: 'LoanLedger',
    tagline: 'Fast, transparent personal loans with a fully digital journey.',
    email: 'LoanLedger@gmail.com',
    phone: '',
    supportHours: 'Mon - Sat, 10:00 AM - 6:00 PM (IST)',
    address: 'Set your office address in Admin > Settings',
    website: 'https://loanledger.demo',
  },
  demo: { chatbotEnabled: true },
};

export async function getSettings() {
  const row = await one('SELECT svalue FROM settings WHERE skey = ?', ['app']);
  if (!row) return structuredClone(DEFAULT_SETTINGS);
  return { ...structuredClone(DEFAULT_SETTINGS), ...fromJson(row.svalue, {}) };
}

export async function saveSettings(settings) {
  const t = now();
  await run(
    `INSERT INTO settings (skey, svalue, updated_at) VALUES ('app', ?, ?)
     ON DUPLICATE KEY UPDATE svalue = VALUES(svalue), updated_at = VALUES(updated_at)`,
    [toJson(settings), t]
  );
  return settings;
}

/* --------------------------------- stats ---------------------------------- */

export async function adminStats() {
  const [[counts]] = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM users) AS users,
      (SELECT COUNT(*) FROM users WHERE role = 'customer') AS customers,
      (SELECT COUNT(*) FROM applications) AS applications,
      (SELECT COUNT(*) FROM payments) AS payments,
      (SELECT COALESCE(SUM(amount), 0) FROM payments) AS simulated_revenue
  `);
  const statusRows = await many('SELECT status, COUNT(*) AS c FROM applications GROUP BY status');
  const byStatus = Object.fromEntries(APP_STATUSES.map((s) => [s, 0]));
  statusRows.forEach((r) => {
    byStatus[r.status] = Number(r.c);
  });
  return {
    demoNotice: 'Sandbox environment - payment records are created by the simulated gateway; no live funds are captured.',
    users: Number(counts.users),
    customers: Number(counts.customers),
    applications: Number(counts.applications),
    payments: Number(counts.payments),
    simulatedRevenue: Number(counts.simulated_revenue),
    byStatus,
  };
}
