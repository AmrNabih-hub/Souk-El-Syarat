import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ChatBubbleLeftIcon, 
  PaperAirplaneIcon, 
  UserCircleIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';

const MessagesPage: React.FC = () => {
  const { user } = useAuthStore();
  const [newMessage, setNewMessage] = useState('');
  const [selectedChat, setSelectedChat] = useState('1');
  
  const [conversations] = useState([
    {
      id: '1',
      vendorName: 'معرض النجمة للسيارات',
      vendorAvatar: '🏪',
      lastMessage: 'السيارة متوفرة ويمكن المعاينة غداً',
      lastMessageTime: '2024-01-15T10:30:00Z',
      unreadCount: 2,
      status: 'online'
    },
    {
      id: '2', 
      vendorName: 'مركز الخدمة السريعة',
      vendorAvatar: '🔧',
      lastMessage: 'تم الانتهاء من الصيانة',
      lastMessageTime: '2024-01-14T15:20:00Z',
      unreadCount: 0,
      status: 'offline'
    },
    {
      id: '3',
      vendorName: 'مؤسسة النجاح للقطع',
      vendorAvatar: '⚙️',
      lastMessage: 'القطع وصلت ومتوفرة الآن',
      lastMessageTime: '2024-01-13T09:15:00Z',
      unreadCount: 1,
      status: 'online'
    }
  ]);

  const [messages] = useState([
    {
      id: '1',
      senderId: 'vendor',
      senderName: 'معرض النجمة للسيارات',
      content: 'أهلاً وسهلاً، كيف يمكنني مساعدتك؟',
      timestamp: '2024-01-15T09:00:00Z',
      status: 'read'
    },
    {
      id: '2',
      senderId: 'user',
      senderName: user?.displayName || 'أنت',
      content: 'مرحباً، مهتم بتويوتا كامري 2020',
      timestamp: '2024-01-15T09:05:00Z',
      status: 'read'
    },
    {
      id: '3',
      senderId: 'vendor',
      senderName: 'معرض النجمة للسيارات', 
      content: 'السيارة متوفرة وفي حالة ممتازة. يمكن المعاينة في أي وقت',
      timestamp: '2024-01-15T09:10:00Z',
      status: 'read'
    },
    {
      id: '4',
      senderId: 'user',
      senderName: user?.displayName || 'أنت',
      content: 'ممتاز، متى يمكنني الحضور للمعاينة؟',
      timestamp: '2024-01-15T09:15:00Z',
      status: 'read'
    },
    {
      id: '5',
      senderId: 'vendor',
      senderName: 'معرض النجمة للسيارات',
      content: 'السيارة متوفرة ويمكن المعاينة غداً في أي وقت مناسب لك',
      timestamp: '2024-01-15T10:30:00Z',
      status: 'delivered'
    }
  ]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    toast.success('تم إرسال الرسالة بنجاح');
    setNewMessage('');
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('ar-EG', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">يجب تسجيل الدخول أولاً</h2>
        </div>
      </div>
    );
  }

  const selectedConversation = conversations.find(c => c.id === selectedChat);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div className="mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">الرسائل</h1>
          <p className="text-gray-600">تواصل مع التجار ومقدمي الخدمات</p>
        </motion.div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden" style={{ height: '600px' }}>
          <div className="flex h-full">
            {/* Conversations List */}
            <div className="w-1/3 border-r border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">المحادثات</h3>
              </div>
              <div className="overflow-y-auto" style={{ height: 'calc(600px - 72px)' }}>
                {conversations.map((conversation) => (
                  <motion.div
                    key={conversation.id}
                    onClick={() => setSelectedChat(conversation.id)}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedChat === conversation.id ? 'bg-primary-50 border-primary-200' : ''
                    }`}
                    whileHover={{ x: 5 }}
                  >
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-xl">
                          {conversation.vendorAvatar}
                        </div>
                        {conversation.status === 'online' && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-gray-900 truncate">{conversation.vendorName}</h4>
                          {conversation.unreadCount > 0 && (
                            <div className="w-6 h-6 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center">
                              {conversation.unreadCount}
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 truncate mt-1">{conversation.lastMessage}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatTime(conversation.lastMessageTime)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {/* Chat Header */}
              {selectedConversation && (
                <div className="p-4 border-b border-gray-200 bg-white">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white">
                      {selectedConversation.vendorAvatar}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{selectedConversation.vendorName}</h3>
                      <p className="text-sm text-gray-600">
                        {selectedConversation.status === 'online' ? '🟢 متصل الآن' : '⚪ غير متصل'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    className={`flex ${message.senderId === 'user' ? 'justify-end' : 'justify-start'}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                      message.senderId === 'user'
                        ? 'bg-primary-500 text-white rounded-br-md'
                        : 'bg-white text-gray-900 rounded-bl-md shadow-sm border border-gray-200'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                      <div className={`flex items-center justify-between mt-2 text-xs ${
                        message.senderId === 'user' ? 'text-primary-100' : 'text-gray-500'
                      }`}>
                        <span>{formatTime(message.timestamp)}</span>
                        {message.senderId === 'user' && (
                          <div className="flex items-center space-x-1 space-x-reverse">
                            {message.status === 'read' ? (
                              <CheckCircleIcon className="w-3 h-3" />
                            ) : (
                              <ClockIcon className="w-3 h-3" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="اكتب رسالتك..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <motion.button
                    onClick={handleSendMessage}
                    className="p-3 bg-primary-500 hover:bg-primary-600 text-white rounded-full transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={!newMessage.trim()}
                  >
                    <PaperAirplaneIcon className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;