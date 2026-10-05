const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const shell = (bodyHtml) => `<!doctype html>
<html lang="en"><body style="margin:0;padding:24px;background:#f2f5ef;font-family:Arial,Helvetica,sans-serif;color:#14312b;">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:6px;padding:32px;">
    <p style="margin:0 0 24px;font-size:20px;font-weight:bold;">VoiceBooks</p>
    ${bodyHtml}
  </div>
</body></html>`;

function passwordResetEmail({ firstName, link, minutes }) {
  const name = escapeHtml(firstName);
  const href = escapeHtml(link);
  return {
    subject: 'Reset your VoiceBooks password',
    text: [
      `Hi ${firstName},`,
      '',
      `Someone asked to reset the password for your VoiceBooks account. Choose a new password here. The link works once and expires in ${minutes} minutes:`,
      '',
      link,
      '',
      "If this wasn't you, ignore this email. Your password stays the same.",
    ].join('\n'),
    html: shell(`
    <p style="margin:0 0 16px;">Hi ${name},</p>
    <p style="margin:0 0 24px;line-height:1.5;">Someone asked to reset the password for your VoiceBooks account. The link works once and expires in ${minutes} minutes.</p>
    <p style="margin:0 0 24px;"><a href="${href}" style="display:inline-block;background:#0e7a5a;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:6px;">Choose a new password</a></p>
    <p style="margin:0 0 8px;font-size:14px;color:#4f655c;">Button not working? Paste this link into your browser:</p>
    <p style="margin:0 0 24px;font-size:14px;word-break:break-all;"><a href="${href}" style="color:#0a5c44;">${href}</a></p>
    <p style="margin:0;font-size:14px;color:#4f655c;">If this wasn't you, ignore this email. Your password stays the same.</p>`),
  };
}

function passwordChangedEmail({ firstName }) {
  const name = escapeHtml(firstName);
  return {
    subject: 'Your VoiceBooks password was changed',
    text: [
      `Hi ${firstName},`,
      '',
      'The password for your VoiceBooks account was just changed.',
      '',
      'If you did this, no action is needed. If you did not, reset your password again straight away from the sign-in page.',
    ].join('\n'),
    html: shell(`
    <p style="margin:0 0 16px;">Hi ${name},</p>
    <p style="margin:0 0 16px;line-height:1.5;">The password for your VoiceBooks account was just changed.</p>
    <p style="margin:0;font-size:14px;color:#4f655c;line-height:1.5;">If you did this, no action is needed. If you did not, reset your password again straight away from the sign-in page.</p>`),
  };
}

module.exports = { escapeHtml, passwordResetEmail, passwordChangedEmail };
