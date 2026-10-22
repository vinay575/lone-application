import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import {
  pool,
  listPlans,
  listChatbot,
  listUsers,
  insertUser,
  insertPlan,
  insertChat,
  insertApplication,
  insertPayment,
  insertNotification,
  updateUser,
  getSettings,
  saveSettings,
  DEFAULT_SETTINGS,
} from './db.js';

/** Default loan plans (template values - configurable in Admin > Loan Plans).
 *  Ordered low-to-high by loan amount. */
export const DEFAULT_PLANS = [
  {
    code: 'C',
    name: 'Plan C - Micro Ease',
    maxAmount: 10000,
    demoUnlockAmount: 250,
    tenureMonths: 3,
    demoRateLabel: 'Indicative 3% / month',
    summary: 'A small, quick plan for everyday expenses.',
    features: [
      'Loan amount up to ₹10,000',
      'Quick review',
      'Minimal paperwork',
      'Flexible 3-month tenure',
    ],
    active: true,
    sort: 1,
  },
  {
    code: 'A',
    name: 'Plan A - Quick Start',
    maxAmount: 30000,
    demoUnlockAmount: 499,
    tenureMonths: 6,
    demoRateLabel: 'Indicative 2.5% / month',
    summary: 'A straightforward plan for first-time applicants.',
    features: [
      'Loan amount up to ₹30,000',
      'Guided 3-step application',
      'Digital document checklist',
      'Flexible 6-month tenure',
    ],
    active: true,
    sort: 2,
  },
  {
    code: 'B',
    name: 'Plan B - Flexi Plus',
    maxAmount: 100000,
    demoUnlockAmount: 1499,
    tenureMonths: 12,
    demoRateLabel: 'Indicative 1.9% / month',
    summary: 'A larger plan with a longer tenure for bigger goals.',
    features: [
      'Loan amount up to ₹1,00,000',
      'Detailed assessment process',
      'Live status timeline',
      'Flexible 12-month tenure',
    ],
    active: true,
    sort: 3,
  },
];

export const DEFAULT_CHATBOT = [
  {
    keywords: ['plan', 'loan plan', 'offer', 'amount', 'interest'],
    response:
      'We have three plans: Plan C up to ₹10,000 (processing fee ₹250), Plan A up to ₹30,000 (processing fee ₹499), and Plan B up to ₹1,00,000 (processing fee ₹1,499). All charges are disclosed upfront.',
  },
  {
    keywords: ['status', 'application status', 'track', 'progress', 'review'],
    response:
      'You can check your application status on the Customer Dashboard after logging in. Statuses move through Draft, Submitted, Under Review, Additional Information Required and Completed.',
  },
  {
    keywords: ['document', 'documents', 'pan', 'aadhaar', 'kyc', 'photo', 'id proof'],
    response:
      'Your application asks for PAN, Aadhaar and a photograph. Uploads happen securely inside the application and are never shared without your consent.',
  },
  {
    keywords: ['payment', 'unlock', 'fee', 'charge', 'pay', 'money'],
    response:
      'The processing fee is shown before you pay, and payment happens on a secure checkout screen. We never ask for your card number, CVV or UPI PIN on this website.',
  },
  {
    keywords: ['support', 'help', 'contact', 'ticket', 'query'],
    response:
      'You can raise a support ticket from your dashboard, use the Contact Us page, or check the FAQ page. Our team responds within one working day.',
  },
  {
    keywords: ['login', 'register', 'account', 'sign up', 'password'],
    response:
      'Use Register to create an account with your name, mobile, email and password. Then log in to see your dashboard and track your application.',
  },
  {
    keywords: ['approve', 'approved', 'disbursal', 'credit', 'bank transfer'],
    response:
      'Applying does not guarantee approval - every application is assessed individually against the eligibility guidelines. You will see status updates on your dashboard as your application progresses.',
  },
];

export function randomPassword() {
  return crypto.randomBytes(9).toString('base64url');
}

/** Seeds reference data plus two sample customers with example journeys. */
export async function seed() {
  const settings = await getSettings();
  await saveSettings({ ...DEFAULT_SETTINGS, ...settings });

  if ((await listPlans()).length === 0) {
    for (const p of DEFAULT_PLANS) await insertPlan(p);
    console.log('Seeded loan plans.');
  }
  if ((await listChatbot()).length === 0) {
    for (const c of DEFAULT_CHATBOT) await insertChat({ ...c, active: true });
    console.log('Seeded chatbot responses.');
  }

  if ((await listUsers()).length === 0) {
    const hash = (pw) => bcrypt.hashSync(pw, 10);
    const sampleUsers = [
      { fullName: 'Aarav Sharma', mobile: '9000000001', email: 'demo.customer@loanledger.demo' },
      { fullName: 'Diya Verma', mobile: '9000000002', email: 'demo.customer2@loanledger.demo' },
    ];
    for (const u of sampleUsers) {
      const user = await insertUser({
        fullName: u.fullName,
        mobile: u.mobile,
        email: u.email,
        passwordHash: hash('Demo@1234'),
        role: 'customer',
        isDemo: true,
      });
      const app = await insertApplication({
        userId: user.id,
        status: 'Under Review',
        planCode: user.id % 2 === 1 ? 'B' : 'A',
        personal: { fullName: u.fullName, dob: '1994-05-12', gender: 'Male', mobile: u.mobile, email: u.email },
        address: { line1: '42, Residency', line2: 'MG Road', city: 'Bengaluru', state: 'Karnataka', pincode: '560001' },
        employment: { type: 'Salaried', employerName: 'Nova Technologies Pvt Ltd', monthlyIncome: 45000 },
        loan: { requestedAmount: user.id % 2 === 1 ? 85000 : 25000, purpose: 'Home renovation', tenureMonths: 12 },
        documents: {
          pan: { uploaded: true, fileName: 'sample-pan.txt', demo: true },
          aadhaar: { uploaded: true, fileName: 'sample-aadhaar.txt', demo: true },
          photo: { uploaded: true, fileName: 'sample-photo.txt', demo: true },
        },
        internalNotes: [{ by: 'System', text: 'Sample application created during initial setup.', at: new Date().toISOString() }],
        history: [
          { status: 'Draft', at: new Date().toISOString(), note: 'Application created' },
          { status: 'Submitted', at: new Date().toISOString(), note: 'Application submitted' },
          { status: 'Under Review', at: new Date().toISOString(), note: 'Review started' },
        ],
        submittedAt: new Date(),
        isDemo: true,
      });
      const planCode = app.planCode;
      const amount = planCode === 'B' ? 1499 : planCode === 'C' ? 250 : 499;
      await insertPayment({
        userId: user.id,
        applicationId: app.id,
        planCode,
        amount,
        method: 'UPI (Sandbox)',
        status: 'Completed',
        description: `Processing fee for ${planCode === 'B' ? 'Plan B - Flexi Plus' : 'Plan A - Quick Start'}`,
      });
      await updateUser(user.id, { plansUnlocked: [planCode] });
      await insertNotification({
        userId: user.id,
        title: 'Application under review',
        body: 'Your application is being reviewed. You will receive an update as soon as the status changes.',
      });
    }
    console.log('Seeded sample customers, applications and payments.');
  }
}

export async function closePool() {
  await pool.end();
}
