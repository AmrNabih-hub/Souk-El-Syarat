/**
 * Notification Panel Component
 * Shows real-time notifications with badge
 * Professional UI with animations
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BellIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import { NotificationService, Notification } from '@/services/notification.service';
import { RealtimeWorkflowService } from '@/services/realtime-workflow.service';
import { Link } from 'react-router-dom';

const NotificationPanel: React.FC = () => {
  const { user } = useAuthStore();
  const { language } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Load notifications
  useEffect(() => {
    if (!user?.id) return;

    async function loadNotifications() {
      setLoading(true);
      const data = await NotificationService.getUserNotifications(user!.id);
      setNotifications(data);
      
      const count = await NotificationService.getUnreadCount(user!.id);
      setUnreadCount(count);
      setLoading(false);
    }

    loadNotifications();
  }, [user?.id]);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = RealtimeWorkflowService.subscribeToUserNotifications(
      user.id,
      {
        onInsert: (newNotification) => {
          console.log('[NotificationPanel] New notification received:', newNotification);
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Play notification sound
          const audio = new Audio('/notification.mp3');
          audio.play().catch(() => console.log('Audio playback failed'));
        },
        onUpdate: (updatedNotification) => {
          setNotifications(prev =>
            prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
          );
        }
      }
    );

    return () => unsubscribe();
  }, [user?.id]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (notificationId: string) => {
    await NotificationService.markAsRead(notificationId);
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;
    await NotificationService.markAllAsRead(user.id);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  if (!user) return null;

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Icon with Badge */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-neutral-600 hover:text-primary-600 transition-colors"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title={language === 'ar' ? 'الإشعارات' : 'Notifications'}
      >
        <BellIcon className="w-6 h-6" />
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <motion.span
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </motion.button>

      {/* Notification Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-2xl border border-neutral-200 z-50"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-200">
              <h3 className="font-bold text-lg">
                {language === 'ar' ? 'الإشعارات' : 'Notifications'}
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  {language === 'ar' ? 'تحديد الكل كمقروء' : 'Mark all as read'}
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-neutral-500">
                  {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-neutral-500">
                  <BellIcon className="w-12 h-12 mx-auto mb-2 text-neutral-300" />
                  <p>{language === 'ar' ? 'لا توجد إشعارات' : 'No notifications'}</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    className={`p-4 border-b border-neutral-100 hover:bg-neutral-50 transition-colors ${
                      !notification.read ? 'bg-primary-50/30' : ''
                    }`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Notification Icon */}
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                        !notification.read ? 'bg-primary-600' : 'bg-neutral-300'
                      }`} />

                      <div className="flex-1 min-w-0">
                        {/* Title */}
                        <h4 className={`font-semibold text-sm mb-1 ${
                          !notification.read ? 'text-neutral-900' : 'text-neutral-600'
                        }`}>
                          {notification.title}
                        </h4>

                        {/* Message */}
                        <p className="text-sm text-neutral-600 mb-2">
                          {notification.message}
                        </p>

                        {/* Time */}
                        <p className="text-xs text-neutral-400">
                          {new Date(notification.created_at).toLocaleDateString(
                            language === 'ar' ? 'ar-EG' : 'en-US',
                            { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
                          )}
                        </p>

                        {/* Action Link */}
                        {notification.link && (
                          <Link
                            to={notification.link}
                            className="inline-block mt-2 text-xs text-primary-600 hover:text-primary-700 font-medium"
                            onClick={() => {
                              handleMarkAsRead(notification.id);
                              setIsOpen(false);
                            }}
                          >
                            {language === 'ar' ? 'عرض التفاصيل →' : 'View details →'}
                          </Link>
                        )}
                      </div>

                      {/* Mark as Read Button */}
                      {!notification.read && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="p-1 hover:bg-neutral-200 rounded transition-colors flex-shrink-0"
                          title={language === 'ar' ? 'تحديد كمقروء' : 'Mark as read'}
                        >
                          <CheckIcon className="w-4 h-4 text-neutral-400" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-neutral-200 text-center">
                <Link
                  to="/notifications"
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  {language === 'ar' ? 'عرض جميع الإشعارات' : 'View all notifications'}
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationPanel;
