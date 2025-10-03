/**
 * Advanced Search Hook
 * Provides comprehensive search functionality with filters, sorting, and pagination
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Product, SearchFilters, SearchResult } from '@/types';
import { ProductService } from '@/services/product.service';
import { useAppStore } from '@/stores/appStore';
import { debounce } from '@/utils/performance';

export interface UseSearchOptions {
  initialQuery?: string;
  initialFilters?: Partial<SearchFilters>;
  debounceMs?: number;
  enableAutoSearch?: boolean;
}

export interface UseSearchReturn {
  // Search state
  query: string;
  filters: SearchFilters;
  results: Product[];
  totalResults: number;
  isLoading: boolean;
  isSearching: boolean;
  error: string | null;
  hasSearched: boolean;
  
  // Pagination
  currentPage: number;
  totalPages: number;
  pageSize: number;
  
  // Actions
  setQuery: (query: string) => void;
  setFilters: (filters: Partial<SearchFilters>) => void;
  updateFilter: (key: keyof SearchFilters, value: any) => void;
  search: (customQuery?: string, customFilters?: Partial<SearchFilters>) => Promise<void>;
  clearSearch: () => void;
  clearFilters: () => void;
  loadMore: () => Promise<void>;
  goToPage: (page: number) => Promise<void>;
  
  // Utilities
  getFilterCount: () => number;
  isFiltered: boolean;
  suggestedQueries: string[];
  recentSearches: string[];
}

const DEFAULT_FILTERS: SearchFilters = {
  category: undefined,
  subcategory: undefined,
  priceMin: undefined,
  priceMax: undefined,
  location: undefined,
  condition: undefined,
  brand: undefined,
  model: undefined,
  yearMin: undefined,
  yearMax: undefined,
  features: [],
  sortBy: 'relevance',
  sortOrder: 'desc',
};

export const useSearch = (options: UseSearchOptions = {}): UseSearchReturn => {
  const {
    initialQuery = '',
    initialFilters = {},
    debounceMs = 300,
    enableAutoSearch = true,
  } = options;

  // Language support - currently using default
  
  // State
  const [query, setQueryState] = useState(initialQuery);
  const [filters, setFiltersState] = useState<SearchFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });
  const [results, setResults] = useState<Product[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorageService.getFilePreviewItem('recent_searches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to load recent searches:', error);
      }
    }
  }, []);

  // Save recent searches to localStorage
  const saveRecentSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setRecentSearches(prev => {
      const filtered = prev.filter(q => q !== searchQuery);
      const updated = [searchQuery, ...filtered].slice(0, 10);
      localStorage.setItem('recent_searches', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Perform search
  const performSearch = useCallback(async (
    searchQuery: string = query,
    searchFilters: Partial<SearchFilters> = filters,
    page: number = 1
  ) => {
    setIsSearching(true);
    setError(null);
    
    try {
      const searchResult: SearchResult = await ProductService.searchProducts({
        query: searchQuery,
        filters: { ...filters, ...searchFilters },
        page,
        limit: pageSize,
      });

      if (page === 1) {
        setResults(searchResult.products);
      } else {
        setResults(prev => [...prev, ...searchResult.products]);
      }
      
      setTotalResults(searchResult.total);
      setCurrentPage(page);
      setHasSearched(true);
      
      // Save successful search to recent searches
      if (searchQuery.trim()) {
        saveRecentSearch(searchQuery.trim());
      }
      
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في البحث');
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
      setIsLoading(false);
    }
  }, [query, filters, pageSize, saveRecentSearch]);

  // Debounced search function
  const debouncedSearch = useMemo(
    () => debounce(performSearch, debounceMs),
    [performSearch, debounceMs]
  );

  // Auto search when query or filters change
  useEffect(() => {
    if (enableAutoSearch && (query || hasSearched)) {
      setIsLoading(true);
      debouncedSearch();
    }
  }, [query, filters, enableAutoSearch, hasSearched, debouncedSearch]);

  // Action handlers
  const setQuery = useCallback((newQuery: string) => {
    setQueryState(newQuery);
    setCurrentPage(1);
  }, []);

  const setFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  }, []);

  const updateFilter = useCallback((key: keyof SearchFilters, value: any) => {
    setFilters({ [key]: value });
  }, [setFilters]);

  const search = useCallback(async (
    customQuery?: string,
    customFilters?: Partial<SearchFilters>
  ) => {
    setIsLoading(true);
    await performSearch(customQuery, customFilters, 1);
  }, [performSearch]);

  const clearSearch = useCallback(() => {
    setQueryState('');
    setResults([]);
    setTotalResults(0);
    setHasSearched(false);
    setError(null);
    setCurrentPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
    setCurrentPage(1);
  }, []);

  const loadMore = useCallback(async () => {
    if (currentPage * pageSize < totalResults) {
      await performSearch(query, filters, currentPage + 1);
    }
  }, [currentPage, pageSize, totalResults, performSearch, query, filters]);

  const goToPage = useCallback(async (page: number) => {
    setIsLoading(true);
    await performSearch(query, filters, page);
  }, [performSearch, query, filters]);

  // Utilities
  const getFilterCount = useCallback(() => {
    return Object.values(filters).filter(value => 
      value !== undefined && 
      value !== null && 
      value !== '' && 
      !(Array.isArray(value) && value.length === 0)
    ).length;
  }, [filters]);

  const isFiltered = useMemo(() => getFilterCount() > 0, [getFilterCount]);

  const totalPages = useMemo(() => 
    Math.ceil(totalResults / pageSize), 
    [totalResults, pageSize]
  );

  // Suggested queries based on current context
  const suggestedQueries = useMemo(() => {
    const suggestions = [
      'BMW',
      'Mercedes',
      'Toyota',
      'سيارات مستعملة',
      'قطع غيار',
      'سيارات كهربائية',
    ];
    
    return suggestions.filter(suggestion => 
      !query || suggestion.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);
  }, [query]);

  return {
    // Search state
    query,
    filters,
    results,
    totalResults,
    isLoading,
    isSearching,
    error,
    hasSearched,
    
    // Pagination
    currentPage,
    totalPages,
    pageSize,
    
    // Actions
    setQuery,
    setFilters,
    updateFilter,
    search,
    clearSearch,
    clearFilters,
    loadMore,
    goToPage,
    
    // Utilities
    getFilterCount,
    isFiltered,
    suggestedQueries,
    recentSearches,
  };
};

export default useSearch;