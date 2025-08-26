import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import {
  UserIcon,
  ShoppingCartIcon,
  HeartIcon,
  Bars3Icon,
  XMarkIcon,
  MagnifyingGlassIcon,
  GlobeAltIcon,
  SunIcon,
  MoonIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  BuildingStorefrontIcon,
  ChartBarIcon,
  UserCircleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

import { useAppStore } from '@/stores/appStore';
import { useAuthStore } from '@/stores/authStore';
import SyncStatusIndicator from '@/components/ui/SyncStatusIndicator';
import clsx from 'clsx';
import toast from 'react-hot-toast';

const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const location = useLocation();
  
  // Real authentication state
  const { user, signOut, isLoading: authLoading } = useAuthStore();
  const { language, theme, setLanguage, setTheme, getCartItemsCount, favorites, syncStatus, isOnline } = useAppStore();

  // Get role-based profile information
  const getUserProfileInfo = () => {
    if (!user) return null;
    
    switch (user.role) {
      case 'admin':
        return {
          name: user.displayName || 'المدير',
          role: 'مدير النظام',
          icon: ShieldCheckIcon,
          dashboardPath: '/admin/dashboard',
          profilePath: '/admin/profile',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      case 'vendor':
        return {
          name: user.displayName || 'التاجر',
          role: 'تاجر',
          icon: BuildingStorefrontIcon,
          dashboardPath: '/vendor/dashboard',
          profilePath: '/vendor/profile',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
      case 'customer':
        return {
          name: user.displayName || 'العميل',
          role: 'عميل',
          icon: UserCircleIcon,
          dashboardPath: '/dashboard',
          profilePath: '/profile',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      default:
        return {
          name: user.displayName || user.email,
          role: 'مستخدم',
          icon: UserIcon,
          dashboardPath: '/dashboard',
          profilePath: '/profile',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
    }
  };

  // Handle sign out with navigation
  const handleSignOut = async () => {
    try {
      await signOut();
      setIsUserMenuOpen(false);
      navigate('/');
      toast.success('تم تسجيل الخروج بنجاح');
    } catch (error) {
      toast.error('حدث خطأ أثناء تسجيل الخروج');
    }
  };

  const profileInfo = getUserProfileInfo();

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/marketplace?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setIsSearchOpen(false);
    }
  };

  const navigationItems = [
    { name: 'الرئيسية', href: '/', nameEn: 'Home' },
    { name: 'السوق', href: '/marketplace', nameEn: 'Marketplace' },
    { name: 'التجار', href: '/vendors', nameEn: 'Vendors' },
    { name: 'طلب كونك تاجر', href: '/vendor/apply', nameEn: 'Become a Vendor' },
  ];

  const isCurrentPath = (path: string) => location.pathname === path;

  return (
    <nav className='bg-white/90 backdrop-blur-md border-b border-neutral-200/50 sticky top-0 z-50 shadow-sm'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center h-16'>
          {/* Logo */}
          <motion.div
            className='flex-shrink-0 flex items-center'
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <Link to='/' className='flex items-center space-x-2'>
              <motion.div
                className='w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center'
                whileHover={{ rotate: 5 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <span className='text-white font-bold text-xl'>س</span>
              </motion.div>
              <div className='hidden sm:block'>
                <h1 className='text-xl font-bold gradient-text-animated font-display'>سوق السيارات</h1>
                <p className='text-xs text-neutral-500 -mt-1'>Souk El-Syarat</p>
              </div>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <div className='hidden lg:flex items-center space-x-8'>
            {navigationItems.map(item => (
              <motion.div key={item.href} whileHover={{ y: -2 }}>
                <Link
                  to={item.href}
                  className={clsx(
                    'relative px-3 py-2 text-sm font-medium transition-colors duration-200',
                    isCurrentPath(item.href)
                      ? 'text-primary-600'
                      : 'text-neutral-700 hover:text-primary-600'
                  )}
                >
                  {language === 'ar' ? item.name : item.nameEn}
                  {isCurrentPath(item.href) && (
                    <motion.div
                      className='absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500'
                      layoutId='navbar-indicator'
                    />
                  )}
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Search Bar */}
          <div className='hidden md:flex flex-1 max-w-md mx-8' ref={searchRef}>
            <div className='relative w-full'>
              <motion.form
                onSubmit={handleSearch}
                className='relative'
                animate={{ width: isSearchOpen ? '100%' : 'auto' }}
              >
                <input
                  type='text'
                  placeholder={
                    language === 'ar' ? 'ابحث عن سيارة، قطع غيار...' : 'Search for cars, parts...'
                  }
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className={clsx(
                    'w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-full',
                    'focus:border-primary-500 focus:ring-1 focus:ring-primary-500',
                    'transition-all duration-200'
                  )}
                  onFocus={() => setIsSearchOpen(true)}
                />
                <MagnifyingGlassIcon className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400' />
              </motion.form>
            </div>
          </div>

          {/* Right Side Icons */}
          <div className='flex items-center space-x-4'>
            {/* Theme Toggle */}
            <motion.button
              onClick={() => {
                try {
                  const newTheme = theme === 'light' ? 'dark' : 'light';
                  console.log('🎨 Switching theme from', theme, 'to', newTheme);
                  setTheme(newTheme);
                  
                  // Force immediate DOM update
                  if (typeof window !== 'undefined') {
                    const root = document.documentElement;
                    if (newTheme === 'dark') {
                      root.classList.add('dark');
                    } else {
                      root.classList.remove('dark');
                    }
                    localStorage.setItem('souk-theme', newTheme);
                  }
                  
                  toast.success(
                    newTheme === 'dark' ? 'تم تفعيل الوضع المظلم' : 'تم تفعيل الوضع المضيء',
                    { duration: 2000 }
                  );
                } catch (error) {
                  console.error('❌ Theme toggle error:', error);
                  toast.error('خطأ في تغيير النمط');
                }
              }}
              className='p-3 text-neutral-600 hover:text-primary-600 transition-all duration-300 bg-neutral-100 hover:bg-primary-50 rounded-lg shadow-sm hover:shadow-md'
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title={theme === 'light' ? 'تفعيل الوضع المظلم' : 'تفعيل الوضع المضيء'}
            >
              {theme === 'light' ? (
                <MoonIcon className='w-5 h-5' />
              ) : (
                <SunIcon className='w-5 h-5' />
              )}
            </motion.button>

            {/* Language Toggle */}
            <motion.button
              onClick={() => {
                try {
                  const newLanguage = language === 'ar' ? 'en' : 'ar';
                  console.log('🌐 Switching language from', language, 'to', newLanguage);
                  setLanguage(newLanguage);
                  
                  // Force immediate DOM update
                  if (typeof window !== 'undefined') {
                    const root = document.documentElement;
                    root.setAttribute('lang', newLanguage);
                    root.setAttribute('dir', newLanguage === 'ar' ? 'rtl' : 'ltr');
                    localStorage.setItem('souk-language', newLanguage);
                    
                    // Also update the HTML tag direction immediately
                    document.dir = newLanguage === 'ar' ? 'rtl' : 'ltr';
                  }
                  
                  toast.success(
                    newLanguage === 'ar' ? 'تم التبديل للعربية' : 'Switched to English',
                    { duration: 2000 }
                  );
                  
                } catch (error) {
                  console.error('❌ Language toggle error:', error);
                  toast.error('خطأ في تغيير اللغة / Language change error');
                }
              }}
              className='p-3 text-neutral-600 hover:text-primary-600 transition-all duration-300 bg-neutral-100 hover:bg-primary-50 rounded-lg shadow-sm hover:shadow-md'
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title={language === 'ar' ? 'Switch to English' : 'التبديل للعربية'}
            >
              <div className="flex items-center gap-1">
                <GlobeAltIcon className='w-5 h-5' />
                <span className="text-xs font-bold">{language === 'ar' ? 'EN' : 'AR'}</span>
              </div>
            </motion.button>

            {user ? (
              <>
                {/* Wishlist */}
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Link
                    to='/wishlist'
                    className='relative p-2 text-neutral-600 hover:text-red-500 transition-colors group'
                    title={language === 'ar' ? 'قائمة المفضلة' : 'Wishlist'}
                  >
                    <HeartIcon className='w-5 h-5 group-hover:text-red-500' />
                    {favorites.length > 0 && (
                      <motion.span
                        className='absolute -top-2 -right-2 min-w-[20px] h-[20px] bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-xl border-2 border-white z-30'
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                        style={{ fontSize: '11px', lineHeight: '1', fontWeight: 'bold' }}
                      >
                        {favorites.length > 99 ? '99+' : favorites.length}
                      </motion.span>
                    )}
                  </Link>
                </motion.div>

                {/* Cart */}
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Link
                    to='/cart'
                    className='relative p-2 text-neutral-600 hover:text-primary-600 transition-colors group'
                    title={language === 'ar' ? 'سلة التسوق' : 'Shopping Cart'}
                  >
                    <ShoppingCartIcon className='w-5 h-5 group-hover:text-primary-600' />
                    {getCartItemsCount() > 0 && (
                      <motion.span
                        className='absolute -top-2 -right-2 min-w-[20px] h-[20px] bg-primary-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-xl border-2 border-white z-30'
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                        style={{ fontSize: '11px', lineHeight: '1', fontWeight: 'bold' }}
                      >
                        {getCartItemsCount() > 99 ? '99+' : getCartItemsCount()}
                      </motion.span>
                    )}
                  </Link>
                </motion.div>

                {/* Real-time Sync Status Indicator */}
                <SyncStatusIndicator size="sm" />

                {/* Enhanced User Menu with Role-based Styling */}
                <div className='relative' ref={userMenuRef}>
                  <motion.button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className={`flex items-center space-x-2 p-2 rounded-lg border transition-all duration-200 ${
                      profileInfo ? `${profileInfo.bgColor} ${profileInfo.borderColor} ${profileInfo.color}` : 'text-neutral-600 hover:text-primary-600'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      profileInfo ? profileInfo.bgColor : 'bg-gray-100'
                    }`}>
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.displayName}
                          className='w-8 h-8 rounded-full object-cover'
                        />
                      ) : profileInfo ? (
                        React.createElement(profileInfo.icon, { 
                          className: `w-4 h-4 ${profileInfo.color}` 
                        })
                      ) : (
                        <UserIcon className='w-4 h-4 text-gray-600' />
                      )}
                    </div>
                    <div className='hidden sm:flex flex-col items-start'>
                      <span className='text-sm font-medium'>{profileInfo?.name || user.displayName}</span>
                      {profileInfo && (
                        <span className='text-xs opacity-75'>{profileInfo.role}</span>
                      )}
                    </div>
                    <ChevronDownIcon className='w-4 h-4' />
                  </motion.button>

                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        className='absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-neutral-200 py-3 z-50 overflow-hidden'
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                      >
                        {/* User Info Header */}
                        <div className={`px-4 py-3 ${profileInfo?.bgColor || 'bg-gray-50'} border-b border-gray-100`}>
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              profileInfo ? profileInfo.bgColor : 'bg-gray-100'
                            } border-2 ${profileInfo?.borderColor || 'border-gray-200'}`}>
                              {user.photoURL ? (
                                <img
                                  src={user.photoURL}
                                  alt={user.displayName}
                                  className='w-10 h-10 rounded-full object-cover'
                                />
                              ) : profileInfo ? (
                                React.createElement(profileInfo.icon, { 
                                  className: `w-5 h-5 ${profileInfo.color}` 
                                })
                              ) : (
                                <UserIcon className='w-5 h-5 text-gray-600' />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">{profileInfo?.name || user.displayName}</p>
                              <p className={`text-sm ${profileInfo?.color || 'text-gray-500'}`}>
                                {profileInfo?.role || 'مستخدم'}
                              </p>
                              <p className="text-xs text-gray-500 truncate">{user.email}</p>
                            </div>
                          </div>
                        </div>

                        {/* Menu Items */}
                        <div className="py-2">
                          {/* Profile Link */}
                          <Link
                            to={profileInfo?.profilePath || '/profile'}
                            className='flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors group'
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <UserCircleIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-600 mr-3" />
                            <span>{language === 'ar' ? 'الملف الشخصي' : 'Profile'}</span>
                          </Link>

                          {/* Dashboard Link */}
                          {profileInfo && (
                            <Link
                              to={profileInfo.dashboardPath}
                              className='flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors group'
                              onClick={() => setIsUserMenuOpen(false)}
                            >
                              <ChartBarIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-600 mr-3" />
                              <span>
                                {user.role === 'admin' && (language === 'ar' ? 'لوحة الإدارة' : 'Admin Dashboard')}
                                {user.role === 'vendor' && (language === 'ar' ? 'لوحة التاجر' : 'Vendor Dashboard')}
                                {user.role === 'customer' && (language === 'ar' ? 'لوحة التحكم' : 'Dashboard')}
                              </span>
                            </Link>
                          )}

                          {/* Settings Link */}
                          <Link
                            to='/settings'
                            className='flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors group'
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <Cog6ToothIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-600 mr-3" />
                            <span>{language === 'ar' ? 'الإعدادات' : 'Settings'}</span>
                          </Link>
                        </div>

                        <hr className='my-2 border-gray-100' />

                        {/* Sign Out */}
                        <motion.button
                          onClick={handleSignOut}
                          className='flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors group'
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          disabled={authLoading}
                        >
                          <ArrowRightOnRectangleIcon className="w-5 h-5 text-red-500 group-hover:text-red-600 mr-3" />
                          <span>{authLoading ? 'جاري تسجيل الخروج...' : (language === 'ar' ? 'تسجيل الخروج' : 'Sign Out')}</span>
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link to='/login' className='btn btn-outline btn-sm'>
                    {language === 'ar' ? 'دخول' : 'Login'}
                  </Link>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link to='/register' className='btn btn-primary btn-sm'>
                    {language === 'ar' ? 'تسجيل' : 'Register'}
                  </Link>
                </motion.div>
              </>
            )}

            {/* Mobile Menu Button */}
            <motion.button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className='lg:hidden p-2 text-neutral-600 hover:text-primary-600 transition-colors'
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className='w-5 h-5' />
              ) : (
                <Bars3Icon className='w-5 h-5' />
              )}
            </motion.button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              className='lg:hidden border-t border-neutral-200'
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className='py-4 space-y-2'>
                {/* Mobile Search */}
                <div className='px-4 pb-4'>
                  <form onSubmit={handleSearch} className='relative'>
                    <input
                      type='text'
                      placeholder={
                        language === 'ar'
                          ? 'ابحث عن سيارة، قطع غيار...'
                          : 'Search for cars, parts...'
                      }
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className='w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-full focus:border-primary-500 focus:ring-1 focus:ring-primary-500'
                    />
                    <MagnifyingGlassIcon className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400' />
                  </form>
                </div>

                {navigationItems.map(item => (
                  <motion.div
                    key={item.href}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link
                      to={item.href}
                      className={clsx(
                        'block px-4 py-2 text-sm font-medium transition-colors',
                        isCurrentPath(item.href)
                          ? 'text-primary-600 bg-primary-50'
                          : 'text-neutral-700 hover:text-primary-600 hover:bg-neutral-50'
                      )}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {language === 'ar' ? item.name : item.nameEn}
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navbar;
