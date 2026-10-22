import { Router } from 'express';
import {
  adminStats,
  listUsers,
  findUserById,
  listApplications,
  findApplicationById,
  findApplicationByRef,
  updateApplication,
  listPaymentsForApplication,
  listAllPayments,
  insertPlan,
  listPlans,
  findPlanById,
  updatePlan,
  deletePlan,
  insertNotification,
  listChatbot,
  findChatById,
  insertChat,
  updateChat,
  deleteChat,
  getSettings,
  saveSettings,
  APP_STATUSES,
} from '../db.js';
import { requireAdmin, publicUser, validate } from '../middleware.js';

const router = Router();
router.use(requireAdmin);

/* ------------------------------- Stats ----------------------------------- */

router.get('/stats', async (req, res) => {
  try {
    res.json(await adminStats());
  } catch (err) {
    console.error('admin stats error', err);
    res.status(500).json({ error: 'Could not load statistics.' });
  }
});

/* -------------------------------- Users ---------------------------------- */

router.get('/users', async (req, res) => {
  try {
    const q = String(req.query.q || '').toLowerCase();
    const users = await listUsers(q);
    const apps = await listApplications();
    const payments = await listAllPayments();
    res.json({
      users: users.map((u) => ({
        ...publicUser(u),
        applicationCount: apps.filter((a) => a.userId === u.id).length,
        paymentCount: payments.filter((p) => p.userId === u.id).length,
      })),
    });
  } catch (err) {
    console.error('admin users error', err);
    res.status(500).json({ error: 'Could not load users.' });
  }
});

/* ----------------------------- Applications ------------------------------ */

router.get('/applications', async (req, res) => {
  try {
    const q = String(req.query.q || '').toLowerCase();
    const status = String(req.query.status || '');
    const applications = await listApplications({ q, status });
    res.json({ applications });
  } catch (err) {
    console.error('admin applications error', err);
    res.status(500).json({ error: 'Could not load applications.' });
  }
});

router.get('/applications/by-ref/:ref', async (req, res) => {
  try {
    const app = await findApplicationByRef(req.params.ref);
    if (!app) return res.status(404).json({ error: 'No application matches that reference number.' });
    res.json({ applicationId: app.id });
  } catch (err) {
    console.error('by-ref error', err);
    res.status(500).json({ error: 'Lookup failed.' });
  }
});

router.get('/applications/:id', async (req, res) => {
  try {
    const app = await findApplicationById(req.params.id);
    if (!app) return res.status(404).json({ error: 'Application not found.' });
    const owner = await findUserById(app.userId);
    res.json({
      application: app,
      customer: publicUser(owner),
      payments: await listPaymentsForApplication(app.id),
    });
  } catch (err) {
    console.error('admin application detail error', err);
    res.status(500).json({ error: 'Could not load the application.' });
  }
});

router.patch('/applications/:id/status', async (req, res) => {
  try {
    const app = await findApplicationById(req.params.id);
    if (!app) return res.status(404).json({ error: 'Application not found.' });
    const { status, note, notify } = req.body || {};
    const errors = validate(req.body || {}, {
      status: { required: true, type: 'enum', values: APP_STATUSES },
    });
    if (Object.keys(errors).length) {
      return res.status(400).json({ error: 'Invalid status.', fields: errors });
    }
    const history = [
      ...(app.history || []),
      {
        status,
        at: new Date().toISOString(),
        note: String(note || '').slice(0, 500) || `Updated by ${req.user.email}`,
      },
    ];
    const internalNotes = note
      ? [
          ...(app.internalNotes || []),
          { by: req.user.email, text: String(note).slice(0, 1000), at: new Date().toISOString() },
        ]
      : app.internalNotes;
    const updated = await updateApplication(app.id, { status, history, internalNotes });
    if (notify !== false) {
      await insertNotification({
        userId: app.userId,
        title: `Application status: ${status}`,
        body: `Reference ${app.refNumber} is now "${status}". Track every update on your dashboard.`,
      });
    }
    res.json({ application: updated });
  } catch (err) {
    console.error('status update error', err);
    res.status(500).json({ error: 'Could not update the status.' });
  }
});

