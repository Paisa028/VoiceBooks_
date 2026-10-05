const { config } = require('../config.js');

const { mail } = config;

// True when SMTP settings are present. Otherwise emails are printed to the server console.
const mailConfigured = Boolean(mail.host);

// nodemailer is loaded on first use, so the app also starts without SMTP settings.
let transporter;
const getTransporter = () => {
  if (!transporter) {
    const nodemailer = require('nodemailer');
    transporter = nodemailer.createTransport({
      host: mail.host,
      port: mail.port,
      secure: mail.secure,
      auth: mail.user ? { user: mail.user, pass: mail.pass } : undefined,
    });
  }
  return transporter;
};

async function sendMail({ to, subject, text, html }) {
  if (!mailConfigured) {
    console.log(`\n[mail: SMTP not configured, printing instead of sending]\nTo: ${to}\nSubject: ${subject}\n\n${text}\n`);
    return;
  }
  await getTransporter().sendMail({ from: mail.from, to, subject, text, html });
}

// Used by controllers so a slow or failing mail server never delays or changes the API response.
const sendInBackground = (to, message) =>
  sendMail({ to, ...message }).catch((err) =>
    console.error(`[mail] Could not send "${message.subject}":`, err.message)
  );

module.exports = { mailConfigured, sendMail, sendInBackground };
