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
    { name: 'الرئيسية', href: '/', nameEn: 'Home' },
    { name: 'السوق', href: '/marketplace', nameEn: 'Marketplace' },
    { name: 'التجار', href: '/vendors', nameEn: 'Vendors' },
    ...(user?.role === 'customer' ? [{ name: 'بيع سيارتك', href: '/sell-car', nameEn: 'Sell Your Car' }] : []),
    { name: 'من نحن', href: '/about', nameEn: 'About' },
    { name: 'اتصل بنا', href: '/contact', nameEn: 'Contact' },
  ];

  const isCurrentPath = (path: string) => location.pathname === path;

  return (
    <nav className='bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border-b border-neutral-200/50 dark:border-neutral-800/50 sticky top-0 z-50 shadow-sm transition-colors duration-300'>
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
                <h1 className='text-xl font-bold font-display bg-clip-text text-transparent bg-gradient-to-r from-primary-600 via-secondary-600 to-primary-700 drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]' style={{ textShadow: '0 0 10px rgba(249,115,22,0.3)' }}>سوق السيارات</h1>
                <p className='text-xs text-neutral-500 -mt-1 font-medium tracking-wide'>Souk El-Syarat</p>
              </div>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <div className='hidden lg:flex items-center space-x-8'>
            {navigationItems.map(item => (
              <motion.div 
                key={item.href} 
                whileHover={{ y: -3, scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              >
                <Link
                  to={item.href}
                  className={clsx(
                    'relative px-4 py-2 text-sm font-bold tracking-wide transition-all duration-300',
                    'hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-primary-500 hover:via-secondary-500 hover:to-primary-600',
                    'hover:drop-shadow-[0_0_8px_rgba(249,115,22,0.6)] hover:text-shadow-lg',
                    'transform hover:scale-105 font-display uppercase letter-spacing-wider',
                    isCurrentPath(item.href)
                      ? 'text-transparent bg-clip-text bg-gradient-to-r from-primary-600 via-secondary-600 to-primary-700 drop-shadow-[0_0_6px_rgba(249,115,22,0.5)]'
                      : 'text-neutral-700 hover:text-primary-600'
                  )}
                  style={{
                    textShadow: isCurrentPath(item.href) ? '0 0 10px rgba(249,115,22,0.4)' : 'none'
                  }}
                >
                  {language === 'ar' ? item.name : item.nameEn}
                  {isCurrentPath(item.href) && (
                    <motion.div
                      className='absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 via-secondary-500 to-primary-600 rounded-full'
                      layoutId='navbar-indicator'
                      style={{
                        boxShadow: '0 0 8px rgba(249,115,22,0.6), 0 0 16px rgba(249,115,22,0.3)'
                      }}
                    />
                  )}
                  {/* Backlight effect for non-active items */}
                  <motion.div
                    className='absolute inset-0 rounded-lg bg-gradient-to-r from-primary-500/20 via-secondary-500/20 to-primary-600/20 opacity-0'
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      boxShadow: '0 0 20px rgba(249,115,22,0.2)'
                    }}
                  />
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

          {/* Premium Become a Vendor Button - Right of Search Bar */}
          {!user && (
            <div className='hidden md:block mr-4 relative'>
              <motion.div 
                className='relative' 
                whileHover={{ scale: 1.08, y: -2 }} 
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              >
                {/* Outer glow effect - properly positioned */}
                <motion.div
                  className='absolute inset-0 rounded-full blur-lg opacity-0 group-hover:opacity-60 transition-opacity duration-300 -z-10'
                  style={{
                    background: 'linear-gradient(135deg, #fbbf24, #f59e0b, #ea580c)',
                    filter: 'blur(8px)',
                    transform: 'scale(1.2)'
                  }}
                  animate={{
                    scale: [1.2, 1.3, 1.2],
                    opacity: [0.4, 0.6, 0.4]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                />
                
                <Link 
                  to='/vendor/apply' 
                  className='relative inline-flex items-center px-6 py-2.5 text-sm font-bold tracking-wide text-white rounded-full overflow-hidden group transition-all duration-300'
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 25%, #ea580c 50%, #dc2626 75%, #b91c1c 100%)',
                    boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4), 0 0 20px rgba(245, 158, 11, 0.2)'
                  }}
                >
                  {/* Animated background glow */}
                  <motion.div
                    className='absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300'
                    animate={{
                      background: [
                        'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #ea580c 100%)',
                        'linear-gradient(135deg, #ea580c 0%, #dc2626 50%, #fbbf24 100%)',
                        'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #ea580c 100%)'
                      ]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                  />
                  
                  {/* Shine effect */}
                  <motion.div
                    className='absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 group-hover:translate-x-full transition-transform duration-700'
                    initial={{ translateX: '-100%' }}
                    whileHover={{ translateX: '100%' }}
                  />
                  
                  {/* Button text */}
                  <span className='relative z-10 font-display uppercase tracking-wider drop-shadow-sm'>
                    {language === 'ar' ? 'كن تاجراً' : 'Become a Vendor'}
                  </span>
                  
                  {/* Premium glow border */}
                  <div 
                    className='absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300'
                    style={{
                      background: 'linear-gradient(135deg, transparent, rgba(255,255,255,0.3), transparent)',
                      padding: '1px'
                    }}
                  />
                </Link>
              </motion.div>
            </div>
          )}

          {/* Right Side Icons */}
          <div className='flex items-center space-x-4'>
            {/* Professional Theme Toggle Dropdown */}
            <ProfessionalThemeToggle variant="dropdown" />

            {/* Enhanced Language Toggle */}
            <motion.button
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className='relative p-2 text-neutral-600 hover:text-primary-600 transition-all duration-300 rounded-lg group'
              whileHover={{ scale: 1.15, y: -2 }}
              whileTap={{ scale: 0.9 }}
              title={language === 'ar' ? 'تغيير اللغة' : 'Change Language'}
              aria-label={language === 'ar' ? 'تغيير اللغة إلى الإنجليزية' : 'Change language to Arabic'}
            >
              <motion.div
                className='absolute inset-0 rounded-lg bg-gradient-to-r from-primary-500/20 via-secondary-500/20 to-primary-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300'
                style={{ boxShadow: '0 0 15px rgba(249,115,22,0.2)' }}
              />
              <GlobeAltIcon className='w-5 h-5 relative z-10 group-hover:drop-shadow-[0_0_6px_rgba(249,115,22,0.6)]' />
            </motion.button>

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
                  whileHover={{ scale: 1.05, y: -2 }} 
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                >
                  <Link 
                    to='/login' 
                    className='relative px-4 py-2 text-sm font-bold tracking-wide text-neutral-700 border border-neutral-300 rounded-full hover:border-primary-500 hover:text-primary-600 transition-all duration-300 group overflow-hidden'
                  >
                    <motion.div
                      className='absolute inset-0 bg-gradient-to-r from-primary-500/10 via-secondary-500/10 to-primary-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300'
                    />
                    <span className='relative z-10 font-display group-hover:drop-shadow-[0_0_4px_rgba(249,115,22,0.4)]'>
                      {language === 'ar' ? 'دخول' : 'Login'}
                    </span>
                  </Link>
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.05, y: -2 }} 
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                >
                  <Link 
                    to='/register' 
                    className='relative px-4 py-2 text-sm font-bold tracking-wide text-white rounded-full overflow-hidden group transition-all duration-300'
                    style={{
                      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 50%, #1e40af 100%)',
                      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                    }}
                  >
                    <motion.div
                      className='absolute inset-0 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300'
                    />
                    <span className='relative z-10 font-display drop-shadow-sm'>
                      {language === 'ar' ? 'تسجيل' : 'Register'}
                    </span>
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
