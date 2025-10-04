import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { SupabaseProvider } from '@/contexts/SupabaseContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { RealtimeProvider } from '@/contexts/RealtimeContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <ThemeProvider defaultTheme="light" storageKey="souk-theme">
      <SupabaseProvider>
        <AuthProvider>
          <RealtimeProvider>
            {children}
          </RealtimeProvider>
        </AuthProvider>
      </SupabaseProvider>
    </ThemeProvider>
  </BrowserRouter>
);

export default Providers;
