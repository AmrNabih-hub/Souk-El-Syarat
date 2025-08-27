/**
 * Real-time Notification Center Component
 * Displays real-time notifications with live updates
 */

import React, { useState } from 'react';
import { useRealtimeStore } from '@/stores/realtimeStore';
import { motion, AnimatePresence } from 'framer-motion';
import { BellIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { useAppStore } from '@/stores/appStore';

const NotificationCenter: React.FC = () => {
  const { notifications, unreadNotifications, markNotificationAsRead, clearNotifications } = useRealtimeStore();
  const { language } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);

  const locale = language === 'ar' ? ar : enUS;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order_update':
        return '📦';
      case 'message':
        return '💬';
      case 'system':
        return '🔔';
      case 'payment_received':
        return '💰';
      case 'product_approved':
        return '✅';
      default:
        return '📢';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'order_update':
        return 'bg-blue-100 text-blue-800';
      case 'message':
        return 'bg-purple-100 text-purple-800';
      case 'system':
        return 'bg-gray-100 text-gray-800';
      case 'payment_received':
        return 'bg-green-100 text-green-800';
      case 'product_approved':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-primary-600 transition-colors"
      >
        <BellIcon className="w-6 h-6" />
        {unreadNotifications > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-accent-500 text-white text-xs rounded-full flex items-center justify-center"
          >
            {unreadNotifications > 9 ? '9+' : unreadNotifications}
          </motion.span>
        )}
      </motion.button>

      {/* Notification Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">
                    {language === 'ar' ? 'الإشعارات' : 'Notifications'}
                  </h3>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    {notifications.length > 0 && (
                      <button
                        onClick={clearNotifications}
                        className="text-white/80 hover:text-white text-sm"
                      >
                        {language === 'ar' ? 'مسح الكل' : 'Clear All'}
                      </button>
                    )}
                    <button
                      onClick={() => setIsOpen(false)}
                      className="text-white/80 hover:text-white"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Notifications List */}
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <BellIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>{language === 'ar' ? 'لا توجد إشعارات' : 'No notifications'}</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => markNotificationAsRead(notification.id)}
                        className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                          !notification.read ? 'bg-blue-50/30' : ''
                        }`}
                      >
                        <div className="flex items-start space-x-3 rtl:space-x-reverse">
                          <span className="text-2xl">
                            {getNotificationIcon(notification.type)}
                          </span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                getNotificationColor(notification.type)
                              }`}>
                                {notification.type.replace('_', ' ')}
                              </span>
                              {!notification.read && (
                                <span className="w-2 h-2 bg-blue-500 rounded-full" />
                              )}
                            </div>
                            <h4 className="font-medium text-gray-900 mb-1">
                              {notification.title}
                            </h4>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {notification.body}
                            </p>
                            <p className="text-xs text-gray-400 mt-2">
                              {formatDistanceToNow(new Date(notification.createdAt), {
                                addSuffix: true,
                                locale
                              })}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="bg-gray-50 p-3 text-center border-t">
                  <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                    {language === 'ar' ? 'عرض جميع الإشعارات' : 'View All Notifications'}
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;