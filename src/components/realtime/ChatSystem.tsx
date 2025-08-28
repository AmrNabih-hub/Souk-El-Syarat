/**
 * Real-time Chat System Component
 * Provides instant messaging with real-time updates
 */

import React, { useState, useEffect, useRef } from 'react';
import { useRealtimeStore } from '@/stores/realtimeStore';
import { useAuthStore } from '@/stores/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { 
  ChatBubbleLeftRightIcon, 
  PaperAirplaneIcon,
  XMarkIcon,
  PhotoIcon,
  PaperClipIcon 
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { useAppStore } from '@/stores/appStore';
import UserPresenceIndicator from './UserPresenceIndicator';

interface ChatWindowProps {
  recipientId: string;
  recipientName: string;
  onClose: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ recipientId, recipientName, onClose }) => {
  const { user } = useAuthStore();
  const { language } = useAppStore();
  const { activeChats, sendMessage, typingUsers, setTypingStatus } = useRealtimeStore();
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const locale = language === 'ar' ? ar : enUS;
  const chatMessages = activeChats[recipientId] || [];
  const isRecipientTyping = typingUsers[recipientId]?.includes(recipientId);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleTyping = (value: string) => {
    setMessage(value);
    
    if (!isTyping && value.length > 0) {
      setIsTyping(true);
      setTypingStatus(recipientId, user?.id || '', true);
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        setTypingStatus(recipientId, user?.id || '', false);
      }
    }, 1000);
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !user) return;
    
    await sendMessage(recipientId, message);
    setMessage('');
    setIsTyping(false);
    setTypingStatus(recipientId, user?.id || '', false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed bottom-4 right-4 w-96 h-[500px] bg-white rounded-lg shadow-2xl z-50 flex flex-col"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-lg font-semibold">
                {recipientName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="font-semibold">{recipientName}</h3>
              <UserPresenceIndicator userId={recipientId} showText={false} size="sm" />
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {chatMessages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>{language === 'ar' ? 'ابدأ المحادثة' : 'Start a conversation'}</p>
          </div>
        ) : (
          <>
            {chatMessages.map((msg) => {
              const isOwn = msg.senderId === user?.id;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] ${
                    isOwn 
                      ? 'bg-primary-500 text-white' 
                      : 'bg-gray-100 text-gray-900'
                  } rounded-lg px-4 py-2`}>
                    <p className="text-sm">{msg.message}</p>
                    <p className={`text-xs mt-1 ${
                      isOwn ? 'text-white/70' : 'text-gray-500'
                    }`}>
                      {formatDistanceToNow(new Date(msg.timestamp), {
                        addSuffix: true,
                        locale
                      })}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </>
        )}
        
        {/* Typing Indicator */}
        {isRecipientTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <div className="flex space-x-1">
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, delay: 0 }}
                  className="w-2 h-2 bg-gray-400 rounded-full"
                />
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, delay: 0.1 }}
                  className="w-2 h-2 bg-gray-400 rounded-full"
                />
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, delay: 0.2 }}
                  className="w-2 h-2 bg-gray-400 rounded-full"
                />
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t p-4">
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <button className="text-gray-500 hover:text-gray-700">
            <PhotoIcon className="w-5 h-5" />
          </button>
          <button className="text-gray-500 hover:text-gray-700">
            <PaperClipIcon className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={message}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={language === 'ar' ? 'اكتب رسالة...' : 'Type a message...'}
            className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className={`p-2 rounded-lg transition-colors ${
              message.trim() 
                ? 'bg-primary-500 text-white hover:bg-primary-600' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

const ChatSystem: React.FC = () => {
  const [activeChatWindows, setActiveChatWindows] = useState<Array<{
    id: string;
    name: string;
  }>>([]);
  const { unreadMessages } = useRealtimeStore();
  const { language } = useAppStore();

  const totalUnread = Object.values(unreadMessages).reduce((sum, count) => sum + count, 0);

  const openChat = (recipientId: string, recipientName: string) => {
    if (!activeChatWindows.find(chat => chat.id === recipientId)) {
      setActiveChatWindows([...activeChatWindows, { id: recipientId, name: recipientName }]);
    }
  };

  const closeChat = (recipientId: string) => {
    setActiveChatWindows(activeChatWindows.filter(chat => chat.id !== recipientId));
  };

  return (
    <>
      {/* Chat Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-4 left-4 bg-primary-500 text-white p-4 rounded-full shadow-lg z-40"
        onClick={() => {
          // This would open a chat list or start a new chat
          console.log('Open chat list');
        }}
      >
        <ChatBubbleLeftRightIcon className="w-6 h-6" />
        {totalUnread > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center"
          >
            {totalUnread > 9 ? '9+' : totalUnread}
          </motion.span>
        )}
      </motion.button>

      {/* Active Chat Windows */}
      <AnimatePresence>
        {activeChatWindows.map((chat, index) => (
          <div
            key={chat.id}
            style={{
              right: `${(index * 410) + 20}px`,
              bottom: '20px',
              position: 'fixed',
              zIndex: 50 + index
            }}
          >
            <ChatWindow
              recipientId={chat.id}
              recipientName={chat.name}
              onClose={() => closeChat(chat.id)}
            />
          </div>
        ))}
      </AnimatePresence>
    </>
  );
};

export default ChatSystem;