import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  UserCircleIcon, EnvelopeIcon, PhoneIcon, MapPinIcon,
  ShieldCheckIcon, BellIcon, CogIcon, CameraIcon, CheckCircleIcon
} from '@heroicons/react/24/outline';
import { useAppStore } from '@/stores/appStore';
import { useAuthStore } from '@/stores/authStore';
import { LoadingSpinner } from '@/components/ui/CustomIcons';
import { auth, db, storage } from '@/config/firebase.config';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import toast from 'react-hot-toast';

const ProfilePage: React.FC = () => {
  const { language } = useAppStore();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('personal');
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    photoURL: user?.photoURL || ''
  });

  const tabs = [
    { id: 'personal', label: language === 'ar' ? 'المعلومات الشخصية' : 'Personal Info', icon: UserCircleIcon },
    { id: 'security', label: language === 'ar' ? 'الأمان' : 'Security', icon: ShieldCheckIcon },
    { id: 'notifications', label: language === 'ar' ? 'الإشعارات' : 'Notifications', icon: BellIcon }
  ];

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-7xl mx-auto px-4'>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className='bg-white rounded-xl shadow-lg'>
          <div className='bg-primary-500 text-white p-8'>
            <div className='flex items-center space-x-6'>
              <img src={profile.photoURL || 'https://via.placeholder.com/150'} alt='Profile' className='w-24 h-24 rounded-full border-4 border-white' />
              <div>
                <h1 className='text-2xl font-bold'>{profile.displayName || 'User'}</h1>
                <p className='text-white/80'>{profile.email}</p>
              </div>
            </div>
          </div>
          
          <div className='border-b'>
            <nav className='flex space-x-8 px-8'>
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium ${
                    activeTab === tab.id ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500'
                  }`}>
                  <tab.icon className='w-5 h-5' />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className='p-8'>
            {activeTab === 'personal' && (
              <div className='space-y-6'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <input type='text' placeholder={language === 'ar' ? 'الاسم' : 'Name'} value={profile.displayName}
                    onChange={e => setProfile(prev => ({ ...prev, displayName: e.target.value }))}
                    className='px-4 py-2 border rounded-lg' />
                  <input type='email' placeholder='Email' value={profile.email}
                    onChange={e => setProfile(prev => ({ ...prev, email: e.target.value }))}
                    className='px-4 py-2 border rounded-lg' />
                  <input type='tel' placeholder={language === 'ar' ? 'الهاتف' : 'Phone'} value={profile.phone}
                    onChange={e => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                    className='px-4 py-2 border rounded-lg' />
                  <input type='text' placeholder={language === 'ar' ? 'المدينة' : 'City'} value={profile.city}
                    onChange={e => setProfile(prev => ({ ...prev, city: e.target.value }))}
                    className='px-4 py-2 border rounded-lg' />
                </div>
                <button className='px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600'>
                  {language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;
