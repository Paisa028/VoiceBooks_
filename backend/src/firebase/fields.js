const names = {
  "password_hash": "passwordHash",
  "first_name": "firstName",
  "last_name": "lastName",
  "onboarding_completed": "onboardingCompleted",
  "business_name": "businessName",
  "registration_number": "registrationNumber",
  "vat_number": "vatNumber",
  "business_size": "businessSize",
  "sage_status": "sageStatus",
  "sage_region": "sageRegion",
  "created_at": "createdAt",
  "updated_at": "updatedAt",
  "debit_account": "debitAccount",
  "credit_account": "creditAccount",
  "original_transcription": "originalTranscription",
  "supporting_information": "supportingInformation",
  "payload_json": "payloadJson",
  "approved_by": "approvedBy",
  "approved_at": "approvedAt",
  "rejection_reason": "rejectionReason",
  "expires_at": "expiresAt",
  "used_at": "usedAt"
};
const inverse = Object.fromEntries(Object.entries(names).map(([snake, camel]) => [camel, snake]));
function convert(value, keys) {
 if (Array.isArray(value)) return value.map(item => convert(item, keys));
 if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [keys[key] || key, convert(item, keys)]));
 return value;
}
module.exports = { toFirebase: value => convert(value, names), fromFirebase: value => convert(value, inverse) };
