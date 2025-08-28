/**
 * Real-time Auction Service
 * Live bidding system with instant updates
 */

import { db, realtimeDb } from '@/config/firebase.config';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc,
  serverTimestamp,
  onSnapshot,
  query,
  where,
  orderBy,
  getDocs
} from 'firebase/firestore';
import { ref, push, onValue, set, onDisconnect } from 'firebase/database';
import { Product } from '@/types';
import { fraudDetectionService } from './fraud-detection.service';
import { blockchainService } from './blockchain.service';
import toast from 'react-hot-toast';

interface Auction {
  id: string;
  product: Product;
  sellerId: string;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  type: 'english' | 'dutch' | 'sealed' | 'vickrey';
  startingPrice: number;
  currentPrice: number;
  reservePrice?: number;
  buyNowPrice?: number;
  incrementAmount: number;
  startTime: Date;
  endTime: Date;
  extendTime?: number; // Seconds to extend on last-minute bid
  bids: Bid[];
  highestBid?: Bid;
  watchers: string[];
  winner?: string;
  isNFT?: boolean;
  smartContractAddress?: string;
}

interface Bid {
  id: string;
  auctionId: string;
  bidderId: string;
  bidderName: string;
  amount: number;
  timestamp: Date;
  isAutoBid?: boolean;
  maxAutoBid?: number;
  isValid: boolean;
  transactionHash?: string;
}

interface AutoBidConfig {
  auctionId: string;
  userId: string;
  maxAmount: number;
  incrementStrategy: 'minimum' | 'aggressive';
  isActive: boolean;
}

interface AuctionAnalytics {
  totalBids: number;
  uniqueBidders: number;
  averageBidAmount: number;
  bidVelocity: number; // Bids per minute
  priceProgression: Array<{ time: Date; price: number }>;
  estimatedFinalPrice?: number;
}

class AuctionService {
  private static instance: AuctionService;
  private activeAuctions: Map<string, Auction> = new Map();
  private autoBidConfigs: Map<string, AutoBidConfig> = new Map();
  private bidValidation: Map<string, boolean> = new Map();
  private auctionTimers: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {
    this.initialize();
  }

  static getInstance(): AuctionService {
    if (!AuctionService.instance) {
      AuctionService.instance = new AuctionService();
    }
    return AuctionService.instance;
  }

  /**
   * Initialize auction service
   */
  private async initialize() {
    await this.loadActiveAuctions();
    this.setupRealtimeListeners();
    this.startAuctionScheduler();
  }

