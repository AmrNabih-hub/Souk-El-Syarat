/**
 * Advanced Search Filters Component
 * Comprehensive filtering interface for the marketplace
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AdjustmentsHorizontalIcon,
  ChevronDownIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { SearchFilters, ProductCategory, ProductCondition } from '@/types';
import { useAppStore } from '@/stores/appStore';
import clsx from 'clsx';

interface AdvancedSearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: Partial<SearchFilters>) => void;
  onClearFilters: () => void;
  className?: string;
  compact?: boolean;
}

const CATEGORIES: { value: ProductCategory; label: string; labelEn: string }[] = [
  { value: 'cars', label: 'سيارات', labelEn: 'Cars' },
  { value: 'parts', label: 'قطع غيار', labelEn: 'Parts' },
  { value: 'accessories', label: 'إكسسوارات', labelEn: 'Accessories' },
  { value: 'services', label: 'خدمات', labelEn: 'Services' },
];

const CONDITIONS: { value: ProductCondition; label: string; labelEn: string }[] = [
  { value: 'new', label: 'جديد', labelEn: 'New' },
  { value: 'used', label: 'مستعمل', labelEn: 'Used' },
  { value: 'refurbished', label: 'مجدد', labelEn: 'Refurbished' },
];

const BRANDS = [
  'BMW', 'Mercedes-Benz', 'Audi', 'Toyota', 'Honda', 'Nissan', 
  'Ford', 'Chevrolet', 'Hyundai', 'Kia', 'Mazda', 'Volkswagen'
];

const SORT_OPTIONS = [
  { value: 'relevance', label: 'الأكثر صلة', labelEn: 'Most Relevant' },
  { value: 'price_asc', label: 'السعر: من الأقل إلى الأعلى', labelEn: 'Price: Low to High' },
  { value: 'price_desc', label: 'السعر: من الأعلى إلى الأقل', labelEn: 'Price: High to Low' },
  { value: 'date_desc', label: 'الأحدث أولاً', labelEn: 'Newest First' },
  { value: 'date_asc', label: 'الأقدم أولاً', labelEn: 'Oldest First' },
  { value: 'rating_desc', label: 'التقييم: الأعلى أولاً', labelEn: 'Rating: Highest First' },
];

export const AdvancedSearchFilters: React.FC<AdvancedSearchFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  className,
  compact = false,
}) => {
  const { language } = useAppStore();
  const [isExpanded, setIsExpanded] = useState(!compact);

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && 
    value !== null && 
    value !== '' && 
    !(Array.isArray(value) && value.length === 0)
  );

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    onFiltersChange({ [key]: value });
  };

  const FilterSection: React.FC<{ 
    title: string; 
    children: React.ReactNode;
    collapsible?: boolean;
    defaultExpanded?: boolean;
  }> = ({ title, children, collapsible = false, defaultExpanded = true }) => {
    const [expanded, setExpanded] = useState(defaultExpanded);

    return (
      <div className="border-b border-neutral-200 dark:border-neutral-700 pb-4 mb-4 last:border-b-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {title}
          </h3>
          {collapsible && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors"
            >
              <ChevronDownIcon 
                className={clsx('w-4 h-4 transition-transform', {
                  'rotate-180': expanded
                })}
              />
            </button>
          )}
        </div>
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className={clsx('bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <FunnelIcon className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {language === 'ar' ? 'تصفية النتائج' : 'Filter Results'}
          </h2>
          {hasActiveFilters && (
            <span className="bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-xs px-2 py-1 rounded-full">
              {Object.values(filters).filter(v => v !== undefined && v !== null && v !== '').length}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
            >
              {language === 'ar' ? 'مسح الكل' : 'Clear All'}
            </button>
          )}
          {compact && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <AdjustmentsHorizontalIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Filters Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-6">
              {/* Category Filter */}
              <FilterSection title={language === 'ar' ? 'الفئة' : 'Category'}>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map(category => (
                    <label
                      key={category.value}
                      className={clsx(
                        'flex items-center p-2 rounded-lg border cursor-pointer transition-all',
                        filters.category === category.value
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
                      )}
                    >
                      <input
                        type="radio"
                        name="category"
                        value={category.value}
                        checked={filters.category === category.value}
                        onChange={(e) => handleFilterChange('category', e.target.value as ProductCategory)}
                        className="sr-only"
                      />
                      <span className="text-sm font-medium">
                        {language === 'ar' ? category.label : category.labelEn}
                      </span>
                    </label>
                  ))}
                </div>
              </FilterSection>

              {/* Price Range */}
              <FilterSection title={language === 'ar' ? 'نطاق السعر' : 'Price Range'}>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                      {language === 'ar' ? 'من' : 'From'}
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={filters.priceMin || ''}
                      onChange={(e) => handleFilterChange('priceMin', e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                      {language === 'ar' ? 'إلى' : 'To'}
                    </label>
                    <input
                      type="number"
                      placeholder="∞"
                      value={filters.priceMax || ''}
                      onChange={(e) => handleFilterChange('priceMax', e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </FilterSection>

              {/* Condition */}
              <FilterSection title={language === 'ar' ? 'الحالة' : 'Condition'}>
                <div className="space-y-2">
                  {CONDITIONS.map(condition => (
                    <label
                      key={condition.value}
                      className="flex items-center space-x-3 rtl:space-x-reverse cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="condition"
                        value={condition.value}
                        checked={filters.condition === condition.value}
                        onChange={(e) => handleFilterChange('condition', e.target.value as ProductCondition)}
                        className="w-4 h-4 text-primary-600 border-neutral-300 focus:ring-primary-500"
                      />
                      <span className="text-sm">
                        {language === 'ar' ? condition.label : condition.labelEn}
                      </span>
                    </label>
                  ))}
                </div>
              </FilterSection>

              {/* Brand */}
              <FilterSection title={language === 'ar' ? 'الماركة' : 'Brand'}>
                <select
                  value={filters.brand || ''}
                  onChange={(e) => handleFilterChange('brand', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">{language === 'ar' ? 'جميع الماركات' : 'All Brands'}</option>
                  {BRANDS.map(brand => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
              </FilterSection>

              {/* Year Range */}
              <FilterSection title={language === 'ar' ? 'سنة الصنع' : 'Year Range'}>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                      {language === 'ar' ? 'من' : 'From'}
                    </label>
                    <select
                      value={filters.yearMin || ''}
                      onChange={(e) => handleFilterChange('yearMin', e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">{language === 'ar' ? 'أي سنة' : 'Any Year'}</option>
                      {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i).map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                      {language === 'ar' ? 'إلى' : 'To'}
                    </label>
                    <select
                      value={filters.yearMax || ''}
                      onChange={(e) => handleFilterChange('yearMax', e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">{language === 'ar' ? 'أي سنة' : 'Any Year'}</option>
                      {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i).map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </FilterSection>

              {/* Sort Options */}
              <FilterSection title={language === 'ar' ? 'ترتيب النتائج' : 'Sort Results'}>
                <select
                  value={filters.sortBy || 'relevance'}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {SORT_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {language === 'ar' ? option.label : option.labelEn}
                    </option>
                  ))}
                </select>
              </FilterSection>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdvancedSearchFilters;