/**
 * Live Video Shopping Service
 * Real-time interactive shopping with live streaming
 */

import { db, realtimeDb } from '@/config/firebase.config';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc,
  onSnapshot,
  serverTimestamp,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { ref, push, onValue, set, onDisconnect } from 'firebase/database';
import { Product, User } from '@/types';
import toast from 'react-hot-toast';

interface LiveStream {
  id: string;
  hostId: string;
  hostName: string;
  title: string;
  description: string;
  thumbnail: string;
  streamUrl?: string;
  status: 'scheduled' | 'live' | 'ended';
  scheduledTime?: Date;
  startTime?: Date;
  endTime?: Date;
  viewerCount: number;
  peakViewers: number;
  products: Product[];
  highlightedProduct?: Product;
  interactions: {
    likes: number;
    comments: number;
    shares: number;
  };
  sales: {
    totalOrders: number;
    totalRevenue: number;
    conversionRate: number;
  };
}

interface StreamMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  message: string;
  type: 'chat' | 'question' | 'purchase' | 'system';
  timestamp: Date;
  isPinned?: boolean;
  isHighlighted?: boolean;
}

interface StreamInteraction {
  type: 'like' | 'share' | 'product_click' | 'add_to_cart' | 'purchase';
  userId: string;
  productId?: string;
  timestamp: Date;
}

class LiveShoppingService {
  private static instance: LiveShoppingService;
  private currentStream: LiveStream | null = null;
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private viewers: Map<string, User> = new Map();
  private messages: StreamMessage[] = [];
  private streamStats: any = {};

  private constructor() {
    this.initializeWebRTC();
  }

  static getInstance(): LiveShoppingService {
    if (!LiveShoppingService.instance) {
      LiveShoppingService.instance = new LiveShoppingService();
    }
    return LiveShoppingService.instance;
  }

