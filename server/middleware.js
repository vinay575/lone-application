import { verifyToken } from './auth.js';
import { findUserById } from './db.js';

export function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    fullName: user.fullName,
    mobile: user.mobile,
    email: user.email,
    role: user.role,
    isDemo: Boolean(user.isDemo),
    plansUnlocked: user.plansUnlocked || [],
    createdAt: user.createdAt,
  };
}

async function authenticate(req, res) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: 'Authentication required.' });
    return false;
  }
  try {
    const payload = verifyToken(token);
    const user = await findUserById(payload.sub);
    if (!user) {
      res.status(401).json({ error: 'Account not found.' });
      return false;
    }
    req.user = user;
    return true;
  } catch {
    res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
    return false;
  }
}

export async function requireAuth(req, res, next) {
  if (await authenticate(req, res)) next();
}

export async function requireAdmin(req, res, next) {
  if (!(await authenticate(req, res))) return;
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
}

/** Simple server-side field validation helper. */
export function validate(body, rules) {
  const errors = {};
  for (const [field, rule] of Object.entries(rules)) {
    const value = body?.[field];
    if (rule.required) {
      const empty =
        value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
      if (empty) {
        errors[field] = rule.message || `${field} is required.`;
        continue;
      }
    }
    if (value === undefined || value === null || value === '') continue;
    if (rule.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
      errors[field] = rule.message || 'Enter a valid email address.';
    }
    if (rule.type === 'mobile' && !/^[6-9]\d{9}$/.test(String(value).replace(/\s+/g, ''))) {
      errors[field] = rule.message || 'Enter a valid 10-digit Indian mobile number.';
    }
    if (rule.type === 'password' && String(value).length < (rule.min || 8)) {
      errors[field] = rule.message || `Password must be at least ${rule.min || 8} characters.`;
    }
    if (rule.type === 'number') {
      const n = Number(value);
      if (Number.isNaN(n)) {
        errors[field] = rule.message || 'Enter a valid number.';
        continue;
      }
      if (rule.min !== undefined && n < rule.min) {
        errors[field] = rule.message || `Must be at least ${rule.min}.`;
      }
      if (rule.max !== undefined && n > rule.max) {
        errors[field] = rule.message || `Must be at most ${rule.max}.`;
      }
    }
    if (rule.type === 'date' && Number.isNaN(Date.parse(value))) {
      errors[field] = rule.message || 'Enter a valid date.';
    }
    if (rule.type === 'enum' && !rule.values.includes(value)) {
      errors[field] = rule.message || 'Invalid value.';
    }
    if (rule.type === 'pincode' && !/^\d{6}$/.test(String(value))) {
      errors[field] = rule.message || 'Enter a valid 6-digit PIN code.';
    }
  }
  return errors;
}
