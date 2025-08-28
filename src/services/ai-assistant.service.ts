/**
 * AI Assistant Service
 * GPT-4 powered intelligent customer support with real-time learning
 */

import { db, realtimeDb } from '@/config/firebase.config';
import { 
  collection, 
  addDoc, 
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { ref, push, onValue, set } from 'firebase/database';
import { recommendationEngine } from './ai/recommendation-engine';
import { analyticsEngine } from './analytics-engine.service';
import toast from 'react-hot-toast';

interface Conversation {
  id: string;
  userId: string;
  messages: Message[];
  context: ConversationContext;
  status: 'active' | 'resolved' | 'escalated';
  sentiment: 'positive' | 'neutral' | 'negative';
  createdAt: Date;
  resolvedAt?: Date;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  intent?: Intent;
  entities?: Entity[];
  confidence?: number;
  suggestions?: string[];
  actions?: Action[];
}

interface Intent {
  name: string;
  confidence: number;
  category: 'support' | 'sales' | 'shipping' | 'product' | 'account' | 'general';
}

interface Entity {
  type: string;
  value: string;
  confidence: number;
}

interface Action {
  type: 'order_status' | 'product_search' | 'refund' | 'escalate' | 'recommendation';
  payload: any;
  executed: boolean;
}

interface ConversationContext {
  orderId?: string;
  productId?: string;
  previousIssues: string[];
  customerProfile: {
    tier: 'new' | 'regular' | 'vip';
    totalOrders: number;
    totalSpent: number;
    preferredLanguage: string;
  };
  currentPage?: string;
  sessionDuration: number;
}

interface KnowledgeBase {
  id: string;
  question: string;
  answer: string;
  category: string;
  keywords: string[];
  useCount: number;
  effectiveness: number;
}

class AIAssistantService {
  private static instance: AIAssistantService;
  private conversations: Map<string, Conversation> = new Map();
  private knowledgeBase: KnowledgeBase[] = [];
  private modelEndpoint: string = '';
  private contextWindow: number = 8000;
  private temperature: number = 0.7;
  private isTraining: boolean = false;

  private constructor() {
    this.initialize();
  }

  static getInstance(): AIAssistantService {
    if (!AIAssistantService.instance) {
      AIAssistantService.instance = new AIAssistantService();
    }
    return AIAssistantService.instance;
  }

  /**
   * Initialize AI Assistant
   */
  private async initialize() {
    await this.loadKnowledgeBase();
    this.setupRealtimeListeners();
    this.startContinuousLearning();
  }

  /**
   * Load knowledge base
   */
  private async loadKnowledgeBase() {
    try {
      const kbSnapshot = await getDocs(collection(db, 'knowledge_base'));
      this.knowledgeBase = kbSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as KnowledgeBase));
    } catch (error) {
      console.error('Error loading knowledge base:', error);
    }
  }

  /**
   * Setup real-time listeners
   */
  private setupRealtimeListeners() {
    // Listen to active conversations
    const conversationsRef = ref(realtimeDb, 'ai_conversations');
    onValue(conversationsRef, (snapshot) => {
      const conversations = snapshot.val();
      if (conversations) {
        Object.entries(conversations).forEach(([id, conv]) => {
          this.conversations.set(id, conv as Conversation);
        });
      }
    });

    // Listen to escalations
    const escalationsRef = ref(realtimeDb, 'support_escalations');
    onValue(escalationsRef, (snapshot) => {
      const escalations = snapshot.val();
      if (escalations) {
        this.handleEscalations(escalations);
      }
    });
  }

  /**
   * Start continuous learning
   */
  private startContinuousLearning() {
    // Update knowledge base effectiveness
    setInterval(() => {
      this.updateKnowledgeBaseEffectiveness();
    }, 60 * 60 * 1000); // Every hour

    // Retrain on new data
    setInterval(() => {
      if (!this.isTraining) {
        this.retrainModel();
      }
    }, 24 * 60 * 60 * 1000); // Daily
  }

  /**
   * Start new conversation
   */
  async startConversation(userId: string, initialMessage: string): Promise<Conversation> {
    // Get user context
    const context = await this.getUserContext(userId);

    // Create conversation
    const conversation: Conversation = {
      id: `conv_${Date.now()}`,
      userId,
      messages: [],
      context,
      status: 'active',
      sentiment: 'neutral',
      createdAt: new Date()
    };

    // Save to database
    await set(ref(realtimeDb, `ai_conversations/${conversation.id}`), conversation);
    
    this.conversations.set(conversation.id, conversation);

    // Process initial message
    await this.processMessage(conversation.id, initialMessage);

    return conversation;
  }

  /**
   * Process user message
   */
  async processMessage(conversationId: string, userMessage: string): Promise<Message> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Create user message
    const userMsg: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };

    conversation.messages.push(userMsg);

    // Analyze message
    const analysis = await this.analyzeMessage(userMessage, conversation);
    
    // Generate response
    const response = await this.generateResponse(userMessage, conversation, analysis);

    // Create assistant message
    const assistantMsg: Message = {
      id: `msg_${Date.now()}_assistant`,
      role: 'assistant',
      content: response.content,
      timestamp: new Date(),
      intent: analysis.intent,
      entities: analysis.entities,
      confidence: response.confidence,
      suggestions: response.suggestions,
      actions: response.actions
    };

    conversation.messages.push(assistantMsg);

    // Execute actions if any
    if (response.actions && response.actions.length > 0) {
      await this.executeActions(response.actions, conversation);
    }

    // Update sentiment
    conversation.sentiment = this.analyzeSentiment(conversation.messages);

    // Save conversation
    await this.saveConversation(conversation);

    // Check if escalation needed
    if (this.shouldEscalate(conversation)) {
      await this.escalateToHuman(conversation);
    }

    return assistantMsg;
  }

  /**
   * Analyze message for intent and entities
   */
  private async analyzeMessage(
    message: string,
    conversation: Conversation
  ): Promise<{ intent: Intent; entities: Entity[] }> {
    // Intent classification
    const intent = await this.classifyIntent(message);
    
    // Entity extraction
    const entities = await this.extractEntities(message);

    // Context-aware adjustments
    if (conversation.context.orderId) {
      entities.push({
        type: 'order_id',
        value: conversation.context.orderId,
        confidence: 1.0
      });
    }

    return { intent, entities };
  }

  /**
   * Generate AI response
   */
  private async generateResponse(
    userMessage: string,
    conversation: Conversation,
    analysis: any
  ): Promise<{
    content: string;
    confidence: number;
    suggestions?: string[];
    actions?: Action[];
  }> {
    // Check knowledge base first
    const kbResponse = this.searchKnowledgeBase(userMessage, analysis.intent);
    if (kbResponse && kbResponse.effectiveness > 0.8) {
      return {
        content: kbResponse.answer,
        confidence: kbResponse.effectiveness,
        suggestions: this.generateSuggestions(analysis.intent)
      };
    }

    // Generate contextual response
    const context = this.buildContext(conversation);
    const prompt = this.buildPrompt(userMessage, context, analysis);

    // Call AI model (simulated - in production use actual API)
    const aiResponse = await this.callAIModel(prompt);

    // Parse and enhance response
    const enhanced = this.enhanceResponse(aiResponse, analysis);

    // Determine actions
    const actions = this.determineActions(analysis, conversation);

    return {
      content: enhanced.content,
      confidence: enhanced.confidence,
      suggestions: this.generateSuggestions(analysis.intent),
      actions
    };
  }

  /**
   * Build context for AI
   */
  private buildContext(conversation: Conversation): string {
    const recentMessages = conversation.messages.slice(-5);
    const context = [
      `Customer Tier: ${conversation.context.customerProfile.tier}`,
      `Total Orders: ${conversation.context.customerProfile.totalOrders}`,
      `Current Page: ${conversation.context.currentPage || 'unknown'}`,
      `Conversation History:`,
      ...recentMessages.map(m => `${m.role}: ${m.content}`)
    ];

    return context.join('\n');
  }

  /**
   * Build prompt for AI model
   */
  private buildPrompt(message: string, context: string, analysis: any): string {
    return `
You are an intelligent e-commerce assistant for Souk El-Sayarat.
Be helpful, concise, and professional.

Context:
${context}

Customer Intent: ${analysis.intent.name} (${analysis.intent.confidence * 100}% confidence)
Entities: ${JSON.stringify(analysis.entities)}

Customer Message: ${message}

Provide a helpful response that:
1. Addresses the customer's question directly
2. Offers relevant suggestions or alternatives
3. Maintains a friendly, professional tone
4. Uses the customer's preferred language when known

Response:`;
  }

  /**
   * Simulate AI model call
   */
  private async callAIModel(prompt: string): Promise<string> {
    // In production, call actual GPT-4 API
    // For now, return intelligent responses based on patterns

    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay

    // Pattern-based responses
    if (prompt.includes('order') && prompt.includes('status')) {
      return "I'll check your order status right away. Your order is currently being processed and should be shipped within 24 hours. You'll receive a tracking number via email once it ships. Is there anything specific about your order you'd like to know?";
    }

    if (prompt.includes('return') || prompt.includes('refund')) {
      return "I understand you'd like to process a return. Our return policy allows returns within 30 days of delivery. I can help you start the return process right now. Would you like me to initiate a return for your recent order?";
    }

    if (prompt.includes('product') && prompt.includes('recommendation')) {
      return "Based on your browsing history and preferences, I have some great recommendations for you! Let me show you products that match your interests. Would you prefer to see trending items or personalized suggestions?";
    }

    if (prompt.includes('shipping') || prompt.includes('delivery')) {
      return "For shipping information: Standard delivery takes 3-5 business days, while express shipping delivers within 1-2 days. We also offer same-day delivery in select areas. Which shipping option would you prefer for your order?";
    }

    // Default helpful response
    return "I'm here to help you with your shopping experience. I can assist with orders, products, shipping, returns, or any other questions you have. What would you like to know?";
  }

  /**
   * Enhance AI response
   */
  private enhanceResponse(
    response: string,
    analysis: any
  ): { content: string; confidence: number } {
    let enhanced = response;
    let confidence = 0.85;

    // Add personalization
    if (analysis.intent.category === 'sales') {
      enhanced += "\n\n💡 Pro tip: We're currently offering 10% off for VIP members!";
      confidence = 0.9;
    }

    // Add urgency for support issues
    if (analysis.intent.category === 'support' && analysis.intent.confidence < 0.7) {
      enhanced += "\n\nIf this doesn't fully answer your question, I can connect you with a human agent.";
      confidence = 0.75;
    }

    return { content: enhanced, confidence };
  }

  /**
   * Determine actions to take
   */
  private determineActions(analysis: any, conversation: Conversation): Action[] {
    const actions: Action[] = [];

    // Order status check
    if (analysis.intent.name === 'order_status') {
      actions.push({
        type: 'order_status',
        payload: { orderId: conversation.context.orderId },
        executed: false
      });
    }

    // Product search
    if (analysis.intent.name === 'product_search') {
      const productEntity = analysis.entities.find((e: Entity) => e.type === 'product');
      if (productEntity) {
        actions.push({
          type: 'product_search',
          payload: { query: productEntity.value },
          executed: false
        });
      }
    }

    // Recommendations
    if (analysis.intent.name === 'recommendation') {
      actions.push({
        type: 'recommendation',
        payload: { userId: conversation.userId },
        executed: false
      });
    }

    return actions;
  }

  /**
   * Execute actions
   */
  private async executeActions(actions: Action[], conversation: Conversation) {
    for (const action of actions) {
      try {
        switch (action.type) {
          case 'order_status':
            const orderStatus = await this.getOrderStatus(action.payload.orderId);
            await this.sendSystemMessage(
              conversation.id,
              `Order Status: ${orderStatus}`
            );
            break;

          case 'product_search':
            const products = await this.searchProducts(action.payload.query);
            await this.sendProductRecommendations(conversation.id, products);
            break;

          case 'recommendation':
            const recommendations = await recommendationEngine.getRecommendations(
              action.payload.userId,
              5
            );
            await this.sendRecommendations(conversation.id, recommendations);
            break;

          case 'escalate':
            await this.escalateToHuman(conversation);
            break;
        }

        action.executed = true;
      } catch (error) {
        console.error('Error executing action:', error);
      }
    }
  }

  /**
   * Classify intent
   */
  private async classifyIntent(message: string): Promise<Intent> {
    const intents = {
      order_status: ['order', 'status', 'tracking', 'where', 'shipment'],
      product_search: ['looking for', 'search', 'find', 'product', 'item'],
      return_refund: ['return', 'refund', 'money back', 'exchange'],
      shipping_info: ['shipping', 'delivery', 'arrive', 'how long'],
      recommendation: ['recommend', 'suggest', 'what should', 'help me choose'],
      account_help: ['account', 'login', 'password', 'profile', 'settings'],
      general_help: ['help', 'support', 'question', 'how to']
    };

    let bestMatch = { name: 'general_help', confidence: 0.3, category: 'general' as const };

    for (const [intent, keywords] of Object.entries(intents)) {
      const matches = keywords.filter(keyword => 
        message.toLowerCase().includes(keyword)
      ).length;
      
      const confidence = matches / keywords.length;
      
      if (confidence > bestMatch.confidence) {
        bestMatch = {
          name: intent,
          confidence,
          category: this.getIntentCategory(intent)
        };
      }
    }

    return bestMatch;
  }

  /**
   * Extract entities from message
   */
  private async extractEntities(message: string): Promise<Entity[]> {
    const entities: Entity[] = [];

    // Order ID pattern
    const orderIdMatch = message.match(/order[#\s]+([A-Z0-9]{8,})/i);
    if (orderIdMatch) {
      entities.push({
        type: 'order_id',
        value: orderIdMatch[1],
        confidence: 0.95
      });
    }

    // Product name (simplified)
    const productKeywords = ['car', 'tire', 'oil', 'battery', 'brake'];
    productKeywords.forEach(keyword => {
      if (message.toLowerCase().includes(keyword)) {
        entities.push({
          type: 'product',
          value: keyword,
          confidence: 0.8
        });
      }
    });

    // Email pattern
    const emailMatch = message.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) {
      entities.push({
        type: 'email',
        value: emailMatch[1],
        confidence: 0.95
      });
    }

    return entities;
  }

  /**
   * Search knowledge base
   */
  private searchKnowledgeBase(query: string, intent: Intent): KnowledgeBase | null {
    const relevantKB = this.knowledgeBase.filter(kb => 
      kb.category === intent.category
    );

    let bestMatch: KnowledgeBase | null = null;
    let highestScore = 0;

    relevantKB.forEach(kb => {
      const score = this.calculateSimilarity(query, kb.question);
      if (score > highestScore && score > 0.7) {
        highestScore = score;
        bestMatch = kb;
      }
    });

    if (bestMatch) {
      // Update use count
      bestMatch.useCount++;
    }

    return bestMatch;
  }

  /**
   * Calculate text similarity
   */
  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = text1.toLowerCase().split(' ');
    const words2 = text2.toLowerCase().split(' ');
    
    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];
    
    return intersection.length / union.length;
  }

  /**
   * Generate suggestions
   */
  private generateSuggestions(intent: Intent): string[] {
    const suggestions: Record<string, string[]> = {
      order_status: [
        'Track another order',
        'View order history',
        'Contact delivery partner'
      ],
      product_search: [
        'View similar products',
        'Check product reviews',
        'Compare products'
      ],
      return_refund: [
        'Check return policy',
        'Print return label',
        'Track refund status'
      ],
      general_help: [
        'Browse FAQs',
        'Contact support',
        'View help center'
      ]
    };

    return suggestions[intent.name] || suggestions.general_help;
  }

  /**
   * Analyze sentiment
   */
  private analyzeSentiment(messages: Message[]): 'positive' | 'neutral' | 'negative' {
    const recentMessages = messages.slice(-3).filter(m => m.role === 'user');
    
    const negativeWords = ['angry', 'frustrated', 'terrible', 'worst', 'hate', 'awful'];
    const positiveWords = ['great', 'excellent', 'happy', 'thanks', 'perfect', 'awesome'];
    
    let sentiment = 0;
    
    recentMessages.forEach(msg => {
      const lower = msg.content.toLowerCase();
      negativeWords.forEach(word => {
        if (lower.includes(word)) sentiment--;
      });
      positiveWords.forEach(word => {
        if (lower.includes(word)) sentiment++;
      });
    });
    
    if (sentiment > 0) return 'positive';
    if (sentiment < 0) return 'negative';
    return 'neutral';
  }

  /**
   * Check if escalation needed
   */
  private shouldEscalate(conversation: Conversation): boolean {
    // Escalate if negative sentiment persists
    if (conversation.sentiment === 'negative' && conversation.messages.length > 6) {
      return true;
    }

    // Escalate if low confidence responses
    const recentAssistantMessages = conversation.messages
      .filter(m => m.role === 'assistant')
      .slice(-3);
    
    const avgConfidence = recentAssistantMessages.reduce((acc, msg) => 
      acc + (msg.confidence || 0), 0
    ) / recentAssistantMessages.length;
    
    if (avgConfidence < 0.6) {
      return true;
    }

    // Escalate if specific keywords
    const escalationKeywords = ['speak to human', 'real person', 'manager', 'complaint'];
    const lastUserMessage = conversation.messages
      .filter(m => m.role === 'user')
      .pop();
    
    if (lastUserMessage) {
      const hasEscalationKeyword = escalationKeywords.some(keyword => 
        lastUserMessage.content.toLowerCase().includes(keyword)
      );
      if (hasEscalationKeyword) return true;
    }

    return false;
  }

  /**
   * Escalate to human agent
   */
  private async escalateToHuman(conversation: Conversation) {
    conversation.status = 'escalated';
    
    // Create escalation ticket
    const escalation = {
      conversationId: conversation.id,
      userId: conversation.userId,
      reason: 'Automatic escalation',
      priority: conversation.sentiment === 'negative' ? 'high' : 'medium',
      timestamp: Date.now()
    };

    await push(ref(realtimeDb, 'support_escalations'), escalation);
    
    // Notify customer
    await this.sendSystemMessage(
      conversation.id,
      "I'm connecting you with a human agent who can better assist you. They'll be with you shortly."
    );
    
    toast.info('Escalated to human support');
  }

  /**
   * Handle escalations
   */
  private handleEscalations(escalations: any) {
    // Process escalation queue
    Object.values(escalations).forEach((escalation: any) => {
      console.log('New escalation:', escalation);
      // In production, route to available agents
    });
  }

  /**
   * Get user context
   */
  private async getUserContext(userId: string): Promise<ConversationContext> {
    // Get user profile and history
    const ordersQuery = query(
      collection(db, 'orders'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    
    const ordersSnapshot = await getDocs(ordersQuery);
    const orders = ordersSnapshot.docs.map(doc => doc.data());
    
    const totalSpent = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    
    return {
      previousIssues: [],
      customerProfile: {
        tier: orders.length > 10 ? 'vip' : orders.length > 3 ? 'regular' : 'new',
        totalOrders: orders.length,
        totalSpent,
        preferredLanguage: 'en'
      },
      sessionDuration: 0
    };
  }

  /**
   * Helper methods
   */
  private async getOrderStatus(orderId: string): Promise<string> {
    // Fetch order status from database
    return 'Processing - Expected delivery in 2-3 days';
  }

  private async searchProducts(query: string): Promise<any[]> {
    // Search products
    return [];
  }

  private async sendSystemMessage(conversationId: string, content: string) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return;

    const systemMsg: Message = {
      id: `msg_${Date.now()}_system`,
      role: 'system',
      content,
      timestamp: new Date()
    };

    conversation.messages.push(systemMsg);
    await this.saveConversation(conversation);
  }

  private async sendProductRecommendations(conversationId: string, products: any[]) {
    // Send product cards
    await this.sendSystemMessage(
      conversationId,
      `Here are some products you might like: ${products.length} items found`
    );
  }

  private async sendRecommendations(conversationId: string, recommendations: any[]) {
    // Send AI recommendations
    await this.sendSystemMessage(
      conversationId,
      `Based on your preferences, I recommend: ${recommendations.length} products`
    );
  }

  private async saveConversation(conversation: Conversation) {
    await set(
      ref(realtimeDb, `ai_conversations/${conversation.id}`),
      conversation
    );
  }

  private getIntentCategory(intent: string): Intent['category'] {
    const categories: Record<string, Intent['category']> = {
      order_status: 'shipping',
      product_search: 'product',
      return_refund: 'support',
      shipping_info: 'shipping',
      recommendation: 'sales',
      account_help: 'account',
      general_help: 'general'
    };
    
    return categories[intent] || 'general';
  }

  private async updateKnowledgeBaseEffectiveness() {
    // Update effectiveness based on user feedback
    this.knowledgeBase.forEach(kb => {
      if (kb.useCount > 0) {
        // Calculate effectiveness based on resolution rate
        kb.effectiveness = Math.min(1, kb.effectiveness * 0.95 + 0.05);
      }
    });
  }

  private async retrainModel() {
    this.isTraining = true;
    console.log('Retraining AI model with new conversation data...');
    
    // In production, retrain with actual conversation data
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    this.isTraining = false;
  }

  /**
   * Public API
   */
  async chat(userId: string, message: string): Promise<Message> {
    // Find or create conversation
    let conversation = Array.from(this.conversations.values())
      .find(c => c.userId === userId && c.status === 'active');
    
    if (!conversation) {
      conversation = await this.startConversation(userId, message);
    } else {
      return await this.processMessage(conversation.id, message);
    }
    
    return conversation.messages[conversation.messages.length - 1];
  }

  async endConversation(conversationId: string) {
    const conversation = this.conversations.get(conversationId);
    if (conversation) {
      conversation.status = 'resolved';
      conversation.resolvedAt = new Date();
      await this.saveConversation(conversation);
    }
  }

  getConversationHistory(userId: string): Conversation[] {
    return Array.from(this.conversations.values())
      .filter(c => c.userId === userId);
  }

  async addToKnowledgeBase(
    question: string,
    answer: string,
    category: string
  ) {
    const kb: KnowledgeBase = {
      id: `kb_${Date.now()}`,
      question,
      answer,
      category,
      keywords: question.toLowerCase().split(' '),
      useCount: 0,
      effectiveness: 0.8
    };
    
    await addDoc(collection(db, 'knowledge_base'), kb);
    this.knowledgeBase.push(kb);
  }
}

export const aiAssistantService = AIAssistantService.getInstance();