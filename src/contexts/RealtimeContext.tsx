import React, { createContext, useContext, useCallback, useEffect } from 'react';
import { realTimeService } from '@/services/realtime-websocket.service';

type RealtimeCallback = (data: any) => void;

interface RealtimeContextType {
  subscribeToUpdates: (topic: string, cb: RealtimeCallback) => () => void;
  unsubscribeFromUpdates: (topic: string) => void;
  sendMessage: (type: string, data: any) => void;
  isConnected: () => boolean;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // TEMPORARILY DISABLED - Using Appwrite Realtime instead of custom WebSocket
  const isRealtimeEnabled = false; // import.meta.env.VITE_ENABLE_REAL_TIME === 'true';
  const subscriptionsRef = React.useRef<Map<string, Set<() => void>>>(new Map());

  useEffect(() => {
    if (isRealtimeEnabled) {
      console.log('🔌 Real-time WebSocket service enabled');
    } else {
      console.log('⚠️ Real-time WebSocket service disabled (set VITE_ENABLE_REAL_TIME=true to enable)');
    }

    return () => {
      if (isRealtimeEnabled) {
        // Cleanup all subscriptions
        subscriptionsRef.current.forEach((unsubscribers) => {
          unsubscribers.forEach(unsubscribe => unsubscribe());
        });
        subscriptionsRef.current.clear();
        realTimeService.destroy();
      }
    };
  }, [isRealtimeEnabled]);

  const subscribeToUpdates = useCallback((topic: string, cb: RealtimeCallback) => {
    if (isRealtimeEnabled) {
      console.debug('[Realtime] Subscribed to', topic);
      const unsubscribe = realTimeService.subscribe(topic, cb);
      
      // Track the unsubscribe function
      if (!subscriptionsRef.current.has(topic)) {
        subscriptionsRef.current.set(topic, new Set());
      }
      subscriptionsRef.current.get(topic)!.add(unsubscribe);
      
      return unsubscribe;
    } else {
      console.debug('[Realtime] No-op subscription to', topic, '(real-time disabled)');
      return () => {};
    }
  }, [isRealtimeEnabled]);

  const unsubscribeFromUpdates = useCallback((topic: string) => {
    console.debug('[Realtime] Unsubscribing from', topic);
    const unsubscribers = subscriptionsRef.current.get(topic);
    if (unsubscribers) {
      unsubscribers.forEach(unsubscribe => unsubscribe());
      subscriptionsRef.current.delete(topic);
    }
  }, []);

  const sendMessage = useCallback((type: string, data: any) => {
    if (isRealtimeEnabled) {
      realTimeService.sendMessage(type, data);
    } else {
      console.debug('[Realtime] Message not sent (real-time disabled):', type, data);
    }
  }, [isRealtimeEnabled]);

  const isConnected = useCallback(() => {
    return isRealtimeEnabled ? realTimeService.isSocketConnected() : false;
  }, [isRealtimeEnabled]);

  return (
    <RealtimeContext.Provider value={{ subscribeToUpdates, unsubscribeFromUpdates, sendMessage, isConnected }}>
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
