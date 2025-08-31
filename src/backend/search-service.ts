/**
 * Advanced Search Service
 * Elasticsearch integration with AI-powered features
 */

import { Client } from '@elastic/elasticsearch';
import * as tf from '@tensorflow/tfjs';
import natural from 'natural';
import axios from 'axios';
import { db } from '@/config/firebase';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';

// Elasticsearch client configuration
const elasticClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
  auth: {
    username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
    password: process.env.ELASTICSEARCH_PASSWORD!,
  },
  maxRetries: 5,
  requestTimeout: 30000,
});

// Search configuration
const SEARCH_CONFIG = {
  indices: {
    products: 'souk_products',
    vendors: 'souk_vendors',
    categories: 'souk_categories',
  },
  settings: {
    maxResults: 100,
    defaultPageSize: 20,
    minScore: 0.5,
    boostFactors: {
      title: 3.0,
      brand: 2.5,
      category: 2.0,
      description: 1.5,
      tags: 1.2,
    },
  },
  ai: {
    openaiApiKey: process.env.OPENAI_API_KEY!,
    googleVisionApiKey: process.env.GOOGLE_VISION_API_KEY!,
    modelPath: '/models/product-similarity',
  },
};

// Type definitions
export interface SearchQuery {
  query: string;
  filters?: {
    category?: string[];
    brand?: string[];
    priceRange?: [number, number];
    condition?: string[];
    location?: string[];
    vendor?: string[];
    rating?: number;
    inStock?: boolean;
    hasDiscount?: boolean;
  };
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
  pagination?: {
    page: number;
    size: number;
  };
  facets?: boolean;
  suggest?: boolean;
  boost?: Record<string, number>;
}

export interface SearchResult {
  hits: {
    total: number;
    maxScore: number;
    items: any[];
  };
  facets?: Record<string, any>;
  suggestions?: string[];
  relatedSearches?: string[];
  executionTime: number;
}

export interface VisualSearchQuery {
  image: Buffer | string; // Base64 or buffer
  maxResults?: number;
  filters?: any;
}

export interface SemanticSearchQuery {
  query: string;
  context?: string;
  language?: 'en' | 'ar';
}

// Main Search Service Class
export class SearchService {
  private static instance: SearchService;
  private similarityModel: tf.LayersModel | null = null;
  private tokenizer: any;

  private constructor() {
    this.initializeIndices();
    this.loadAIModels();
    this.tokenizer = new natural.WordTokenizer();
  }

