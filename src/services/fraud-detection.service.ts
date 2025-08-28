/**
 * Fraud Detection Service
 * Real-time fraud detection using machine learning and rule-based systems
 */

import { db, realtimeDb } from '@/config/firebase.config';
import { 
  collection, 
  doc, 
  getDocs, 
  query, 
  where,
  addDoc,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { ref, set, onValue, push } from 'firebase/database';
import { securityService } from './security.service';

interface FraudIndicator {
  type: string;
  score: number;
  description: string;
}

interface RiskProfile {
  userId: string;
  riskScore: number;
  indicators: FraudIndicator[];
  lastUpdated: Date;
  status: 'low' | 'medium' | 'high' | 'blocked';
}

interface Transaction {
  id: string;
  userId: string;
  amount: number;
  timestamp: Date;
  location?: { lat: number; lng: number };
  deviceId?: string;
  ipAddress?: string;
  type: 'purchase' | 'refund' | 'transfer';
}

class FraudDetectionService {
  private static instance: FraudDetectionService;
  private riskProfiles: Map<string, RiskProfile> = new Map();
  private suspiciousPatterns: Map<string, number> = new Map();
  private blockedUsers: Set<string> = new Set();
  
  private readonly RISK_THRESHOLDS = {
    low: 30,
    medium: 60,
    high: 80,
    block: 95
  };

  private constructor() {
    this.initialize();
  }

  static getInstance(): FraudDetectionService {
    if (!FraudDetectionService.instance) {
      FraudDetectionService.instance = new FraudDetectionService();
    }
    return FraudDetectionService.instance;
  }

  private async initialize() {
    await this.loadRiskProfiles();
    this.setupRealtimeMonitoring();
    this.startPatternAnalysis();
  }

  private async loadRiskProfiles() {
    try {
      const profilesSnapshot = await getDocs(collection(db, 'risk_profiles'));
      profilesSnapshot.forEach(doc => {
        const profile = doc.data() as RiskProfile;
        this.riskProfiles.set(profile.userId, profile);
        
        if (profile.status === 'blocked') {
          this.blockedUsers.add(profile.userId);
        }
      });
    } catch (error) {
      console.error('Error loading risk profiles:', error);
    }
  }

  private setupRealtimeMonitoring() {
    // Monitor transactions in real-time
    const transactionsRef = ref(realtimeDb, 'transactions');
    onValue(transactionsRef, (snapshot) => {
      const transactions = snapshot.val();
      if (transactions) {
        Object.values(transactions).forEach((transaction: any) => {
          this.analyzeTransaction(transaction);
        });
      }
    });

    // Monitor user behavior
    const behaviorRef = ref(realtimeDb, 'user_behavior');
    onValue(behaviorRef, (snapshot) => {
      const behaviors = snapshot.val();
      if (behaviors) {
        this.analyzeBehaviorPatterns(behaviors);
      }
    });
  }

  private startPatternAnalysis() {
    // Analyze patterns every 5 minutes
    setInterval(() => {
      this.detectAnomalies();
      this.updateRiskScores();
    }, 5 * 60 * 1000);
  }

  /**
   * Analyze transaction for fraud
   */
  async analyzeTransaction(transaction: Transaction): Promise<{
    approved: boolean;
    riskScore: number;
    reasons: string[];
  }> {
    const indicators: FraudIndicator[] = [];
    let totalScore = 0;

    // Check if user is blocked
    if (this.blockedUsers.has(transaction.userId)) {
      return {
        approved: false,
        riskScore: 100,
        reasons: ['User is blocked due to previous fraud']
      };
    }

    // 1. Velocity checks
    const velocityScore = await this.checkVelocity(transaction);
    if (velocityScore > 0) {
      indicators.push({
        type: 'velocity',
        score: velocityScore,
        description: 'Unusual transaction velocity detected'
      });
      totalScore += velocityScore;
    }

    // 2. Amount anomaly
    const amountScore = await this.checkAmountAnomaly(transaction);
    if (amountScore > 0) {
      indicators.push({
        type: 'amount',
        score: amountScore,
        description: 'Transaction amount is unusual'
      });
      totalScore += amountScore;
    }

    // 3. Location anomaly
    if (transaction.location) {
      const locationScore = await this.checkLocationAnomaly(transaction);
      if (locationScore > 0) {
        indicators.push({
          type: 'location',
          score: locationScore,
          description: 'Suspicious location detected'
        });
        totalScore += locationScore;
      }
    }

    // 4. Device fingerprint
    if (transaction.deviceId) {
      const deviceScore = await this.checkDeviceAnomaly(transaction);
      if (deviceScore > 0) {
        indicators.push({
          type: 'device',
          score: deviceScore,
          description: 'Unknown or suspicious device'
        });
        totalScore += deviceScore;
      }
    }

    // 5. Pattern matching
    const patternScore = this.checkKnownPatterns(transaction);
    if (patternScore > 0) {
      indicators.push({
        type: 'pattern',
        score: patternScore,
        description: 'Matches known fraud pattern'
      });
      totalScore += patternScore;
    }

    // 6. ML-based detection
    const mlScore = await this.mlFraudDetection(transaction);
    if (mlScore > 0) {
      indicators.push({
        type: 'ml',
        score: mlScore,
        description: 'AI detected suspicious activity'
      });
      totalScore += mlScore;
    }

    // Calculate final risk score
    const riskScore = Math.min(100, totalScore / indicators.length || 0);

    // Update user's risk profile
    await this.updateRiskProfile(transaction.userId, riskScore, indicators);

    // Determine approval
    const approved = riskScore < this.RISK_THRESHOLDS.high;

    // Log for audit
    await this.logFraudCheck(transaction, riskScore, indicators, approved);

    // Send alert if high risk
    if (riskScore >= this.RISK_THRESHOLDS.high) {
      await this.sendFraudAlert(transaction, riskScore, indicators);
    }

    return {
      approved,
      riskScore,
      reasons: indicators.map(i => i.description)
    };
  }

  /**
   * Check transaction velocity
   */
  private async checkVelocity(transaction: Transaction): Promise<number> {
    try {
      // Get recent transactions
      const recentTransactions = await getDocs(
        query(
          collection(db, 'transactions'),
          where('userId', '==', transaction.userId),
          where('timestamp', '>', new Date(Date.now() - 3600000)) // Last hour
        )
      );

      const count = recentTransactions.size;
      
      // Scoring based on velocity
      if (count > 10) return 80;
      if (count > 5) return 40;
      if (count > 3) return 20;
      
      return 0;
    } catch (error) {
      console.error('Error checking velocity:', error);
      return 0;
    }
  }

  /**
   * Check amount anomaly
   */
  private async checkAmountAnomaly(transaction: Transaction): Promise<number> {
    try {
      // Get user's transaction history
      const historySnapshot = await getDocs(
        query(
          collection(db, 'transactions'),
          where('userId', '==', transaction.userId)
        )
      );

      if (historySnapshot.empty) {
        // First transaction, slightly suspicious
        return transaction.amount > 1000 ? 30 : 10;
      }

      const amounts: number[] = [];
      historySnapshot.forEach(doc => {
        amounts.push(doc.data().amount);
      });

      // Calculate statistics
      const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const variance = amounts.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / amounts.length;
      const stdDev = Math.sqrt(variance);

      // Check if amount is an outlier (> 3 standard deviations)
      const zScore = Math.abs((transaction.amount - mean) / (stdDev || 1));
      
      if (zScore > 3) return 70;
      if (zScore > 2) return 40;
      if (zScore > 1.5) return 20;
      
      return 0;
    } catch (error) {
      console.error('Error checking amount anomaly:', error);
      return 0;
    }
  }

  /**
   * Check location anomaly
   */
  private async checkLocationAnomaly(transaction: Transaction): Promise<number> {
    if (!transaction.location) return 0;

    try {
      // Get user's location history
      const locationHistory = await getDocs(
        query(
          collection(db, 'user_locations'),
          where('userId', '==', transaction.userId)
        )
      );

      if (locationHistory.empty) {
        // No location history
        return 15;
      }

      // Check distance from usual locations
      let minDistance = Infinity;
      locationHistory.forEach(doc => {
        const loc = doc.data().location;
        const distance = this.calculateDistance(
          transaction.location!,
          loc
        );
        minDistance = Math.min(minDistance, distance);
      });

      // Scoring based on distance (in km)
      if (minDistance > 1000) return 60; // Different country
      if (minDistance > 100) return 30;  // Different city
      if (minDistance > 50) return 15;   // Unusual area
      
      return 0;
    } catch (error) {
      console.error('Error checking location anomaly:', error);
      return 0;
    }
  }

  /**
   * Check device anomaly
   */
  private async checkDeviceAnomaly(transaction: Transaction): Promise<number> {
    if (!transaction.deviceId) return 0;

    try {
      // Check if device is known
      const deviceHistory = await getDocs(
        query(
          collection(db, 'user_devices'),
          where('userId', '==', transaction.userId),
          where('deviceId', '==', transaction.deviceId)
        )
      );

      if (deviceHistory.empty) {
        // New device
        return 25;
      }

      // Check if device was recently added
      const device = deviceHistory.docs[0].data();
      const deviceAge = Date.now() - device.firstSeen.toMillis();
      
      if (deviceAge < 86400000) return 15; // Less than 24 hours old
      if (deviceAge < 604800000) return 5; // Less than a week old
      
      return 0;
    } catch (error) {
      console.error('Error checking device anomaly:', error);
      return 0;
    }
  }

  /**
   * Check known fraud patterns
   */
  private checkKnownPatterns(transaction: Transaction): number {
    let score = 0;

    // Pattern 1: Round amounts (potential testing)
    if (transaction.amount % 100 === 0) {
      score += 5;
    }

    // Pattern 2: Sequential amounts
    const pattern = `${transaction.userId}_${transaction.amount}`;
    const count = this.suspiciousPatterns.get(pattern) || 0;
    if (count > 2) {
      score += 30;
    }
    this.suspiciousPatterns.set(pattern, count + 1);

    // Pattern 3: Time-based patterns (late night transactions)
    const hour = new Date(transaction.timestamp).getHours();
    if (hour >= 2 && hour <= 5) {
      score += 10;
    }

    return score;
  }

  /**
   * ML-based fraud detection
   */
  private async mlFraudDetection(transaction: Transaction): Promise<number> {
    // Simplified ML detection - in production, use proper ML model
    const features = [
      transaction.amount / 10000, // Normalized amount
      new Date(transaction.timestamp).getHours() / 24, // Time of day
      transaction.type === 'refund' ? 1 : 0, // Transaction type
    ];

    // Simple neural network simulation
    const weights = [0.4, 0.2, 0.3];
    let score = 0;
    
    for (let i = 0; i < features.length; i++) {
      score += features[i] * weights[i];
    }

    return Math.min(100, score * 100);
  }

  /**
   * Update user's risk profile
   */
  private async updateRiskProfile(
    userId: string,
    riskScore: number,
    indicators: FraudIndicator[]
  ) {
    const profile: RiskProfile = {
      userId,
      riskScore,
      indicators,
      lastUpdated: new Date(),
      status: this.getRiskStatus(riskScore)
    };

    this.riskProfiles.set(userId, profile);

    // Save to database
    try {
      await addDoc(collection(db, 'risk_profiles'), {
        ...profile,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating risk profile:', error);
    }

    // Update blocked users if necessary
    if (profile.status === 'blocked') {
      this.blockedUsers.add(userId);
    }
  }

  /**
   * Get risk status based on score
   */
  private getRiskStatus(score: number): RiskProfile['status'] {
    if (score >= this.RISK_THRESHOLDS.block) return 'blocked';
    if (score >= this.RISK_THRESHOLDS.high) return 'high';
    if (score >= this.RISK_THRESHOLDS.medium) return 'medium';
    return 'low';
  }

  /**
   * Detect anomalies in overall patterns
   */
  private async detectAnomalies() {
    // Implement anomaly detection algorithms
    console.log('Running anomaly detection...');
  }

  /**
   * Update risk scores for all users
   */
  private async updateRiskScores() {
    this.riskProfiles.forEach(async (profile, userId) => {
      // Decay risk score over time
      const timeSinceUpdate = Date.now() - profile.lastUpdated.getTime();
      const daysSinceUpdate = timeSinceUpdate / 86400000;
      
      if (daysSinceUpdate > 1) {
        profile.riskScore = Math.max(0, profile.riskScore - daysSinceUpdate * 2);
        profile.status = this.getRiskStatus(profile.riskScore);
        
        if (profile.status !== 'blocked') {
          this.blockedUsers.delete(userId);
        }
      }
    });
  }

  /**
   * Analyze behavior patterns
   */
  private analyzeBehaviorPatterns(behaviors: any) {
    // Analyze user behavior for suspicious patterns
    Object.entries(behaviors).forEach(([userId, behavior]: [string, any]) => {
      // Check for bot-like behavior
      if (behavior.clickRate > 100) {
        this.updateRiskProfile(userId, 50, [{
          type: 'behavior',
          score: 50,
          description: 'Bot-like clicking behavior detected'
        }]);
      }
    });
  }

  /**
   * Log fraud check for audit
   */
  private async logFraudCheck(
    transaction: Transaction,
    riskScore: number,
    indicators: FraudIndicator[],
    approved: boolean
  ) {
    try {
      await push(ref(realtimeDb, 'fraud_logs'), {
        transactionId: transaction.id,
        userId: transaction.userId,
        riskScore,
        indicators,
        approved,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error logging fraud check:', error);
    }
  }

  /**
   * Send fraud alert
   */
  private async sendFraudAlert(
    transaction: Transaction,
    riskScore: number,
    indicators: FraudIndicator[]
  ) {
    try {
      await push(ref(realtimeDb, 'fraud_alerts'), {
        severity: riskScore >= this.RISK_THRESHOLDS.block ? 'critical' : 'high',
        transaction,
        riskScore,
        indicators,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error sending fraud alert:', error);
    }
  }

  /**
   * Calculate distance between two coordinates
   */
  private calculateDistance(
    loc1: { lat: number; lng: number },
    loc2: { lat: number; lng: number }
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
    const dLon = (loc2.lng - loc1.lng) * Math.PI / 180;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Public API
   */
  async checkTransaction(transaction: Transaction): Promise<boolean> {
    const result = await this.analyzeTransaction(transaction);
    return result.approved;
  }

  getUserRiskScore(userId: string): number {
    return this.riskProfiles.get(userId)?.riskScore || 0;
  }

  isUserBlocked(userId: string): boolean {
    return this.blockedUsers.has(userId);
  }

  async unblockUser(userId: string) {
    this.blockedUsers.delete(userId);
    const profile = this.riskProfiles.get(userId);
    if (profile) {
      profile.status = 'low';
      profile.riskScore = 0;
      await this.updateRiskProfile(userId, 0, []);
    }
  }
}

export const fraudDetectionService = FraudDetectionService.getInstance();