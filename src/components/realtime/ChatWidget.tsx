/**
 * 🚀 REAL-TIME CHAT WIDGET COMPONENT
 * Souk El-Sayarat - Professional Messaging Interface
 * 
 * This component provides a real-time chat interface
 * for customer-vendor communication
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
  FaceSmileIcon,
  CheckIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { useRealtimeStore } from '@/stores/realtimeStore';
import { realtimeInfrastructure } from '@/services/realtime-infrastructure.service';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: number;
  read: boolean;
  delivered: boolean;
  type: 'text' | 'image' | 'file' | 'product';
  metadata?: any;
}

interface ChatConversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  participantRole: string;
  lastMessage: string;
  lastMessageTime: number;
  unreadCount: number;
  isOnline: boolean;
  isTyping: boolean;
}

export const ChatWidget: React.FC = () => {
  const { user } = useAuthStore();
  const { realtimeMessages, realtimePresence } = useRealtimeStore();
  
  const [isOpen, setIsOpen] = useState(false);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversations
  useEffect(() => {
    if (!user) return;

    // Mock conversations for demonstration
    const mockConversations: ChatConversation[] = [
      {
        id: 'conv-1',
        participantId: 'vendor-1',
        participantName: 'محل قطع الغيار الأصلية',
        participantAvatar: 'https://ui-avatars.com/api/?name=Auto+Parts&background=f59e0b&color=fff',
        participantRole: 'vendor',
        lastMessage: 'نعم، القطعة متوفرة لدينا',
        lastMessageTime: Date.now() - 3600000,
        unreadCount: 2,
        isOnline: true,
        isTyping: false
      },
      {
        id: 'conv-2',
        participantId: 'support-1',
        participantName: 'دعم العملاء',
        participantAvatar: 'https://ui-avatars.com/api/?name=Support&background=0ea5e9&color=fff',
        participantRole: 'support',
        lastMessage: 'كيف يمكنني مساعدتك؟',
        lastMessageTime: Date.now() - 7200000,
        unreadCount: 0,
        isOnline: true,
        isTyping: false
      }
    ];

    setConversations(mockConversations);
  }, [user]);

  // Load messages for active conversation
  useEffect(() => {
    if (!activeConversation) return;

    // Mock messages for demonstration
    const mockMessages: ChatMessage[] = [
      {
        id: 'msg-1',
        senderId: 'vendor-1',
        senderName: 'محل قطع الغيار الأصلية',
        content: 'أهلاً بك! كيف يمكنني مساعدتك؟',
        timestamp: Date.now() - 7200000,
        read: true,
        delivered: true,
        type: 'text'
      },
      {
        id: 'msg-2',
        senderId: user?.id || 'user',
        senderName: 'أنت',
        content: 'هل لديكم فلتر زيت لسيارة تويوتا كامري 2020؟',
        timestamp: Date.now() - 3600000,
        read: true,
        delivered: true,
        type: 'text'
      },
      {
        id: 'msg-3',
        senderId: 'vendor-1',
        senderName: 'محل قطع الغيار الأصلية',
        content: 'نعم، القطعة متوفرة لدينا',
        timestamp: Date.now() - 1800000,
        read: false,
        delivered: true,
        type: 'text'
      },
      {
        id: 'msg-4',
        senderId: 'vendor-1',
        senderName: 'محل قطع الغيار الأصلية',
        content: 'السعر 250 جنيه مصري',
        timestamp: Date.now() - 900000,
        read: false,
        delivered: true,
        type: 'text'
      }
    ];

    setMessages(mockMessages);
  }, [activeConversation, user]);

  // Send message
  const sendMessage = useCallback(async () => {
    if (!inputMessage.trim() || !activeConversation || !user) return;

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: user.id,
      senderName: 'أنت',
      content: inputMessage,
      timestamp: Date.now(),
      read: false,
      delivered: false,
      type: 'text'
    };

    // Add message optimistically
    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');

    // Send via real-time infrastructure
    try {
      const conversation = conversations.find(c => c.id === activeConversation);
      if (conversation) {
        await realtimeInfrastructure.sendMessage({
          chatId: activeConversation,
          senderId: user.id,
          receiverId: conversation.participantId,
          content: inputMessage,
          type: 'text',
          read: false
        });
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, [inputMessage, activeConversation, user, conversations]);

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      // Notify other user that we're typing
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      // Notify other user that we stopped typing
    }, 2000);
  }, [isTyping]);

  // Mark messages as read
  const markMessagesAsRead = useCallback(async (conversationId: string) => {
    const unreadMessages = messages.filter(m => !m.read && m.senderId !== user?.id);
    
    for (const message of unreadMessages) {
      await realtimeInfrastructure.markMessageAsRead(message.id);
    }

    // Update conversation unread count
    setConversations(prev => prev.map(c => 
      c.id === conversationId ? { ...c, unreadCount: 0 } : c
    ));
  }, [messages, user]);

  // Open conversation
  const openConversation = useCallback((conversationId: string) => {
    setActiveConversation(conversationId);
    markMessagesAsRead(conversationId);
  }, [markMessagesAsRead]);

  // Get total unread count
  const totalUnreadCount = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  return (
    <>
      {/* Chat Button */}
      <motion.button
        className="fixed bottom-6 right-6 z-40 bg-primary-500 text-white rounded-full p-4 shadow-lg hover:bg-primary-600 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <ChatBubbleLeftRightIcon className="w-6 h-6" />
        {totalUnreadCount > 0 && (
          <motion.span
            className="absolute -top-2 -right-2 bg-accent-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            {totalUnreadCount}
          </motion.span>
        )}
      </motion.button>

      {/* Chat Widget */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-24 right-6 z-40 bg-white rounded-lg shadow-2xl overflow-hidden"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            style={{ width: '380px', height: '500px' }}
          >
            {/* Header */}
            <div className="bg-primary-500 text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <ChatBubbleLeftRightIcon className="w-6 h-6" />
                <div>
                  <h3 className="font-semibold">المحادثات</h3>
                  {activeConversation && (
                    <p className="text-xs opacity-90">
                      {conversations.find(c => c.id === activeConversation)?.participantName}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-primary-600 rounded p-1 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex h-full">
              {/* Conversations List */}
              {!activeConversation && (
                <div className="flex-1 overflow-y-auto">
                  {conversations.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>لا توجد محادثات</p>
                      <p className="text-sm mt-2">ابدأ محادثة جديدة</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {conversations.map(conv => (
                        <motion.button
                          key={conv.id}
                          className="w-full p-4 hover:bg-gray-50 transition-colors text-right"
                          onClick={() => openConversation(conv.id)}
                          whileHover={{ x: -5 }}
                        >
                          <div className="flex items-start space-x-3 rtl:space-x-reverse">
                            <div className="relative">
                              <img
                                src={conv.participantAvatar}
                                alt={conv.participantName}
                                className="w-10 h-10 rounded-full"
                              />
                              {conv.isOnline && (
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <p className="font-medium text-gray-900 truncate">
                                  {conv.participantName}
                                </p>
                                <span className="text-xs text-gray-500">
                                  {formatDistanceToNow(conv.lastMessageTime, { 
                                    addSuffix: true,
                                    locale: ar 
                                  })}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 truncate">
                                {conv.lastMessage}
                              </p>
                            </div>
                            {conv.unreadCount > 0 && (
                              <span className="bg-accent-500 text-white text-xs rounded-full px-2 py-1 min-w-[24px] text-center">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Chat Messages */}
              {activeConversation && (
                <div className="flex-1 flex flex-col" style={{ height: 'calc(100% - 64px)' }}>
                  {/* Back Button */}
                  <button
                    className="p-3 border-b border-gray-100 text-right hover:bg-gray-50 transition-colors"
                    onClick={() => setActiveConversation(null)}
                  >
                    <span className="text-sm text-primary-500">← رجوع للمحادثات</span>
                  </button>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.map(message => (
                      <motion.div
                        key={message.id}
                        className={`flex ${message.senderId === user?.id ? 'justify-start' : 'justify-end'}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div className={`max-w-[70%] ${
                          message.senderId === user?.id 
                            ? 'bg-primary-500 text-white' 
                            : 'bg-gray-100 text-gray-900'
                        } rounded-lg p-3`}>
                          <p className="text-sm">{message.content}</p>
                          <div className={`flex items-center justify-end space-x-1 rtl:space-x-reverse mt-1 ${
                            message.senderId === user?.id ? 'text-primary-100' : 'text-gray-500'
                          }`}>
                            <span className="text-xs">
                              {new Date(message.timestamp).toLocaleTimeString('ar-EG', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            {message.senderId === user?.id && (
                              <>
                                {message.delivered && <CheckIcon className="w-3 h-3" />}
                                {message.read && <CheckCircleIcon className="w-3 h-3" />}
                              </>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    
                    {/* Typing Indicator */}
                    {conversations.find(c => c.id === activeConversation)?.isTyping && (
                      <motion.div
                        className="flex justify-end"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <div className="bg-gray-100 rounded-lg p-3">
                          <div className="flex space-x-1 rtl:space-x-reverse">
                            <motion.span
                              className="w-2 h-2 bg-gray-400 rounded-full"
                              animate={{ y: [0, -5, 0] }}
                              transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                            />
                            <motion.span
                              className="w-2 h-2 bg-gray-400 rounded-full"
                              animate={{ y: [0, -5, 0] }}
                              transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                            />
                            <motion.span
                              className="w-2 h-2 bg-gray-400 rounded-full"
                              animate={{ y: [0, -5, 0] }}
                              transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="border-t border-gray-100 p-3">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <button className="text-gray-400 hover:text-gray-600 transition-colors">
                        <PaperClipIcon className="w-5 h-5" />
                      </button>
                      <button 
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        onClick={() => setShowEmoji(!showEmoji)}
                      >
                        <FaceSmileIcon className="w-5 h-5" />
                      </button>
                      <input
                        ref={inputRef}
                        type="text"
                        value={inputMessage}
                        onChange={(e) => {
                          setInputMessage(e.target.value);
                          handleTyping();
                        }}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="اكتب رسالتك..."
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500"
                        dir="rtl"
                      />
                      <motion.button
                        className="bg-primary-500 text-white rounded-lg p-2 hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={sendMessage}
                        disabled={!inputMessage.trim()}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <PaperAirplaneIcon className="w-5 h-5 rotate-180" />
                      </motion.button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};