import { useContext } from 'react';
import { SignupContext } from '../context/signupState.js';

export const useSignup = () => useContext(SignupContext);