router.post('/applications/:id/notes', async (req, res) => {
  try {
    const app = await findApplicationById(req.params.id);
    if (!app) return res.status(404).json({ error: 'Application not found.' });
    const text = String(req.body?.text || '').trim();
    if (!text) return res.status(400).json({ error: 'Note text is required.' });
    const internalNotes = [
      ...(app.internalNotes || []),
      { by: req.user.email, text: text.slice(0, 1000), at: new Date().toISOString() },
    ];
    const updated = await updateApplication(app.id, { internalNotes });
    res.json({ application: updated });
  } catch (err) {
    console.error('add note error', err);
    res.status(500).json({ error: 'Could not add the note.' });
  }
});

/* -------------------------------- Plans ---------------------------------- */

router.get('/plans', async (req, res) => {
  try {
    res.json({ plans: await listPlans() });
  } catch (err) {
    console.error('admin plans error', err);
    res.status(500).json({ error: 'Could not load plans.' });
  }
});

router.post('/plans', async (req, res) => {
  try {
    const body = req.body || {};
    const errors = validate(body, {
      name: { required: true },
      maxAmount: { required: true, type: 'number', min: 1000 },
      demoUnlockAmount: { required: true, type: 'number', min: 0 },
      summary: { required: true },
    });
    if (Object.keys(errors).length) {
      return res.status(400).json({ error: 'Please fix the highlighted fields.', fields: errors });
    }
    const existing = await listPlans();
    const codes = existing.map((p) => p.code);
    let code = String(body.code || '').trim().toUpperCase();
    if (!code || codes.includes(code)) {
      let n = codes.length + 1;
      while (codes.includes(String.fromCharCode(64 + n))) n += 1;
      code = String.fromCharCode(64 + n);
    }
    const plan = await insertPlan({
      code,
      name: String(body.name).trim(),
      maxAmount: Number(body.maxAmount),
      demoUnlockAmount: Number(body.demoUnlockAmount),
      tenureMonths: Number(body.tenureMonths) || 6,
      demoRateLabel: String(body.demoRateLabel || 'Indicative rate'),
      summary: String(body.summary).trim(),
      features: Array.isArray(body.features) ? body.features.map(String).slice(0, 8) : [],
      active: body.active !== false,
      sort: Number(body.sort) || existing.length + 1,
    });
    res.status(201).json({ plan });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'A plan with that code already exists.' });
    }
    console.error('create plan error', err);
    res.status(500).json({ error: 'Could not create the plan.' });
  }
});

router.put('/plans/:id', async (req, res) => {
  try {
    const plan = await findPlanById(req.params.id);
    if (!plan) return res.status(404).json({ error: 'Plan not found.' });
    const body = req.body || {};
    const patch = {};
    if (body.name !== undefined && !String(body.name).trim()) {
      return res.status(400).json({ error: 'Plan name is required.' });
    }
    const numericRules = { maxAmount: 1000, demoUnlockAmount: 0, tenureMonths: 1, sort: 0 };
    for (const [key, min] of Object.entries(numericRules)) {
      if (body[key] === undefined) continue;
      const n = Number(body[key]);
      if (!Number.isFinite(n) || n < min) {
        return res.status(400).json({ error: `${key} must be a number of at least ${min}.` });
      }
    }
    if (body.name !== undefined) patch.name = String(body.name).trim();
    if (body.maxAmount !== undefined) patch.maxAmount = Number(body.maxAmount);
    if (body.demoUnlockAmount !== undefined) patch.demoUnlockAmount = Number(body.demoUnlockAmount);
    if (body.tenureMonths !== undefined) patch.tenureMonths = Number(body.tenureMonths);
    if (body.demoRateLabel !== undefined) patch.demoRateLabel = String(body.demoRateLabel);
    if (body.summary !== undefined) patch.summary = String(body.summary);
    if (body.features !== undefined && Array.isArray(body.features)) {
      patch.features = body.features.map(String).slice(0, 8);
    }
    if (body.active !== undefined) patch.active = Boolean(body.active);
    if (body.sort !== undefined) patch.sort = Number(body.sort);
    const updated = await updatePlan(plan.id, patch);
    res.json({ plan: updated });
  } catch (err) {
    console.error('update plan error', err);
    res.status(500).json({ error: 'Could not update the plan.' });
  }
});

router.delete('/plans/:id', async (req, res) => {
  try {
    const plan = await findPlanById(req.params.id);
    if (!plan) return res.status(404).json({ error: 'Plan not found.' });
    const apps = await listApplications();
    if (apps.some((a) => a.planCode === plan.code)) {
      return res
        .status(400)
        .json({ error: 'Plan is referenced by existing applications. Deactivate it instead.' });
    }
    const ok = await deletePlan(plan.id);
    if (!ok) return res.status(404).json({ error: 'Plan not found.' });
    res.json({ ok: true });
  } catch (err) {
    console.error('delete plan error', err);
    res.status(500).json({ error: 'Could not delete the plan.' });
  }
});

