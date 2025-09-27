import React from 'react';
import { RenderOptions, render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { RealtimeProvider } from '../contexts/RealtimeContext';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

export const AllProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <RealtimeProvider>
        <BrowserRouter>{children}</BrowserRouter>
      </RealtimeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export const renderWithProviders = (ui: React.ReactElement, options?: RenderOptions) =>
  render(ui, { wrapper: AllProviders as React.ComponentType<any>, ...options });

export * from '@testing-library/react';
export { renderWithProviders as render }; // encourage using the providers-aware render
