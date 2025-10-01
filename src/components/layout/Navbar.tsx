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
  ChevronDownIcon,
} from '@heroicons/react/24/outline';

import { useAppStore } from '@/stores/appStore';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/contexts/ThemeContext';
import ProfessionalThemeToggle from '@/components/ui/ProfessionalThemeToggle';
import clsx from 'clsx';

const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuthStore();
  const { language, setLanguage, getCartItemsCount, favorites } = useAppStore();

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
      navigate('/');
    } catch (error) {
      if (process.env.NODE_ENV === 'development')
        if (process.env.NODE_ENV === 'development') console.error('Error signing out:', error);
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

  const navigationItems = [
    { name: 'الرئيسية', href: '/', nameEn: 'Home', isSpecial: false },
    { name: 'السوق', href: '/marketplace', nameEn: 'Marketplace', isSpecial: false },
    { name: 'التجار', href: '/vendors', nameEn: 'Vendors', isSpecial: false },
    { name: 'من نحن', href: '/about', nameEn: 'About', isSpecial: false },
    { name: 'اتصل بنا', href: '/contact', nameEn: 'Contact', isSpecial: false },
  ];

  const isCurrentPath = (path: string) => location.pathname === path;

  return (
    <nav className='bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border-b border-neutral-200/50 dark:border-neutral-800/50 sticky top-0 z-50 shadow-sm transition-colors duration-300'>
      <div className='w-full px-4 sm:px-6 lg:px-8'>
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
                <h1 className='text-xl font-bold font-display bg-clip-text text-transparent bg-gradient-to-r from-primary-600 via-secondary-600 to-primary-700 drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]' style={{ textShadow: '0 0 10px rgba(249,115,22,0.3)' }}>سوق السيارات</h1>
                <p className='text-xs text-neutral-500 -mt-1 font-medium tracking-wide'>Souk El-Syarat</p>
              </div>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <div className='hidden lg:flex items-center space-x-6'>
            {navigationItems.map(item => (
              <motion.div 
                key={item.href} 
                whileHover={{ y: -2 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              >
                <Link
                  to={item.href}
                  className={clsx(
                    'relative px-3 py-2 text-sm font-semibold transition-all duration-300 rounded-lg',
                    isCurrentPath(item.href)
                      ? 'bg-gradient-to-r from-primary-500/10 to-secondary-500/10 text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-gradient-to-r hover:from-primary-500/10 hover:to-secondary-500/10 hover:shadow-[0_0_15px_rgba(249,115,22,0.3)]'
                  )}
                >
                  {language === 'ar' ? item.name : item.nameEn}
                </Link>
              </motion.div>
            ))}
            
            {/* Sell Your Car Button - for customers only */}
            {user?.role === 'customer' && (
              <motion.div 
                whileHover={{ scale: 1.05, y: -2 }} 
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              >
                <Link 
                  to='/sell-your-car' 
                  className='px-4 py-2 text-sm font-bold text-white rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 shadow-md hover:shadow-[0_0_20px_rgba(16,185,129,0.5)]'
                >
                  {language === 'ar' ? 'بيع عربيتك' : 'Sell Your Car'}
                </Link>
              </motion.div>
            )}
            
            {/* Become a Vendor Button - positioned beside Contact Us */}
            {!user && (
              <motion.div 
                whileHover={{ scale: 1.05, y: -2 }} 
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              >
                <Link 
                  to='/vendor/apply' 
                  className='px-4 py-2 text-sm font-bold text-white rounded-full bg-gradient-to-r from-primary-500 to-secondary-600 hover:from-primary-600 hover:to-secondary-700 transition-all duration-300 shadow-md hover:shadow-[0_0_20px_rgba(249,115,22,0.5)]'
                >
                  {language === 'ar' ? 'كن تاجراً' : 'Become a Vendor'}
                </Link>
              </motion.div>
            )}
          </div>

          {/* Search Bar */}
          <div className='hidden md:flex flex-1 max-w-xs mx-6' ref={searchRef}>
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
          <div className='flex items-center space-x-3'>
            {/* Language Toggle */}
            <motion.button
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className='p-2 text-neutral-600 hover:text-primary-600 transition-colors duration-200 rounded-lg'
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={language === 'ar' ? 'تغيير اللغة' : 'Change Language'}
              aria-label={language === 'ar' ? 'تغيير اللغة إلى الإنجليزية' : 'Change language to Arabic'}
            >
              <GlobeAltIcon className='w-5 h-5' />
            </motion.button>
            
            {/* Theme Toggle - Now visible on desktop */}
            <div className='hidden md:block'>
              <ProfessionalThemeToggle className='p-2' />
            </div>

            {user ? (
              <>
                {/* Wishlist */}
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Link
                    to='/favorites'
                    className='relative p-2 text-neutral-600 hover:text-red-500 transition-colors group'
                    title={language === 'ar' ? 'قائمة المفضلة' : 'Wishlist'}
                  >
                    <HeartIcon className='w-5 h-5 group-hover:text-red-500' />
                    {favorites.length > 0 && (
                      <motion.span
                        className='absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium shadow-sm'
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300 }}
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
                        className='absolute -top-1 -right-1 w-5 h-5 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center font-medium shadow-sm'
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                      >
                        {getCartItemsCount() > 99 ? '99+' : getCartItemsCount()}
                      </motion.span>
                    )}
                  </Link>
                </motion.div>

                {/* User Menu */}
                <div className='relative' ref={userMenuRef}>
                  <motion.button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className='flex items-center space-x-2 p-2 text-neutral-600 hover:text-primary-600 transition-colors'
                    whileHover={{ scale: 1.05 }}
                    title={language === 'ar' ? 'قائمة المستخدم' : 'User Menu'}
                    aria-label={language === 'ar' ? 'فتح قائمة المستخدم' : 'Open user menu'}
                  >
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName}
                        className='w-6 h-6 rounded-full object-cover'
                      />
                    ) : (
                      <UserIcon className='w-5 h-5' />
                    )}
                    <span className='hidden sm:block text-sm font-medium'>{user.displayName}</span>
                    <ChevronDownIcon className='w-4 h-4' />
                  </motion.button>

                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        className='absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-neutral-200 py-2 z-50'
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                      >
                        <Link
                          to='/profile'
                          className='block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors'
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          {language === 'ar' ? 'الملف الشخصي' : 'Profile'}
                        </Link>

                        {user.role === 'admin' && (
                          <Link
                            to='/admin/dashboard'
                            className='block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors'
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            {language === 'ar' ? 'لوحة الإدارة' : 'Admin Dashboard'}
                          </Link>
                        )}

                        {user.role === 'vendor' && (
                          <Link
                            to='/vendor/dashboard'
                            className='block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors'
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            {language === 'ar' ? 'لوحة التاجر' : 'Vendor Dashboard'}
                          </Link>
                        )}

                        {user.role === 'customer' && (
                          <Link
                            to='/dashboard'
                            className='block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors'
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            {language === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
                          </Link>
                        )}

                        <hr className='my-2' />

                        <button
                          onClick={handleSignOut}
                          className='block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors'
                        >
                          {language === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <>
                <motion.div 
                  whileHover={{ scale: 1.02 }} 
                  whileTap={{ scale: 0.98 }}
                >
                  <Link 
                    to='/login' 
                    className='px-4 py-2 text-sm font-semibold text-neutral-700 border border-neutral-300 rounded-full hover:border-primary-500 hover:text-primary-600 transition-all duration-200'
                  >
                    {language === 'ar' ? 'دخول' : 'Login'}
                  </Link>
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.02 }} 
                  whileTap={{ scale: 0.98 }}
                >
                  <Link 
                    to='/register' 
                    className='px-4 py-2 text-sm font-semibold text-white rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm'
                  >
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
              title={language === 'ar' ? 'القائمة' : 'Menu'}
              aria-label={language === 'ar' ? 'فتح القائمة الرئيسية' : 'Open main menu'}
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
                        // Special styling for "Become a Vendor" in mobile
                        item.isSpecial 
                          ? 'text-white bg-gradient-to-r from-primary-500 to-secondary-600 font-bold text-center rounded-lg mx-2 my-2' 
                          : clsx(
                              isCurrentPath(item.href)
                                ? 'text-primary-600 bg-primary-50'
                                : 'text-neutral-700 hover:text-primary-600 hover:bg-neutral-50'
                            )
                      )}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {language === 'ar' ? item.name : item.nameEn}
                    </Link>
                  </motion.div>
                ))}

                {/* Theme Toggle in Mobile Menu */}
                <div className='mt-6 pt-4 border-t border-neutral-200'>
                  <div className='px-4 py-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider'>
                    {language === 'ar' ? 'إعدادات' : 'Settings'}
                  </div>
                  <div className='px-4 py-2'>
                    <ProfessionalThemeToggle variant="button" showLabel={true} className="w-full justify-start" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navbar;
