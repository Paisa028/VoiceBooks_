
import { useCallback, useMemo, useState } from "react";
import { SignupContext } from "./signupState.js";

const createEmptyDraft = () => ({
  account: null,
  role: "",
  business: null,
  authMethod: "password",
  googleCredential: null,
});

export function SignupProvider({ children }) {
  const [draft, setDraft] = useState(createEmptyDraft);

  const update = useCallback((patch) => {
    setDraft((current) => ({
      ...current,
      ...patch,
    }));
  }, []);

  const reset = useCallback(() => {
    setDraft(createEmptyDraft());
  }, []);

  const value = useMemo(
    () => ({
      draft,
      update,
      reset,
    }),
    [draft, update, reset]
  );

  return (
    <SignupContext.Provider value={value}>
      {children}
    </SignupContext.Provider>
  );
}
