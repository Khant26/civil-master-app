import { createContext, useContext } from 'react';

// Auth context object + hook (kept separate from the provider component so
// React Fast Refresh works for AuthContext.jsx).
export const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
