import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import Alert from './Alert.jsx';
import FormField from './FormField.jsx';
import Button from './Button.jsx';

export default function AccountantAssignment() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  useEffect(() => {
    let active = true;
    api.getAccountant().then(data => { if (active) setEmail(data.accountant?.email || ''); })
      .catch(error => { if (active) setError(error.message); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, []);
  async function save(event) {
    event.preventDefault();
    setBusy(true); setError(''); setMessage('');
    try {
      await api.setAccountant({ email });
      setMessage(email ? 'Accountant assigned. They can now review your business transactions.' : 'Accountant access removed.');
    } catch (error) { setError(error.message); }
    finally { setBusy(false); }
  }
  return (
    <section className="settings-card">
      <h2>Accountant access</h2>
      <p>Assign a registered accountant using their email address. They can view and review your business transactions. Leave the email empty to remove access.</p>
      <Alert type="error">{error}</Alert>
      <Alert type="success">{message}</Alert>
      <form onSubmit={save}>
        <FormField label="Accountant email" name="accountantEmail" type="email" value={email}
          onChange={event => setEmail(event.target.value)} disabled={busy} />
        <Button type="submit" disabled={busy}>{busy ? 'Please wait…' : 'Save accountant access'}</Button>
      </form>
    </section>
  );
}
