const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
require('dotenv').config();
const hosted = process.argv.includes('--hosted');
if (hosted) {
  if (process.env.FIREBASE_PROJECT_ID !== 'voicebooks-d7726' || process.env.DATA_CONNECT_EMULATOR_HOST) {
    throw new Error('Hosted checks require voicebooks-d7726 and an empty DATA_CONNECT_EMULATOR_HOST.');
  }
} else {
  process.env.FIREBASE_PROJECT_ID = 'demo-voicebooks';
  process.env.DATA_CONNECT_EMULATOR_HOST = '127.0.0.1:9399';
}
process.env.DATABASE_PROVIDER = 'firebase';
process.env.JWT_SECRET = 'firebase_emulator_test_secret_32_characters';
process.env.NODE_ENV = 'test';
process.env.SMTP_HOST = '';
const request = require('supertest');
const app = require('../src/app');
const { getClient, executeList } = require('../src/firebase/client');
const created = [];
const suffix = randomUUID();
let checks = 0;
const check = (condition, message) => { assert.ok(condition, message); checks++; };
const auth = (call, user) => call.set('Cookie', user.cookie);
async function register(role) {
  const email = `${role}-${created.length}-${suffix}@example.com`;
  const response = await request(app).post('/api/auth/register').send({
    firstName: 'Firebase', lastName: 'Test', email, password: 'StrongPass123!', confirmPassword: 'StrongPass123!', role,
    business: { businessName: 'Firebase Test', industry: 'Services', businessSize: '1', country: 'South Africa', currency: 'ZAR' }
  });
  assert.equal(response.status, 201, JSON.stringify(response.body));
  created.push(response.body.user.id);
  checks++;
  return { ...response.body.user, cookie: response.headers['set-cookie'][0].split(';')[0], email };
}
async function run() {
  const owner = await register('business_owner');
  const other = await register('business_owner');
  const accountant = await register('accountant');
  const outsider = await register('accountant');
  await request(app).get('/api/transactions').expect(401); checks++;
  await auth(request(app).get('/api/auth/profile'), owner).expect(200); checks++;
  await request(app).post('/api/auth/login').send({ email: owner.email.toUpperCase(), password: 'StrongPass123!' }).expect(200); checks++;
  await auth(request(app).post('/api/onboarding/complete'), owner).expect(200); checks++;
  await auth(request(app).put('/api/onboarding/sage'), owner).send({ action: 'skip' }).expect(200); checks++;
  const settings = await auth(request(app).get('/api/settings'), owner).expect(200);
  check(settings.body.user.business.name === 'Firebase Test', 'Settings read from Firebase');
  const current = settings.body.user;
  await auth(request(app).put('/api/settings'), owner).send({ firstName: 'Updated', lastName: current.lastName,
    businessName: 'Updated Business', industry: 'Services', businessSize: '1', country: 'South Africa', currency: 'ZAR' }).expect(200); checks++;
  await auth(request(app).put('/api/transactions/accountant'), owner).send({ email: accountant.email }).expect(200); checks++;
  const payload = { type: 'expense', amount: 250.25, description: 'Office supplies', paymentMethod: 'cash', transactionDate: '2026-10-05', accountCategory: 'Office' };
  const submitted = await auth(request(app).post('/api/transactions'), owner).send(payload).expect(201);
  const id = submitted.body.transaction.id;
  check(submitted.body.transaction.status === 'pending_review', 'New entry requires review');
  check(submitted.body.auditRecord.action === 'TRANSACTION_SUBMITTED', 'Submission includes audit');
  await assert.rejects(getClient().executeGraphql('query Protected($ownerId: Int!) @auth(level: NO_ACCESS) { entries(where: {ownerId: {eq: $ownerId}}) {id} }',
    { variables: { ownerId: owner.id }, impersonate: { unauthenticated: true } })); checks++;
  const beforeRollback = (await auth(request(app).get('/api/transactions'), owner)).body.count;
  await assert.rejects(getClient().executeGraphql(`mutation Rollback($ownerId: Int!) @transaction {
    entry_insert(data: {ownerId: $ownerId, description: "Rollback check", amount: 1,
      debitAccount: "Office", creditAccount: "Cash", payloadJson: "{}"})
    audit_insert(data: {ownerId: $ownerId, actorId: -1, entryId_expr: "response.entry_insert.id", action: "FAIL", source: "test"})
  }`, { variables: { ownerId: owner.id } })); checks++;
  check((await auth(request(app).get('/api/transactions'), owner)).body.count === beforeRollback, 'Failed audit rolls back entry insertion');
  check((await auth(request(app).get('/api/transactions'), other)).body.transactions.length === 0, 'Other owner sees no entries');
  await auth(request(app).get(`/api/transactions/${id}`), other).expect(404); checks++;
  await auth(request(app).patch(`/api/accountant/transactions/${id}/approve`), outsider).expect(404); checks++;
  const pending = await auth(request(app).get('/api/accountant/reviews/pending'), accountant).expect(200);
  check(pending.body.data.some(row => row.id === id), 'Assigned accountant sees entry');
  await auth(request(app).patch(`/api/accountant/transactions/${id}/reject`), accountant).send({ reason: 'Please correct the amount' }).expect(200); checks++;
  await auth(request(app).put(`/api/transactions/${id}`), owner).send({ ...payload, amount: 300 }).expect(201); checks++;
  const reviews = await Promise.all([1, 2].map(() => auth(request(app).patch(`/api/accountant/transactions/${id}/approve`), accountant)));
  check(reviews.filter(response => response.status === 200).length === 1, 'Exactly one concurrent approval succeeds');
  check(reviews.filter(response => response.status === 409).length === 1, 'Duplicate concurrent approval conflicts');
  const approved = await auth(request(app).get('/api/transactions?status=approved'), owner).expect(200);
  check(approved.body.transactions[0].amount === 300, 'Approved data feeds ledger/report API');
  const audit = await auth(request(app).get('/api/transactions/audit'), owner).expect(200);
  check(audit.body.auditLog.filter(event => event.action === 'TRANSACTION_APPROVED').length === 1, 'Approval audit is atomic');
  check((await executeList('OwnerAudit', { ownerId: owner.id }, 'audits', 2)).length === audit.body.auditLog.length,
    'Pagination retrieves all audit records across multiple pages');
  await auth(request(app).put('/api/transactions/accountant'), owner).send({ email: '' }).expect(200); checks++;
  await auth(request(app).get(`/api/accountant/transactions/${id}/review`), accountant).expect(404); checks++;
  const forgot = await request(app).post('/api/auth/forgot-password').send({ email: owner.email }).expect(200);
  const token = new URL(forgot.body.devResetLink).searchParams.get('token');
  const verified = await request(app).post('/api/auth/verify-reset-token').send({ token }).expect(200);
  check(verified.body.valid, 'Reset token is valid');
  await request(app).post('/api/auth/reset-password').send({ token, password: 'NewStrongPass123!', confirmPassword: 'NewStrongPass123!' }).expect(200); checks++;
  await request(app).post('/api/auth/reset-password').send({ token, password: 'NewStrongPass123!', confirmPassword: 'NewStrongPass123!' }).expect(400); checks++;
  await request(app).post('/api/auth/login').send({ email: owner.email, password: 'NewStrongPass123!' }).expect(200); checks++;
  console.log(`Firebase SQL Connect ${hosted ? 'hosted' : 'emulator'}: ${checks} checks passed.`);
}
run().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  // Only accounts created by this test are removed; existing emulator data stays intact.
  if (created.length) {
    try { await getClient().executeGraphql('mutation Cleanup($ids: [Int!]!) { account_deleteMany(where: { id: { in: $ids } }) }', { variables: { ids: created } }); }
    catch (error) { console.error('Test cleanup failed:', error.message); process.exitCode = 1; }
  }
});
