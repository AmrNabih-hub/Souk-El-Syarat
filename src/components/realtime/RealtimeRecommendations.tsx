/**
 * 🔄 REAL-TIME RECOMMENDATION COMPONENT
 * Ensures recommendations update instantly across all users
 */

import React, { useEffect, useState } from 'react';
import { useRealtimeStore } from '@/stores/realtimeStore';
import { useAuthStore } from '@/stores/authStore';
import { aiRecommendation } from '@/services/ai-recommendation.service';
import { Product } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { SparklesIcon, RefreshIcon } from '@heroicons/react/24/outline';
import { onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '@/config/firebase.config';
import { useAppStore } from '@/stores/appStore';

interface RecommendationProps {
  userId: string;
  onProductClick?: (product: Product) => void;
}

const RealtimeRecommendations: React.FC<RecommendationProps> = ({ userId, onProductClick }) => {
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [confidence, setConfidence] = useState(0);
  const [reasoning, setReasoning] = useState<string[]>([]);
  const { language } = useAppStore();
  const { addToCart } = useRealtimeStore();

  useEffect(() => {
    let unsubscribe: any;

    const setupRealtimeRecommendations = async () => {
      // Get initial recommendations
      await loadRecommendations();

      // Listen to real-time updates for user behavior
      const userBehaviorQuery = query(
        collection(db, 'user_behaviors'),
        where('userId', '==', userId)
      );

      unsubscribe = onSnapshot(userBehaviorQuery, async (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === 'modified') {
            // User behavior changed, update recommendations in real-time
            await loadRecommendations();
          }
        });
      });

      // Also listen to product updates
      const productsQuery = query(
        collection(db, 'products'),
        where('isActive', '==', true)
      );

      const productUnsubscribe = onSnapshot(productsQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'modified') {
            // Update recommendation if product changed
            const updatedProduct = { id: change.doc.id, ...change.doc.data() } as Product;
            setRecommendations(prev => 
              prev.map(p => p.id === updatedProduct.id ? updatedProduct : p)
            );
          }
        });
      });

      return () => {
        productUnsubscribe();
      };
    };

    const loadRecommendations = async () => {
      try {
        setIsLoading(true);
        const result = await aiRecommendation.getPersonalizedRecommendations(userId, 8);
        
        // Update in real-time
        setRecommendations(result.products);
        setConfidence(result.confidence);
        setReasoning(result.reasoning);
      } catch (error) {
        console.error('Error loading recommendations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    setupRealtimeRecommendations();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [userId]);

  const handleProductInteraction = async (product: Product, action: string) => {
    // Track interaction for AI learning
    await aiRecommendation.trackInteraction(userId, product.id, action as any);
    
    if (action === 'cart') {
      // Add to cart with real-time sync
      addToCart({
        productId: product.id,
        quantity: 1,
        product
      });
    }
    
    if (onProductClick && action === 'click') {
      onProductClick(product);
    }
  };

  const refreshRecommendations = async () => {
    setIsLoading(true);
    const result = await aiRecommendation.getPersonalizedRecommendations(userId, 8);
    setRecommendations(result.products);
    setConfidence(result.confidence);
    setReasoning(result.reasoning);
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-gray-100 rounded-lg h-64"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <SparklesIcon className="w-6 h-6 text-primary-500" />
          <h2 className="text-2xl font-bold text-gray-900">
            {language === 'ar' ? 'مُوصى به لك' : 'Recommended for You'}
          </h2>
          {confidence > 0.7 && (
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              {Math.round(confidence * 100)}% {language === 'ar' ? 'دقة' : 'Accurate'}
            </span>
          )}
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={refreshRecommendations}
          className="flex items-center space-x-2 px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
        >
          <RefreshIcon className="w-4 h-4" />
          <span>{language === 'ar' ? 'تحديث' : 'Refresh'}</span>
        </motion.button>
      </div>

      {/* Reasoning */}
      {reasoning.length > 0 && (
        <div className="mb-4 text-sm text-gray-600">
          {reasoning.map((reason, index) => (
            <span key={index} className="inline-block mr-4">
              • {reason}
            </span>
          ))}
        </div>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnimatePresence>
          {recommendations.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
              onClick={() => handleProductInteraction(product, 'click')}
            >
              {/* Real-time Stock Indicator */}
              <div className="relative">
                <img
                  src={product.images?.[0] || '/placeholder.jpg'}
                  alt={product.name}
                  className="w-full h-48 object-cover"
                />
                {product.stock <= 5 && product.stock > 0 && (
                  <motion.div
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs"
                  >
                    {language === 'ar' ? `${product.stock} فقط متبقي` : `Only ${product.stock} left`}
                  </motion.div>
                )}
                {product.stock === 0 && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs">
                    {language === 'ar' ? 'نفذ المخزون' : 'Out of Stock'}
                  </div>
                )}
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                  {product.name}
                </h3>
                
                {/* Real-time Price */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xl font-bold text-primary-600">
                    {product.price} {language === 'ar' ? 'ج.م' : 'EGP'}
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-sm text-gray-500 line-through">
                      {product.originalPrice} {language === 'ar' ? 'ج.م' : 'EGP'}
                    </span>
                  )}
                </div>

                {/* Real-time Rating */}
                {product.rating && (
                  <div className="flex items-center mb-3">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-4 h-4 ${i < Math.floor(product.rating!) ? 'fill-current' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                          />
                        </svg>
                      ))}
                    </div>
                    <span className="ml-2 text-sm text-gray-600">
                      ({product.reviewCount || 0})
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-2 rtl:space-x-reverse">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProductInteraction(product, 'cart');
                    }}
                    disabled={product.stock === 0}
                    className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                      product.stock === 0
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-primary-500 text-white hover:bg-primary-600'
                    }`}
                  >
                    {language === 'ar' ? 'أضف للسلة' : 'Add to Cart'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProductInteraction(product, 'wishlist');
                    }}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </motion.button>
                </div>
              </div>

              {/* Real-time Viewers */}
              {product.currentViewers && product.currentViewers > 0 && (
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="px-4 pb-3 text-xs text-gray-600"
                >
                  <span className="inline-flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                    {product.currentViewers} {language === 'ar' ? 'يشاهدون الآن' : 'viewing now'}
                  </span>
                </motion.div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default RealtimeRecommendations;