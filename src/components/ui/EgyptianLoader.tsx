import React from 'react';

const EgyptianLoader: React.FC<{ size?: 'sm' | 'md' | 'lg' | 'xl'; text?: string }> = ({ size = 'md', text }) => {
  const sizeClass = size === 'sm' ? 'w-6 h-6' : size === 'lg' ? 'w-12 h-12' : size === 'xl' ? 'w-16 h-16' : 'w-8 h-8';
  return (
    <div className='flex items-center space-x-3'>
      <div className={`rounded-full border-2 border-primary-500 border-t-transparent animate-spin ${sizeClass}`} />
      {text && <div className='text-sm text-neutral-600'>{text}</div>}
    </div>
  );
};

export default EgyptianLoader;