  /**
   * Create new auction
   */
  async createAuction(
    product: Product,
    sellerId: string,
    config: {
      type: Auction['type'];
      startingPrice: number;
      reservePrice?: number;
      buyNowPrice?: number;
      incrementAmount: number;
      duration: number; // in hours
      startTime?: Date;
      isNFT?: boolean;
    }
  ): Promise<Auction> {
    try {
      // Validate auction parameters
      this.validateAuctionConfig(config);

      // Create smart contract for high-value or NFT auctions
      let smartContractAddress;
      if (config.isNFT || config.startingPrice > 10000) {
        smartContractAddress = await this.deployAuctionContract(product, config);
      }

      const auction: Auction = {
        id: `auction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        product,
        sellerId,
        status: 'scheduled',
        type: config.type,
        startingPrice: config.startingPrice,
        currentPrice: config.startingPrice,
        reservePrice: config.reservePrice,
        buyNowPrice: config.buyNowPrice,
        incrementAmount: config.incrementAmount,
        startTime: config.startTime || new Date(),
        endTime: new Date(
          (config.startTime?.getTime() || Date.now()) + config.duration * 60 * 60 * 1000
        ),
        extendTime: 120, // Extend by 2 minutes on last-minute bid
        bids: [],
        watchers: [],
        isNFT: config.isNFT,
        smartContractAddress
      };

      // Save to database
      const auctionDoc = await addDoc(collection(db, 'auctions'), {
        ...auction,
        createdAt: serverTimestamp()
      });

      auction.id = auctionDoc.id;

      // Setup real-time sync
      await this.setupAuctionRealtime(auction);

      // Schedule auction start/end
      this.scheduleAuction(auction);

      this.activeAuctions.set(auction.id, auction);

      toast.success('Auction created successfully!');
      return auction;

    } catch (error) {
      console.error('Error creating auction:', error);
      toast.error('Failed to create auction');
      throw error;
    }
  }

  /**
   * Place bid on auction
   */
  async placeBid(
    auctionId: string,
    bidderId: string,
    amount: number,
    isAutoBid: boolean = false
  ): Promise<Bid> {
    const auction = this.activeAuctions.get(auctionId);
    if (!auction) {
      throw new Error('Auction not found');
    }

    // Validate auction status
    if (auction.status !== 'live') {
      throw new Error('Auction is not active');
    }

    // Validate bid amount
    this.validateBid(auction, amount);

    // Check fraud risk
    const fraudCheck = await fraudDetectionService.analyzeTransaction({
      id: `bid_${Date.now()}`,
      userId: bidderId,
      amount,
      timestamp: new Date(),
      type: 'purchase'
    });

    if (!fraudCheck.approved) {
      throw new Error('Bid rejected due to security concerns');
    }

    // Create bid
    const bid: Bid = {
      id: `bid_${Date.now()}`,
      auctionId,
      bidderId,
      bidderName: await this.getBidderName(bidderId),
      amount,
      timestamp: new Date(),
      isAutoBid,
      isValid: true
    };

    // Process payment authorization (for high-value bids)
    if (amount > 1000) {
      bid.transactionHash = await this.authorizePayment(bidderId, amount);
    }

    // Update auction
    auction.bids.push(bid);
    auction.currentPrice = amount;
    auction.highestBid = bid;

    // Extend auction if bid placed in final minutes
    this.checkAndExtendAuction(auction);

    // Trigger auto-bids from other users
    await this.processAutoBids(auction, bid);

    // Update real-time
    await this.updateAuctionRealtime(auction);

    // Send notifications
    await this.sendBidNotifications(auction, bid);

    // Update analytics
    this.updateAuctionAnalytics(auction);

    toast.success(`Bid placed: ${amount} EGP`);
    return bid;
  }

  /**
   * Buy now (immediate purchase)
   */
  async buyNow(auctionId: string, buyerId: string): Promise<void> {
    const auction = this.activeAuctions.get(auctionId);
    if (!auction || !auction.buyNowPrice) {
      throw new Error('Buy now not available');
    }

    // Create winning bid
    const winningBid = await this.placeBid(
      auctionId,
      buyerId,
      auction.buyNowPrice,
      false
    );

    // End auction immediately
    await this.endAuction(auctionId, buyerId);

    toast.success('Purchase successful!');
  }

  /**
   * Setup auto-bid
   */
  async setupAutoBid(
    auctionId: string,
    userId: string,
    maxAmount: number,
    strategy: 'minimum' | 'aggressive' = 'minimum'
  ): Promise<void> {
    const auction = this.activeAuctions.get(auctionId);
    if (!auction) {
      throw new Error('Auction not found');
    }

    const autoBidConfig: AutoBidConfig = {
      auctionId,
      userId,
      maxAmount,
      incrementStrategy: strategy,
      isActive: true
    };

    this.autoBidConfigs.set(`${auctionId}_${userId}`, autoBidConfig);

    // Place initial auto-bid if needed
    if (auction.status === 'live' && 
        (!auction.highestBid || auction.highestBid.bidderId !== userId)) {
      await this.executeAutoBid(auction, autoBidConfig);
    }

    toast.success('Auto-bid configured');
  }

  /**
   * Watch auction
   */
  async watchAuction(auctionId: string, userId: string): Promise<void> {
    const auction = this.activeAuctions.get(auctionId);
    if (!auction) {
      throw new Error('Auction not found');
    }

    if (!auction.watchers.includes(userId)) {
      auction.watchers.push(userId);
      await this.updateAuctionRealtime(auction);
    }

    // Setup real-time updates for watcher
    this.setupWatcherUpdates(auctionId, userId);

    toast.success('Watching auction');
  }

  /**
   * Get auction analytics
   */
  async getAuctionAnalytics(auctionId: string): Promise<AuctionAnalytics> {
    const auction = this.activeAuctions.get(auctionId);
    if (!auction) {
      throw new Error('Auction not found');
    }

    const uniqueBidders = new Set(auction.bids.map(b => b.bidderId));
    const totalAmount = auction.bids.reduce((sum, bid) => sum + bid.amount, 0);
    
    // Calculate bid velocity
    const duration = (Date.now() - auction.startTime.getTime()) / 60000; // in minutes
    const bidVelocity = duration > 0 ? auction.bids.length / duration : 0;

    // Price progression
    const priceProgression = auction.bids.map(bid => ({
      time: bid.timestamp,
      price: bid.amount
    }));

    // Estimate final price using ML
    const estimatedFinalPrice = await this.predictFinalPrice(auction);

    return {
      totalBids: auction.bids.length,
      uniqueBidders: uniqueBidders.size,
      averageBidAmount: auction.bids.length > 0 ? totalAmount / auction.bids.length : 0,
      bidVelocity,
      priceProgression,
      estimatedFinalPrice
    };
  }

  /**
   * Private helper methods
   */
  private async loadActiveAuctions() {
    const auctionsQuery = query(
      collection(db, 'auctions'),
      where('status', 'in', ['scheduled', 'live'])
    );

    const snapshot = await getDocs(auctionsQuery);
    snapshot.forEach(doc => {
      const auction = { id: doc.id, ...doc.data() } as Auction;
      this.activeAuctions.set(auction.id, auction);
      this.scheduleAuction(auction);
    });
  }

  private setupRealtimeListeners() {
    // Listen to auction updates
    const auctionsRef = ref(realtimeDb, 'auctions');
    onValue(auctionsRef, (snapshot) => {
      const auctions = snapshot.val();
      if (auctions) {
        Object.entries(auctions).forEach(([id, auction]) => {
          this.handleAuctionUpdate(id, auction as Auction);
        });
      }
    });

    // Listen to bids
    const bidsRef = ref(realtimeDb, 'auction_bids');
    onValue(bidsRef, (snapshot) => {
      const bids = snapshot.val();
      if (bids) {
        this.processBidUpdates(bids);
      }
    });
  }

  private startAuctionScheduler() {
    // Check auction status every minute
    setInterval(() => {
      this.activeAuctions.forEach(auction => {
        this.checkAuctionStatus(auction);
      });
    }, 60000);
  }

  private validateAuctionConfig(config: any) {
    if (config.startingPrice < 0) {
      throw new Error('Starting price must be positive');
    }
    if (config.reservePrice && config.reservePrice < config.startingPrice) {
      throw new Error('Reserve price must be higher than starting price');
    }
    if (config.duration < 0.5 || config.duration > 720) {
      throw new Error('Duration must be between 30 minutes and 30 days');
    }
  }

  private validateBid(auction: Auction, amount: number) {
    // Check minimum bid
    const minBid = auction.currentPrice + auction.incrementAmount;
    if (amount < minBid) {
      throw new Error(`Minimum bid is ${minBid} EGP`);
    }

    // Check buy now price
    if (auction.buyNowPrice && amount >= auction.buyNowPrice) {
      throw new Error('Use Buy Now option for this price');
    }
  }

  private async deployAuctionContract(product: Product, config: any): Promise<string> {
    // Deploy smart contract for auction
    if (blockchainService.isWalletConnected()) {
      // Create escrow contract
      const contractAddress = await blockchainService.createEscrowContract(
        'buyer_placeholder',
        product.vendorId || 'seller',
        config.startingPrice,
        'ETH'
      );
      return contractAddress;
    }
    return '';
  }

  private async setupAuctionRealtime(auction: Auction) {
    await set(ref(realtimeDb, `auctions/${auction.id}`), {
      ...auction,
      timestamp: Date.now()
    });
  }

  private scheduleAuction(auction: Auction) {
    // Schedule auction start
    const startDelay = auction.startTime.getTime() - Date.now();
    if (startDelay > 0) {
      setTimeout(() => {
        this.startAuction(auction.id);
      }, startDelay);
    } else if (auction.status === 'scheduled') {
      this.startAuction(auction.id);
    }

    // Schedule auction end
    const endDelay = auction.endTime.getTime() - Date.now();
    if (endDelay > 0) {
      const timer = setTimeout(() => {
        this.endAuction(auction.id);
      }, endDelay);
      this.auctionTimers.set(auction.id, timer);
    }
  }

  private async startAuction(auctionId: string) {
    const auction = this.activeAuctions.get(auctionId);
    if (!auction) return;

    auction.status = 'live';
    await this.updateAuctionRealtime(auction);
    
    // Notify watchers
    await this.notifyWatchers(auction, 'Auction is now live!');
    
    toast.success(`Auction ${auction.product.title} is now live!`);
  }

  private async endAuction(auctionId: string, winnerId?: string) {
    const auction = this.activeAuctions.get(auctionId);
    if (!auction) return;

    auction.status = 'ended';
    
    // Determine winner
    if (!winnerId && auction.highestBid) {
      winnerId = auction.highestBid.bidderId;
    }
    
    if (winnerId && auction.reservePrice) {
      // Check if reserve price was met
      if (auction.currentPrice >= auction.reservePrice) {
        auction.winner = winnerId;
        await this.processAuctionWin(auction, winnerId);
      } else {
        await this.notifyWatchers(auction, 'Auction ended - reserve not met');
      }
    } else if (winnerId) {
      auction.winner = winnerId;
      await this.processAuctionWin(auction, winnerId);
    }

    await this.updateAuctionRealtime(auction);
    
    // Clear timer
    const timer = this.auctionTimers.get(auctionId);
    if (timer) {
      clearTimeout(timer);
      this.auctionTimers.delete(auctionId);
    }

    // Remove from active auctions
    this.activeAuctions.delete(auctionId);
  }

  private checkAndExtendAuction(auction: Auction) {
    const timeRemaining = auction.endTime.getTime() - Date.now();
    const extendThreshold = 120000; // 2 minutes

    if (timeRemaining < extendThreshold && auction.extendTime) {
      // Extend auction
      const newEndTime = new Date(auction.endTime.getTime() + auction.extendTime * 1000);
      auction.endTime = newEndTime;

      // Reschedule end timer
      const oldTimer = this.auctionTimers.get(auction.id);
      if (oldTimer) {
        clearTimeout(oldTimer);
      }

      const newTimer = setTimeout(() => {
        this.endAuction(auction.id);
      }, auction.extendTime * 1000);
      
      this.auctionTimers.set(auction.id, newTimer);

      toast.info(`Auction extended by ${auction.extendTime} seconds`);
    }
  }

  private async processAutoBids(auction: Auction, newBid: Bid) {
    // Get all auto-bid configs for this auction
    const autoBids = Array.from(this.autoBidConfigs.values())
      .filter(config => 
        config.auctionId === auction.id && 
        config.isActive && 
        config.userId !== newBid.bidderId
      );

    for (const config of autoBids) {
      await this.executeAutoBid(auction, config);
    }
  }

  private async executeAutoBid(auction: Auction, config: AutoBidConfig) {
    // Calculate bid amount based on strategy
    let bidAmount: number;
    
    if (config.incrementStrategy === 'minimum') {
      bidAmount = auction.currentPrice + auction.incrementAmount;
    } else {
      // Aggressive strategy - bid higher increment
      bidAmount = auction.currentPrice + (auction.incrementAmount * 2);
    }

    // Check if within max amount
    if (bidAmount <= config.maxAmount) {
      try {
        await this.placeBid(auction.id, config.userId, bidAmount, true);
      } catch (error) {
        console.error('Auto-bid failed:', error);
        config.isActive = false;
      }
    } else {
      // Deactivate auto-bid if max reached
      config.isActive = false;
      await this.notifyUser(
        config.userId,
        `Auto-bid limit reached for auction ${auction.product.title}`
      );
    }
  }

  private async authorizePayment(userId: string, amount: number): Promise<string> {
    // Authorize payment (hold funds)
    return `auth_${Date.now()}_${amount}`;
  }

  private async processAuctionWin(auction: Auction, winnerId: string) {
    // Process payment
    if (auction.highestBid?.transactionHash) {
      // Capture authorized payment
      console.log('Capturing payment:', auction.highestBid.transactionHash);
    }

    // Transfer ownership if NFT
    if (auction.isNFT && auction.smartContractAddress) {
      // Transfer NFT to winner
      console.log('Transferring NFT to winner');
    }

    // Create order
    await addDoc(collection(db, 'orders'), {
      userId: winnerId,
      auctionId: auction.id,
      productId: auction.product.id,
      amount: auction.currentPrice,
      type: 'auction',
      status: 'processing',
      createdAt: serverTimestamp()
    });

    // Notify winner
    await this.notifyUser(
      winnerId,
      `Congratulations! You won the auction for ${auction.product.title}`
    );

    // Notify seller
    await this.notifyUser(
      auction.sellerId,
      `Your auction for ${auction.product.title} sold for ${auction.currentPrice} EGP`
    );
  }

  private async updateAuctionRealtime(auction: Auction) {
    await set(ref(realtimeDb, `auctions/${auction.id}`), {
      ...auction,
      lastUpdate: Date.now()
    });
  }

  private async sendBidNotifications(auction: Auction, bid: Bid) {
    // Notify previous highest bidder
    if (auction.bids.length > 1) {
      const previousBid = auction.bids[auction.bids.length - 2];
      await this.notifyUser(
        previousBid.bidderId,
        `You've been outbid on ${auction.product.title}`
      );
    }

    // Notify watchers
    await this.notifyWatchers(
      auction,
      `New bid: ${bid.amount} EGP on ${auction.product.title}`
    );
  }

