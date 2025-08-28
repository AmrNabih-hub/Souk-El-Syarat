/**
 * Voice Commerce Service
 * Real-time voice shopping with natural language processing
 */

import { recommendationEngine } from './ai/recommendation-engine';
import { productService } from './product.service';
import { cartService } from './cart.service';
import { authService } from './auth.service';
import { realtimeDb } from '@/config/firebase.config';
import { ref, push, onValue } from 'firebase/database';
import toast from 'react-hot-toast';

interface VoiceCommand {
  intent: 'search' | 'add_to_cart' | 'checkout' | 'track_order' | 'help' | 'unknown';
  entities: {
    product?: string;
    quantity?: number;
    category?: string;
    price?: { min: number; max: number };
    action?: string;
  };
  confidence: number;
  rawText: string;
}

interface VoiceSession {
  sessionId: string;
  userId: string;
  context: {
    lastProduct?: string;
    lastCategory?: string;
    cartItems: number;
    conversationHistory: VoiceCommand[];
  };
  isActive: boolean;
  startTime: Date;
}

class VoiceCommerceService {
  private static instance: VoiceCommerceService;
  private recognition: any = null;
  private synthesis: SpeechSynthesisUtterance | null = null;
  private isListening: boolean = false;
  private currentSession: VoiceSession | null = null;
  private commandPatterns: Map<string, RegExp> = new Map();
  private nlpProcessor: any = null;

  private constructor() {
    this.initializeVoiceRecognition();
    this.initializeCommandPatterns();
    this.setupRealtimeSync();
  }

  static getInstance(): VoiceCommerceService {
    if (!VoiceCommerceService.instance) {
      VoiceCommerceService.instance = new VoiceCommerceService();
    }
    return VoiceCommerceService.instance;
  }

  /**
   * Initialize voice recognition
   */
  private initializeVoiceRecognition() {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || 
                              (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      
      this.recognition.onresult = this.handleVoiceInput.bind(this);
      this.recognition.onerror = this.handleError.bind(this);
      this.recognition.onend = this.handleEnd.bind(this);
    }

    // Initialize text-to-speech
    if ('speechSynthesis' in window) {
      this.synthesis = new SpeechSynthesisUtterance();
      this.synthesis.lang = 'en-US';
      this.synthesis.rate = 1.0;
      this.synthesis.pitch = 1.0;
    }
  }

  /**
   * Initialize command patterns
   */
  private initializeCommandPatterns() {
    // Search patterns
    this.commandPatterns.set('search', 
      /(?:search|find|show|look for|i want|i need)\s+(.+)/i
    );
    
    // Add to cart patterns
    this.commandPatterns.set('add_to_cart',
      /(?:add|put|place)\s+(?:(\d+)\s+)?(.+?)\s+(?:to|in)\s+(?:my\s+)?cart/i
    );
    
    // Checkout patterns
    this.commandPatterns.set('checkout',
      /(?:checkout|buy|purchase|order|proceed to checkout)/i
    );
    
    // Track order patterns
    this.commandPatterns.set('track_order',
      /(?:track|where is|status of)\s+(?:my\s+)?(?:order|package)/i
    );
    
    // Navigation patterns
    this.commandPatterns.set('navigate',
      /(?:go to|open|show me)\s+(.+)/i
    );
    
    // Help patterns
    this.commandPatterns.set('help',
      /(?:help|what can you do|commands|how to)/i
    );
  }

  /**
   * Setup real-time synchronization
   */
  private setupRealtimeSync() {
    if (!authService.getCurrentUser()) return;

    const userId = authService.getCurrentUser()?.uid;
    if (!userId) return;

    // Listen to voice commands from other devices
    const voiceRef = ref(realtimeDb, `voice_sessions/${userId}`);
    onValue(voiceRef, (snapshot) => {
      const session = snapshot.val();
      if (session && session.sessionId !== this.currentSession?.sessionId) {
        // Sync session from another device
        this.syncSession(session);
      }
    });
  }

  /**
   * Start voice session
   */
  async startVoiceSession(): Promise<void> {
    if (!this.recognition) {
      throw new Error('Voice recognition not supported');
    }

    const user = authService.getCurrentUser();
    if (!user) {
      throw new Error('Please login to use voice shopping');
    }

    // Create session
    this.currentSession = {
      sessionId: `voice_${Date.now()}`,
      userId: user.uid,
      context: {
        cartItems: 0,
        conversationHistory: []
      },
      isActive: true,
      startTime: new Date()
    };

    // Start listening
    this.isListening = true;
    this.recognition.start();

    // Greet user
    await this.speak(`Hello ${user.displayName || 'there'}! I'm your shopping assistant. How can I help you today?`);
    
    // Save session to realtime DB
    await this.saveSession();
  }