  /**
   * Initialize WebRTC configuration
   */
  private initializeWebRTC() {
    if (typeof window === 'undefined') return;

    // WebRTC configuration with STUN/TURN servers
    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        // Add TURN servers for better connectivity
        {
          urls: 'turn:relay.metered.ca:80',
          username: 'demo',
          credential: 'demo'
        }
      ]
    });

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.currentStream) {
        this.sendSignal('ice-candidate', event.candidate);
      }
    };

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      this.remoteStream = event.streams[0];
      this.onRemoteStreamReceived(this.remoteStream);
    };
  }

  /**
   * Start a live shopping stream
   */
  async startStream(
    title: string,
    description: string,
    products: Product[]
  ): Promise<LiveStream> {
    try {
      // Get user media (camera + microphone)
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Add tracks to peer connection
      this.localStream.getTracks().forEach(track => {
        if (this.peerConnection && this.localStream) {
          this.peerConnection.addTrack(track, this.localStream);
        }
      });

      // Create stream document
      const streamDoc = await addDoc(collection(db, 'live_streams'), {
        hostId: 'current-user-id', // Get from auth
        hostName: 'Host Name',
        title,
        description,
        thumbnail: await this.generateThumbnail(),
        status: 'live',
        startTime: serverTimestamp(),
        viewerCount: 0,
        peakViewers: 0,
        products: products.map(p => ({
          id: p.id,
          title: p.title,
          price: p.price,
          image: p.images?.[0]?.url
        })),
        interactions: { likes: 0, comments: 0, shares: 0 },
        sales: { totalOrders: 0, totalRevenue: 0, conversionRate: 0 }
      });

      this.currentStream = {
        id: streamDoc.id,
        hostId: 'current-user-id',
        hostName: 'Host Name',
        title,
        description,
        thumbnail: '',
        status: 'live',
        startTime: new Date(),
        viewerCount: 0,
        peakViewers: 0,
        products,
        interactions: { likes: 0, comments: 0, shares: 0 },
        sales: { totalOrders: 0, totalRevenue: 0, conversionRate: 0 }
      };

      // Setup real-time listeners
      this.setupStreamListeners();

      // Start analytics
      this.startStreamAnalytics();

      toast.success('Live stream started!');
      return this.currentStream;

    } catch (error) {
      console.error('Error starting stream:', error);
      toast.error('Failed to start live stream');
      throw error;
    }
  }

  /**
   * Join a live shopping stream as viewer
   */
  async joinStream(streamId: string): Promise<void> {
    try {
      // Get stream details
      const streamRef = doc(db, 'live_streams', streamId);
      const unsubscribe = onSnapshot(streamRef, (doc) => {
        if (doc.exists()) {
          this.currentStream = { id: doc.id, ...doc.data() } as LiveStream;
        }
      });

      // Join as viewer
      await this.registerViewer(streamId);

      // Setup viewer listeners
      this.setupViewerListeners(streamId);

      // Create offer for WebRTC
      const offer = await this.peerConnection?.createOffer();
      if (offer) {
        await this.peerConnection?.setLocalDescription(offer);
        this.sendSignal('offer', offer);
      }

      toast.success('Joined live stream!');

    } catch (error) {
      console.error('Error joining stream:', error);
      toast.error('Failed to join stream');
    }
  }

  /**
   * Send chat message
   */
  async sendMessage(message: string, type: StreamMessage['type'] = 'chat') {
    if (!this.currentStream) return;

    const messageData: StreamMessage = {
      id: `msg_${Date.now()}`,
      userId: 'current-user-id',
      userName: 'User Name',
      message,
      type,
      timestamp: new Date()
    };

    // Add to realtime database
    await push(ref(realtimeDb, `streams/${this.currentStream.id}/messages`), messageData);

    // Update interaction count
    if (this.currentStream) {
      this.currentStream.interactions.comments++;
      await this.updateStreamStats();
    }
  }

  /**
   * Highlight product during stream
   */
  async highlightProduct(product: Product) {
    if (!this.currentStream) return;

    this.currentStream.highlightedProduct = product;

    // Update in database
    await updateDoc(doc(db, 'live_streams', this.currentStream.id), {
      highlightedProduct: {
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.images?.[0]?.url,
        discount: product.discount
      }
    });

    // Send system message
    await this.sendMessage(
      `Featured Product: ${product.title} - ${product.price} EGP`,
      'system'
    );

    // Track interaction
    this.trackInteraction('product_click', product.id);
  }

  /**
   * Process purchase during stream
   */
  async processPurchase(productId: string, quantity: number = 1) {
    if (!this.currentStream) return;

    try {
      // Add to cart with special stream discount
      const product = this.currentStream.products.find(p => p.id === productId);
      if (!product) throw new Error('Product not found');

      // Apply stream-exclusive discount
      const streamDiscount = 0.1; // 10% off during stream
      const discountedPrice = product.price * (1 - streamDiscount);

      // Process order
      const order = await addDoc(collection(db, 'orders'), {
        userId: 'current-user-id',
        streamId: this.currentStream.id,
        productId,
        quantity,
        originalPrice: product.price,
        discountedPrice,
        discount: streamDiscount,
        timestamp: serverTimestamp()
      });

      // Update stream sales stats
      this.currentStream.sales.totalOrders++;
      this.currentStream.sales.totalRevenue += discountedPrice * quantity;
      await this.updateStreamStats();

      // Send purchase notification
      await this.sendMessage(
        `🎉 Someone just purchased ${product.title}!`,
        'purchase'
      );

      // Track conversion
      this.trackInteraction('purchase', productId);

      toast.success('Purchase successful! You got 10% stream discount!');
      return order.id;

    } catch (error) {
      console.error('Error processing purchase:', error);
      toast.error('Purchase failed');
    }
  }

  /**
   * Like the stream
   */
  async likeStream() {
    if (!this.currentStream) return;

    this.currentStream.interactions.likes++;
    await this.updateStreamStats();
    this.trackInteraction('like');

    // Animate like
    this.animateLike();
  }

  /**
   * Share stream
   */
  async shareStream() {
    if (!this.currentStream) return;

    const shareUrl = `${window.location.origin}/live/${this.currentStream.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: this.currentStream.title,
          text: this.currentStream.description,
          url: shareUrl
        });
        
        this.currentStream.interactions.shares++;
        await this.updateStreamStats();
        this.trackInteraction('share');
        
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(shareUrl);
      toast.success('Stream link copied!');
    }
  }

  /**
   * End the stream
   */
  async endStream() {
    if (!this.currentStream) return;

    // Stop local stream
    this.localStream?.getTracks().forEach(track => track.stop());

    // Update stream status
    await updateDoc(doc(db, 'live_streams', this.currentStream.id), {
      status: 'ended',
      endTime: serverTimestamp()
    });

    // Calculate final stats
    const duration = Date.now() - this.currentStream.startTime!.getTime();
    const conversionRate = this.currentStream.viewerCount > 0
      ? (this.currentStream.sales.totalOrders / this.currentStream.viewerCount) * 100
      : 0;

    // Save stream analytics
    await addDoc(collection(db, 'stream_analytics'), {
      streamId: this.currentStream.id,
      duration,
      peakViewers: this.currentStream.peakViewers,
      totalViewers: this.viewers.size,
      engagement: {
        likes: this.currentStream.interactions.likes,
        comments: this.currentStream.interactions.comments,
        shares: this.currentStream.interactions.shares
      },
      sales: {
        ...this.currentStream.sales,
        conversionRate
      },
      timestamp: serverTimestamp()
    });

    // Clean up
    this.peerConnection?.close();
    this.currentStream = null;
    this.viewers.clear();
    this.messages = [];

    toast.success('Stream ended successfully!');
  }

  /**
   * Setup stream listeners
   */
  private setupStreamListeners() {
    if (!this.currentStream) return;

    // Listen to viewer count
    const viewersRef = ref(realtimeDb, `streams/${this.currentStream.id}/viewers`);
    onValue(viewersRef, (snapshot) => {
      const viewers = snapshot.val() || {};
      this.viewers.clear();
      Object.entries(viewers).forEach(([id, viewer]) => {
        this.viewers.set(id, viewer as User);
      });
      
      if (this.currentStream) {
        this.currentStream.viewerCount = this.viewers.size;
        this.currentStream.peakViewers = Math.max(
          this.currentStream.peakViewers,
          this.viewers.size
        );
      }
    });

    // Listen to messages
    const messagesRef = ref(realtimeDb, `streams/${this.currentStream.id}/messages`);
    onValue(messagesRef, (snapshot) => {
      const messages = snapshot.val() || {};
      this.messages = Object.values(messages) as StreamMessage[];
      this.onMessagesUpdated(this.messages);
    });

    // Listen to interactions
    const interactionsRef = ref(realtimeDb, `streams/${this.currentStream.id}/interactions`);
    onValue(interactionsRef, (snapshot) => {
      const interactions = snapshot.val() || [];
      this.processInteractions(interactions);
    });
  }

  /**
   * Setup viewer-specific listeners
   */
  private setupViewerListeners(streamId: string) {
    // Listen to highlighted products
    const highlightRef = ref(realtimeDb, `streams/${streamId}/highlighted_product`);
    onValue(highlightRef, (snapshot) => {
      const product = snapshot.val();
      if (product) {
        this.onProductHighlighted(product);
      }
    });

    // Listen to stream status
    const statusRef = ref(realtimeDb, `streams/${streamId}/status`);
    onValue(statusRef, (snapshot) => {
      const status = snapshot.val();
      if (status === 'ended') {
        this.onStreamEnded();
      }
    });
  }

  /**
   * Register viewer
   */
  private async registerViewer(streamId: string) {
    const viewerData = {
      userId: 'current-user-id',
      userName: 'User Name',
      joinedAt: Date.now()
    };

    const viewerRef = ref(realtimeDb, `streams/${streamId}/viewers/current-user-id`);
    await set(viewerRef, viewerData);

    // Remove viewer on disconnect
    onDisconnect(viewerRef).remove();
  }

  /**
   * Update stream statistics
   */
  private async updateStreamStats() {
    if (!this.currentStream) return;

    await updateDoc(doc(db, 'live_streams', this.currentStream.id), {
      viewerCount: this.currentStream.viewerCount,
      peakViewers: this.currentStream.peakViewers,
      interactions: this.currentStream.interactions,
      sales: this.currentStream.sales
    });
  }

  /**
   * Track interaction
   */
  private async trackInteraction(
    type: StreamInteraction['type'],
    productId?: string
  ) {
    if (!this.currentStream) return;

    const interaction: StreamInteraction = {
      type,
      userId: 'current-user-id',
      productId,
      timestamp: new Date()
    };

    await push(
      ref(realtimeDb, `streams/${this.currentStream.id}/interactions`),
      interaction
    );
  }

  /**
   * Start stream analytics
   */
  private startStreamAnalytics() {
    // Track viewer retention
    setInterval(() => {
      if (this.currentStream) {
        const retention = this.calculateViewerRetention();
        this.streamStats.retention = retention;
      }
    }, 30000); // Every 30 seconds

    // Track engagement rate
    setInterval(() => {
      if (this.currentStream) {
        const engagement = this.calculateEngagementRate();
        this.streamStats.engagement = engagement;
      }
    }, 60000); // Every minute
  }

  /**
   * Calculate viewer retention
   */
  private calculateViewerRetention(): number {
    if (!this.currentStream || this.currentStream.peakViewers === 0) return 0;
    return (this.currentStream.viewerCount / this.currentStream.peakViewers) * 100;
  }

  /**
   * Calculate engagement rate
   */
  private calculateEngagementRate(): number {
    if (!this.currentStream || this.currentStream.viewerCount === 0) return 0;
    
    const totalInteractions = 
      this.currentStream.interactions.likes +
      this.currentStream.interactions.comments +
      this.currentStream.interactions.shares;
    
    return (totalInteractions / this.currentStream.viewerCount) * 100;
  }

  /**
   * Generate thumbnail from video stream
   */
  private async generateThumbnail(): Promise<string> {
    if (!this.localStream) return '';

    const video = document.createElement('video');
    video.srcObject = this.localStream;
    video.play();

    await new Promise(resolve => setTimeout(resolve, 100));

    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL('image/jpeg');
  }

  /**
   * Send WebRTC signaling
   */
  private sendSignal(type: string, data: any) {
    if (!this.currentStream) return;

    push(ref(realtimeDb, `streams/${this.currentStream.id}/signals`), {
      type,
      data,
      senderId: 'current-user-id',
      timestamp: Date.now()
    });
  }

  /**
   * Process interactions
   */
  private processInteractions(interactions: StreamInteraction[]) {
    // Process and display interactions
    interactions.forEach(interaction => {
      if (interaction.type === 'like') {
        this.animateLike();
      }
    });
  }

  /**
   * Animate like
   */
  private animateLike() {
    // Trigger like animation in UI
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('stream-like'));
    }
  }

  /**
   * Callbacks for UI updates
   */
  private onRemoteStreamReceived(stream: MediaStream) {
    // Update UI with remote stream
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('remote-stream', { detail: stream }));
    }
  }

  private onMessagesUpdated(messages: StreamMessage[]) {
    // Update UI with new messages
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('stream-messages', { detail: messages }));
    }
  }

  private onProductHighlighted(product: any) {
    // Update UI with highlighted product
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('product-highlight', { detail: product }));
    }
  }

  private onStreamEnded() {
    // Handle stream end
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('stream-ended'));
    }
  }

  /**
   * Get stream analytics
   */
  async getStreamAnalytics(streamId: string) {
    const analyticsQuery = query(
      collection(db, 'stream_analytics'),
      where('streamId', '==', streamId)
    );
    
    const snapshot = await getDocs(analyticsQuery);
    if (!snapshot.empty) {
      return snapshot.docs[0].data();
    }
    return null;
  }

  /**
   * Get upcoming streams
   */
  async getUpcomingStreams(): Promise<LiveStream[]> {
    const streamsQuery = query(
      collection(db, 'live_streams'),
      where('status', '==', 'scheduled'),
      orderBy('scheduledTime', 'asc')
    );
    
    const snapshot = await getDocs(streamsQuery);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LiveStream));
  }

  /**
   * Get live streams
   */
  async getLiveStreams(): Promise<LiveStream[]> {
    const streamsQuery = query(
      collection(db, 'live_streams'),
      where('status', '==', 'live'),
      orderBy('viewerCount', 'desc')
    );
    
    const snapshot = await getDocs(streamsQuery);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LiveStream));
  }
}

export const liveShoppingService = LiveShoppingService.getInstance();