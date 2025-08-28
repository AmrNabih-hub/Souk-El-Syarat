/**
 * Collaborative Filtering for Recommendations
 * User-based and item-based collaborative filtering
 */

import { db } from '@/config/firebase.config';
import { collection, getDocs } from 'firebase/firestore';
import { RecommendationResult } from './recommendation-engine';

export class CollaborativeFilter {
  private userItemMatrix: Map<string, Map<string, number>> = new Map();
  private readonly MIN_INTERACTIONS = 5;

  async buildMatrix() {
    try {
      // Load orders for implicit ratings
      const ordersSnapshot = await getDocs(collection(db, 'orders'));
      
      ordersSnapshot.forEach(doc => {
        const order = doc.data();
        const userId = order.userId;
        
        if (!this.userItemMatrix.has(userId)) {
          this.userItemMatrix.set(userId, new Map());
        }
        
        const userItems = this.userItemMatrix.get(userId)!;
        
        order.items?.forEach((item: any) => {
          const currentRating = userItems.get(item.productId) || 0;
          userItems.set(item.productId, currentRating + 1);
        });
      });
      
      // Load product views for implicit ratings
      const viewsSnapshot = await getDocs(collection(db, 'product_views'));
      viewsSnapshot.forEach(doc => {
        const view = doc.data();
        const userId = view.userId;
        const productId = view.productId;
        
        if (!this.userItemMatrix.has(userId)) {
          this.userItemMatrix.set(userId, new Map());
        }
        
        const userItems = this.userItemMatrix.get(userId)!;
        const currentRating = userItems.get(productId) || 0;
        userItems.set(productId, currentRating + 0.1); // Lower weight for views
      });
    } catch (error) {
      console.error('Error building user-item matrix:', error);
    }
  }

  async getRecommendations(
    userId: string,
    count: number
  ): Promise<RecommendationResult[]> {
    const userItems = this.userItemMatrix.get(userId);
    if (!userItems || userItems.size < this.MIN_INTERACTIONS) {
      return [];
    }
    
    // Find similar users
    const similarUsers = this.findSimilarUsers(userId, 20);
    
    // Get items from similar users
    const recommendations = new Map<string, number>();
    
    similarUsers.forEach(({ userId: similarUserId, similarity }) => {
      const similarUserItems = this.userItemMatrix.get(similarUserId);
      if (similarUserItems) {
        similarUserItems.forEach((rating, productId) => {
          if (!userItems.has(productId)) {
            const score = (recommendations.get(productId) || 0) + rating * similarity;
            recommendations.set(productId, score);
          }
        });
      }
    });
    
    // Convert to recommendation results
    const results: RecommendationResult[] = [];
    recommendations.forEach((score, productId) => {
      results.push({
        productId,
        score: score / similarUsers.length,
        reason: 'Users with similar preferences bought this',
        confidence: Math.min(0.9, similarUsers.length / 10),
        type: 'collaborative'
      });
    });
    
    return results.sort((a, b) => b.score - a.score).slice(0, count);
  }

  updateUserItem(userId: string, productIds: string[], weight: number) {
    if (!this.userItemMatrix.has(userId)) {
      this.userItemMatrix.set(userId, new Map());
    }
    
    const userItems = this.userItemMatrix.get(userId)!;
    productIds.forEach(productId => {
      const currentRating = userItems.get(productId) || 0;
      userItems.set(productId, currentRating + weight);
    });
  }

  private findSimilarUsers(
    userId: string,
    count: number
  ): Array<{ userId: string; similarity: number }> {
    const userItems = this.userItemMatrix.get(userId);
    if (!userItems) return [];
    
    const similarities: Array<{ userId: string; similarity: number }> = [];
    
    this.userItemMatrix.forEach((otherUserItems, otherUserId) => {
      if (otherUserId !== userId) {
        const similarity = this.jaccardSimilarity(userItems, otherUserItems);
        if (similarity > 0) {
          similarities.push({ userId: otherUserId, similarity });
        }
      }
    });
    
    return similarities.sort((a, b) => b.similarity - a.similarity).slice(0, count);
  }

  private jaccardSimilarity(
    set1: Map<string, number>,
    set2: Map<string, number>
  ): number {
    const intersection = new Set<string>();
    const union = new Set<string>();
    
    set1.forEach((_, key) => {
      union.add(key);
      if (set2.has(key)) {
        intersection.add(key);
      }
    });
    
    set2.forEach((_, key) => {
      union.add(key);
    });
    
    return union.size === 0 ? 0 : intersection.size / union.size;
  }
}