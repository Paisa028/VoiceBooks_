require('dotenv').config();
const crypto = require('node:crypto');
const path = require('node:path');

const isProd = process.env.NODE_ENV === 'production';
if (process.env.DATABASE_PROVIDER && !['sqlite', 'firebase'].includes(process.env.DATABASE_PROVIDER)) {
  throw new Error('DATABASE_PROVIDER must be sqlite or firebase.');
}

let jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret.length < 32) {
  if (isProd) throw new Error('JWT_SECRET must be set (32+ characters) in production');
  jwtSecret = crypto.randomBytes(48).toString('hex');
  console.warn('[config] JWT_SECRET missing or short: using a temporary one. Sessions reset on restart.');
}

const config = {
  databaseProvider: process.env.DATABASE_PROVIDER || 'sqlite',
  isProd,
  port: Number(process.env.PORT) || 3715,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  jwtSecret,
  sessionMinutes: Number(process.env.SESSION_MINUTES) || 60,
  cookieSecure: process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === 'true' : isProd,
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 12,
  resetTokenTtlMinutes: Number(process.env.RESET_TOKEN_TTL_MINUTES) || 30,
  databaseFile: process.env.DATABASE_FILE === ':memory:' ? ':memory:' : path.resolve(process.env.DATABASE_FILE || './data/voicebooks.db'),
  mail: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for port 465, false for 587 (STARTTLS)
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.MAIL_FROM || 'VoiceBooks <no-reply@example.com>',
  },
};

if (isProd && !config.mail.host) {
  console.warn('[config] SMTP_HOST is not set: password reset emails cannot be delivered.');
}

module.exports = { config };
