const base = 'http://localhost:3001/api';
const j = (r) => r.json();
const post = (url, body, token) =>
  fetch(base + url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  }).then(async (r) => ({ status: r.status, data: await r.json() }));

async function main() {
  const reg = await post('/auth/register', {
    fullName: 'Test User',
    mobile: '9876543210',
    email: 'test.user@example.com',
    password: 'Password@123',
  });
  console.log('register:', reg.status, JSON.stringify(reg.data).slice(0, 120));

  const login = await post('/auth/login', {
    email: 'test.user@example.com',
    password: 'Password@123',
  });
  console.log('login:', login.status, login.data.user?.email);
  const token = login.data.token;

  const app1 = await post('/customer/applications', { planCode: 'A' }, token);
  console.log('createApp:', app1.status, app1.data.application?.refNumber);

  const id = app1.data.application.id;
  const put = await fetch(`${base}/customer/applications/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      personal: {
        fullName: 'Test User', dob: '1995-01-01', gender: 'Male',
        mobile: '9876543210', email: 'test.user@example.com',
      },
      address: { line1: '1 Demo St', city: 'Pune', state: 'Maharashtra', pincode: '411001' },
      employment: { type: 'Salaried', employerName: 'Demo Ltd', monthlyIncome: 50000 },
      loan: { requestedAmount: 20000, purpose: 'Demo purpose' },
    }),
  }).then(async (r) => ({ status: r.status, data: await r.json() }));
  console.log('updateApp:', put.status);

  const sub = await post('/customer/applications/:id/submit'.replace(':id', id), {}, token);
  console.log('submit (should fail without docs):', sub.status, sub.data.error);

  const pay = await post('/customer/payments/simulate', { applicationId: id, planCode: 'A' }, token);
  console.log('simulatePayment:', pay.status, pay.data.payment?.amount, pay.data.payment?.isDemo);

  const adminLogin = await post('/auth/login', {
    email: 'admin@loanledger.demo',
    password: 'AdminDemo@123',
  });
  console.log('adminLogin:', adminLogin.status, adminLogin.data.user?.role);

  const adminToken = adminLogin.data.token;
  const stats = await fetch(base + '/admin/stats', {
    headers: { Authorization: `Bearer ${adminToken}` },
  }).then(j);
  console.log('adminStats:', JSON.stringify(stats).slice(0, 150));

  const forbidden = await fetch(base + '/admin/stats', {
    headers: { Authorization: `Bearer ${token}` },
  }).then(j);
  console.log('customerBlockedFromAdmin:', forbidden.error);

  const chat = await fetch(base + '/chatbot/answer?q=what%20are%20the%20loan%20plans').then(j);
  console.log('chatbot:', chat.matched, chat.answer.slice(0, 60));
}
main().catch((e) => {
  console.error('TEST FAILED', e);
  process.exit(1);
});