  /**
   * Stop voice session
   */
  async stopVoiceSession(): Promise<void> {
    if (this.recognition && this.isListening) {
      this.isListening = false;
      this.recognition.stop();
      
      if (this.currentSession) {
        this.currentSession.isActive = false;
        await this.saveSession();
      }
      
      await this.speak('Goodbye! Happy shopping!');
    }
  }

  /**
   * Handle voice input
   */
  private async handleVoiceInput(event: any) {
    const last = event.results.length - 1;
    const transcript = event.results[last][0].transcript.trim();
    const isFinal = event.results[last].isFinal;

    if (isFinal && transcript) {
      console.log('Voice input:', transcript);
      
      // Process command
      const command = await this.processCommand(transcript);
      
      // Add to history
      if (this.currentSession) {
        this.currentSession.context.conversationHistory.push(command);
      }
      
      // Execute command
      await this.executeCommand(command);
      
      // Save session
      await this.saveSession();
    }
  }

  /**
   * Process voice command
   */
  private async processCommand(text: string): Promise<VoiceCommand> {
    const command: VoiceCommand = {
      intent: 'unknown',
      entities: {},
      confidence: 0,
      rawText: text
    };

    // Check for search intent
    const searchMatch = text.match(this.commandPatterns.get('search')!);
    if (searchMatch) {
      command.intent = 'search';
      command.entities.product = searchMatch[1];
      command.confidence = 0.9;
      return command;
    }

    // Check for add to cart intent
    const cartMatch = text.match(this.commandPatterns.get('add_to_cart')!);
    if (cartMatch) {
      command.intent = 'add_to_cart';
      command.entities.quantity = parseInt(cartMatch[1]) || 1;
      command.entities.product = cartMatch[2];
      command.confidence = 0.9;
      return command;
    }

    // Check for checkout intent
    if (this.commandPatterns.get('checkout')!.test(text)) {
      command.intent = 'checkout';
      command.confidence = 0.95;
      return command;
    }

    // Check for track order intent
    if (this.commandPatterns.get('track_order')!.test(text)) {
      command.intent = 'track_order';
      command.confidence = 0.9;
      return command;
    }

    // Check for help intent
    if (this.commandPatterns.get('help')!.test(text)) {
      command.intent = 'help';
      command.confidence = 0.95;
      return command;
    }

    // Use NLP for complex queries
    command.intent = 'search';
    command.entities.product = text;
    command.confidence = 0.6;

    return command;
  }

  /**
   * Execute voice command
   */
  private async executeCommand(command: VoiceCommand) {
    switch (command.intent) {
      case 'search':
        await this.handleSearch(command);
        break;
      
      case 'add_to_cart':
        await this.handleAddToCart(command);
        break;
      
      case 'checkout':
        await this.handleCheckout();
        break;
      
      case 'track_order':
        await this.handleTrackOrder();
        break;
      
      case 'help':
        await this.handleHelp();
        break;
      
      default:
        await this.handleUnknown(command);
    }
  }

  /**
   * Handle search command
   */
  private async handleSearch(command: VoiceCommand) {
    const query = command.entities.product || '';
    
    await this.speak(`Searching for ${query}...`);
    
    try {
      // Search products
      const products = await productService.searchProducts(query);
      
      if (products.length === 0) {
        await this.speak(`Sorry, I couldn't find any products matching "${query}". Try different keywords.`);
        return;
      }
      
      // Get recommendations if search is broad
      if (products.length > 10) {
        const recommendations = await recommendationEngine.getRecommendations(
          this.currentSession!.userId,
          5,
          { category: products[0].category }
        );
        
        await this.speak(
          `I found ${products.length} products. Here are the top recommendations: ` +
          `${products.slice(0, 3).map(p => p.title).join(', ')}. ` +
          `Would you like to add any to your cart?`
        );
      } else {
        await this.speak(
          `I found ${products.length} products: ` +
          `${products.slice(0, 5).map(p => `${p.title} for ${p.price} Egyptian pounds`).join(', ')}`
        );
      }
      
      // Update context
      if (this.currentSession) {
        this.currentSession.context.lastProduct = products[0].id;
        this.currentSession.context.lastCategory = products[0].category;
      }
      
      // Navigate to search results
      window.location.href = `/search?q=${encodeURIComponent(query)}`;
      
    } catch (error) {
      await this.speak('Sorry, there was an error searching for products. Please try again.');
    }
  }

