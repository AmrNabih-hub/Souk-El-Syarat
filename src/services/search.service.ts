/**
 * Advanced Search Service with AI capabilities
 * Implements fuzzy search, filters, and intelligent suggestions
 */

import { Product, SearchFilters, Vendor } from '@/types';
import { db } from '@/config/firebase.config';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  QueryConstraint,
  DocumentData,
} from 'firebase/firestore';
import { cacheService } from './cache.service';

// Search configuration
interface SearchConfig {
  fuzzyThreshold: number;
  maxSuggestions: number;
  minSearchLength: number;
  debounceMs: number;
  cacheTimeout: number;
}

// Search result interface
interface SearchResult<T> {
  items: T[];
  totalCount: number;
  facets: SearchFacets;
  suggestions: string[];
  executionTime: number;
}

// Search facets for filtering
interface SearchFacets {
  categories: FacetItem[];
  priceRanges: FacetItem[];
  conditions: FacetItem[];
  brands: FacetItem[];
  locations: FacetItem[];
  ratings: FacetItem[];
}

interface FacetItem {
  value: string;
  count: number;
  label: string;
}

// Search index entry
interface SearchIndex {
  id: string;
  type: 'product' | 'vendor' | 'category';
  title: string;
  description: string;
  keywords: string[];
  searchText: string; // Concatenated searchable text
  popularity: number;
  timestamp: Date;
}

export class AdvancedSearchService {
  private static instance: AdvancedSearchService;
  private config: SearchConfig;
  private searchIndex: Map<string, SearchIndex> = new Map();
  private popularSearches: string[] = [];
  private searchHistory: Map<string, number> = new Map();

  private constructor() {
    this.config = {
      fuzzyThreshold: 0.6,
      maxSuggestions: 10,
      minSearchLength: 2,
      debounceMs: 300,
      cacheTimeout: 300, // 5 minutes
    };
    
    this.initializeSearchIndex();
    this.loadPopularSearches();
  }

  static getInstance(): AdvancedSearchService {
    if (!AdvancedSearchService.instance) {
      AdvancedSearchService.instance = new AdvancedSearchService();
    }
    return AdvancedSearchService.instance;
  }

  /**
   * Initialize search index from database
   */
  private async initializeSearchIndex(): Promise<void> {
    try {
      // Load products into search index
      const productsQuery = query(collection(db, 'products'), limit(1000));
      const productsSnapshot = await getDocs(productsQuery);
      
      productsSnapshot.forEach(doc => {
        const data = doc.data();
        const searchEntry: SearchIndex = {
          id: doc.id,
          type: 'product',
          title: data.title || '',
          description: data.description || '',
          keywords: data.tags || [],
          searchText: this.createSearchText(data),
          popularity: data.views || 0,
          timestamp: data.createdAt?.toDate() || new Date(),
        };
        this.searchIndex.set(doc.id, searchEntry);
      });

      // console.log(`✅ Search index initialized with ${this.searchIndex.size} entries`);
    } catch (error) {
      // console.error('Failed to initialize search index:', error);
    }
  }

  /**
   * Create searchable text from document data
   */
  private createSearchText(data: DocumentData): string {
    const fields = [
      data.title,
      data.description,
      data.category,
      data.brand,
      ...(data.tags || []),
      ...(data.features || []),
    ];
    
    return fields
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .replace(/[^\w\s]/g, ' '); // Remove special characters
  }

  /**
   * Load popular searches from cache or database
   */
  private async loadPopularSearches(): Promise<void> {
    const cached = await cacheService.get<string[]>('popular_searches');
    if (cached) {
      this.popularSearches = cached;
      return;
    }

    // In production, this would load from database
    this.popularSearches = [
      'toyota camry',
      'mercedes benz',
      'قطع غيار',
      'زيت محرك',
      'إطارات',
      'bmw',
      'nissan',
      'honda civic',
      'spare parts',
      'car accessories',
    ];

    await cacheService.set('popular_searches', this.popularSearches, 3600);
  }

