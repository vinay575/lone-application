import { Router } from 'express';
import {
  insertUser,
  findUserByEmail,
  findUserByMobile,
  updateUser,
  insertNotification,
} from '../db.js';
import { hashPassword, verifyPassword, signToken } from '../auth.js';
import { requireAuth, publicUser, validate } from '../middleware.js';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const body = req.body || {};
    const errors = validate(body, {
      fullName: { required: true, message: 'Full name is required.' },
      mobile: { required: true, type: 'mobile' },
      email: { required: true, type: 'email' },
      password: { required: true, type: 'password', min: 8 },
    });
    if (Object.keys(errors).length) {
      return res.status(400).json({ error: 'Please fix the highlighted fields.', fields: errors });
    }
    const email = String(body.email).trim().toLowerCase();
    const mobile = String(body.mobile).replace(/\s+/g, '');
    if (await findUserByEmail(email)) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }
    if (await findUserByMobile(mobile)) {
      return res.status(409).json({ error: 'An account with this mobile number already exists.' });
    }
    const user = await insertUser({
      fullName: String(body.fullName).trim(),
      mobile,
      email,
      passwordHash: hashPassword(String(body.password)),
      role: 'customer',
      isDemo: true,
      plansUnlocked: [],
    });
    await insertNotification({
      userId: user.id,
      title: 'Welcome to LoanLedger',
      body: 'Your account is ready. Start an application and track every update from your dashboard.',
    });
    const token = signToken(user);
    res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'An account with this email or mobile already exists.' });
    }
    console.error('register error', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const body = req.body || {};
    const errors = validate(body, {
      email: { required: true, type: 'email' },
      password: { required: true },
    });
    if (Object.keys(errors).length) {
      return res.status(400).json({ error: 'Please fix the highlighted fields.', fields: errors });
    }
    const email = String(body.email).trim().toLowerCase();
    const user = await findUserByEmail(email);
    if (!user || !verifyPassword(String(body.password), user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    const token = signToken(user);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    console.error('login error', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

router.put('/me', async (req, res) => {
  try {
    const body = req.body || {};
    const errors = validate(body, {
      fullName: { required: true },
      mobile: { required: true, type: 'mobile' },
      email: { required: true, type: 'email' },
    });
    if (Object.keys(errors).length) {
      return res.status(400).json({ error: 'Please fix the highlighted fields.', fields: errors });
    }
    const email = String(body.email).trim().toLowerCase();
    const clash = await findUserByEmail(email);
    if (clash && clash.id !== req.user.id) {
      return res.status(409).json({ error: 'Email already in use.' });
    }
    const mobile = String(body.mobile).replace(/\s+/g, '');
    const mobileClash = await findUserByMobile(mobile);
    if (mobileClash && mobileClash.id !== req.user.id) {
      return res.status(409).json({ error: 'Mobile number already in use.' });
    }
    const user = await updateUser(req.user.id, {
      fullName: String(body.fullName).trim(),
      mobile,
      email,
    });
    res.json({ user: publicUser(user) });
  } catch (err) {
    console.error('profile update error', err);
    res.status(500).json({ error: 'Profile update failed.' });
  }
});

export default router;