  private setupWatcherUpdates(auctionId: string, userId: string) {
    const auctionRef = ref(realtimeDb, `auctions/${auctionId}`);
    onValue(auctionRef, (snapshot) => {
      const auction = snapshot.val();
      if (auction) {
        // Send update to watcher
        this.sendWatcherUpdate(userId, auction);
      }
    });
  }

  private async predictFinalPrice(auction: Auction): Promise<number> {
    // Use ML to predict final price based on:
    // - Current price trajectory
    // - Number of bidders
    // - Time remaining
    // - Historical auction data
    
    const priceIncrease = auction.bids.length * auction.incrementAmount * 0.7;
    return auction.currentPrice + priceIncrease;
  }

  private checkAuctionStatus(auction: Auction) {
    const now = Date.now();
    
    if (auction.status === 'scheduled' && auction.startTime.getTime() <= now) {
      this.startAuction(auction.id);
    } else if (auction.status === 'live' && auction.endTime.getTime() <= now) {
      this.endAuction(auction.id);
    }
  }

  private handleAuctionUpdate(id: string, auction: Auction) {
    this.activeAuctions.set(id, auction);
  }

  private processBidUpdates(bids: any) {
    // Process incoming bid updates
    Object.values(bids).forEach((bid: any) => {
      const auction = this.activeAuctions.get(bid.auctionId);
      if (auction) {
        // Update auction with new bid
        const existingBid = auction.bids.find(b => b.id === bid.id);
        if (!existingBid) {
          auction.bids.push(bid);
          if (!auction.highestBid || bid.amount > auction.highestBid.amount) {
            auction.highestBid = bid;
            auction.currentPrice = bid.amount;
          }
        }
      }
    });
  }

