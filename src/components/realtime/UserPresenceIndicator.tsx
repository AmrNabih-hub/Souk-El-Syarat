/**
 * Real-time User Presence Indicator Component
 * Shows user online/offline status in real-time
 */

import React from 'react';
import { useRealtimeStore } from '@/stores/realtimeStore';
import { motion } from 'framer-motion';

interface UserPresenceIndicatorProps {
  userId: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const UserPresenceIndicator: React.FC<UserPresenceIndicatorProps> = ({ 
  userId, 
  showText = true,
  size = 'md' 
}) => {
  const { onlineUsers } = useRealtimeStore();
  const userPresence = onlineUsers[userId];
  
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const isOnline = userPresence?.status === 'online';
  const isAway = userPresence?.status === 'away';

  return (
    <div className="flex items-center space-x-2 rtl:space-x-reverse">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={`${sizeClasses[size]} rounded-full relative`}
      >
        <div className={`absolute inset-0 rounded-full ${
          isOnline ? 'bg-green-500' : 
          isAway ? 'bg-yellow-500' : 
          'bg-gray-400'
        }`} />
        {isOnline && (
          <motion.div
            className="absolute inset-0 rounded-full bg-green-500"
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ opacity: 0.3 }}
          />
        )}
      </motion.div>
      
      {showText && (
        <span className="text-sm text-gray-600">
          {isOnline ? 'متصل الآن' : isAway ? 'بعيد' : 'غير متصل'}
        </span>
      )}
      
      {userPresence?.currentPage && showText && (
        <span className="text-xs text-gray-500">
          ({userPresence.currentPage})
        </span>
      )}
    </div>
  );
};

export default UserPresenceIndicator;