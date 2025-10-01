/**
 * Chat Window Component
 * Real-time messaging interface
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PaperAirplaneIcon,
  PhotoIcon,
  XMarkIcon,
  EllipsisVerticalIcon,
} from '@heroicons/react/24/outline';
import { chatService } from '@/services/chat.service';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import type { ChatMessage, User } from '@/types';
import { format } from 'date-fns';

interface ChatWindowProps {
  recipient: User;
  onClose: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ recipient, onClose }) => {
  const { user } = useAuthStore();
  const { language } = useAppStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const conversationId = chatService['generateConversationId'](user!.id, recipient.id);

  useEffect(() => {
    loadMessages();

    // Subscribe to new messages
    const unsubscribe = chatService.subscribeToMessages(conversationId, (message) => {
      setMessages(prev => [...prev, message]);
      markAsRead();
    });

    return unsubscribe;
  }, [conversationId]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    try {
      const msgs = await chatService.getMessages(conversationId);
      setMessages(msgs.reverse()); // Oldest first
      await markAsRead();
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const markAsRead = async () => {
    await chatService.markAsRead(conversationId, user!.id);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      const message = await chatService.sendMessage(
        conversationId,
        user!.id,
        recipient.id,
        newMessage.trim()
      );

      setMessages(prev => [...prev, message]);
      setNewMessage('');
      inputRef.current?.focus();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      chatService.sendTypingIndicator(conversationId, user!.id);
      
      setTimeout(() => setIsTyping(false), 3000);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await chatService.uploadAttachment(file);
      await chatService.sendMessage(
        conversationId,
        user!.id,
        recipient.id,
        language === 'ar' ? 'أرسل ملف' : 'Sent a file',
        [url]
      );
    } catch (error) {
      console.error('Failed to upload file:', error);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 rtl:right-auto rtl:left-4 w-96 h-[600px] bg-white dark:bg-neutral-800 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-700 flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700 bg-gradient-to-r from-primary-500 to-secondary-500">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-neutral-300 dark:bg-neutral-600 flex items-center justify-center text-white font-bold">
            {recipient.displayName?.[0]?.toUpperCase() || 'U'}
          </div>
          
          {/* Name and status */}
          <div>
            <h3 className="font-semibold text-white">
              {recipient.displayName}
            </h3>
            <p className="text-xs text-white/80">
              {recipient.role === 'vendor' 
                ? (language === 'ar' ? 'تاجر' : 'Vendor')
                : (language === 'ar' ? 'عميل' : 'Customer')
              }
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <EllipsisVerticalIcon className="w-5 h-5 text-white" />
          </button>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => {
            const isMine = message.senderId === user?.id;

            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                    isMine
                      ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white'
                      : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100'
                  }`}
                >
                  <p className="text-sm break-words">{message.content}</p>
                  
                  {/* Attachments */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {message.attachments.map((url, idx) => (
                        <img
                          key={idx}
                          src={url}
                          alt="Attachment"
                          className="rounded-lg max-w-full h-auto"
                        />
                      ))}
                    </div>
                  )}

                  {/* Timestamp */}
                  <p className={`text-xs mt-1 ${isMine ? 'text-white/70' : 'text-neutral-500'}`}>
                    {format(new Date(message.timestamp), 'HH:mm')}
                    {isMine && message.read && ' ✓✓'}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span>{language === 'ar' ? 'يكتب...' : 'typing...'}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-neutral-200 dark:border-neutral-700">
        <div className="flex items-end gap-2">
          {/* File upload */}
          <label className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg cursor-pointer transition-colors">
            <PhotoIcon className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileUpload}
            />
          </label>

          {/* Text input */}
          <textarea
            ref={inputRef}
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onKeyPress={handleKeyPress}
            placeholder={language === 'ar' ? 'اكتب رسالة...' : 'Type a message...'}
            className="flex-1 resize-none bg-neutral-100 dark:bg-neutral-700 border-0 rounded-lg px-4 py-2 max-h-24 focus:outline-none focus:ring-2 focus:ring-primary-500 text-neutral-900 dark:text-neutral-100"
            rows={1}
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          />

          {/* Send button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            className="p-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg hover:from-primary-700 hover:to-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
