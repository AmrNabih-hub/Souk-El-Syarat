import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Chat Store
 * Manages real-time chat state and unread message count
 */

interface ChatMessage {
  id: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  senderId: string;
  senderName: string;
  type: 'incoming' | 'outgoing';
}

interface ChatState {
  unreadCount: number;
  messages: ChatMessage[];
  isAgentOnline: boolean;
  
  // Actions
  incrementUnread: () => void;
  decrementUnread: () => void;
  resetUnread: () => void;
  setUnreadCount: (count: number) => void;
  addMessage: (message: ChatMessage) => void;
  markAllAsRead: () => void;
  setAgentOnline: (online: boolean) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      // Initial state
      unreadCount: 0,
      messages: [],
      isAgentOnline: true,

      // Increment unread count
      incrementUnread: () => {
        set((state) => ({ unreadCount: state.unreadCount + 1 }));
      },

      // Decrement unread count
      decrementUnread: () => {
        set((state) => ({ 
          unreadCount: Math.max(0, state.unreadCount - 1) 
        }));
      },

      // Reset unread count to 0
      resetUnread: () => {
        set({ unreadCount: 0 });
      },

      // Set specific unread count
      setUnreadCount: (count: number) => {
        set({ unreadCount: Math.max(0, count) });
      },

      // Add new message
      addMessage: (message: ChatMessage) => {
        set((state) => ({
          messages: [...state.messages, message],
          // Only increment unread for incoming messages
          unreadCount: message.type === 'incoming' && !message.isRead
            ? state.unreadCount + 1
            : state.unreadCount
        }));
      },

      // Mark all messages as read
      markAllAsRead: () => {
        set((state) => ({
          messages: state.messages.map(msg => ({ ...msg, isRead: true })),
          unreadCount: 0
        }));
      },

      // Set agent online status
      setAgentOnline: (online: boolean) => {
        set({ isAgentOnline: online });
      },
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({ 
        unreadCount: state.unreadCount,
        messages: state.messages 
      }),
    }
  )
);

/**
 * Mock function to simulate receiving messages
 * In production, this would be replaced with WebSocket/Firebase listeners
 */
export const simulateIncomingMessage = () => {
  const store = useChatStore.getState();
  
  const mockMessages = [
    'مرحباً! كيف يمكنني مساعدتك؟',
    'شكراً لتواصلك معنا',
    'نحن هنا لخدمتك',
    'Hello! How can I help you?',
    'Thank you for contacting us',
  ];

  const randomMessage = mockMessages[Math.floor(Math.random() * mockMessages.length)];

  const newMessage: ChatMessage = {
    id: `msg_${Date.now()}`,
    content: randomMessage,
    timestamp: new Date(),
    isRead: false,
    senderId: 'support_agent',
    senderName: 'Support Agent',
    type: 'incoming',
  };

  store.addMessage(newMessage);
};