  /**
   * Main search function with AI enhancements
   */
  async search<T = Product>(
    query: string,
    filters?: SearchFilters,
    options?: {
      page?: number;
      pageSize?: number;
      sortBy?: string;
      includeFactets?: boolean;
    }
  ): Promise<SearchResult<T>> {
    const startTime = Date.now();
    
    // Check cache first
    const cacheKey = `search:${query}:${JSON.stringify(filters)}:${JSON.stringify(options)}`;
    const cached = await cacheService.get<SearchResult<T>>(cacheKey);
    if (cached) {
      return cached;
    }

    // Normalize and enhance query
    const normalizedQuery = this.normalizeQuery(query);
    const enhancedQuery = await this.enhanceQuery(normalizedQuery);
    
    // Perform search
    const searchResults = await this.performSearch(enhancedQuery, filters, options);
    
    // Generate facets if requested
    let facets: SearchFacets | undefined;
    if (options?.includeFactets) {
      facets = await this.generateFacets(searchResults.items as any[]);
    }

    // Generate suggestions
    const suggestions = await this.generateSuggestions(query, searchResults.items as any[]);

    // Track search for analytics
    this.trackSearch(query, searchResults.items.length);

    const result: SearchResult<T> = {
      items: searchResults.items,
      totalCount: searchResults.totalCount,
      facets: facets || this.getEmptyFacets(),
      suggestions,
      executionTime: Date.now() - startTime,
    };

    // Cache result
    await cacheService.set(cacheKey, result, this.config.cacheTimeout);

    return result;
  }

  /**
   * Perform the actual search
   */
  private async performSearch(
    query: string,
    filters?: SearchFilters,
    options?: any
  ): Promise<{ items: any[]; totalCount: number }> {
    const constraints: QueryConstraint[] = [];

    // Add filters
    if (filters?.category) {
      constraints.push(where('category', '==', filters.category));
    }
    if (filters?.priceRange) {
      constraints.push(
        where('price', '>=', filters.priceRange[0]),
        where('price', '<=', filters.priceRange[1])
      );
    }
    if (filters?.condition) {
      constraints.push(where('condition', '==', filters.condition));
    }
    if (filters?.inStock) {
      constraints.push(where('stock', '>', 0));
    }

    // Add sorting
    const sortBy = options?.sortBy || 'relevance';
    switch (sortBy) {
      case 'price_asc':
        constraints.push(orderBy('price', 'asc'));
        break;
      case 'price_desc':
        constraints.push(orderBy('price', 'desc'));
        break;
      case 'newest':
        constraints.push(orderBy('createdAt', 'desc'));
        break;
      case 'popular':
        constraints.push(orderBy('views', 'desc'));
        break;
      default:
        // Relevance sorting would be done in post-processing
        break;
    }

    // Add pagination
    const pageSize = options?.pageSize || 20;
    constraints.push(limit(pageSize));

    // Execute query
    const q = query(collection(db, 'products'), ...constraints);
    const snapshot = await getDocs(q);
    
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Apply text search filtering and scoring
    const scoredItems = this.scoreAndFilterItems(items, query);
    
    // Sort by relevance if needed
    if (sortBy === 'relevance') {
      scoredItems.sort((a, b) => (b as any).relevanceScore - (a as any).relevanceScore);
    }

    return {
      items: scoredItems,
      totalCount: scoredItems.length,
    };
  }

  /**
   * Score and filter items based on search query
   */
  private scoreAndFilterItems(items: any[], query: string): any[] {
    const queryTerms = query.toLowerCase().split(' ');
    
    return items
      .map(item => {
        const searchText = this.createSearchText(item);
        let score = 0;
        
        // Calculate relevance score
        queryTerms.forEach(term => {
          if (searchText.includes(term)) {
            score += 10; // Exact match
          } else {
            // Fuzzy match
            const fuzzyScore = this.calculateFuzzyScore(term, searchText);
            score += fuzzyScore * 5;
          }
        });
        
        // Boost score based on popularity
        score += Math.log(item.views || 1);
        
        // Boost for exact title match
        if (item.title?.toLowerCase().includes(query.toLowerCase())) {
          score += 20;
        }
        
        return { ...item, relevanceScore: score };
      })
      .filter(item => item.relevanceScore > 0)
      .slice(0, 100); // Limit results
  }

  /**
   * Calculate fuzzy matching score
   */
  private calculateFuzzyScore(term: string, text: string): number {
    const words = text.split(' ');
    let maxScore = 0;
    
    for (const word of words) {
      const score = this.levenshteinSimilarity(term, word);
      if (score > maxScore) {
        maxScore = score;
      }
    }
    
    return maxScore > this.config.fuzzyThreshold ? maxScore : 0;
  }

