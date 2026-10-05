import { createContext } from 'react';

// The auth context object. The provider lives in AuthProvider.jsx and the hook in hooks/useAuth.js.
export const AuthContext = createContext(null);