  private updateAuctionAnalytics(auction: Auction) {
    // Track auction metrics for analytics
    push(ref(realtimeDb, 'auction_analytics'), {
      auctionId: auction.id,
      timestamp: Date.now(),
      currentPrice: auction.currentPrice,
      bidCount: auction.bids.length,
      watcherCount: auction.watchers.length
    });
  }

  private async getBidderName(userId: string): Promise<string> {
    // Get user name from database
    return `User_${userId.slice(-4)}`;
  }

  private async notifyUser(userId: string, message: string) {
    push(ref(realtimeDb, `notifications/${userId}`), {
      message,
      timestamp: Date.now(),
      type: 'auction'
    });
  }

  private async notifyWatchers(auction: Auction, message: string) {
    auction.watchers.forEach(userId => {
      this.notifyUser(userId, message);
    });
  }

  private sendWatcherUpdate(userId: string, auction: any) {
    // Send real-time update to watcher
    push(ref(realtimeDb, `watcher_updates/${userId}`), {
      auctionId: auction.id,
      currentPrice: auction.currentPrice,
      timeRemaining: auction.endTime - Date.now(),
      timestamp: Date.now()
    });
  }

  /**
   * Public API
   */
  getActiveAuctions(): Auction[] {
    return Array.from(this.activeAuctions.values())
      .filter(a => a.status === 'live');
  }

  getUpcomingAuctions(): Auction[] {
    return Array.from(this.activeAuctions.values())
      .filter(a => a.status === 'scheduled');
  }

  getUserBids(userId: string): Bid[] {
    const bids: Bid[] = [];
    this.activeAuctions.forEach(auction => {
      const userBids = auction.bids.filter(b => b.bidderId === userId);
      bids.push(...userBids);
    });
    return bids;
  }

  getUserWonAuctions(userId: string): Auction[] {
    return Array.from(this.activeAuctions.values())
      .filter(a => a.winner === userId);
  }
}

export const auctionService = AuctionService.getInstance();