import React from 'react';
import { useAppStore } from '@/stores/appStore';

const CustomerDashboard: React.FC = () => {
  const { language } = useAppStore();

  return (
    <div className='min-h-screen bg-neutral-50 py-8'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='text-center py-20'>
          <h1 className='text-4xl font-bold text-neutral-900 mb-4'>
            {language === 'ar' ? 'لوحة تحكم العميل' : 'Customer Dashboard'}
          </h1>
          <p className='text-xl text-neutral-600'>
            {language === 'ar'
              ? 'قريباً - ستتم إضافة لوحة تحكم العميل'
              : 'Coming Soon - Customer dashboard will be added'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
