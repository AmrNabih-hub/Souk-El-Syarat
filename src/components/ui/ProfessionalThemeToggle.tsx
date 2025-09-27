import React from 'react';
import { motion } from 'framer-motion';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import { useTheme } from '@/contexts/ThemeContext';
import { useAppStore } from '@/stores/appStore';
import clsx from 'clsx';

interface ProfessionalThemeToggleProps {
  className?: string;
  showLabel?: boolean;
  variant?: 'button' | 'dropdown';
}

const ProfessionalThemeToggle: React.FC<ProfessionalThemeToggleProps> = ({
  className = '',
  showLabel = false,
  variant = 'button'
}) => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { language } = useAppStore();
  const [isOpen, setIsOpen] = React.useState(false);

  const themes = [
    {
      value: 'light' as const,
      label: { ar: 'فاتح', en: 'Light' },
      icon: SunIcon,
      description: { ar: 'المظهر الفاتح', en: 'Light mode' }
    },
    {
      value: 'dark' as const,
      label: { ar: 'داكن', en: 'Dark' },
      icon: MoonIcon,
      description: { ar: 'المظهر الداكن', en: 'Dark mode' }
    },
    {
      value: 'auto' as const,
      label: { ar: 'تلقائي', en: 'Auto' },
      icon: ComputerDesktopIcon,
      description: { ar: 'حسب النظام', en: 'System preference' }
    }
  ];

  const currentTheme = themes.find(t => t.value === theme);
  const CurrentIcon = currentTheme?.icon || SunIcon;

  if (variant === 'button') {
    return (
      <motion.button
        onClick={() => {
          const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'auto' : 'light';
          setTheme(nextTheme);
        }}
        className={clsx(
          'relative flex items-center space-x-2 p-3 rounded-xl transition-all duration-300',
          'bg-white/80 dark:bg-neutral-800/80 backdrop-blur-md',
          'border border-neutral-200 dark:border-neutral-700',
          'hover:bg-white dark:hover:bg-neutral-800',
          'hover:shadow-lg dark:hover:shadow-neutral-900/30',
          'group focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400',
          className
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        title={currentTheme?.description[language]}
        aria-label={`${language === 'ar' ? 'تبديل المظهر إلى' : 'Switch theme to'} ${currentTheme?.label[language]}`}
      >
        {/* Icon with animation */}
        <motion.div
          key={theme}
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="relative"
        >
          <CurrentIcon className="w-5 h-5 text-neutral-600 dark:text-neutral-300 group-hover:text-primary-600 dark:group-hover:text-primary-400" />
          
          {/* Glow effect for current mode */}
          <motion.div
            className="absolute inset-0 rounded-full"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ 
              scale: resolvedTheme === 'dark' ? [1, 1.2, 1] : [1, 1.1, 1],
              opacity: resolvedTheme === 'dark' ? [0.3, 0.6, 0.3] : [0.2, 0.4, 0.2]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              background: resolvedTheme === 'dark' 
                ? 'radial-gradient(circle, rgba(245, 158, 11, 0.3) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(245, 158, 11, 0.2) 0%, transparent 70%)'
            }}
          />
        </motion.div>

        {/* Label */}
        {showLabel && (
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200 group-hover:text-primary-600 dark:group-hover:text-primary-400">
            {currentTheme?.label[language]}
          </span>
        )}

        {/* Theme indicator */}
        {theme === 'auto' && (
          <motion.div
            className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full shadow-sm"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
          />
        )}
      </motion.button>
    );
  }

  // Dropdown variant (used in navbar)
  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'flex items-center space-x-1 p-2 rounded-lg transition-colors',
          'text-neutral-600 dark:text-neutral-300',
          'hover:text-primary-600 dark:hover:text-primary-400',
          'hover:bg-neutral-100 dark:hover:bg-neutral-700/50',
          className
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={`${language === 'ar' ? 'فتح قائمة المظهر' : 'Open theme menu'}`}
        title={language === 'ar' ? 'تغيير المظهر' : 'Change theme'}
      >
        <motion.div
          key={theme}
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <CurrentIcon className="w-5 h-5" />
        </motion.div>
        
        {theme === 'auto' && (
          <ComputerDesktopIcon className="w-3 h-3 opacity-60" />
        )}
      </motion.button>

      {/* Dropdown menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          <motion.div
            className="absolute right-0 mt-2 w-44 bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 py-2 z-50 backdrop-blur-sm"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            <div className="px-3 py-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              {language === 'ar' ? 'المظهر' : 'Appearance'}
            </div>
            
            {themes.map((themeOption) => {
              const Icon = themeOption.icon;
              const isActive = theme === themeOption.value;
              
              return (
                <motion.button
                  key={themeOption.value}
                  onClick={() => {
                    setTheme(themeOption.value);
                    setIsOpen(false);
                  }}
                  className={clsx(
                    'flex items-center w-full px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700/50'
                  )}
                  whileHover={{ x: 2 }}
                  transition={{ duration: 0.15 }}
                >
                  <Icon className="w-4 h-4 mr-3" />
                  <span>{themeOption.label[language]}</span>
                  
                  {isActive && (
                    <motion.div
                      className="ml-auto w-2 h-2 bg-primary-500 rounded-full"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        </>
      )}
    </div>
  );
};

export default ProfessionalThemeToggle;