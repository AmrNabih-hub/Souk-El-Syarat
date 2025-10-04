import React, { createContext, useContext, useCallback } from 'react';

type RealtimeCallback = (data: any) => void;

interface RealtimeContextType {
  subscribeToUpdates: (topic: string, cb: RealtimeCallback) => () => void;
  unsubscribeFromUpdates: (topic: string) => void;
  sendMessage: (type: string, data: any) => void;
  isConnected: () => boolean;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const subscribeToUpdates = useCallback((topic: string, cb: RealtimeCallback) => {
    console.log(`📡 Subscribing to ${topic}`);
    
    // Return unsubscribe function
    return () => {
      console.log(`📡 Unsubscribing from ${topic}`);
    };
  }, []);

  const unsubscribeFromUpdates = useCallback((topic: string) => {
    console.log(`📡 Unsubscribing from ${topic}`);
  }, []);

  const sendMessage = useCallback((type: string, data: any) => {
    console.log(`📤 Sending message:`, { type, data });
  }, []);

  const isConnected = useCallback(() => {
    return true; // Always connected for demo
  }, []);

  const value = {
    subscribeToUpdates,
    unsubscribeFromUpdates,
    sendMessage,
    isConnected,
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = (): RealtimeContextType => {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};

export default RealtimeProvider;