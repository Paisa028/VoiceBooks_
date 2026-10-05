const request = require('supertest');
const app = require('../../src/app');
const { db } = require('../../src/db');
const { signToken } = require('../../src/utils/security');

const payload = {
  type: 'expense', amount: 250, description: 'Stationery', paymentMethod: 'cash',
  transactionDate: '2026-10-05', accountCategory: 'Office',
};
function user(email, role) {
  const id = Number(db.prepare(`INSERT INTO users(email, password_hash, first_name, last_name, role_id)
    VALUES (?, 'unused', 'Test', 'User', (SELECT id FROM roles WHERE name = ?))`).run(email, role).lastInsertRowid);
  db.prepare(`INSERT INTO business_profiles(user_id, business_name, industry, business_size, country, currency)
    VALUES (?, ?, 'Services', '1', 'South Africa', 'ZAR')`).run(id, email);
  return { id, email, role, token: signToken({ id, role }) };
}
const auth = (call, person) => call.set('Cookie', `vb_token=${person.token}`);
let owner, other, accountant, outsider;
beforeEach(() => {
  db.exec(`DELETE FROM legacy_transaction_imports; DELETE FROM transaction_audit; DELETE FROM transactions; DELETE FROM accountant_assignments;
    DELETE FROM clients; DELETE FROM password_reset_tokens; DELETE FROM business_profiles; DELETE FROM users;`);
  owner = user('owner@example.com', 'business_owner');
  other = user('other@example.com', 'business_owner');
  accountant = user('accountant@example.com', 'accountant');
  outsider = user('outsider@example.com', 'accountant');
});
afterAll(() => db.close());
async function submit() {
  const result = await auth(request(app).post('/api/transactions'), owner).send(payload).expect(201);
  return result.body.transaction;
}
async function assign(person = accountant) {
  await auth(request(app).put('/api/transactions/accountant'), owner).send({ email: person.email }).expect(200);
}

test('all transaction and audio endpoints require authentication before processing uploads', async () => {
  for (const path of ['/api/transactions', '/api/transactions/audit', '/api/transactions/1', '/api/transactions/accountant']) {
    await request(app).get(path).expect(401);
  }
  await request(app).post('/api/transactions').send(payload).expect(401);
  await request(app).post('/api/transactions/process').send({ transcript: 'Paid 250 cash' }).expect(401);
  await request(app).post('/api/transcriptions').attach('audio', Buffer.from('audio'), 'sample.wav').expect(401);
  await auth(request(app).post('/api/transcriptions'), accountant).expect(403);
});

test('owner identity and server journal override spoofed payloads; other owners cannot read or edit', async () => {
  const response = await auth(request(app).post('/api/transactions'), owner).send({ ...payload,
    id: 'fake', ownerId: other.id, client_id: 999, status: 'approved', journalEntries: [{ debit: 999 }] }).expect(201);
  const transaction = response.body.transaction;
  expect(transaction.status).toBe('pending_review');
  expect(transaction.journalEntries).toEqual([
    { account: 'Office Expense', debit: 250, credit: 0 }, { account: 'Cash', debit: 0, credit: 250 }
  ]);
  expect((await auth(request(app).get('/api/transactions'), other)).body.transactions).toEqual([]);
  expect((await auth(request(app).get('/api/transactions/audit'), other)).body.auditLog).toEqual([]);
  await auth(request(app).get(`/api/transactions/${transaction.id}`), other).expect(404);
  await auth(request(app).put(`/api/transactions/${transaction.id}`), other).send(payload).expect(404);
});

test('submission reaches only assigned accountant; approval feeds owner ledger/report query and audit', async () => {
  const transaction = await submit();
  expect((await auth(request(app).get('/api/accountant/reviews/pending'), accountant)).body.data).toEqual([]);
  await assign();
  const pending = await auth(request(app).get('/api/accountant/reviews/pending'), accountant).expect(200);
  expect(pending.body.data[0].id).toBe(transaction.id);
  const clientId = pending.body.data[0].client_id;
  await auth(request(app).get(`/api/accountant/clients/${clientId}`), outsider).expect(404);
  expect((await auth(request(app).get(`/api/accountant/clients/${clientId}/transactions`), outsider)).body.data).toEqual([]);
  await auth(request(app).patch(`/api/accountant/transactions/${transaction.id}/approve`), outsider).expect(404);
  expect((await auth(request(app).get('/api/transactions?status=approved'), owner)).body.transactions).toEqual([]);
  await auth(request(app).patch(`/api/accountant/transactions/${transaction.id}/approve`), accountant).expect(200);
  await auth(request(app).patch(`/api/accountant/transactions/${transaction.id}/approve`), accountant).expect(409);
  const approved = await auth(request(app).get('/api/transactions?status=approved'), owner).expect(200);
  expect(approved.body.transactions[0].postingStatus).toBe('posted');
  expect((await auth(request(app).get('/api/transactions/audit'), owner)).body.auditLog[0].action).toBe('TRANSACTION_APPROVED');
  await auth(request(app).put('/api/transactions/accountant'), owner).send({ email: '' }).expect(200);
  await auth(request(app).get(`/api/accountant/transactions/${transaction.id}/review`), accountant).expect(404);
});

