const { initializeApp, getApps, applicationDefault } = require('firebase-admin/app');
const { getDataConnect } = require('firebase-admin/data-connect');
const fs = require('node:fs');
const path = require('node:path');
const { toFirebase, fromFirebase } = require('./fields');
let client;

function getClient() {
  if (client) return client;
  const emulator = process.env.DATA_CONNECT_EMULATOR_HOST;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error('FIREBASE_PROJECT_ID is required for Firebase SQL Connect.');
  if (projectId.startsWith('demo-') && !emulator) throw new Error('Demo projects require DATA_CONNECT_EMULATOR_HOST.');
  if (process.env.NODE_ENV === 'production' && emulator) throw new Error('Production must not connect to an emulator.');
  const app = getApps().find(app => app.name === 'voicebooks-sql') || initializeApp({
    projectId,
    ...(emulator ? {} : { credential: applicationDefault() }),
  }, 'voicebooks-sql');
  client = getDataConnect({ serviceId: process.env.FIREBASE_SERVICE_ID || 'voicebooks-d7726-service',
    location: process.env.FIREBASE_LOCATION || 'us-east4' }, app);
  return client;
}

// Read the same operations that the Firebase CLI validates and deploys.
const document = fs.readFileSync(path.resolve(__dirname, '../../../dataconnect/backend/operations.gql'), 'utf8');
async function execute(operationName, variables = {}, readOnly = false) {
  try {
    const sdk = getClient();
    const flatInput = ['CreateAccount', 'SubmitEntry', 'ResubmitEntry'].includes(operationName)
      ? { ...variables.data, ...Object.fromEntries(Object.entries(variables).filter(([key]) => key !== 'data')) }
      : variables;
    const response = await sdk[readOnly ? 'executeGraphqlRead' : 'executeGraphql'](document, { operationName, variables: toFirebase(flatInput) });
    if (response.errors?.length) throw new Error(response.errors.map(error => error.message).join('; '));
    return fromFirebase(response.data);
  } catch (error) {
    const message = String(error.message);
    if (/Entry no longer returned|Entry unavailable for review|Reset token expired or used/.test(message)) {
      error.status = 409;
      error.message = 'This record changed or is no longer available. Refresh and try again.';
    }
    const details = JSON.stringify(error.httpResponse?.data?.errors || []);
    if (/unique|duplicate key|23505/i.test(message + details)) error.code = 'ACCOUNT_EXISTS';
    throw error;
  }
}
async function executeList(operationName, variables, field, pageSize = 500) {
  const rows = [];
  for (let offset = 0; ; offset += pageSize) {
    const page = (await execute(operationName, { ...variables, limit: pageSize, offset }, true))[field];
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}
async function checkConnection() {
  const result = await getClient().executeGraphqlRead(`query VoiceBooksConnectionCheck {
    accounts(limit: 1) { id }
    entries(limit: 1) { id }
    audits(limit: 1) { id }
    resetTokens(limit: 1) { id }
  }`);
  if (result.errors?.length) throw new Error('Firebase SQL schema is unavailable. Deploy the VoiceBooks schema before starting the backend.');
}
module.exports = { execute, executeList, getClient, checkConnection };