  /**
   * Calculate Levenshtein similarity between two strings
   */
  private levenshteinSimilarity(str1: string, str2: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    
    const distance = matrix[str2.length][str1.length];
    const maxLength = Math.max(str1.length, str2.length);
    return 1 - distance / maxLength;
  }

  /**
   * Normalize search query
   */
  private normalizeQuery(query: string): string {
    return query
      .toLowerCase()
      .trim()
      .replace(/[^\w\s\u0600-\u06FF]/g, ' ') // Keep Arabic characters
      .replace(/\s+/g, ' ');
  }

  /**
   * Enhance query with synonyms and corrections
   */
  private async enhanceQuery(query: string): Promise<string> {
    // Check for common misspellings
    const corrections: Record<string, string> = {
      'toyata': 'toyota',
      'mercedez': 'mercedes',
      'nisan': 'nissan',
      'هوندا': 'honda',
      'تويوتا': 'toyota',
    };
    
    let enhanced = query;
    for (const [misspelling, correction] of Object.entries(corrections)) {
      enhanced = enhanced.replace(new RegExp(misspelling, 'gi'), correction);
    }
    
    // Add synonyms
    const synonyms: Record<string, string[]> = {
      'car': ['vehicle', 'automobile', 'سيارة'],
      'parts': ['spare parts', 'قطع غيار', 'accessories'],
      'oil': ['engine oil', 'زيت', 'lubricant'],
    };
    
    const terms = enhanced.split(' ');
    const expandedTerms = new Set(terms);
    
    terms.forEach(term => {
      if (synonyms[term]) {
        synonyms[term].forEach(syn => expandedTerms.add(syn));
      }
    });
    
    return Array.from(expandedTerms).join(' ');
  }

  /**
   * Generate search facets
   */
  private async generateFacets(items: any[]): Promise<SearchFacets> {
    const facets: SearchFacets = {
      categories: this.countValues(items, 'category'),
      priceRanges: this.generatePriceRanges(items),
      conditions: this.countValues(items, 'condition'),
      brands: this.countValues(items, 'brand'),
      locations: this.countValues(items, 'location'),
      ratings: this.generateRatingRanges(items),
    };
    
    return facets;
  }

