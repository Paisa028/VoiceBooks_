import { useCallback, useMemo, useState } from 'react';
import { SignupContext } from './signupState.js';

// Holds the three sign-up steps in memory until the final submit.
// Nothing is written to localStorage, so the password never touches disk.
const EMPTY = { account: null, role: '', business: null };

export function SignupProvider({ children }) {
  const [draft, setDraft] = useState(EMPTY);
  const update = useCallback((patch) => setDraft((d) => ({ ...d, ...patch })), []);
  const reset = useCallback(() => setDraft(EMPTY), []);
  const value = useMemo(() => ({ draft, update, reset }), [draft, update, reset]);
  return <SignupContext.Provider value={value}>{children}</SignupContext.Provider>;
}
