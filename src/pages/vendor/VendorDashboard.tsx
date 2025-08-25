import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  TruckIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon,
  UsersIcon,
  StarIcon,
  ChartBarIcon,
  EyeIcon,
  PlusIcon,
  BellIcon,
  Cog6ToothIcon,
  HeartIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChatBubbleLeftIcon,
  CameraIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

import { useAppStore } from '@/stores/appStore';
import { useAuthStore } from '@/stores/authStore';

const VendorDashboard: React.FC = () => {
  const { language } = useAppStore();
  const { user } = useAuthStore();

  // Mock business data
  const [businessMetrics] = useState({
    totalRevenue: 125000,
    totalVehicles: 28,
    totalOrders: 45,
    totalCustomers: 127,
    monthlyGrowth: 12.5,
    avgRating: 4.6,
  });

  const [recentOrders] = useState([
    {
      id: 1,
      customer: 'محمد أحمد',
      vehicle: 'تويوتا كامري 2020',
      price: 320000,
      status: 'pending',
      date: '2024-01-15',
      phone: '01234567890',
    },
    {
      id: 2,
      customer: 'فاطمة محمود',
      vehicle: 'هوندا سيفيك 2019',
      price: 285000,
      status: 'confirmed',
      date: '2024-01-14',
      phone: '01098765432',
    },
    {
      id: 3,
      customer: 'أحمد علي',
      vehicle: 'نيسان صني 2021',
      price: 245000,
      status: 'completed',
      date: '2024-01-12',
      phone: '01123456789',
    },
  ]);

  const [inventory] = useState([
    {
      id: 1,
      title: 'تويوتا كامری 2020',
      price: 320000,
      image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=300&h=200&fit=crop',
      views: 124,
      likes: 18,
      status: 'available',
      year: 2020,
      mileage: 45000,
    },
    {
      id: 2,
      title: 'هوندا سيفيك 2019',
      price: 285000,
      image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=300&h=200&fit=crop',
      views: 89,
      likes: 12,
      status: 'sold',
      year: 2019,
      mileage: 52000,
    },
    {
      id: 3,
      title: 'نيسان صني 2021',
      price: 245000,
      image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=300&h=200&fit=crop',
      views: 76,
      likes: 9,
      status: 'available',
      year: 2021,
      mileage: 28000,
    },
  ]);

  const [recentReviews] = useState([
    {
      id: 1,
      customer: 'محمد أحمد',
      rating: 5,
      comment: 'خدمة ممتازة وسيارة بحالة ممتازة. أنصح بالتعامل معهم.',
      date: '2024-01-14',
      vehicle: 'تويوتا كامری 2020',
    },
    {
      id: 2,
      customer: 'سارة محمود',
      rating: 4,
      comment: 'تعامل راقي وأسعار مناسبة. سيارة كما هو موصوف.',
      date: '2024-01-12',
      vehicle: 'هوندا سيفيك 2019',
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'confirmed': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'في الانتظار';
      case 'confirmed': return 'مؤكد';
      case 'completed': return 'مكتمل';
      case 'cancelled': return 'ملغى';
      default: return 'غير محدد';
    }
  };

  const getVehicleStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'text-green-600 bg-green-100';
      case 'sold': return 'text-gray-600 bg-gray-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getVehicleStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'متاح';
      case 'sold': return 'مباع';
      case 'pending': return 'محجوز';
      default: return 'غير محدد';
    }
  };

  const businessStats = [
    {
      label: 'إجمالي الإيرادات',
      value: `${businessMetrics.totalRevenue.toLocaleString()} جنيه`,
      icon: CurrencyDollarIcon,
      color: 'text-green-500',
      change: '+12.5%',
    },
    {
      label: 'السيارات المتاحة',
      value: businessMetrics.totalVehicles,
      icon: TruckIcon,
      color: 'text-blue-500',
      change: '+3',
    },
    {
      label: 'الطلبات',
      value: businessMetrics.totalOrders,
      icon: ShoppingCartIcon,
      color: 'text-purple-500',
      change: '+8',
    },
    {
      label: 'العملاء',
      value: businessMetrics.totalCustomers,
      icon: UsersIcon,
      color: 'text-orange-500',
      change: '+15',
    },
  ];

  return (
    <div className='min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50'>
      {/* Header */}
      <div className='bg-white shadow-sm border-b border-neutral-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-neutral-900'>
                معرض {user?.displayName || 'النجمة للسيارات'}
              </h1>
              <p className='text-neutral-600 mt-1'>لوحة تحكم التاجر - سوق السيارات</p>
              <div className='flex items-center gap-4 mt-2'>
                <div className='flex items-center gap-1'>
                  <StarIcon className='w-5 h-5 text-yellow-500' />
                  <span className='text-neutral-700 font-medium'>{businessMetrics.avgRating}</span>
                  <span className='text-neutral-500 text-sm'>(127 تقييم)</span>
                </div>
                <div className='flex items-center gap-1 text-green-600'>
                  <TruckIcon className='w-5 h-5' />
                  <span className='font-medium'>تاجر موثق</span>
                </div>
              </div>
            </div>
            <div className='flex items-center gap-4'>
              <button className='relative p-2 text-neutral-600 hover:text-primary-600 transition-colors'>
                <BellIcon className='w-6 h-6' />
                <span className='absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center'>
                  7
                </span>
              </button>
              <Link
                to='/vendor/settings'
                className='flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors'
              >
                <Cog6ToothIcon className='w-6 h-6' />
                <span>الإعدادات</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Business Stats */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
          {businessStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className='bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow'
              >
                <div className='flex items-center justify-between mb-2'>
                  <div className='flex items-center gap-3'>
                    <Icon className={`w-8 h-8 ${stat.color}`} />
                    <div>
                      <p className='text-neutral-600 text-sm'>{stat.label}</p>
                      <p className='text-2xl font-bold text-neutral-900'>{stat.value}</p>
                    </div>
                  </div>
                </div>
                <div className='flex items-center gap-1 text-green-600 text-sm'>
                  <span>{stat.change}</span>
                  <span>هذا الشهر</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Recent Orders */}
          <div className='lg:col-span-2'>
            <div className='bg-white rounded-xl shadow-sm p-6'>
              <div className='flex items-center justify-between mb-6'>
                <h2 className='text-xl font-bold text-neutral-900'>الطلبات الأخيرة</h2>
                <Link to='/vendor/orders' className='text-primary-600 hover:text-primary-700 text-sm font-medium'>
                  عرض الكل
                </Link>
              </div>
              <div className='space-y-4'>
                {recentOrders.map(order => (
                  <div key={order.id} className='border border-neutral-200 rounded-lg p-4 hover:bg-neutral-50'>
                    <div className='flex items-center justify-between mb-3'>
                      <div>
                        <h3 className='font-medium text-neutral-900'>{order.customer}</h3>
                        <p className='text-neutral-600 text-sm'>{order.vehicle}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <div>
                        <span className='text-primary-600 font-bold text-lg'>
                          {order.price.toLocaleString()} جنيه
                        </span>
                        <p className='text-neutral-500 text-sm'>{order.date}</p>
                      </div>
                      <div className='flex gap-2'>
                        <button className='text-green-600 hover:bg-green-50 p-2 rounded-lg transition-colors'>
                          <CheckCircleIcon className='w-5 h-5' />
                        </button>
                        <button className='text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors'>
                          <ChatBubbleLeftIcon className='w-5 h-5' />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className='lg:col-span-1'>
            <div className='bg-white rounded-xl shadow-sm p-6 mb-6'>
              <h2 className='text-xl font-bold text-neutral-900 mb-6'>إجراءات سريعة</h2>
              <div className='space-y-3'>
                <Link
                  to='/vendor/add-vehicle'
                  className='flex items-center gap-3 p-3 border border-neutral-200 rounded-lg hover:bg-primary-50 hover:border-primary-300 transition-colors group'
                >
                  <PlusIcon className='w-6 h-6 text-primary-500 group-hover:scale-110 transition-transform' />
                  <span className='font-medium text-neutral-900'>إضافة سيارة جديدة</span>
                </Link>
                <Link
                  to='/vendor/inventory'
                  className='flex items-center gap-3 p-3 border border-neutral-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors group'
                >
                  <TruckIcon className='w-6 h-6 text-blue-500 group-hover:scale-110 transition-transform' />
                  <span className='font-medium text-neutral-900'>إدارة المخزن</span>
                </Link>
                <Link
                  to='/vendor/analytics'
                  className='flex items-center gap-3 p-3 border border-neutral-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors group'
                >
                  <ChartBarIcon className='w-6 h-6 text-green-500 group-hover:scale-110 transition-transform' />
                  <span className='font-medium text-neutral-900'>التقارير والتحليلات</span>
                </Link>
              </div>
            </div>

            {/* Recent Reviews */}
            <div className='bg-white rounded-xl shadow-sm p-6'>
              <div className='flex items-center justify-between mb-6'>
                <h2 className='text-xl font-bold text-neutral-900'>التقييمات الأخيرة</h2>
                <Link to='/vendor/reviews' className='text-primary-600 hover:text-primary-700 text-sm font-medium'>
                  عرض الكل
                </Link>
              </div>
              <div className='space-y-4'>
                {recentReviews.map(review => (
                  <div key={review.id} className='border border-neutral-200 rounded-lg p-4'>
                    <div className='flex items-center justify-between mb-2'>
                      <h3 className='font-medium text-neutral-900'>{review.customer}</h3>
                      <div className='flex'>
                        {[...Array(5)].map((_, i) => (
                          <StarIcon
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating ? 'text-yellow-400 fill-current' : 'text-neutral-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className='text-neutral-600 text-sm mb-2'>{review.comment}</p>
                    <div className='flex justify-between text-xs text-neutral-500'>
                      <span>{review.vehicle}</span>
                      <span>{review.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle Inventory Preview */}
        <div className='bg-white rounded-xl shadow-sm p-6 mt-8'>
          <div className='flex items-center justify-between mb-6'>
            <h2 className='text-xl font-bold text-neutral-900'>المخزن الحالي</h2>
            <Link to='/vendor/inventory' className='text-primary-600 hover:text-primary-700 text-sm font-medium'>
              إدارة المخزن
            </Link>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {inventory.slice(0, 3).map(vehicle => (
              <div key={vehicle.id} className='border border-neutral-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow'>
                <div className='relative'>
                  <img
                    src={vehicle.image}
                    alt={vehicle.title}
                    className='w-full h-40 object-cover'
                  />
                  <span className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${getVehicleStatusColor(vehicle.status)}`}>
                    {getVehicleStatusText(vehicle.status)}
                  </span>
                  <div className='absolute bottom-2 left-2 flex gap-2'>
                    <span className='bg-black/70 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1'>
                      <EyeIcon className='w-3 h-3' />
                      {vehicle.views}
                    </span>
                    <span className='bg-black/70 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1'>
                      <HeartIcon className='w-3 h-3' />
                      {vehicle.likes}
                    </span>
                  </div>
                </div>
                <div className='p-4'>
                  <h3 className='font-medium text-neutral-900 mb-2'>{vehicle.title}</h3>
                  <p className='text-primary-600 font-bold text-lg mb-2'>
                    {vehicle.price.toLocaleString()} جنيه
                  </p>
                  <div className='flex justify-between text-sm text-neutral-600 mb-3'>
                    <span>موديل {vehicle.year}</span>
                    <span>{vehicle.mileage.toLocaleString()} كم</span>
                  </div>
                  <div className='flex gap-2'>
                    <button className='flex-1 bg-primary-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-primary-600 transition-colors'>
                      تعديل
                    </button>
                    <button className='bg-neutral-200 text-neutral-700 px-3 py-2 rounded-lg text-sm hover:bg-neutral-300 transition-colors'>
                      <CameraIcon className='w-4 h-4' />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;