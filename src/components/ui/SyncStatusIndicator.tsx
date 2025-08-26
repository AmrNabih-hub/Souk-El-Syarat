import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CloudIcon, 
  CloudArrowUpIcon, 
  ExclamationTriangleIcon,
  WifiIcon,
  SignalSlashIcon
} from '@heroicons/react/24/outline';
import { useAppStore } from '@/stores/appStore';
import clsx from 'clsx';

interface SyncStatusIndicatorProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({ 
  size = 'md', 
  showLabel = false,
  className 
}) => {
  const { syncStatus, isOnline, lastSyncTime } = useAppStore();

  const getSyncStatusConfig = () => {
    if (!isOnline) {
      return {
        icon: SignalSlashIcon,
        color: 'text-red-500',
        bgColor: 'bg-red-50',
        label: 'غير متصل',
        description: 'لا يوجد اتصال بالإنترنت'
      };
    }

    switch (syncStatus) {
      case 'syncing':
        return {
          icon: CloudArrowUpIcon,
          color: 'text-blue-500',
          bgColor: 'bg-blue-50',
          label: 'يتم المزامنة...',
          description: 'جاري مزامنة البيانات'
        };
      case 'synced':
        return {
          icon: CloudIcon,
          color: 'text-green-500',
          bgColor: 'bg-green-50',
          label: 'متزامن',
          description: lastSyncTime ? `آخر مزامنة: ${formatTime(lastSyncTime)}` : 'البيانات متزامنة'
        };
      case 'error':
        return {
          icon: ExclamationTriangleIcon,
          color: 'text-red-500',
          bgColor: 'bg-red-50',
          label: 'خطأ في المزامنة',
          description: 'فشل في مزامنة البيانات'
        };
      default:
        return {
          icon: WifiIcon,
          color: 'text-gray-500',
          bgColor: 'bg-gray-50',
          label: 'في الانتظار',
          description: 'في انتظار المزامنة'
        };
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `${minutes} د`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} س`;
    return date.toLocaleDateString('ar-EG');
  };

  const config = getSyncStatusConfig();
  const IconComponent = config.icon;
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const containerSizeClasses = {
    sm: 'p-1',
    md: 'p-2',
    lg: 'p-3'
  };

  return (
    <motion.div
      className={clsx(
        'flex items-center space-x-2 space-x-reverse rounded-lg transition-all duration-200',
        config.bgColor,
        containerSizeClasses[size],
        className
      )}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      title={config.description}
    >
      <div className="relative">
        <IconComponent 
          className={clsx(
            sizeClasses[size],
            config.color
          )}
        />
        
        {/* Animated sync indicator */}
        <AnimatePresence>
          {syncStatus === 'syncing' && (
            <motion.div
              className="absolute -inset-1 rounded-full border-2 border-blue-300"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: [0.8, 1.2, 0.8],
                opacity: [0, 0.6, 0]
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {showLabel && (
        <motion.span 
          className={clsx(
            'text-sm font-medium',
            config.color,
            size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {config.label}
        </motion.span>
      )}
    </motion.div>
  );
};

export default SyncStatusIndicator;