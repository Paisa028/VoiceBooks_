import { useContext } from 'react';
import { AuthContext } from '../context/authState.js';

export const useAuth = () => useContext(AuthContext);
