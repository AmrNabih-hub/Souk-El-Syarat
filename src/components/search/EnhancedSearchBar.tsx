/**
 * Enhanced Search Bar Component
 * Advanced search with suggestions, recent searches, and filters
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  ClockIcon,
  FireIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/appStore';
import { ProductService } from '@/services/product.service';
import type { Product } from '@/types';

export const EnhancedSearchBar: React.FC<{ className?: string }> = ({ className }) => {
  const { language, addSearchHistory, searchHistory } = useAppStore();
  const navigate = useNavigate();
  
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const productService = new ProductService();

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions when query changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.trim().length < 2) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const results = await ProductService.searchProducts({ query });
        setSuggestions(results.products.slice(0, 5)); // Top 5 results
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleSearch = (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;

    addSearchHistory(searchQuery);
    navigate(`/marketplace?search=${encodeURIComponent(searchQuery)}`);
    setShowSuggestions(false);
    setQuery('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSuggestionClick = (product: Product) => {
    navigate(`/product/${product.id}`);
    setShowSuggestions(false);
    setQuery('');
  };

  const handleRecentSearchClick = (searchTerm: string) => {
    setQuery(searchTerm);
    handleSearch(searchTerm);
  };

  const clearSearch = () => {
    setQuery('');
    setSuggestions([]);
    inputRef.current?.focus();
  };

  // Popular searches (could be dynamic from analytics)
  const popularSearches = [
    language === 'ar' ? 'بي إم دبليو' : 'BMW',
    language === 'ar' ? 'مرسيدس' : 'Mercedes',
    language === 'ar' ? 'تويوتا' : 'Toyota',
    language === 'ar' ? 'قطع غيار' : 'Parts',
  ];

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={() => setShowSuggestions(true)}
          placeholder={language === 'ar' ? 'ابحث عن سيارات، قطع غيار...' : 'Search cars, parts...'}
          className="w-full pl-10 rtl:pl-4 rtl:pr-10 pr-10 py-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-neutral-900 dark:text-neutral-100 transition-all"
          dir={language === 'ar' ? 'rtl' : 'ltr'}
        />

        {/* Clear button */}
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 p-1 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded-full transition-colors"
          >
            <XMarkIcon className="w-4 h-4 text-neutral-500" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestions && (query || searchHistory.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-800 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden z-50 max-h-96 overflow-y-auto"
          >
            {/* Product Suggestions */}
            {suggestions.length > 0 && (
              <div className="p-2">
                <p className="px-3 py-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">
                  {language === 'ar' ? 'اقتراحات' : 'Suggestions'}
                </p>
                {suggestions.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleSuggestionClick(product)}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors text-left rtl:text-right"
                  >
                    {/* Product image */}
                    <img
                      src={product.images[0]?.url || '/placeholder-image.jpg'}
                      alt={product.title}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                    
                    {/* Product info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                        {product.title}
                      </p>
                      <p className="text-sm text-primary-600 dark:text-primary-400 font-semibold">
                        {new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-EG', {
                          style: 'currency',
                          currency: 'EGP',
                        }).format(product.price)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Recent Searches */}
            {searchHistory.length > 0 && !query && (
              <div className="p-2 border-t border-neutral-200 dark:border-neutral-700">
                <p className="px-3 py-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase flex items-center gap-2">
                  <ClockIcon className="w-4 h-4" />
                  {language === 'ar' ? 'عمليات بحث سابقة' : 'Recent Searches'}
                </p>
                {searchHistory.slice(0, 5).map((searchTerm, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleRecentSearchClick(searchTerm)}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors text-left rtl:text-right"
                  >
                    <ClockIcon className="w-4 h-4 text-neutral-400" />
                    <span className="text-neutral-700 dark:text-neutral-300">{searchTerm}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Popular Searches */}
            {!query && (
              <div className="p-2 border-t border-neutral-200 dark:border-neutral-700">
                <p className="px-3 py-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase flex items-center gap-2">
                  <FireIcon className="w-4 h-4" />
                  {language === 'ar' ? 'عمليات بحث شائعة' : 'Popular Searches'}
                </p>
                {popularSearches.map((searchTerm, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleRecentSearchClick(searchTerm)}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors text-left rtl:text-right"
                  >
                    <FireIcon className="w-4 h-4 text-orange-500" />
                    <span className="text-neutral-700 dark:text-neutral-300">{searchTerm}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Loading state */}
            {isLoading && (
              <div className="p-4 text-center">
                <div className="inline-block w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {/* No results */}
            {query && !isLoading && suggestions.length === 0 && (
              <div className="p-6 text-center text-neutral-500 dark:text-neutral-400">
                <p>{language === 'ar' ? 'لا توجد نتائج' : 'No results found'}</p>
                <p className="text-sm mt-1">
                  {language === 'ar' ? 'جرب كلمات بحث مختلفة' : 'Try different keywords'}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedSearchBar;
