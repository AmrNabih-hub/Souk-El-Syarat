import React, { useState, useRef, useEffect } from 'react';
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
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
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
  const { language, theme, setLanguage, setTheme, getCartItemsCount, favorites } = useAppStore();

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
    { name: 'طلب كونك تاجر', href: '/vendor/apply', nameEn: 'Become a Vendor' },
  ];

  const isCurrentPath = (path: string) => location.pathname === path;

  return (
    <nav className='bg-white/95 backdrop-blur-sm border-b border-neutral-200 sticky top-0 z-50'>
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
                <h1 className='text-xl font-bold gradient-text font-display'>سوق السيارات</h1>
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
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className='p-2 text-neutral-600 hover:text-primary-600 transition-colors'
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {theme === 'light' ? (
                <MoonIcon className='w-5 h-5' />
              ) : (
                <SunIcon className='w-5 h-5' />
              )}
            </motion.button>

            {/* Language Toggle */}
            <motion.button
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className='p-2 text-neutral-600 hover:text-primary-600 transition-colors'
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <GlobeAltIcon className='w-5 h-5' />
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
