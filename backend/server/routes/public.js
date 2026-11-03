import { Router } from 'express';
import { listPlans, getSettings, listChatbot } from '../db.js';

const router = Router();

router.get('/plans', async (req, res) => {
  try {
    res.json({ plans: await listPlans({ activeOnly: true }) });
  } catch (err) {
    console.error('plans error', err);
    res.status(500).json({ error: 'Could not load loan plans.' });
  }
});

router.get('/settings/company', async (req, res) => {
  try {
    const settings = await getSettings();
    res.json({ company: settings.company });
  } catch (err) {
    console.error('settings error', err);
    res.status(500).json({ error: 'Could not load company settings.' });
  }
});

/** Keyword match against admin-configured chatbot responses. */
router.get('/chatbot/answer', async (req, res) => {
  try {
    const q = String(req.query.q || '').toLowerCase().trim();
    const settings = await getSettings();
    if (settings.demo?.chatbotEnabled === false) {
      return res.json({
        answer: 'The assistant is currently switched off by the administrator.',
        matched: false,
      });
    }
    if (!q) {
      return res.json({
        answer:
          'Hi! I am the LoanLedger assistant. Ask me about loan plans, application status, required documents or customer support.',
        matched: false,
      });
    }
    const responses = await listChatbot({ activeOnly: true });
    let best = null;
    let bestScore = 0;
    for (const r of responses) {
      const score = (r.keywords || []).reduce(
        (acc, k) => acc + (q.includes(String(k).toLowerCase()) ? String(k).length : 0),
        0
      );
      if (score > bestScore) {
        bestScore = score;
        best = r;
      }
    }
    if (best && bestScore > 0) {
      return res.json({ answer: best.response, matched: true });
    }
    res.json({
      answer:
        'I could not find an exact match. Try asking about loan plans, application status, required documents, or customer support.',
      matched: false,
    });
  } catch (err) {
    console.error('chatbot error', err);
    res.status(500).json({ error: 'The assistant is unavailable right now.' });
  }
});

export default router;
