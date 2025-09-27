import React from 'react';
import Providers from '@/components/common/Providers';

const TestProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <Providers>{children}</Providers>;
};

export default TestProviders;
