import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  findApplicationById,
  listApplicationsByUser,
  insertApplication,
  updateApplication,
  listPaymentsByUser,
  insertPayment,
  insertNotification,
  listNotificationsByUser,
  markNotificationsRead,
  findUserById,
  updateUser,
  findPlanByCode,
} from '../db.js';
import { requireAuth, validate } from '../middleware.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const DOC_FIELDS = ['pan', 'aadhaar', 'photo'];
const ALLOWED_EXT = new Set(['.png', '.jpg', '.jpeg', '.pdf', '.txt', '.webp']);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(UPLOAD_DIR, String(req.user.id));
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^\w.\-]/g, '_').slice(-60);
    cb(null, `${Date.now()}-${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024, files: 3 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (!ALLOWED_EXT.has(ext)) {
      return cb(new Error('Only PNG, JPG, WEBP, PDF or TXT files up to 2 MB are allowed.'));
    }
    cb(null, true);
  },
});

const router = Router();
router.use(requireAuth);

async function ownedApplication(req) {
  const app = await findApplicationById(req.params.id);
  if (!app || app.userId !== req.user.id) return null;
  return app;
}

function sanitizeApplication(app) {
  if (!app) return app;
  const { internalNotes, ...rest } = app;
  return rest;
}

/* ------------------------------ Applications ----------------------------- */

router.get('/applications', async (req, res) => {
  try {
    const apps = await listApplicationsByUser(req.user.id);
    res.json({ applications: apps.map(sanitizeApplication) });
  } catch (err) {
    console.error('list applications error', err);
    res.status(500).json({ error: 'Could not load applications.' });
  }
});

router.get('/applications/:id', async (req, res) => {
  try {
    const app = await ownedApplication(req);
    if (!app) return res.status(404).json({ error: 'Application not found.' });
    res.json({ application: sanitizeApplication(app) });
  } catch (err) {
    console.error('get application error', err);
    res.status(500).json({ error: 'Could not load the application.' });
  }
});

const EMPLOYMENT = ['Salaried', 'Self-Employed', 'Business Owner', 'Student', 'Other'];

router.post('/applications', async (req, res) => {
  try {
    const body = req.body || {};
    const errors = validate(body, {
      planCode: { required: true, type: 'enum', values: ['A', 'B', 'C'] },
    });
    if (Object.keys(errors).length) {
      return res.status(400).json({ error: 'Please fix the highlighted fields.', fields: errors });
    }
    const plan = await findPlanByCode(body.planCode);
    if (!plan) return res.status(400).json({ error: 'Selected plan is not available.' });

    const app = await insertApplication({
      userId: req.user.id,
      status: 'Draft',
      planCode: plan.code,
      personal: {},
      address: {},
      employment: {},
      loan: {},
      documents: { pan: { uploaded: false }, aadhaar: { uploaded: false }, photo: { uploaded: false } },
      internalNotes: [],
      history: [{ status: 'Draft', at: new Date().toISOString(), note: 'Draft created' }],
      isDemo: true,
    });
    res.status(201).json({ application: sanitizeApplication(app) });
  } catch (err) {
    console.error('create application error', err);
    res.status(500).json({ error: 'Could not create the application.' });
  }
});

router.put('/applications/:id', async (req, res) => {
  try {
    const app = await ownedApplication(req);
    if (!app) return res.status(404).json({ error: 'Application not found.' });
    if (app.status !== 'Draft' && app.status !== 'Additional Information Required') {
      return res.status(400).json({ error: 'This application can no longer be edited.' });
    }
    const body = req.body || {};
    const errors = {};

    if (body.personal) {
      Object.assign(
        errors,
        validate(body.personal, {
          fullName: { required: true },
          dob: { required: true, type: 'date' },
          gender: { required: true },
          mobile: { required: true, type: 'mobile' },
          email: { required: true, type: 'email' },
        })
      );
    }
    if (body.address) {
      Object.assign(
        errors,
        validate(body.address, {
          line1: { required: true },
          city: { required: true },
          state: { required: true },
          pincode: { required: true, type: 'pincode' },
        })
      );
    }
    if (body.employment) {
      Object.assign(
        errors,
        validate(body.employment, {
          type: { required: true, type: 'enum', values: EMPLOYMENT },
          monthlyIncome: { required: true, type: 'number', min: 0 },
        })
      );
    }
    if (body.loan) {
      Object.assign(
        errors,
        validate(body.loan, {
          requestedAmount: { required: true, type: 'number', min: 1000, max: 1000000 },
          purpose: { required: true },
        })
      );
    }
    if (Object.keys(errors).length) {
      return res.status(400).json({ error: 'Please fix the highlighted fields.', fields: errors });
    }

    const patch = {};
    if (body.personal) patch.personal = { ...app.personal, ...body.personal };
    if (body.address) patch.address = { ...app.address, ...body.address };
    if (body.employment) patch.employment = { ...app.employment, ...body.employment };
    if (body.loan) patch.loan = { ...app.loan, ...body.loan };
    if (typeof body.planCode === 'string' && ['A', 'B', 'C'].includes(body.planCode)) {
      patch.planCode = body.planCode;
    }
    const updated = await updateApplication(app.id, patch);
    res.json({ application: sanitizeApplication(updated) });
  } catch (err) {
    console.error('update application error', err);
    res.status(500).json({ error: 'Could not update the application.' });
  }
});

router.post('/applications/:id/submit', async (req, res) => {
  try {
    const app = await ownedApplication(req);
    if (!app) return res.status(404).json({ error: 'Application not found.' });
    if (app.status !== 'Draft' && app.status !== 'Additional Information Required') {
      return res.status(400).json({ error: 'Application already submitted.' });
    }

    const errors = {};
    Object.assign(
      errors,
      validate(app.personal, {
        fullName: { required: true },
        dob: { required: true },
        mobile: { required: true, type: 'mobile' },
        email: { required: true, type: 'email' },
      }),
      validate(app.address, {
        line1: { required: true },
        city: { required: true },
        state: { required: true },
        pincode: { required: true, type: 'pincode' },
      }),
      validate(app.employment, { type: { required: true }, monthlyIncome: { required: true } }),
      validate(app.loan, { requestedAmount: { required: true }, purpose: { required: true } })
    );
    const missingDocs = DOC_FIELDS.filter((f) => !app.documents?.[f]?.uploaded);
    if (missingDocs.length) {
      errors.documents = `Please upload the required documents: ${missingDocs.join(', ')}.`;
    }
    if (Object.keys(errors).length) {
      return res.status(400).json({ error: 'Application is incomplete.', fields: errors });
    }

    const submittedAt = new Date();
    const history = [
      ...(app.history || []),
      { status: 'Submitted', at: submittedAt.toISOString(), note: 'Application submitted' },
    ];
    const updated = await updateApplication(app.id, {
      status: 'Submitted',
      submittedAt,
      history,
    });
    await insertNotification({
      userId: req.user.id,
      title: 'Application submitted',
      body: `Reference ${app.refNumber} has been submitted and is now queued for review. Track every update on your dashboard.`,
    });
    res.json({ application: sanitizeApplication(updated) });
  } catch (err) {
    console.error('submit application error', err);
    res.status(500).json({ error: 'Could not submit the application.' });
  }
});

router.post('/applications/:id/documents', (req, res, next) => {
  upload.fields(DOC_FIELDS.map((name) => ({ name, maxCount: 1 })))(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, async (req, res) => {
  try {
    const app = await ownedApplication(req);
    if (!app) return res.status(404).json({ error: 'Application not found.' });
    if (['Submitted', 'Under Review', 'Completed', 'Demo Completed'].includes(app.status)) {
      return res.status(400).json({ error: 'Documents can only be changed while a draft is open.' });
    }
    const files = req.files || {};
    const uploaded = [];
    const documents = { ...(app.documents || {}) };
    for (const field of DOC_FIELDS) {
      const f = files[field]?.[0];
      if (!f) continue;
      documents[field] = {
        uploaded: true,
        fileName: f.filename,
        originalName: f.originalname,
        size: f.size,
        demo: true,
        note: 'Stored securely - never shared without consent',
        uploadedAt: new Date().toISOString(),
      };
      uploaded.push(field);
    }
    const updated = await updateApplication(app.id, { documents });
    res.json({ application: sanitizeApplication(updated), uploaded });
  } catch (err) {
    console.error('document upload error', err);
    res.status(500).json({ error: 'Could not store the documents.' });
  }
});

/* -------------------------- Simulated payments --------------------------- */

router.post('/payments/simulate', async (req, res) => {
  try {
    const { applicationId, planCode } = req.body || {};
    const app = await findApplicationById(applicationId);
    if (!app || app.userId !== req.user.id) {
      return res.status(404).json({ error: 'Application not found.' });
    }
    const plan = await findPlanByCode(planCode || app.planCode);
    if (!plan) return res.status(400).json({ error: 'Selected plan is not available.' });

    const methodLabel = ['upi', 'netbanking', 'card'].includes(String(req.body?.method))
      ? { upi: 'UPI', netbanking: 'Net Banking', card: 'Card' }[String(req.body.method)]
      : 'UPI';

    const payment = await insertPayment({
      userId: req.user.id,
      applicationId: app.id,
      planCode: plan.code,
      amount: plan.demoUnlockAmount,
      method: `${methodLabel} (Sandbox)`,
      status: 'Completed',
      description: `Processing fee for ${plan.name}`,
    });

    await updateApplication(app.id, { planCode: plan.code });
    const user = await findUserById(req.user.id);
    await updateUser(user.id, {
      plansUnlocked: Array.from(new Set([...(user.plansUnlocked || []), plan.code])),
    });
    await insertNotification({
      userId: req.user.id,
      title: 'Payment received',
      body: `Your payment for ${plan.name} has been received and the plan is now active in your dashboard.`,
    });
    res.status(201).json({
      payment,
      plan,
      receipt: payment.refNumber || payment.reference || `PY-${payment.id}`,
      notice: 'Payment recorded in sandbox mode - no live funds were transferred.',
    });
  } catch (err) {
    console.error('simulate payment error', err);
    res.status(500).json({ error: 'Could not record the payment.' });
  }
});

router.get('/payments', async (req, res) => {
  try {
    res.json({ payments: await listPaymentsByUser(req.user.id) });
  } catch (err) {
    console.error('list payments error', err);
    res.status(500).json({ error: 'Could not load payments.' });
  }
});

/* ----------------------------- Notifications ----------------------------- */

router.get('/notifications', async (req, res) => {
  try {
    res.json({ notifications: await listNotificationsByUser(req.user.id) });
  } catch (err) {
    console.error('list notifications error', err);
    res.status(500).json({ error: 'Could not load notifications.' });
  }
});

router.post('/notifications/read-all', async (req, res) => {
  try {
    await markNotificationsRead(req.user.id);
    res.json({ ok: true });
  } catch (err) {
    console.error('mark read error', err);
    res.status(500).json({ error: 'Could not update notifications.' });
  }
});

export default router;
