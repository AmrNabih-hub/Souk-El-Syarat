import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HeartIcon,
  ClockIcon,
  ShoppingCartIcon,
  ChatBubbleLeftIcon,
  CogIcon,
  TruckIcon,
  StarIcon,
  EyeIcon,
  PlusIcon,
  BellIcon,
  UserCircleIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import {
  HeartIcon as HeartIconSolid,
  StarIcon as StarIconSolid,
} from '@heroicons/react/24/solid';

import { useAppStore } from '@/stores/appStore';
import { useAuthStore } from '@/stores/authStore';

const CustomerDashboard: React.FC = () => {
  const { language } = useAppStore();
  const { user } = useAuthStore();
  
  // Mock data for demonstration
  const [recentSearches] = useState([
    { id: 1, query: 'تويوتا كامري 2020', results: 24, date: '2024-01-15' },
    { id: 2, query: 'قطع غيار هوندا', results: 156, date: '2024-01-14' },
    { id: 3, query: 'مركز صيانة مرسيدس', results: 8, date: '2024-01-13' },
  ]);

  const [favoriteVehicles] = useState([
    {
      id: 1,
      title: 'تويوتا كامري 2020',
      price: '320,000 جنيه',
      image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=300&h=200&fit=crop',
      vendor: 'معرض النجمة للسيارات',
      location: 'القاهرة',
      saved: true,
    },
    {
      id: 2,
      title: 'هوندا سيفيك 2019',
      price: '285,000 جنيه',
      image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=300&h=200&fit=crop',
      vendor: 'شركة الأمان للسيارات',
      location: 'الجيزة',
      saved: true,
    },
  ]);

  const [recentOrders] = useState([
    {
      id: 1,
      title: 'فلتر هواء نيسان',
      price: '120 جنيه',
      status: 'delivered',
      date: '2024-01-10',
      vendor: 'قطع غيار الأصلي',
    },
    {
      id: 2,
      title: 'زيت محرك شل',
      price: '450 جنيه',
      status: 'shipping',
      date: '2024-01-12',
      vendor: 'مركز الصيانة الفورية',
    },
  ]);

  const [messages] = useState([
    {
      id: 1,
      vendor: 'معرض النجمة للسيارات',
      lastMessage: 'السيارة متاحة للمعاينة اليوم',
      time: '10:30 ص',
      unread: 2,
    },
    {
      id: 2,
      vendor: 'قطع غيار الأصلي',
      lastMessage: 'شكراً لك على الطلب',
      time: 'أمس',
      unread: 0,
    },
  ]);

  const stats = [
    { label: 'المفضلة', value: favoriteVehicles.length, icon: HeartIcon, color: 'text-red-500' },
    { label: 'الطلبات', value: recentOrders.length, icon: ShoppingCartIcon, color: 'text-blue-500' },
    { label: 'الرسائل', value: messages.length, icon: ChatBubbleLeftIcon, color: 'text-green-500' },
    { label: 'البحثات', value: recentSearches.length, icon: EyeIcon, color: 'text-purple-500' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'text-green-600 bg-green-100';
      case 'shipping': return 'text-blue-600 bg-blue-100';
      case 'processing': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'delivered': return 'تم التوصيل';
      case 'shipping': return 'في الشحن';
      case 'processing': return 'قيد المعالجة';
      default: return 'غير محدد';
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50'>
      {/* Header */}
      <div className='bg-white shadow-sm border-b border-neutral-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-neutral-900'>
                مرحباً، {user?.displayName || 'عميل كريم'}
              </h1>
              <p className='text-neutral-600 mt-1'>لوحة تحكم العميل - سوق السيارات</p>
            </div>
            <div className='flex items-center gap-4'>
              <button className='relative p-2 text-neutral-600 hover:text-primary-600 transition-colors'>
                <BellIcon className='w-6 h-6' />
                <span className='absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center'>
                  3
                </span>
              </button>
              <Link
                to='/profile'
                className='flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors'
              >
                <UserCircleIcon className='w-8 h-8' />
                <span>الملف الشخصي</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Stats Cards */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className='bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow'
              >
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-neutral-600 text-sm'>{stat.label}</p>
                    <p className='text-2xl font-bold text-neutral-900'>{stat.value}</p>
                  </div>
                  <Icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Recent Orders */}
          <div className='lg:col-span-1'>
            <div className='bg-white rounded-xl shadow-sm p-6'>
              <div className='flex items-center justify-between mb-6'>
                <h2 className='text-xl font-bold text-neutral-900'>الطلبات الأخيرة</h2>
                <Link to='/orders' className='text-primary-600 hover:text-primary-700 text-sm font-medium'>
                  عرض الكل
                </Link>
              </div>
              <div className='space-y-4'>
                {recentOrders.map(order => (
                  <div key={order.id} className='border border-neutral-200 rounded-lg p-4'>
                    <div className='flex items-center justify-between mb-2'>
                      <h3 className='font-medium text-neutral-900'>{order.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>
                    <p className='text-neutral-600 text-sm'>{order.vendor}</p>
                    <div className='flex items-center justify-between mt-2'>
                      <span className='text-primary-600 font-medium'>{order.price}</span>
                      <span className='text-neutral-500 text-sm'>{order.date}</span>
                    </div>
                  </div>
                ))}
                {recentOrders.length === 0 && (
                  <div className='text-center py-8'>
                    <ShoppingCartIcon className='w-12 h-12 text-neutral-400 mx-auto mb-4' />
                    <p className='text-neutral-600'>لا توجد طلبات حتى الآن</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Favorite Vehicles */}
          <div className='lg:col-span-2'>
            <div className='bg-white rounded-xl shadow-sm p-6'>
              <div className='flex items-center justify-between mb-6'>
                <h2 className='text-xl font-bold text-neutral-900'>السيارات المفضلة</h2>
                <Link to='/favorites' className='text-primary-600 hover:text-primary-700 text-sm font-medium'>
                  عرض الكل
                </Link>
              </div>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {favoriteVehicles.map(vehicle => (
                  <div key={vehicle.id} className='border border-neutral-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow'>
                    <div className='relative'>
                      <img
                        src={vehicle.image}
                        alt={vehicle.title}
                        className='w-full h-32 object-cover'
                      />
                      <button className='absolute top-2 right-2 p-1.5 bg-white/90 rounded-full'>
                        <HeartIconSolid className='w-4 h-4 text-red-500' />
                      </button>
                    </div>
                    <div className='p-4'>
                      <h3 className='font-medium text-neutral-900 mb-1'>{vehicle.title}</h3>
                      <p className='text-primary-600 font-bold mb-2'>{vehicle.price}</p>
                      <div className='flex items-center justify-between text-sm text-neutral-600'>
                        <span>{vehicle.vendor}</span>
                        <div className='flex items-center gap-1'>
                          <MapPinIcon className='w-3 h-3' />
                          <span>{vehicle.location}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {favoriteVehicles.length === 0 && (
                  <div className='col-span-2 text-center py-8'>
                    <HeartIcon className='w-12 h-12 text-neutral-400 mx-auto mb-4' />
                    <p className='text-neutral-600'>لم تقم بإضافة أي سيارات للمفضلة</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Messages and Recent Searches */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8'>
          {/* Messages */}
          <div className='bg-white rounded-xl shadow-sm p-6'>
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-xl font-bold text-neutral-900'>الرسائل</h2>
              <Link to='/messages' className='text-primary-600 hover:text-primary-700 text-sm font-medium'>
                عرض الكل
              </Link>
            </div>
            <div className='space-y-3'>
              {messages.map(message => (
                <div key={message.id} className='flex items-center justify-between p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50'>
                  <div className='flex-1'>
                    <h3 className='font-medium text-neutral-900'>{message.vendor}</h3>
                    <p className='text-neutral-600 text-sm'>{message.lastMessage}</p>
                  </div>
                  <div className='text-left'>
                    <p className='text-neutral-500 text-sm'>{message.time}</p>
                    {message.unread > 0 && (
                      <span className='inline-block bg-primary-500 text-white text-xs rounded-full px-2 py-0.5 mt-1'>
                        {message.unread}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Searches */}
          <div className='bg-white rounded-xl shadow-sm p-6'>
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-xl font-bold text-neutral-900'>البحثات الأخيرة</h2>
              <button className='text-neutral-500 hover:text-neutral-700 text-sm'>
                مسح الكل
              </button>
            </div>
            <div className='space-y-3'>
              {recentSearches.map(search => (
                <div key={search.id} className='flex items-center justify-between p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 cursor-pointer'>
                  <div>
                    <h3 className='font-medium text-neutral-900'>{search.query}</h3>
                    <p className='text-neutral-600 text-sm'>{search.results} نتيجة</p>
                  </div>
                  <div className='text-neutral-500 text-sm'>
                    {search.date}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className='bg-white rounded-xl shadow-sm p-6 mt-8'>
          <h2 className='text-xl font-bold text-neutral-900 mb-6'>إجراءات سريعة</h2>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <Link
              to='/marketplace'
              className='flex flex-col items-center p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors group'
            >
              <EyeIcon className='w-8 h-8 text-primary-500 mb-2 group-hover:scale-110 transition-transform' />
              <span className='text-sm font-medium text-neutral-900'>تصفح السوق</span>
            </Link>
            <Link
              to='/vendors'
              className='flex flex-col items-center p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors group'
            >
              <TruckIcon className='w-8 h-8 text-green-500 mb-2 group-hover:scale-110 transition-transform' />
              <span className='text-sm font-medium text-neutral-900'>التجار</span>
            </Link>
            <Link
              to='/services'
              className='flex flex-col items-center p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors group'
            >
              <CogIcon className='w-8 h-8 text-blue-500 mb-2 group-hover:scale-110 transition-transform' />
              <span className='text-sm font-medium text-neutral-900'>الخدمات</span>
            </Link>
            <Link
              to='/sell-car'
              className='flex flex-col items-center p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors group'
            >
              <PlusIcon className='w-8 h-8 text-yellow-500 mb-2 group-hover:scale-110 transition-transform' />
              <span className='text-sm font-medium text-neutral-900'>بيع سيارة</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
