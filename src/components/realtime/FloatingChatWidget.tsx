import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChatBubbleLeftRightIcon, 
  XMarkIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import { useAppStore } from '@/stores/appStore';

/**
 * Floating Chat Widget Component
 * Professional expandable chat button that appears as a circle
 * and expands into a full chat interface when clicked
 */
export const FloatingChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { language } = useAppStore();

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            onClick={toggleChat}
            className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-r from-primary-500 to-secondary-600 rounded-full shadow-2xl hover:shadow-primary-500/50 flex items-center justify-center group overflow-hidden"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            {/* Pulse Animation */}
            <span className="absolute inset-0 rounded-full bg-primary-400 animate-ping opacity-20" />
            
            {/* Icon */}
            <ChatBubbleLeftRightIcon className="w-8 h-8 text-white relative z-10" />
            
            {/* Notification Badge (optional) */}
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              3
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Expanded Chat Widget */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-6 right-6 z-50 w-96 h-[32rem] bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            initial={{ scale: 0, opacity: 0, originX: 1, originY: 1 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-primary-500 to-secondary-600 p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <div className="relative">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <ChatBubbleLeftRightIcon className="w-6 h-6 text-white" />
                  </div>
                  {/* Online indicator */}
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">
                    {language === 'ar' ? 'دعم العملاء' : 'Customer Support'}
                  </h3>
                  <p className="text-white/80 text-xs">
                    {language === 'ar' ? 'متصل الآن' : 'Online now'}
                  </p>
                </div>
              </div>
              
              {/* Close Button */}
              <button
                onClick={toggleChat}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Chat Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50 dark:bg-neutral-900">
              {/* Welcome Message */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex justify-start"
              >
                <div className="bg-white dark:bg-neutral-800 rounded-2xl rounded-tl-none px-4 py-3 max-w-[80%] shadow-sm">
                  <p className="text-sm text-neutral-800 dark:text-neutral-200">
                    {language === 'ar' 
                      ? '👋 مرحباً! كيف يمكنني مساعدتك اليوم؟' 
                      : '👋 Hello! How can I help you today?'}
                  </p>
                </div>
              </motion.div>

              {/* Placeholder for when chat is implemented */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex justify-center"
              >
                <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-700 rounded-xl px-4 py-3 max-w-[90%]">
                  <p className="text-xs text-primary-800 dark:text-primary-300 text-center">
                    {language === 'ar' 
                      ? '💬 الدردشة المباشرة قيد التطوير. سيتم تفعيلها قريباً!' 
                      : '💬 Live chat is under development. Coming soon!'}
                  </p>
                </div>
              </motion.div>

              {/* Quick Action Buttons */}
              <div className="space-y-2">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center mb-3">
                  {language === 'ar' ? 'إجراءات سريعة:' : 'Quick Actions:'}
                </p>
                
                {[
                  { 
                    icon: '📦', 
                    text: language === 'ar' ? 'تتبع طلبي' : 'Track my order',
                    action: () => window.location.href = '/orders'
                  },
                  { 
                    icon: '❓', 
                    text: language === 'ar' ? 'الأسئلة الشائعة' : 'FAQ',
                    action: () => window.location.href = '/faq'
                  },
                  { 
                    icon: '📞', 
                    text: language === 'ar' ? 'اتصل بنا' : 'Contact us',
                    action: () => window.location.href = '/contact'
                  },
                ].map((item, index) => (
                  <motion.button
                    key={index}
                    onClick={item.action}
                    className="w-full bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center space-x-3 rtl:space-x-reverse transition-all hover:scale-[1.02] active:scale-[0.98]"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    whileHover={{ x: 5 }}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span>{item.text}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Chat Input Area */}
            <div className="p-4 border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <input
                  type="text"
                  placeholder={language === 'ar' ? 'اكتب رسالتك...' : 'Type your message...'}
                  disabled
                  className="flex-1 bg-neutral-100 dark:bg-neutral-700 border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none placeholder:text-neutral-400 dark:placeholder:text-neutral-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  disabled
                  className="w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-600 rounded-xl flex items-center justify-center text-white hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-2 text-center">
                {language === 'ar' 
                  ? 'سيتم تفعيل الدردشة المباشرة قريباً' 
                  : 'Live chat will be enabled soon'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingChatWidget;