/* ------------------------------- Payments -------------------------------- */

router.get('/payments', async (req, res) => {
  try {
    const payments = await listAllPayments();
    res.json({ payments, note: 'All payment records run through the sandbox gateway - no live funds moved.' });
  } catch (err) {
    console.error('admin payments error', err);
    res.status(500).json({ error: 'Could not load payments.' });
  }
});

/* --------------------------- Notifications ------------------------------- */

router.post('/notifications', async (req, res) => {
  try {
    const body = req.body || {};
    const errors = validate(body, {
      userId: { required: true, type: 'number', min: 1 },
      title: { required: true },
      body: { required: true },
    });
    if (Object.keys(errors).length) {
      return res.status(400).json({ error: 'Please fix the highlighted fields.', fields: errors });
    }
    const target = await findUserById(Number(body.userId));
    if (!target) return res.status(404).json({ error: 'User not found.' });
    const notification = await insertNotification({
      userId: target.id,
      title: String(body.title).trim(),
      body: String(body.body).trim().slice(0, 500),
    });
    res.status(201).json({ notification });
  } catch (err) {
    console.error('send notification error', err);
    res.status(500).json({ error: 'Could not send the notification.' });
  }
});

/* ------------------------------- Chatbot KB ------------------------------ */

router.get('/chatbot', async (req, res) => {
  try {
    res.json({ entries: await listChatbot() });
  } catch (err) {
    console.error('admin chatbot error', err);
    res.status(500).json({ error: 'Could not load chatbot responses.' });
  }
});

router.post('/chatbot', async (req, res) => {
  try {
    const body = req.body || {};
    const keywords = Array.isArray(body.keywords) ? body.keywords.map(String).filter(Boolean) : [];
    if (!String(body.response || '').trim() || keywords.length === 0) {
      return res.status(400).json({ error: 'Provide at least one keyword and a response.' });
    }
    const entry = await insertChat({
      keywords: keywords.slice(0, 10),
      response: String(body.response).trim(),
      active: body.active !== false,
    });
    res.status(201).json({ entry });
  } catch (err) {
    console.error('create chatbot entry error', err);
    res.status(500).json({ error: 'Could not create the chatbot response.' });
  }
});

router.put('/chatbot/:id', async (req, res) => {
  try {
    const entry = await findChatById(req.params.id);
    if (!entry) return res.status(404).json({ error: 'Chatbot response not found.' });
    const body = req.body || {};
    const patch = {};
    if (Array.isArray(body.keywords)) patch.keywords = body.keywords.map(String).slice(0, 10);
    if (body.response !== undefined) patch.response = String(body.response);
    if (body.active !== undefined) patch.active = Boolean(body.active);
    res.json({ entry: await updateChat(entry.id, patch) });
  } catch (err) {
    console.error('update chatbot entry error', err);
    res.status(500).json({ error: 'Could not update the chatbot response.' });
  }
});

router.delete('/chatbot/:id', async (req, res) => {
  try {
    const ok = await deleteChat(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Chatbot response not found.' });
    res.json({ ok: true });
  } catch (err) {
    console.error('delete chatbot entry error', err);
    res.status(500).json({ error: 'Could not delete the chatbot response.' });
  }
});

/* ------------------------------- Settings -------------------------------- */

router.get('/settings', async (req, res) => {
  try {
    res.json({ settings: await getSettings() });
  } catch (err) {
    console.error('admin settings error', err);
    res.status(500).json({ error: 'Could not load settings.' });
  }
});

router.put('/settings', async (req, res) => {
  try {
    const body = req.body || {};
    const settings = await getSettings();
    if (body.company && typeof body.company === 'object') {
      for (const key of Object.keys(settings.company)) {
        if (body.company[key] !== undefined) {
          settings.company[key] = String(body.company[key]).slice(0, 300);
        }
      }
    }
    if (body.demo && typeof body.demo === 'object') {
      if (body.demo.chatbotEnabled !== undefined) {
        settings.demo.chatbotEnabled = Boolean(body.demo.chatbotEnabled);
      }
    }
    await saveSettings(settings);
    res.json({ settings });
  } catch (err) {
    console.error('save settings error', err);
    res.status(500).json({ error: 'Could not save settings.' });
  }
});

export default router;