test('returned transaction stays out of reports, owner corrects and resubmits the same record', async () => {
  await assign();
  const transaction = await submit();
  await auth(request(app).patch(`/api/accountant/transactions/${transaction.id}/reject`), accountant)
    .send({ reason: 'Please correct the amount' }).expect(200);
  const detail = await auth(request(app).get(`/api/transactions/${transaction.id}`), owner).expect(200);
  expect(detail.body.transaction.rejectionReason).toBe('Please correct the amount');
  const updated = await auth(request(app).put(`/api/transactions/${transaction.id}`), owner)
    .send({ ...payload, amount: 300 }).expect(201);
  expect(updated.body.transaction).toMatchObject({ id: transaction.id, amount: 300, status: 'pending_review', rejectionReason: null });
  expect(db.prepare('SELECT COUNT(*) AS total FROM transactions').get().total).toBe(1);
});

test('invalid types, dates, amounts and accountant assignments fail cleanly', async () => {
  for (const invalid of [{ description: 123 }, { amount: -1 }, { amount: true },
    { amount: 1.234 }, { transactionDate: '2026-02-30' }, { paymentMethod: {} }]) {
    await auth(request(app).post('/api/transactions'), owner).send({ ...payload, ...invalid }).expect(400);
  }
  await auth(request(app).post('/api/transactions/process'), owner).send({ transcript: 123 }).expect(400);
  await auth(request(app).put('/api/transactions/accountant'), owner).send({ email: other.email }).expect(400);
  await auth(request(app).put('/api/transactions/accountant'), accountant).send({ email: accountant.email }).expect(403);
});

test('database rolls back submission and approval if audit insertion fails', async () => {
  await assign();
  db.exec(`CREATE TEMP TRIGGER fail_audit BEFORE INSERT ON transaction_audit BEGIN SELECT RAISE(ABORT, 'audit unavailable'); END;`);
  const log = jest.spyOn(console, 'error').mockImplementation(() => {});
  try {
    await auth(request(app).post('/api/transactions'), owner).send(payload).expect(500);
    expect(db.prepare('SELECT COUNT(*) AS total FROM transactions').get().total).toBe(0);
  } finally { db.exec('DROP TRIGGER fail_audit'); log.mockRestore(); }
  const transaction = await submit();
  db.exec(`CREATE TEMP TRIGGER fail_audit BEFORE INSERT ON transaction_audit BEGIN SELECT RAISE(ABORT, 'audit unavailable'); END;`);
  try {
    await auth(request(app).patch(`/api/accountant/transactions/${transaction.id}/approve`), accountant).expect(500);
    expect(db.prepare('SELECT status FROM transactions WHERE id = ?').get(transaction.id).status).toBe('pending_review');
  } finally { db.exec('DROP TRIGGER fail_audit'); }
});

test('verified legacy imports preserve audits and are repeatable without duplicate transactions', () => {
  const { importTransactions } = require('../../scripts/import-transactions');
  const records = [{ ...payload, id: 'TXN-legacy', status: 'confirmed' }];
  const audits = [{ transactionId: 'TXN-legacy', action: 'TRANSACTION_POSTED', timestamp: '2026-10-01T12:00:00Z' }];
  expect(importTransactions(records, owner.email, audits)).toBe(1);
  expect(importTransactions(records, owner.email, audits)).toBe(0);
  expect(db.prepare('SELECT status FROM transactions').get().status).toBe('pending_review');
  expect(db.prepare("SELECT source FROM transaction_audit WHERE action = 'LEGACY_TRANSACTION_POSTED'").get().source).toBe('legacy_import');
  expect(() => importTransactions(records, other.email)).toThrow('already owned');
});

test('legacy import rolls back the whole batch when a record is invalid', () => {
  const { importTransactions } = require('../../scripts/import-transactions');
  expect(() => importTransactions([{ ...payload, id: 'legacy-1' }, { ...payload, id: 'legacy-2', amount: -5 }], owner.email)).toThrow();
  expect(db.prepare('SELECT COUNT(*) AS total FROM transactions').get().total).toBe(0);
  expect(db.prepare('SELECT COUNT(*) AS total FROM legacy_transaction_imports').get().total).toBe(0);
});