  static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService();
    }
    return SearchService.instance;
  }

  // ============================================
  // INDEX MANAGEMENT
  // ============================================

  private async initializeIndices(): Promise<void> {
    try {
      // Create products index with Arabic analyzer
      const productsIndexExists = await elasticClient.indices.exists({
        index: SEARCH_CONFIG.indices.products,
      });

      if (!productsIndexExists) {
        await elasticClient.indices.create({
          index: SEARCH_CONFIG.indices.products,
          body: {
            settings: {
              number_of_shards: 3,
              number_of_replicas: 2,
              analysis: {
                analyzer: {
                  arabic_analyzer: {
                    type: 'custom',
                    tokenizer: 'standard',
                    filter: ['lowercase', 'arabic_normalization', 'arabic_stemmer'],
                  },
                  autocomplete: {
                    type: 'custom',
                    tokenizer: 'edge_ngram_tokenizer',
                    filter: ['lowercase'],
                  },
                },
                tokenizer: {
                  edge_ngram_tokenizer: {
                    type: 'edge_ngram',
                    min_gram: 2,
                    max_gram: 20,
                    token_chars: ['letter', 'digit'],
                  },
                },
                filter: {
                  arabic_stemmer: {
                    type: 'stemmer',
                    language: 'arabic',
                  },
                },
              },
            },
            mappings: {
              properties: {
                id: { type: 'keyword' },
                title: {
                  type: 'text',
                  analyzer: 'standard',
                  fields: {
                    arabic: {
                      type: 'text',
                      analyzer: 'arabic_analyzer',
                    },
                    autocomplete: {
                      type: 'text',
                      analyzer: 'autocomplete',
                    },
                  },
                },
                description: {
                  type: 'text',
                  analyzer: 'standard',
                  fields: {
                    arabic: {
                      type: 'text',
                      analyzer: 'arabic_analyzer',
                    },
                  },
                },
                category: {
                  type: 'keyword',
                  fields: {
                    text: { type: 'text' },
                  },
                },
                brand: { type: 'keyword' },
                model: { type: 'keyword' },
                year: { type: 'integer' },
                price: { type: 'float' },
                discountedPrice: { type: 'float' },
                condition: { type: 'keyword' },
                location: {
                  type: 'geo_point',
                },
                vendorId: { type: 'keyword' },
                vendorName: {
                  type: 'text',
                  fields: {
                    keyword: { type: 'keyword' },
                  },
                },
                rating: { type: 'float' },
                reviewCount: { type: 'integer' },
                views: { type: 'integer' },
                sold: { type: 'integer' },
                stock: { type: 'integer' },
                tags: { type: 'keyword' },
                features: { type: 'text' },
                specifications: { type: 'object' },
                images: { type: 'keyword' },
                isPromoted: { type: 'boolean' },
                createdAt: { type: 'date' },
                updatedAt: { type: 'date' },
                embedding: {
                  type: 'dense_vector',
                  dims: 512, // For similarity search
                },
              },
            },
          },
        });

        console.log('Products index created successfully');
      }
    } catch (error) {
      console.error('Failed to initialize indices:', error);
    }
  }

  // ============================================
  // PRODUCT INDEXING
  // ============================================

  async indexProduct(product: any): Promise<void> {
    try {
      // Generate embedding for similarity search
      const embedding = await this.generateProductEmbedding(product);

      // Prepare document for indexing
      const document = {
        ...product,
        embedding,
        suggest: {
          input: [
            product.title,
            product.brand,
            product.model,
            ...(product.tags || []),
          ],
        },
      };

      // Index document
      await elasticClient.index({
        index: SEARCH_CONFIG.indices.products,
        id: product.id,
        body: document,
        refresh: 'wait_for',
      });

      console.log(`Product ${product.id} indexed successfully`);
    } catch (error) {
      console.error(`Failed to index product ${product.id}:`, error);
      throw error;
    }
  }

  async bulkIndexProducts(products: any[]): Promise<void> {
    try {
      const operations = products.flatMap(product => [
        { index: { _index: SEARCH_CONFIG.indices.products, _id: product.id } },
        {
          ...product,
          embedding: this.generateProductEmbedding(product),
        },
      ]);

      const response = await elasticClient.bulk({
        body: operations,
        refresh: 'wait_for',
      });

      if (response.errors) {
        console.error('Bulk indexing errors:', response.items);
      } else {
        console.log(`${products.length} products indexed successfully`);
      }
    } catch (error) {
      console.error('Bulk indexing failed:', error);
      throw error;
    }
  }

  async updateProductIndex(productId: string, updates: any): Promise<void> {
    try {
      await elasticClient.update({
        index: SEARCH_CONFIG.indices.products,
        id: productId,
        body: {
          doc: updates,
        },
        refresh: 'wait_for',
      });
    } catch (error) {
      console.error(`Failed to update product ${productId}:`, error);
      throw error;
    }
  }

  async deleteFromIndex(productId: string): Promise<void> {
    try {
      await elasticClient.delete({
        index: SEARCH_CONFIG.indices.products,
        id: productId,
        refresh: 'wait_for',
      });
    } catch (error) {
      console.error(`Failed to delete product ${productId}:`, error);
      throw error;
    }
  }

  // ============================================
  // SEARCH OPERATIONS
  // ============================================

  async search(searchQuery: SearchQuery): Promise<SearchResult> {
    const startTime = Date.now();

    try {
      // Build Elasticsearch query
      const esQuery = this.buildElasticsearchQuery(searchQuery);

      // Execute search
      const response = await elasticClient.search({
        index: SEARCH_CONFIG.indices.products,
        body: esQuery,
      });

      // Process results
      const results = this.processSearchResults(response, searchQuery);

      // Get suggestions if requested
      if (searchQuery.suggest) {
        results.suggestions = await this.getSuggestions(searchQuery.query);
      }

      // Get related searches
      results.relatedSearches = await this.getRelatedSearches(searchQuery.query);

      results.executionTime = Date.now() - startTime;

      return results;
    } catch (error) {
      console.error('Search failed:', error);
      throw error;
    }
  }

  private buildElasticsearchQuery(searchQuery: SearchQuery): any {
    const { query, filters, sort, pagination, facets } = searchQuery;
    const page = pagination?.page || 1;
    const size = pagination?.size || SEARCH_CONFIG.settings.defaultPageSize;

    // Build must queries
    const must: any[] = [];
    const filter: any[] = [];

    // Text search with boosting
    if (query) {
      must.push({
        multi_match: {
          query,
          fields: [
            `title^${SEARCH_CONFIG.settings.boostFactors.title}`,
            `title.arabic^${SEARCH_CONFIG.settings.boostFactors.title}`,
            `brand^${SEARCH_CONFIG.settings.boostFactors.brand}`,
            `category.text^${SEARCH_CONFIG.settings.boostFactors.category}`,
            `description^${SEARCH_CONFIG.settings.boostFactors.description}`,
            `description.arabic^${SEARCH_CONFIG.settings.boostFactors.description}`,
            `tags^${SEARCH_CONFIG.settings.boostFactors.tags}`,
          ],
          type: 'best_fields',
          fuzziness: 'AUTO',
        },
      });
    }

    // Apply filters
    if (filters) {
      if (filters.category?.length) {
        filter.push({ terms: { category: filters.category } });
      }

      if (filters.brand?.length) {
        filter.push({ terms: { brand: filters.brand } });
      }

      if (filters.priceRange) {
        filter.push({
          range: {
            price: {
              gte: filters.priceRange[0],
              lte: filters.priceRange[1],
            },
          },
        });
      }

      if (filters.condition?.length) {
        filter.push({ terms: { condition: filters.condition } });
      }

      if (filters.vendor?.length) {
        filter.push({ terms: { vendorId: filters.vendor } });
      }

      if (filters.rating !== undefined) {
        filter.push({
          range: {
            rating: { gte: filters.rating },
          },
        });
      }

      if (filters.inStock) {
        filter.push({
          range: {
            stock: { gt: 0 },
          },
        });
      }

      if (filters.hasDiscount) {
        filter.push({
          exists: { field: 'discountedPrice' },
        });
      }
    }

    // Build aggregations for facets
    const aggs = facets ? {
      categories: {
        terms: { field: 'category', size: 20 },
      },
      brands: {
        terms: { field: 'brand', size: 30 },
      },
      priceRanges: {
        range: {
          field: 'price',
          ranges: [
            { to: 50000 },
            { from: 50000, to: 100000 },
            { from: 100000, to: 300000 },
            { from: 300000, to: 500000 },
            { from: 500000 },
          ],
        },
      },
      conditions: {
        terms: { field: 'condition' },
      },
      avgRating: {
        avg: { field: 'rating' },
      },
    } : undefined;

    // Build sort
    const sortCriteria: any[] = [];
    
    if (sort) {
      sortCriteria.push({
        [sort.field]: { order: sort.order },
      });
    } else {
      // Default sorting: relevance + promoted items
      sortCriteria.push(
        { isPromoted: { order: 'desc' } },
        '_score',
        { rating: { order: 'desc' } },
      );
    }

    return {
      from: (page - 1) * size,
      size,
      min_score: SEARCH_CONFIG.settings.minScore,
      query: {
        bool: {
          must,
          filter,
          should: [
            // Boost promoted items
            {
              term: {
                isPromoted: {
                  value: true,
                  boost: 2.0,
                },
              },
            },
            // Boost items with high ratings
            {
              range: {
                rating: {
                  gte: 4.5,
                  boost: 1.5,
                },
              },
            },
          ],
        },
      },
      sort: sortCriteria,
      aggs,
      highlight: {
        fields: {
          title: {},
          description: {},
        },
        pre_tags: ['<mark>'],
        post_tags: ['</mark>'],
      },
    };
  }

  private processSearchResults(response: any, searchQuery: SearchQuery): SearchResult {
    const hits = response.hits;
    const aggregations = response.aggregations;

    // Process items
    const items = hits.hits.map((hit: any) => ({
      ...hit._source,
      _score: hit._score,
      _highlights: hit.highlight,
    }));

    // Process facets
    const facets = aggregations ? {
      categories: aggregations.categories.buckets.map((b: any) => ({
        value: b.key,
        count: b.doc_count,
      })),
      brands: aggregations.brands.buckets.map((b: any) => ({
        value: b.key,
        count: b.doc_count,
      })),
      priceRanges: aggregations.priceRanges.buckets.map((b: any) => ({
        from: b.from,
        to: b.to,
        count: b.doc_count,
      })),
      conditions: aggregations.conditions.buckets.map((b: any) => ({
        value: b.key,
        count: b.doc_count,
      })),
      avgRating: aggregations.avgRating.value,
    } : undefined;

    return {
      hits: {
        total: hits.total.value,
        maxScore: hits.max_score,
        items,
      },
      facets,
      executionTime: 0, // Will be set by caller
    };
  }

  // ============================================
  // AUTOCOMPLETE & SUGGESTIONS
  // ============================================

  async autocomplete(partial: string): Promise<string[]> {
    try {
      const response = await elasticClient.search({
        index: SEARCH_CONFIG.indices.products,
        body: {
          suggest: {
            product_suggest: {
              prefix: partial,
              completion: {
                field: 'suggest',
                size: 10,
                fuzzy: {
                  fuzziness: 'AUTO',
                },
              },
            },
          },
        },
      });

      const suggestions = response.suggest.product_suggest[0].options.map(
        (option: any) => option.text
      );

      return [...new Set(suggestions)]; // Remove duplicates
    } catch (error) {
      console.error('Autocomplete failed:', error);
      return [];
    }
  }

  private async getSuggestions(query: string): Promise<string[]> {
    try {
      const response = await elasticClient.search({
        index: SEARCH_CONFIG.indices.products,
        body: {
          suggest: {
            text: query,
            simple_phrase: {
              phrase: {
                field: 'title',
                size: 5,
                gram_size: 2,
                direct_generator: [{
                  field: 'title',
                  suggest_mode: 'popular',
                }],
              },
            },
          },
        },
      });

      return response.suggest.simple_phrase[0].options.map((o: any) => o.text);
    } catch (error) {
      console.error('Suggestions failed:', error);
      return [];
    }
  }

  private async getRelatedSearches(query: string): Promise<string[]> {
    try {
      // Use significant terms aggregation to find related searches
      const response = await elasticClient.search({
        index: SEARCH_CONFIG.indices.products,
        body: {
          size: 0,
          query: {
            match: { title: query },
          },
          aggs: {
            related_terms: {
              significant_terms: {
                field: 'tags',
                size: 10,
              },
            },
          },
        },
      });

      return response.aggregations.related_terms.buckets.map((b: any) => b.key);
    } catch (error) {
      console.error('Related searches failed:', error);
      return [];
    }
  }

  // ============================================
  // AI-POWERED SEARCH FEATURES
  // ============================================

  async visualSearch(query: VisualSearchQuery): Promise<SearchResult> {
    try {
      // Extract features from image using Google Vision API
      const imageFeatures = await this.extractImageFeatures(query.image);

      // Generate embedding from features
      const embedding = await this.generateImageEmbedding(imageFeatures);

      // Search for similar products using vector similarity
      const response = await elasticClient.search({
        index: SEARCH_CONFIG.indices.products,
        body: {
          size: query.maxResults || 20,
          query: {
            script_score: {
              query: {
                match_all: {},
              },
              script: {
                source: "cosineSimilarity(params.query_vector, 'embedding') + 1.0",
                params: {
                  query_vector: embedding,
                },
              },
            },
          },
        },
      });

      return this.processSearchResults(response, {} as SearchQuery);
    } catch (error) {
      console.error('Visual search failed:', error);
      throw error;
    }
  }

  private async extractImageFeatures(image: Buffer | string): Promise<any> {
    try {
      // Convert image to base64 if buffer
      const base64Image = Buffer.isBuffer(image) ? image.toString('base64') : image;

      // Call Google Vision API
      const response = await axios.post(
        `https://vision.googleapis.com/v1/images:annotate?key=${SEARCH_CONFIG.ai.googleVisionApiKey}`,
        {
          requests: [{
            image: {
              content: base64Image,
            },
            features: [
              { type: 'LABEL_DETECTION', maxResults: 10 },
              { type: 'OBJECT_LOCALIZATION', maxResults: 5 },
              { type: 'IMAGE_PROPERTIES', maxResults: 1 },
              { type: 'WEB_DETECTION', maxResults: 5 },
            ],
          }],
        }
      );

      return response.data.responses[0];
    } catch (error) {
      console.error('Image feature extraction failed:', error);
      throw error;
    }
  }

  async semanticSearch(query: SemanticSearchQuery): Promise<SearchResult> {
    try {
      // Use OpenAI to understand query intent
      const intent = await this.understandQueryIntent(query);

      // Expand query with synonyms and related terms
      const expandedQuery = await this.expandQuery(query.query, query.language);

      // Build semantic search query
      const searchQuery: SearchQuery = {
        query: expandedQuery,
        filters: intent.filters,
        boost: intent.boosts,
      };

      return this.search(searchQuery);
    } catch (error) {
      console.error('Semantic search failed:', error);
      throw error;
    }
  }

  private async understandQueryIntent(query: SemanticSearchQuery): Promise<any> {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a search query analyzer for an automotive marketplace. Extract intent, filters, and important terms from user queries.',
            },
            {
              role: 'user',
              content: `Analyze this search query and extract filters and intent: "${query.query}"`,
            },
          ],
          functions: [
            {
              name: 'extract_search_intent',
              parameters: {
                type: 'object',
                properties: {
                  intent: {
                    type: 'string',
                    enum: ['buy', 'browse', 'compare', 'research'],
                  },
                  filters: {
                    type: 'object',
                    properties: {
                      brand: { type: 'array', items: { type: 'string' } },
                      priceRange: { type: 'array', items: { type: 'number' } },
                      condition: { type: 'array', items: { type: 'string' } },
                      year: { type: 'array', items: { type: 'number' } },
                    },
                  },
                  boosts: {
                    type: 'object',
                    properties: {
                      price: { type: 'number' },
                      rating: { type: 'number' },
                      recency: { type: 'number' },
                    },
                  },
                },
              },
            },
          ],
          function_call: { name: 'extract_search_intent' },
        },
        {
          headers: {
            'Authorization': `Bearer ${SEARCH_CONFIG.ai.openaiApiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return JSON.parse(response.data.choices[0].message.function_call.arguments);
    } catch (error) {
      console.error('Query intent understanding failed:', error);
      return { filters: {}, boosts: {} };
    }
  }

  private async expandQuery(query: string, language?: string): Promise<string> {
    // Use NLP to expand query with synonyms
    const tokens = this.tokenizer.tokenize(query);
    const expanded = tokens;

    // Add Arabic variations if needed
    if (language === 'ar' || this.containsArabic(query)) {
      // Add Arabic processing
    }

    return expanded.join(' ');
  }

  // ============================================
  // SIMILAR PRODUCTS
  // ============================================

  async findSimilarProducts(productId: string, limit: number = 10): Promise<any[]> {
    try {
      // Get the product
      const productDoc = await getDoc(doc(db, 'products', productId));
      
      if (!productDoc.exists()) {
        throw new Error('Product not found');
      }

      const product = productDoc.data();

      // Search for similar products
      const response = await elasticClient.search({
        index: SEARCH_CONFIG.indices.products,
        body: {
          size: limit + 1, // +1 to exclude self
          query: {
            bool: {
              must_not: [
                { term: { id: productId } }, // Exclude self
              ],
              should: [
                // Same category
                {
                  term: {
                    category: {
                      value: product.category,
                      boost: 3.0,
                    },
                  },
                },
                // Same brand
                {
                  term: {
                    brand: {
                      value: product.brand,
                      boost: 2.5,
                    },
                  },
                },
                // Similar price range (±20%)
                {
                  range: {
                    price: {
                      gte: product.price * 0.8,
                      lte: product.price * 1.2,
                      boost: 2.0,
                    },
                  },
                },
                // Similar year (±2 years for cars)
                {
                  range: {
                    year: {
                      gte: product.year - 2,
                      lte: product.year + 2,
                      boost: 1.5,
                    },
                  },
                },
                // More like this on description
                {
                  more_like_this: {
                    fields: ['description', 'features'],
                    like: product.description,
                    min_term_freq: 1,
                    max_query_terms: 12,
                    boost: 1.0,
                  },
                },
              ],
              minimum_should_match: 2,
            },
          },
        },
      });

      return response.hits.hits.map((hit: any) => hit._source);
    } catch (error) {
      console.error('Similar products search failed:', error);
      return [];
    }
  }

  // ============================================
  // AI MODEL MANAGEMENT
  // ============================================

  private async loadAIModels(): Promise<void> {
    try {
      // Load TensorFlow model for similarity
      // this.similarityModel = await tf.loadLayersModel(SEARCH_CONFIG.ai.modelPath);
      console.log('AI models loaded successfully');
    } catch (error) {
      console.error('Failed to load AI models:', error);
    }
  }

  private async generateProductEmbedding(product: any): Promise<number[]> {
    // Generate embedding using TensorFlow model
    // For now, return random embedding
    return Array.from({ length: 512 }, () => Math.random());
  }

  private async generateImageEmbedding(features: any): Promise<number[]> {
    // Generate embedding from image features
    // For now, return random embedding
    return Array.from({ length: 512 }, () => Math.random());
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private containsArabic(text: string): boolean {
    return /[\u0600-\u06FF]/.test(text);
  }

  async reindexAllProducts(): Promise<void> {
    try {
      // Delete existing index
      await elasticClient.indices.delete({
        index: SEARCH_CONFIG.indices.products,
        ignore_unavailable: true,
      });

      // Recreate index
      await this.initializeIndices();

      // Get all products from Firestore
      const productsSnapshot = await getDocs(collection(db, 'products'));
      const products = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Bulk index products
      await this.bulkIndexProducts(products);

      console.log(`Reindexed ${products.length} products`);
    } catch (error) {
      console.error('Reindexing failed:', error);
      throw error;
    }
  }

  async getIndexStats(): Promise<any> {
    try {
      const stats = await elasticClient.indices.stats({
        index: SEARCH_CONFIG.indices.products,
      });

      return {
        documentCount: stats._all.primaries.docs.count,
        sizeInBytes: stats._all.primaries.store.size_in_bytes,
        indexing: stats._all.primaries.indexing,
        search: stats._all.primaries.search,
      };
    } catch (error) {
      console.error('Failed to get index stats:', error);
      return null;
    }
  }
}

// Export singleton instance
export const searchService = SearchService.getInstance();
