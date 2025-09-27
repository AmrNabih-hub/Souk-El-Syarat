import React from 'react';

export const ChatWidget: React.FC = () => {
  return (
    <div data-testid='chat-widget' className='fixed bottom-6 right-6 w-80 h-96 bg-white shadow-lg rounded-lg p-3'>
      <div className='font-semibold mb-2'>Chat Widget (Placeholder)</div>
      <div className='text-sm text-neutral-500'>Real-time chat placeholder — implement PubSub/WebSocket later.</div>
    </div>
  );
};

export default ChatWidget;
