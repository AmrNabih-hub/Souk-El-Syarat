import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PaperAirplaneIcon,
  PaperClipIcon,
  FaceSmileIcon,
  MicrophoneIcon,
  StopIcon,
  PhotoIcon,
  DocumentIcon,
  PhoneIcon,
  VideoCameraIcon,
  InformationCircleIcon,
  EllipsisVerticalIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useAppStore } from '@/stores/appStore';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'voice' | 'system';
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  duration?: number; // for voice messages
  replyTo?: string;
  edited?: boolean;
  editedAt?: Date;
}

interface ChatParticipant {
  id: string;
  name: string;
  avatar?: string;
  role: 'customer' | 'vendor' | 'admin';
  isOnline: boolean;
  lastSeen?: Date;
  isTyping?: boolean;
}

interface RealTimeChatProps {
  chatId: string;
  currentUser: ChatParticipant;
  otherParticipant: ChatParticipant;
  carId?: string;
  onClose?: () => void;
  className?: string;
}

const RealTimeChat: React.FC<RealTimeChatProps> = ({
  chatId,
  currentUser,
  otherParticipant,
  carId,
  onClose,
  className = ''
}) => {
  const { language } = useAppStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Mock messages for demonstration
  const mockMessages: Message[] = [
    {
      id: '1',
      senderId: 'vendor-1',
      recipientId: 'customer-1',
      content: 'مرحباً! شكراً لاهتمامك بسيارة تويوتا كامري. هل لديك أي استفسارات؟',
      type: 'text',
      timestamp: new Date(Date.now() - 3600000),
      status: 'read'
    },
    {
      id: '2',
      senderId: 'customer-1',
      recipientId: 'vendor-1',
      content: 'مرحباً، نعم أريد معرفة المزيد عن تاريخ الصيانة والحالة العامة للسيارة',
      type: 'text',
      timestamp: new Date(Date.now() - 3300000),
      status: 'read'
    },
    {
      id: '3',
      senderId: 'vendor-1',
      recipientId: 'customer-1',
      content: 'بالطبع! السيارة تم صيانتها بانتظام في الوكيل المعتمد. سأرسل لك صور تقرير الفحص الأخير',
      type: 'text',
      timestamp: new Date(Date.now() - 3000000),
      status: 'read'
    }
  ];

  useEffect(() => {
    setMessages(mockMessages);
    scrollToBottom();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      // Simulate sending typing status to other user
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  }, [isTyping]);

  const sendMessage = async (content: string, type: 'text' | 'image' | 'file' | 'voice' = 'text', fileData?: any) => {
    if (!content.trim() && type === 'text') return;

    const newMsg: Message = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      recipientId: otherParticipant.id,
      content: content,
      type: type,
      timestamp: new Date(),
      status: 'sending',
      ...(fileData && {
        fileUrl: fileData.url,
        fileName: fileData.name,
        fileSize: fileData.size,
        duration: fileData.duration
      }),
      ...(replyingTo && { replyTo: replyingTo.id })
    };

    setMessages(prev => [...prev, newMsg]);
    setNewMessage('');
    setReplyingTo(null);
    setIsTyping(false);

    // Simulate message sending
    setTimeout(() => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === newMsg.id 
            ? { ...msg, status: 'sent' }
            : msg
        )
      );

      // Simulate delivery and read status
      setTimeout(() => {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === newMsg.id 
              ? { ...msg, status: 'delivered' }
              : msg
          )
        );
      }, 1000);
    }, 500);
  };

  const handleSendMessage = () => {
    sendMessage(newMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Voice recording functionality
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const audioChunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Simulate sending voice message
        sendMessage('رسالة صوتية', 'voice', {
          url: audioUrl,
          duration: 5, // Mock duration
        });

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.success(language === 'ar' ? 'بدء التسجيل...' : 'Recording started...');
    } catch (error) {
      toast.error(language === 'ar' ? 'فشل في الوصول للميكروفون' : 'Failed to access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.success(language === 'ar' ? 'تم إرسال الرسالة الصوتية' : 'Voice message sent');
    }
  };

  // File upload handler
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileData = {
      url: URL.createObjectURL(file),
      name: file.name,
      size: file.size
    };

    const fileType = file.type.startsWith('image/') ? 'image' : 'file';
    const content = fileType === 'image' ? 'صورة' : file.name;
    
    sendMessage(content, fileType, fileData);
    setShowAttachMenu(false);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('ar-EG', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatLastSeen = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 5) return language === 'ar' ? 'نشط الآن' : 'Active now';
    if (minutes < 60) return language === 'ar' ? `منذ ${minutes} دقيقة` : `${minutes}m ago`;
    if (hours < 24) return language === 'ar' ? `منذ ${hours} ساعة` : `${hours}h ago`;
    return language === 'ar' ? `منذ ${days} يوم` : `${days}d ago`;
  };

  const getStatusIcon = (status: Message['status']) => {
    switch (status) {
      case 'sending':
        return <motion.div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />;
      case 'sent':
        return <CheckIcon className="w-4 h-4 text-gray-400" />;
      case 'delivered':
        return <div className="flex"><CheckIcon className="w-4 h-4 text-gray-400" /><CheckIcon className="w-4 h-4 text-gray-400 -ml-2" /></div>;
      case 'read':
        return <div className="flex"><CheckIcon className="w-4 h-4 text-blue-500" /><CheckIcon className="w-4 h-4 text-blue-500 -ml-2" /></div>;
      default:
        return null;
    }
  };

  const emojis = ['😊', '😂', '❤️', '👍', '👎', '😮', '😢', '😡', '🔥', '💯', '🚗', '✅'];

  return (
    <div className={`bg-white rounded-xl shadow-xl flex flex-col h-[600px] max-h-[80vh] ${className}`}>
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <img
              src={otherParticipant.avatar || '/default-avatar.png'}
              alt={otherParticipant.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            {otherParticipant.isOnline && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{otherParticipant.name}</h3>
            <p className="text-xs text-gray-500">
              {otherParticipant.isOnline
                ? (otherParticipant.isTyping 
                    ? (language === 'ar' ? 'يكتب...' : 'Typing...') 
                    : (language === 'ar' ? 'متصل الآن' : 'Online now'))
                : (otherParticipant.lastSeen 
                    ? formatLastSeen(otherParticipant.lastSeen)
                    : (language === 'ar' ? 'غير متصل' : 'Offline'))
              }
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <motion.button
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            <PhoneIcon className="w-5 h-5 text-gray-600" />
          </motion.button>
          <motion.button
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            <VideoCameraIcon className="w-5 h-5 text-gray-600" />
          </motion.button>
          <motion.button
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            <InformationCircleIcon className="w-5 h-5 text-gray-600" />
          </motion.button>
          {onClose && (
            <motion.button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              whileTap={{ scale: 0.95 }}
            >
              <XMarkIcon className="w-5 h-5 text-gray-600" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isOwnMessage = message.senderId === currentUser.id;
          const repliedMessage = message.replyTo ? messages.find(m => m.id === message.replyTo) : null;

          return (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[70%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                {/* Reply Preview */}
                {repliedMessage && (
                  <div className={`mb-1 p-2 bg-gray-100 rounded-lg border-l-4 ${
                    isOwnMessage ? 'border-primary-500' : 'border-gray-400'
                  }`}>
                    <p className="text-xs text-gray-600 mb-1">
                      {language === 'ar' ? 'رد على:' : 'Reply to:'}
                    </p>
                    <p className="text-sm text-gray-800 line-clamp-2">
                      {repliedMessage.content}
                    </p>
                  </div>
                )}

                <div
                  className={`rounded-2xl p-3 ${
                    isOwnMessage
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  } ${message.type === 'system' ? 'bg-yellow-100 text-yellow-800 text-center text-sm' : ''}`}
                >
                  {message.type === 'text' && (
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                  )}

                  {message.type === 'image' && (
                    <div>
                      <img
                        src={message.fileUrl}
                        alt="Shared image"
                        className="rounded-lg max-w-full h-auto mb-2"
                      />
                      {message.content !== 'صورة' && (
                        <p className="text-sm">{message.content}</p>
                      )}
                    </div>
                  )}

                  {message.type === 'file' && (
                    <div className="flex items-center space-x-2">
                      <DocumentIcon className="w-8 h-8 text-gray-400" />
                      <div>
                        <p className="font-medium">{message.fileName}</p>
                        <p className="text-xs opacity-70">
                          {message.fileSize ? `${(message.fileSize / 1024).toFixed(1)} KB` : ''}
                        </p>
                      </div>
                    </div>
                  )}

                  {message.type === 'voice' && (
                    <div className="flex items-center space-x-2">
                      <div className={`p-2 rounded-full ${isOwnMessage ? 'bg-white bg-opacity-20' : 'bg-primary-100'}`}>
                        <motion.div
                          className={`w-4 h-4 ${isOwnMessage ? 'text-white' : 'text-primary-600'}`}
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        >
                          🎵
                        </motion.div>
                      </div>
                      <div className="flex-1">
                        <div className={`h-1 rounded-full ${isOwnMessage ? 'bg-white bg-opacity-30' : 'bg-gray-300'}`}>
                          <div className={`h-1 rounded-full w-1/3 ${isOwnMessage ? 'bg-white' : 'bg-primary-500'}`} />
                        </div>
                        <p className="text-xs opacity-70 mt-1">
                          {message.duration ? `${message.duration}s` : '0:05'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Message time and status */}
                  <div className={`flex items-center justify-between mt-2 text-xs ${
                    isOwnMessage ? 'text-white text-opacity-70' : 'text-gray-500'
                  }`}>
                    <span>{formatTime(message.timestamp)}</span>
                    {isOwnMessage && (
                      <div className="flex items-center space-x-1">
                        {message.edited && <span className="text-xs">edited</span>}
                        {getStatusIcon(message.status)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Typing Indicator */}
        <AnimatePresence>
          {otherParticipant.isTyping && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex justify-start"
            >
              <div className="bg-gray-100 rounded-2xl p-3">
                <div className="flex space-x-1">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 bg-gray-400 rounded-full"
                      animate={{ y: [0, -5, 0] }}
                      transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        delay: i * 0.2
                      }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Reply Preview */}
      <AnimatePresence>
        {replyingTo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="px-4 py-2 bg-gray-50 border-t border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs text-gray-600 mb-1">
                  {language === 'ar' ? 'رد على:' : 'Replying to:'}
                </p>
                <p className="text-sm text-gray-800 line-clamp-1">{replyingTo.content}</p>
              </div>
              <motion.button
                onClick={() => setReplyingTo(null)}
                className="p-1 hover:bg-gray-200 rounded"
                whileTap={{ scale: 0.95 }}
              >
                <XMarkIcon className="w-4 h-4 text-gray-600" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-end space-x-2">
          {/* Attachment Menu */}
          <div className="relative">
            <motion.button
              onClick={() => setShowAttachMenu(!showAttachMenu)}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              whileTap={{ scale: 0.95 }}
            >
              <PaperClipIcon className="w-5 h-5 text-gray-600" />
            </motion.button>

            <AnimatePresence>
              {showAttachMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-lg p-2 min-w-[120px]"
                >
                  <motion.button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center space-x-2 p-2 hover:bg-gray-100 rounded text-sm"
                    whileTap={{ scale: 0.95 }}
                  >
                    <PhotoIcon className="w-4 h-4 text-gray-600" />
                    <span>{language === 'ar' ? 'صورة' : 'Image'}</span>
                  </motion.button>
                  <motion.button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center space-x-2 p-2 hover:bg-gray-100 rounded text-sm"
                    whileTap={{ scale: 0.95 }}
                  >
                    <DocumentIcon className="w-4 h-4 text-gray-600" />
                    <span>{language === 'ar' ? 'ملف' : 'File'}</span>
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              accept="image/*,.pdf,.doc,.docx,.txt"
            />
          </div>

          {/* Message Input */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              onKeyPress={handleKeyPress}
              placeholder={language === 'ar' ? 'اكتب رسالتك...' : 'Type your message...'}
              className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={isLoading}
            />

            {/* Emoji Button */}
            <motion.button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800"
              whileTap={{ scale: 0.95 }}
            >
              <FaceSmileIcon className="w-5 h-5" />
            </motion.button>

            {/* Emoji Picker */}
            <AnimatePresence>
              {showEmojiPicker && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-lg p-3"
                >
                  <div className="grid grid-cols-6 gap-1">
                    {emojis.map((emoji, index) => (
                      <motion.button
                        key={index}
                        onClick={() => {
                          setNewMessage(prev => prev + emoji);
                          setShowEmojiPicker(false);
                        }}
                        className="p-1 hover:bg-gray-100 rounded text-lg"
                        whileTap={{ scale: 0.9 }}
                      >
                        {emoji}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Voice/Send Button */}
          {newMessage.trim() ? (
            <motion.button
              onClick={handleSendMessage}
              disabled={isLoading}
              className="p-2 bg-primary-500 hover:bg-primary-600 text-white rounded-full transition-colors disabled:opacity-50"
              whileTap={{ scale: 0.95 }}
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </motion.button>
          ) : (
            <motion.button
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-2 rounded-full transition-colors ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              {isRecording ? (
                <StopIcon className="w-5 h-5" />
              ) : (
                <MicrophoneIcon className="w-5 h-5" />
              )}
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RealTimeChat;