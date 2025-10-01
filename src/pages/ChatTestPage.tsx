import React from 'react';
import { motion } from 'framer-motion';
import { useChatStore, simulateIncomingMessage } from '@/stores/chatStore';
import { useAppStore } from '@/stores/appStore';
import { 
  PlusIcon, 
  MinusIcon, 
  ArrowPathIcon,
  CheckIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

/**
 * Chat Test Page
 * For testing the real-time notification badge
 * This page is for development/testing only
 */
const ChatTestPage: React.FC = () => {
  const { language } = useAppStore();
  const { 
    unreadCount, 
    incrementUnread, 
    decrementUnread, 
    resetUnread, 
    setUnreadCount,
    isAgentOnline,
    setAgentOnline
  } = useChatStore();

  const handleSimulateMessage = () => {
    simulateIncomingMessage();
  };

  const handleMultipleMessages = () => {
    // Simulate receiving 5 messages
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        simulateIncomingMessage();
      }, i * 500);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-neutral-900 dark:to-neutral-800 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-4">
            <ChatBubbleLeftRightIcon className="w-12 h-12 text-primary-500" />
          </div>
          <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-4">
            {language === 'ar' ? 'اختبار الدردشة' : 'Chat Test Page'}
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            {language === 'ar' 
              ? 'استخدم هذه الصفحة لاختبار عداد الإشعارات في الوقت الفعلي'
              : 'Use this page to test the real-time notification counter'}
          </p>
        </motion.div>

        {/* Current Count Display */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-neutral-800 rounded-2xl shadow-xl p-8 mb-8"
        >
          <div className="text-center">
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">
              {language === 'ar' ? 'عدد الرسائل غير المقروءة' : 'Unread Messages'}
            </p>
            <motion.div
              key={unreadCount}
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-6xl font-bold bg-gradient-to-r from-primary-500 to-secondary-600 bg-clip-text text-transparent"
            >
              {unreadCount}
            </motion.div>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-2">
              {language === 'ar' 
                ? 'انظر إلى زر الدردشة أسفل اليمين' 
                : 'Check the chat button at bottom-right'}
            </p>
          </div>
        </motion.div>

        {/* Control Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Increment Button */}
          <motion.button
            onClick={incrementUnread}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-3 rtl:space-x-reverse"
          >
            <PlusIcon className="w-6 h-6" />
            <span className="font-semibold">
              {language === 'ar' ? 'زيادة (+1)' : 'Increment (+1)'}
            </span>
          </motion.button>

          {/* Decrement Button */}
          <motion.button
            onClick={decrementUnread}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-3 rtl:space-x-reverse"
          >
            <MinusIcon className="w-6 h-6" />
            <span className="font-semibold">
              {language === 'ar' ? 'تقليل (-1)' : 'Decrement (-1)'}
            </span>
          </motion.button>

          {/* Reset Button */}
          <motion.button
            onClick={resetUnread}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-3 rtl:space-x-reverse"
          >
            <ArrowPathIcon className="w-6 h-6" />
            <span className="font-semibold">
              {language === 'ar' ? 'إعادة تعيين (0)' : 'Reset (0)'}
            </span>
          </motion.button>

          {/* Mark as Read Button */}
          <motion.button
            onClick={resetUnread}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-3 rtl:space-x-reverse"
          >
            <CheckIcon className="w-6 h-6" />
            <span className="font-semibold">
              {language === 'ar' ? 'تحديد كمقروء' : 'Mark as Read'}
            </span>
          </motion.button>
        </div>

        {/* Simulate Messages */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-neutral-800 rounded-2xl shadow-xl p-6"
        >
          <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">
            {language === 'ar' ? 'محاكاة الرسائل الواردة' : 'Simulate Incoming Messages'}
          </h3>
          
          <div className="space-y-3">
            <button
              onClick={handleSimulateMessage}
              className="w-full bg-gradient-to-r from-primary-500 to-secondary-600 text-white rounded-xl py-4 px-6 font-semibold hover:shadow-lg transition-all"
            >
              {language === 'ar' ? '📨 استلام رسالة واحدة' : '📨 Receive 1 Message'}
            </button>

            <button
              onClick={handleMultipleMessages}
              className="w-full bg-gradient-to-r from-secondary-500 to-primary-600 text-white rounded-xl py-4 px-6 font-semibold hover:shadow-lg transition-all"
            >
              {language === 'ar' ? '📨 استلام 5 رسائل' : '📨 Receive 5 Messages'}
            </button>

            <div className="flex gap-3">
              <button
                onClick={() => setUnreadCount(10)}
                className="flex-1 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-xl py-3 px-4 font-semibold hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-all"
              >
                {language === 'ar' ? 'تعيين: 10' : 'Set: 10'}
              </button>
              
              <button
                onClick={() => setUnreadCount(50)}
                className="flex-1 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-xl py-3 px-4 font-semibold hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-all"
              >
                {language === 'ar' ? 'تعيين: 50' : 'Set: 50'}
              </button>
              
              <button
                onClick={() => setUnreadCount(100)}
                className="flex-1 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-xl py-3 px-4 font-semibold hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-all"
              >
                {language === 'ar' ? 'تعيين: 100' : 'Set: 100'}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Agent Status Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-neutral-800 rounded-2xl shadow-xl p-6 mt-8"
        >
          <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">
            {language === 'ar' ? 'حالة الوكيل' : 'Agent Status'}
          </h3>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <span className={`w-3 h-3 rounded-full ${isAgentOnline ? 'bg-green-400' : 'bg-gray-400'}`} />
              <span className="text-neutral-700 dark:text-neutral-300 font-medium">
                {isAgentOnline 
                  ? (language === 'ar' ? 'متصل' : 'Online')
                  : (language === 'ar' ? 'غير متصل' : 'Offline')
                }
              </span>
            </div>
            
            <button
              onClick={() => setAgentOnline(!isAgentOnline)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                isAgentOnline
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {isAgentOnline
                ? (language === 'ar' ? 'قطع الاتصال' : 'Go Offline')
                : (language === 'ar' ? 'الاتصال' : 'Go Online')
              }
            </button>
          </div>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 p-6 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-700 rounded-xl"
        >
          <h4 className="font-bold text-primary-800 dark:text-primary-300 mb-2">
            {language === 'ar' ? '💡 كيفية الاستخدام:' : '💡 How to use:'}
          </h4>
          <ul className="text-sm text-primary-700 dark:text-primary-400 space-y-2">
            <li>
              {language === 'ar' 
                ? '• استخدم الأزرار أعلاه لتغيير عدد الرسائل غير المقروءة'
                : '• Use the buttons above to change the unread message count'}
            </li>
            <li>
              {language === 'ar'
                ? '• لاحظ التحديث الفوري للشارة على زر الدردشة (أسفل اليمين)'
                : '• Watch the badge on the chat button (bottom-right) update instantly'}
            </li>
            <li>
              {language === 'ar'
                ? '• افتح نافذة الدردشة لإعادة تعيين العداد تلقائياً'
                : '• Open the chat window to automatically reset the counter'}
            </li>
            <li>
              {language === 'ar'
                ? '• الأرقام فوق 99 تظهر كـ "99+"'
                : '• Numbers above 99 display as "99+"'}
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
};

export default ChatTestPage;

