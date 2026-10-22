import 'dotenv/config';
import { pool, DEFAULT_SETTINGS, getSettings, saveSettings } from '../db.js';
import { DEFAULT_PLANS, DEFAULT_CHATBOT } from '../seed.js';

/**
 * One-off content refresh: rewrites existing demo-era wording in the database
 * so the whole product reads as a production site (sandbox disclosures only).
 * Safe to re-run - every statement is idempotent.
 */

const log = (label, result) => console.log(`  ${label}: ${result.affectedRows ?? 0} row(s)`);

async function main() {
  console.log('Refreshing database content...');

  /* --------------------------------- plans -------------------------------- */
  for (const p of DEFAULT_PLANS) {
    const [r] = await pool.query(
      `UPDATE plans SET name = ?, summary = ?, features = ?, demo_rate_label = ?,
        max_amount = ?, demo_unlock_amount = ?, tenure_months = ?, updated_at = NOW(3)
       WHERE code = ?`,
      [p.name, p.summary, JSON.stringify(p.features), p.demoRateLabel,
       p.maxAmount, p.demoUnlockAmount, p.tenureMonths, p.code]
    );
    log(`plan ${p.code}`, r);
  }

  /* ------------------------------- chatbot kb ------------------------------ */
  await pool.query('DELETE FROM chatbot_responses');
  for (const c of DEFAULT_CHATBOT) {
    await pool.query(
      'INSERT INTO chatbot_responses (keywords, response, active, created_at, updated_at) VALUES (?, ?, 1, NOW(3), NOW(3))',
      [JSON.stringify(c.keywords), c.response]
    );
  }
  console.log(`  chatbot: ${DEFAULT_CHATBOT.length} inserted`);

  /* -------------------------------- settings ------------------------------- */
  const current = await getSettings();
  await saveSettings({
    ...current,
    company: {
      ...current.company,
      name: DEFAULT_SETTINGS.company.name,
      tagline: DEFAULT_SETTINGS.company.tagline,
      address:
        /demo/i.test(current.company?.address || '')
          ? DEFAULT_SETTINGS.company.address
          : current.company?.address,
    },
  });
  console.log('  settings: company details refreshed');

  /* --------------------------------- users -------------------------------- */
  const [u1] = await pool.query(
    `UPDATE users SET full_name = 'Administrator' WHERE role = 'admin'`
  );
  log('admin name', u1);
  const [u2] = await pool.query(
    `UPDATE users SET full_name = REPLACE(full_name, ' (Demo)', '') WHERE full_name LIKE '%(Demo)'`
  );
  log('customer names', u2);

  /* ----------------------------- applications ------------------------------ */
  const [a1] = await pool.query(
    `UPDATE applications SET ref_number = SUBSTRING(ref_number, 6) WHERE ref_number LIKE 'DEMO-LN-%'`
  );
  log('ref numbers', a1);
  const [a2] = await pool.query(
    `UPDATE applications SET status = 'Completed' WHERE status = 'Demo Completed'`
  );
  log('statuses', a2);

  const jsonCols = ['personal', 'address', 'employment', 'loan', 'documents', 'internal_notes', 'history'];
  const appPairs = [
    [' (Demo)', ''],
    ['Demo Residency', 'Residency'],
    ['MG Road (fictional)', 'MG Road'],
    ['Demo Corp Pvt Ltd (fictional)', 'Nova Technologies Pvt Ltd'],
    ['Home repair (demo purpose)', 'Home renovation'],
    ['sample-pan-demo.txt', 'sample-pan.txt'],
    ['sample-aadhaar-demo.txt', 'sample-aadhaar.txt'],
    ['sample-photo-demo.txt', 'sample-photo.txt'],
    ['System (demo seed)', 'System'],
    ['Seeded fictional demo application.', 'Sample application created during initial setup.'],
    ['Demo record created', 'Application created'],
    ['Demo submission', 'Application submitted'],
    ['Demo review started', 'Review started'],
    ['Submitted for demo review', 'Application submitted'],
    ['Stored on local demo server only - never sent to external services',
     'Stored securely - never shared without consent'],
  ];
  for (const col of jsonCols) {
    let expr = col;
    for (const _pair of appPairs) expr = `REPLACE(${expr}, ?, ?)`;
    const params = [];
    for (const [search, repl] of appPairs) params.push(search, repl);
    const [r] = await pool.query(`UPDATE applications SET ${col} = ${expr}`, params);
    log(`applications.${col}`, r);
  }

  /* -------------------------------- payments ------------------------------- */
  const [p1] = await pool.query(
    `UPDATE payments SET status = 'Completed' WHERE status = 'Demo Completed'`
  );
  log('payment statuses', p1);
  const [p2] = await pool.query(
    `UPDATE payments SET method = 'UPI (Sandbox)' WHERE method LIKE 'Simulated%'`
  );
  log('payment methods', p2);
  const [p3] = await pool.query(
    `UPDATE payments SET description = 'Processing fee'
     WHERE description LIKE 'Simulated plan unlock%'`
  );
  log('payment descriptions (generic)', p3);
  const [p4] = await pool.query(
    `UPDATE payments SET description = REPLACE(REPLACE(description,
       'Simulated unlock for ', 'Processing fee for '),
       ' - no real payment processed', '')
     WHERE description LIKE 'Simulated%'`
  );
  log('payment descriptions', p4);

  /* ------------------------------ notifications ---------------------------- */
  const notifPairs = [
    ['Welcome to the LoanLedger demo', 'Welcome to LoanLedger'],
    ['This is a simulated loan website. No real loans, payments or verification take place.',
     'Your account is ready. Start an application and track every update from your dashboard.'],
    ['Demo application received', 'Application under review'],
    ['Your fictional demo application is under review. No real loan is being processed.',
     'Your application is being reviewed. You will receive an update as soon as the status changes.'],
    ['Demo plan unlocked (simulated)', 'Payment received'],
    ['is unlocked in your dashboard. This was a simulation - no money moved and no loan was approved.',
     'is now active in your dashboard.'],
    ['Demo application status: ', 'Application status: '],
    ['in the simulation. This is demo data - not a real loan decision.',
     'Track every update on your dashboard.'],
    ['Demo application submitted', 'Application submitted'],
    ['is now submitted (simulated). This is not a real loan application.',
     'has been submitted and is now queued for review.'],
  ];
  for (const [search, repl] of notifPairs) {
    const [r] = await pool.query(
      `UPDATE notifications SET title = REPLACE(title, ?, ?), body = REPLACE(body, ?, ?)`,
      [search, repl, search, repl]
    );
    log(`notif "${search.slice(0, 32)}"`, r);
  }

  console.log('Content refresh complete.');
}

main()
  .then(() => pool.end())
  .catch((err) => {
    console.error('Refresh failed:', err);
    process.exit(1);
  });
