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
  BellIcon
} from '@heroicons/react/24/outline';

import { useAppStore } from '@/stores/appStore';
import { useMasterAuthStore } from '@/stores/authStore.master';
import clsx from 'clsx';
import toast from 'react-hot-toast';

const EnhancedNavbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useMasterAuthStore();
  const { 
    language, 
    theme, 
    setLanguage, 
    setTheme, 
    getCartItemsCount, 
    favorites 
  } = useAppStore();

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

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsUserMenuOpen(false);
      // Navigation is handled by the unified auth store
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('حدث خطأ في تسجيل الخروج');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/marketplace?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setIsSearchOpen(false);
    }
  };

  const handleLanguageToggle = () => {
    try {
      const newLanguage = language === 'ar' ? 'en' : 'ar';
      console.log('🌐 Language toggle clicked - Current:', language, 'New:', newLanguage);
      
      // Call the AppStore function
      setLanguage(newLanguage);
      
      // Show success toast
      const message = newLanguage === 'en' 
        ? '🇺🇸 Language changed to English' 
        : '🇪🇬 تم تغيير اللغة للعربية';
        
      toast.success(message, { 
        duration: 3000,
        style: {
          fontSize: '14px',
          fontWeight: '600',
          direction: newLanguage === 'ar' ? 'rtl' : 'ltr'
        }
      });
      
      console.log('✅ Language successfully changed to:', newLanguage);
      console.log('📊 Current AppStore language state:', useAppStore.getState().language);
    } catch (error) {
      console.error('❌ Error changing language:', error);
      toast.error('حدث خطأ في تغيير اللغة / Language change failed');
    }
  };

  const handleThemeToggle = () => {
    try {
      const newTheme = theme === 'light' ? 'dark' : 'light';
      console.log('🎨 Theme toggle clicked - Current:', theme, 'New:', newTheme);
      
      // Call the AppStore function
      setTheme(newTheme);
      
      // Show success toast
      const message = newTheme === 'dark' 
        ? (language === 'ar' ? '🌙 تم تفعيل الوضع المظلم' : '🌙 Dark mode activated')
        : (language === 'ar' ? '☀️ تم تفعيل الوضع المضيء' : '☀️ Light mode activated');
        
      toast.success(message, { 
        duration: 3000,
        style: {
          fontSize: '14px',
          fontWeight: '600',
          direction: language === 'ar' ? 'rtl' : 'ltr'
        }
      });
      
      console.log('✅ Theme successfully changed to:', newTheme);
      console.log('📊 Current AppStore theme state:', useAppStore.getState().theme);
      console.log('📊 Document classes:', document.documentElement.className);
    } catch (error) {
      console.error('❌ Error changing theme:', error);
      toast.error('حدث خطأ في تغيير الثيم / Theme change failed');
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
    <nav className='bg-white/95 backdrop-blur-lg border-b border-neutral-200/50 sticky top-0 z-50 shadow-sm'>
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
                className='w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg'
                whileHover={{ rotate: 5 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <span className='text-white font-bold text-xl'>س</span>
              </motion.div>
              <div className='hidden sm:block'>
                <h1 className='text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent font-display'>
                  سوق السيارات
                </h1>
                <p className='text-xs text-neutral-500 -mt-1'>Souk El-Syarat</p>
              </div>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <div className='hidden lg:flex items-center space-x-8'>
            {navigationItems.map((item) => (
              <motion.div
                key={item.href}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <Link
                  to={item.href}
                  className={clsx(
                    'px-3 py-2 text-sm font-medium transition-all duration-200 rounded-lg',
                    isCurrentPath(item.href)
                      ? 'text-blue-600 bg-blue-50 shadow-sm'
                      : 'text-neutral-700 hover:text-blue-600 hover:bg-neutral-50'
                  )}
                >
                  {language === 'ar' ? item.name : item.nameEn}
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Search Bar - Desktop */}
          <div className='hidden md:flex items-center flex-1 max-w-md mx-8'>
            <motion.form
              onSubmit={handleSearch}
              className='relative w-full'
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <input
                type='text'
                placeholder={
                  language === 'ar'
                    ? 'ابحث عن سيارة، قطع غيار...'
                    : 'Search for cars, parts...'
                }
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className='w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-full bg-neutral-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200'
                onFocus={() => setIsSearchOpen(true)}
              />
              <MagnifyingGlassIcon className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400' />
            </motion.form>
          </div>

          {/* Right Side Icons */}
          <div className='flex items-center space-x-3'>
            {/* Language Toggle - Enhanced */}
            <motion.button
              onClick={handleLanguageToggle}
              className='p-2.5 text-neutral-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 rounded-lg group'
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={language === 'ar' ? 'English' : 'العربية'}
            >
              <div className='flex items-center space-x-1'>
                <GlobeAltIcon className='w-5 h-5 group-hover:text-blue-600 transition-colors' />
                <span className='text-xs font-medium hidden sm:block'>
                  {language === 'ar' ? 'EN' : 'AR'}
                </span>
              </div>
            </motion.button>

            {/* Theme Toggle - Enhanced */}
            <motion.button
              onClick={handleThemeToggle}
              className='p-2.5 text-neutral-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 rounded-lg group'
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={theme === 'light' ? 
                (language === 'ar' ? 'الوضع المظلم' : 'Dark Mode') : 
                (language === 'ar' ? 'الوضع المضيء' : 'Light Mode')
              }
            >
              <AnimatePresence mode="wait">
                {theme === 'light' ? (
                  <motion.div
                    key="moon"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <MoonIcon className='w-5 h-5 group-hover:text-blue-600 transition-colors' />
                  </motion.div>
                ) : (
                  <motion.div
                    key="sun"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <SunIcon className='w-5 h-5 group-hover:text-blue-600 transition-colors' />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            {user ? (
              <>
                {/* Wishlist - Enhanced with Better Visibility */}
                <motion.div 
                  whileHover={{ scale: 1.05 }} 
                  whileTap={{ scale: 0.95 }}
                  className="relative"
                >
                  <Link
                    to='/wishlist'
                    className='relative p-2.5 text-neutral-600 hover:text-red-500 hover:bg-red-50 transition-all duration-200 rounded-lg group'
                    title={language === 'ar' ? 'قائمة المفضلة' : 'Wishlist'}
                  >
                    <HeartIcon className='w-5 h-5 group-hover:text-red-500 transition-colors' />
                    {favorites.length > 0 && (
                      <motion.span
                        className='absolute -top-2 -right-2 min-w-[20px] h-[20px] bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full flex items-center justify-center font-extrabold shadow-lg border-2 border-white z-30'
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400 }}
                        style={{ 
                          fontSize: '10px', 
                          lineHeight: '1',
                          minWidth: '20px',
                          height: '20px',
                          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)'
                        }}
                      >
                        {favorites.length > 99 ? '99+' : favorites.length}
                      </motion.span>
                    )}
                  </Link>
                </motion.div>

                {/* Cart - Enhanced with Better Visibility */}
                <motion.div 
                  whileHover={{ scale: 1.05 }} 
                  whileTap={{ scale: 0.95 }}
                  className="relative"
                >
                  <Link
                    to='/cart'
                    className='relative p-2.5 text-neutral-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 rounded-lg group'
                    title={language === 'ar' ? 'سلة التسوق' : 'Shopping Cart'}
                  >
                    <ShoppingCartIcon className='w-5 h-5 group-hover:text-blue-600 transition-colors' />
                    {getCartItemsCount() > 0 && (
                      <motion.span
                        className='absolute -top-2 -right-2 min-w-[20px] h-[20px] bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs rounded-full flex items-center justify-center font-extrabold shadow-lg border-2 border-white z-30'
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400 }}
                        style={{ 
                          fontSize: '10px', 
                          lineHeight: '1',
                          minWidth: '20px',
                          height: '20px',
                          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)'
                        }}
                      >
                        {getCartItemsCount() > 99 ? '99+' : getCartItemsCount()}
                      </motion.span>
                    )}
                  </Link>
                </motion.div>

                {/* User Menu - Enhanced */}
                <div className='relative' ref={userMenuRef}>
                  <motion.button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className='flex items-center space-x-2 p-2 text-neutral-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 rounded-lg'
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="relative">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.displayName}
                          className='w-8 h-8 rounded-full object-cover border-2 border-neutral-200'
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                          <UserIcon className='w-4 h-4 text-white' />
                        </div>
                      )}
                      {/* Role indicator */}
                      <div className={clsx(
                        'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white',
                        {
                          'bg-red-500': user.role === 'admin',
                          'bg-green-500': user.role === 'vendor',
                          'bg-blue-500': user.role === 'customer'
                        }
                      )} />
                    </div>
                    <div className='hidden sm:block text-left'>
                      <span className='text-sm font-medium block'>{user.displayName}</span>
                      <span className='text-xs text-neutral-500'>
                        {user.role === 'admin' ? 'مدير' : user.role === 'vendor' ? 'تاجر' : 'عضو'}
                      </span>
                    </div>
                    <ChevronDownIcon className='w-4 h-4 ml-1' />
                  </motion.button>

                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        className='absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-neutral-200 py-2 z-50'
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                      >
                        {/* User info header */}
                        <div className="px-4 py-3 border-b border-neutral-100">
                          <p className="text-sm font-medium text-neutral-900">{user.displayName}</p>
                          <p className="text-xs text-neutral-500">{user.email}</p>
                        </div>

                        <Link
                          to='/profile'
                          className='flex items-center px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors'
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <UserIcon className="w-4 h-4 mr-3" />
                          {language === 'ar' ? 'الملف الشخصي' : 'Profile'}
                        </Link>

                        {user.role === 'admin' && (
                          <Link
                            to='/admin/dashboard'
                            className='flex items-center px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors'
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <div className="w-4 h-4 mr-3 bg-red-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">A</span>
                            </div>
                            {language === 'ar' ? 'لوحة الإدارة' : 'Admin Dashboard'}
                          </Link>
                        )}

                        {user.role === 'vendor' && (
                          <Link
                            to='/vendor/dashboard'
                            className='flex items-center px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors'
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <div className="w-4 h-4 mr-3 bg-green-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">V</span>
                            </div>
                            {language === 'ar' ? 'لوحة التاجر' : 'Vendor Dashboard'}
                          </Link>
                        )}

                        {user.role === 'customer' && (
                          <Link
                            to='/dashboard'
                            className='flex items-center px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors'
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <div className="w-4 h-4 mr-3 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">C</span>
                            </div>
                            {language === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
                          </Link>
                        )}

                        <hr className='my-2' />

                        <button
                          onClick={handleSignOut}
                          className='flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors'
                        >
                          <XMarkIcon className="w-4 h-4 mr-3" />
                          {language === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link 
                    to='/login' 
                    className='px-4 py-2 text-sm font-medium text-neutral-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200'
                  >
                    {language === 'ar' ? 'دخول' : 'Login'}
                  </Link>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link 
                    to='/register' 
                    className='px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-lg shadow-sm transition-all duration-200'
                  >
                    {language === 'ar' ? 'تسجيل' : 'Register'}
                  </Link>
                </motion.div>
              </>
            )}

            {/* Mobile Menu Button */}
            <motion.button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className='lg:hidden p-2 text-neutral-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 rounded-lg'
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
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
              className='lg:hidden border-t border-neutral-200 bg-white'
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
                      className='w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-full focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                    />
                    <MagnifyingGlassIcon className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400' />
                  </form>
                </div>

                {navigationItems.map((item) => (
                  <motion.div
                    key={item.href}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link
                      to={item.href}
                      className={clsx(
                        'block px-4 py-3 text-sm font-medium transition-colors',
                        isCurrentPath(item.href)
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-neutral-700 hover:text-blue-600 hover:bg-neutral-50'
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

export default EnhancedNavbar;