import React, { createContext, useContext, useCallback } from 'react';

type RealtimeCallback = (data: any) => void;

interface RealtimeContextType {
  subscribeToUpdates: (topic: string, cb: RealtimeCallback) => void;
  unsubscribeFromUpdates: (topic: string) => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Minimal no-op implementation to keep app running during early integration
  const subscribeToUpdates = useCallback((topic: string, cb: RealtimeCallback) => {
    // TODO: Replace with real realtime subscription (WebSocket/Amplify PubSub)
    console.debug('[Realtime] Subscribed to', topic);
  }, []);

  const unsubscribeFromUpdates = useCallback((topic: string) => {
    // TODO: Replace with real unsubscribe logic
    console.debug('[Realtime] Unsubscribed from', topic);
  }, []);

  return (
    <RealtimeContext.Provider value={{ subscribeToUpdates, unsubscribeFromUpdates }}>
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => {
  const ctx = useContext(RealtimeContext);
  if (!ctx) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return ctx;
};

export default RealtimeContext;
