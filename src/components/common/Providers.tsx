import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { RealtimeProvider } from '@/contexts/RealtimeContext';

export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      <RealtimeProvider>
        {children}
      </RealtimeProvider>
    </AuthProvider>
  </BrowserRouter>
);

export default Providers;