  /**
   * Handle add to cart command
   */
  private async handleAddToCart(command: VoiceCommand) {
    const productName = command.entities.product;
    const quantity = command.entities.quantity || 1;
    
    if (!productName) {
      await this.speak('What would you like to add to your cart?');
      return;
    }
    
    try {
      // Search for the product
      const products = await productService.searchProducts(productName);
      
      if (products.length === 0) {
        await this.speak(`Sorry, I couldn't find "${productName}". Try different keywords.`);
        return;
      }
      
      // If multiple matches, use the first or ask for clarification
      const product = products[0];
      
      if (products.length > 1) {
        await this.speak(
          `I found multiple products. Adding ${product.title} to your cart. ` +
          `Is that correct?`
        );
      }
      
      // Add to cart
      await cartService.addToCart(product.id, quantity);
      
      await this.speak(
        `Added ${quantity} ${product.title} to your cart for ${product.price * quantity} Egyptian pounds. ` +
        `Your cart now has ${this.currentSession?.context.cartItems || 0 + quantity} items.`
      );
      
      // Update context
      if (this.currentSession) {
        this.currentSession.context.cartItems += quantity;
        this.currentSession.context.lastProduct = product.id;
      }
      
      toast.success(`Added ${product.title} to cart`);
      
    } catch (error) {
      await this.speak('Sorry, I couldn\'t add that to your cart. Please try again.');
    }
  }

  /**
   * Handle checkout command
   */
  private async handleCheckout() {
    const cart = await cartService.getCart();
    
    if (cart.items.length === 0) {
      await this.speak('Your cart is empty. Would you like to search for products?');
      return;
    }
    
    await this.speak(
      `You have ${cart.items.length} items in your cart totaling ${cart.total} Egyptian pounds. ` +
      `Proceeding to checkout...`
    );
    
    // Navigate to checkout
    window.location.href = '/checkout';
  }

  /**
   * Handle track order command
   */
  private async handleTrackOrder() {
    try {
      const orders = await orderService.getUserOrders();
      
      if (orders.length === 0) {
        await this.speak('You don\'t have any orders yet. Would you like to start shopping?');
        return;
      }
      
      const latestOrder = orders[0];
      await this.speak(
        `Your latest order ${latestOrder.id?.slice(-8)} is ${latestOrder.status}. ` +
        `It contains ${latestOrder.items?.length} items and will be delivered soon.`
      );
      
      // Navigate to orders
      window.location.href = '/orders';
      
    } catch (error) {
      await this.speak('Sorry, I couldn\'t fetch your order information. Please try again.');
    }
  }

  /**
   * Handle help command
   */
  private async handleHelp() {
    await this.speak(
      'I can help you with: ' +
      'Searching for products - say "search for" followed by what you want. ' +
      'Adding to cart - say "add" followed by the product name "to cart". ' +
      'Checking out - say "checkout" or "buy now". ' +
      'Tracking orders - say "track my order". ' +
      'What would you like to do?'
    );
  }

  /**
   * Handle unknown command
   */
  private async handleUnknown(command: VoiceCommand) {
    await this.speak(
      `I didn't understand "${command.rawText}". ` +
      'You can say things like "search for cars", "add product to cart", or "checkout". ' +
      'Say "help" for more commands.'
    );
  }

  /**
   * Text-to-speech
   */
  private async speak(text: string): Promise<void> {
    if (!this.synthesis || typeof window === 'undefined') return;
    
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = this.currentSession?.userId ? 'en-US' : 'ar-EG';
      utterance.onend = () => resolve();
      
      window.speechSynthesis.speak(utterance);
    });
  }

  /**
   * Handle recognition error
   */
  private handleError(event: any) {
    console.error('Voice recognition error:', event.error);
    
    if (event.error === 'no-speech') {
      // Restart recognition
      if (this.isListening) {
        this.recognition.start();
      }
    } else {
      toast.error('Voice recognition error. Please try again.');
    }
  }

  /**
   * Handle recognition end
   */
  private handleEnd() {
    if (this.isListening) {
      // Restart recognition to keep listening
      this.recognition.start();
    }
  }

  /**
   * Save session to realtime DB
   */
  private async saveSession() {
    if (!this.currentSession) return;
    
    try {
      const sessionRef = ref(realtimeDb, `voice_sessions/${this.currentSession.userId}`);
      await push(sessionRef, this.currentSession);
    } catch (error) {
      console.error('Error saving voice session:', error);
    }
  }

  /**
   * Sync session from another device
   */
  private syncSession(session: VoiceSession) {
    this.currentSession = session;
    toast.info('Voice session synced from another device');
  }

  /**
   * Public API
   */
  isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    
    return !!(
      ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) &&
      window.speechSynthesis
    );
  }

  async toggleVoice(): Promise<boolean> {
    if (this.isListening) {
      await this.stopVoiceSession();
      return false;
    } else {
      await this.startVoiceSession();
      return true;
    }
  }

  getSessionContext(): VoiceSession | null {
    return this.currentSession;
  }

  async processText(text: string): Promise<void> {
    const command = await this.processCommand(text);
    await this.executeCommand(command);
  }
}

export const voiceCommerceService = VoiceCommerceService.getInstance();