  /**
   * Count occurrences of values in a field
   */
  private countValues(items: any[], field: string): FacetItem[] {
    const counts = new Map<string, number>();
    
    items.forEach(item => {
      const value = item[field];
      if (value) {
        counts.set(value, (counts.get(value) || 0) + 1);
      }
    });
    
    return Array.from(counts.entries())
      .map(([value, count]) => ({
        value,
        count,
        label: this.formatLabel(value),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Generate price range facets
   */
  private generatePriceRanges(items: any[]): FacetItem[] {
    const ranges = [
      { min: 0, max: 10000, label: 'Under 10,000 EGP' },
      { min: 10000, max: 50000, label: '10,000 - 50,000 EGP' },
      { min: 50000, max: 100000, label: '50,000 - 100,000 EGP' },
      { min: 100000, max: 500000, label: '100,000 - 500,000 EGP' },
      { min: 500000, max: Infinity, label: 'Over 500,000 EGP' },
    ];
    
    return ranges.map(range => ({
      value: `${range.min}-${range.max}`,
      count: items.filter(item => 
        item.price >= range.min && item.price < range.max
      ).length,
      label: range.label,
    })).filter(facet => facet.count > 0);
  }

  /**
   * Generate rating range facets
   */
  private generateRatingRanges(items: any[]): FacetItem[] {
    const ranges = [
      { min: 4, label: '4+ Stars' },
      { min: 3, label: '3+ Stars' },
      { min: 2, label: '2+ Stars' },
      { min: 1, label: '1+ Stars' },
    ];
    
    return ranges.map(range => ({
      value: `${range.min}+`,
      count: items.filter(item => 
        (item.rating || 0) >= range.min
      ).length,
      label: range.label,
    }));
  }

  /**
   * Format label for display
   */
  private formatLabel(value: string): string {
    return value
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Generate search suggestions
   */
  async generateSuggestions(query: string, results: any[]): Promise<string[]> {
    const suggestions = new Set<string>();
    
    // Add popular searches that match
    this.popularSearches.forEach(search => {
      if (search.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(search);
      }
    });
    
    // Add category suggestions from results
    results.slice(0, 10).forEach(item => {
      if (item.category) {
        suggestions.add(`${query} in ${item.category}`);
      }
      if (item.brand) {
        suggestions.add(`${item.brand} ${query}`);
      }
    });
    
    // Add related searches
    const related = await this.getRelatedSearches(query);
    related.forEach(search => suggestions.add(search));
    
    return Array.from(suggestions).slice(0, this.config.maxSuggestions);
  }

  /**
   * Get related searches based on user history
   */
  private async getRelatedSearches(query: string): Promise<string[]> {
    // In production, this would use ML to find related searches
    const related: Record<string, string[]> = {
      'toyota': ['toyota camry', 'toyota corolla', 'toyota parts'],
      'mercedes': ['mercedes benz', 'mercedes c class', 'mercedes parts'],
      'parts': ['spare parts', 'car parts', 'auto parts'],
      'oil': ['engine oil', 'motor oil', 'oil change'],
    };
    
    const queryLower = query.toLowerCase();
    for (const [key, values] of Object.entries(related)) {
      if (queryLower.includes(key)) {
        return values;
      }
    }
    
    return [];
  }

  /**
   * Track search for analytics
   */
  private trackSearch(query: string, resultCount: number): void {
    this.searchHistory.set(query, (this.searchHistory.get(query) || 0) + 1);
    
    // Update popular searches periodically
    if (this.searchHistory.size > 100) {
      this.updatePopularSearches();
    }
    
    // Log analytics
    // console.log(`🔍 Search: "${query}" - ${resultCount} results`);
  }

  /**
   * Update popular searches based on history
   */
  private updatePopularSearches(): void {
    const sorted = Array.from(this.searchHistory.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([query]) => query);
    
    this.popularSearches = sorted;
    cacheService.set('popular_searches', this.popularSearches, 3600);
    
    // Clear old history
    this.searchHistory.clear();
  }

  /**
   * Get empty facets structure
   */
  private getEmptyFacets(): SearchFacets {
    return {
      categories: [],
      priceRanges: [],
      conditions: [],
      brands: [],
      locations: [],
      ratings: [],
    };
  }

  /**
   * Autocomplete suggestions
   */
  async autocomplete(partial: string): Promise<string[]> {
    if (partial.length < this.config.minSearchLength) {
      return [];
    }
    
    const normalizedPartial = this.normalizeQuery(partial);
    const suggestions: string[] = [];
    
    // Search in index
    this.searchIndex.forEach(entry => {
      if (entry.title.toLowerCase().startsWith(normalizedPartial)) {
        suggestions.push(entry.title);
      }
    });
    
    // Add from popular searches
    this.popularSearches.forEach(search => {
      if (search.toLowerCase().startsWith(normalizedPartial)) {
        suggestions.push(search);
      }
    });
    
    // Sort by popularity and limit
    return suggestions
      .slice(0, this.config.maxSuggestions)
      .sort((a, b) => {
        const aCount = this.searchHistory.get(a) || 0;
        const bCount = this.searchHistory.get(b) || 0;
        return bCount - aCount;
      });
  }

  /**
   * Visual search (placeholder for future implementation)
   */
  async visualSearch(imageFile: File): Promise<SearchResult<Product>> {
    // console.log('Visual search initiated for:', imageFile.name);
    
    // In production, this would:
    // 1. Upload image to ML service
    // 2. Extract features using computer vision
    // 3. Find similar products
    // 4. Return results
    
    // For now, return mock results
    return {
      items: [],
      totalCount: 0,
      facets: this.getEmptyFacets(),
      suggestions: ['Similar cars', 'Same color vehicles', 'Related models'],
      executionTime: 100,
    };
  }

  /**
   * Voice search (placeholder for future implementation)
   */
  async voiceSearch(audioBlob: Blob): Promise<string> {
    // console.log('Voice search initiated');
    
    // In production, this would:
    // 1. Send audio to speech-to-text service
    // 2. Process the transcribed text
    // 3. Return search query
    
    return 'toyota camry 2020';
  }
}

// Export singleton instance
export const searchService = AdvancedSearchService.getInstance();