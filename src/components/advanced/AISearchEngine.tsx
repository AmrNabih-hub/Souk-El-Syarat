import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  SparklesIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
}

const AISearchEngine: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);

    try {
      // Demo results
      const demoResults: SearchResult[] = [
        {
          id: '1',
          title: 'BMW 320i 2020 - Excellent Condition',
          description: 'Luxury sedan with full service history',
          price: 450000,
          currency: 'EGP',
          category: 'Sedans'
        },
        {
          id: '2', 
          title: 'Mercedes C200 2019 - Low Mileage',
          description: 'German engineering at its finest',
          price: 520000,
          currency: 'EGP',
          category: 'Luxury'
        }
      ];

      // Filter results based on search query
      const filteredResults = demoResults.filter(result => 
        result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.description.toLowerCase().includes(searchQuery.toLowerCase())
      );

      setResults(filteredResults);

    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search cars, parts, services... (e.g., 'BMW sedan')"
          className="w-full px-12 py-4 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-0 transition-colors"
        />
        <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        
        {isSearching && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
          </div>
        )}
      </form>

      {/* Search Results */}
      <div className="mt-6">
        {results.length > 0 && (
          <div className="mb-4 flex items-center justify-between">
            <p className="text-gray-600">
              Found {results.length} results for "{query}"
            </p>
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-4 h-4 text-yellow-500" />
              <span className="text-sm text-gray-600">AI-powered search</span>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <AnimatePresence>
            {results.map((result) => (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {result.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3">
                      {result.description}
                    </p>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {result.category}
                    </span>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-bold text-lg text-blue-600">
                      {result.price.toLocaleString()} {result.currency}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {query && !isSearching && results.length === 0 && (
          <div className="text-center py-12">
            <MagnifyingGlassIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-600">
              Try different search terms
            </p>
          </div>
        )}
      </div>

      {/* Demo Info */}
      {!query && (
        <div className="mt-6 text-center">
          <div className="bg-blue-50 rounded-lg p-6">
            <SparklesIcon className="w-8 h-8 text-blue-500 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">AI-Powered Search Ready</h3>
            <p className="text-gray-600 text-sm">
              Try searching for "BMW", "Mercedes", or "sedan" to see demo results
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AISearchEngine;