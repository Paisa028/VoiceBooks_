const { execute, executeList } = require('./client');
const labels = { business_owner: 'Business owner', bookkeeper: 'Bookkeeper', accountant: 'Accountant', admin: 'Administrator' };
const row = account => account && { ...account, business_id: account.id, role_label: labels[account.role] };
async function findRowByEmail(email) { return row((await execute('AccountByEmail', { email: email.toLowerCase() }, true)).accounts[0]); }
async function findRowById(id) { return row((await execute('AccountById', { id: Number(id) }, true)).account); }
async function createUserWithBusiness({ user, business }) {
  if (!['business_owner', 'bookkeeper', 'accountant'].includes(user.role)) throw new Error('Invalid role');
  const result = await execute('CreateAccount', { data: {
    email: user.email.toLowerCase(), password_hash: user.passwordHash, first_name: user.firstName,
    last_name: user.lastName, phone: user.phone || null, role: user.role,
    business_name: business.businessName, registration_number: business.registrationNumber || null,
    vat_number: business.vatNumber || null, industry: business.industry, business_size: business.businessSize,
    country: business.country, currency: business.currency,
  } });
  return result.account_insert.id;
}
async function update(id, data) { return execute('UpdateAccount', { id: Number(id), data: { ...data, updated_at: new Date().toISOString() } }); }
async function setSageStatus(id, status, region = null) { return update(id, { sage_status: status, sage_region: region }); }
async function completeOnboarding(id) { return update(id, { onboarding_completed: true }); }
async function listUsers() { return executeList('AllAccounts', {}, 'accounts'); }
async function updateSettings(id, { user, business }) {
  await update(id, { first_name: user.firstName, last_name: user.lastName, phone: user.phone || null,
    business_name: business.businessName, registration_number: business.registrationNumber || null,
    vat_number: business.vatNumber || null, industry: business.industry, business_size: business.businessSize,
    country: business.country, currency: business.currency });
  return require('../models/accounts').toPublic(await findRowById(id));
}
async function saveResetToken(id, hash, expiresAt) { return execute('SaveReset', { ownerId: id, hash, expiresAt }); }
async function findValidResetToken(hash) {
  const token = (await execute('FindReset', { hash }, true)).resetToken;
  return token && !token.used_at && new Date(token.expires_at) > new Date() ? { ...token, user_id: token.ownerId } : null;
}
async function consumeResetToken(tokenId, userId, passwordHash) {
  return execute('ConsumeReset', { hash: tokenId, ownerId: userId, passwordHash, now: new Date().toISOString() });
}
async function recentResetTokenExists(id, seconds) {
  return (await execute('RecentReset', { ownerId: id, since: new Date(Date.now() - seconds * 1000).toISOString() }, true)).resetTokens.length > 0;
}
module.exports = { findRowByEmail, findRowById, createUserWithBusiness, updateSettings, setSageStatus,
  completeOnboarding, listUsers, saveResetToken, findValidResetToken, consumeResetToken, recentResetTokenExists };
