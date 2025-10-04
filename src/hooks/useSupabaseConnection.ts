/**
 * 🔗 Supabase Connection Hook
 * Monitor connection status without UI interference
 */

import { useState, useEffect } from 'react';
import { connectionService } from '@/services/supabase-connection.service';

interface ConnectionState {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  lastChecked: Date | null;
}

export const useSupabaseConnection = (autoCheck = false) => {
  const [state, setState] = useState<ConnectionState>({
    isConnected: false,
    isLoading: false,
    error: null,
    lastChecked: null,
  });

  const checkConnection = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await connectionService.getHealthStatus();
      
      setState({
        isConnected: result.connected,
        isLoading: false,
        error: result.error || null,
        lastChecked: new Date(),
      });

      // Log connection status for development only
      if (process.env.NODE_ENV === 'development') {
        if (result.connected) {
          console.log('✅ Supabase connection healthy');
        } else {
          console.warn('⚠️ Supabase connection issue -', result.error || 'Please check your configuration');
          console.warn('⚠️ Running in development mode with limited functionality');
        }
      }

      return result.connected;
    } catch (error: any) {
      setState({
        isConnected: false,
        isLoading: false,
        error: error.message,
        lastChecked: new Date(),
      });

      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Supabase connection issue -', error.message);
      }

      return false;
    }
  };

  useEffect(() => {
    if (autoCheck) {
      checkConnection();
      
      // Check periodically in background (every 30 seconds)
      const interval = setInterval(checkConnection, 30000);
      return () => clearInterval(interval);
    }
  }, [autoCheck]);

  return {
    ...state,
    checkConnection,
    refresh: checkConnection,
  };
};

export default useSupabaseConnection;