// Global type declarations for Ultimate Marketplace

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

// Speech Recognition types
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  grammars: SpeechGrammarList;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  serviceURI: string;
  
  abort(): void;
  start(): void;
  stop(): void;
  
  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionError) => any) | null;
  onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  readonly isFinal: boolean;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly confidence: number;
  readonly transcript: string;
}

interface SpeechRecognitionError extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechGrammarList {
  readonly length: number;
  addFromString(string: string, weight?: number): void;
  addFromURI(src: string, weight?: number): void;
  item(index: number): SpeechGrammar;
  [index: number]: SpeechGrammar;
}

interface SpeechGrammar {
  readonly src: string;
  weight: number;
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

declare var webkitSpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

// Enhanced Car Types
interface CarImage {
  id: string;
  url: string;
  angle: number;
  view: 'exterior' | 'interior' | 'engine' | 'trunk';
  hotspots?: Array<{
    x: number;
    y: number;
    title: string;
    description: string;
    icon?: React.ReactNode;
  }>;
}

interface CarSpecifications {
  engine: string;
  horsepower: number;
  acceleration: string;
  topSpeed: string;
  fuelEconomy: string;
  safety: string[];
  technology: string[];
}

interface CarSeller {
  id: string;
  name: string;
  rating: number;
  verified: boolean;
  responseTime: string;
  location: string;
}

interface EnhancedCar {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  originalPrice?: number;
  mileage: number;
  location: string;
  condition: 'new' | 'used' | 'certified';
  images: CarImage[];
  rating: number;
  views: number;
  features: string[];
  bodyType: string;
  fuelType: string;
  transmission: string;
  drivetrain: string;
  exteriorColor: string;
  interiorColor: string;
  seller: CarSeller;
  specifications: CarSpecifications;
  isPromoted?: boolean;
  isFeatured?: boolean;
  discount?: number;
  createdAt: Date;
  updatedAt: Date;
  matchScore?: number;
  matchReasons?: string[];
}

// Message Types
interface ChatMessage {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'voice' | 'system';
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  duration?: number;
  replyTo?: string;
  edited?: boolean;
  editedAt?: Date;
}

interface ChatParticipant {
  id: string;
  name: string;
  avatar?: string;
  role: 'customer' | 'vendor' | 'admin';
  isOnline: boolean;
  lastSeen?: Date;
  isTyping?: boolean;
}

// Search and Filter Types
interface SearchFilters {
  query: string;
  make: string;
  model: string;
  yearFrom: number | null;
  yearTo: number | null;
  priceFrom: number | null;
  priceTo: number | null;
  mileageMax: number | null;
  location: string;
  condition: 'new' | 'used' | 'certified' | '';
  bodyType: string;
  fuelType: string;
  transmission: string;
  drivetrain: string;
  exteriorColor: string;
  interiorColor: string;
  features: string[];
  sortBy: 'price-asc' | 'price-desc' | 'year-desc' | 'year-asc' | 'mileage-asc' | 'distance' | 'popularity' | 'date-desc';
}

interface UserPreferences {
  budget: { min: number; max: number };
  preferredMakes: string[];
  preferredBodyTypes: string[];
  maxMileage: number;
  preferredLocation: string;
  mustHaveFeatures: string[];
  viewHistory: string[];
  searchHistory: string[];
  wishlist: string[];
}

// Recommendation Types
interface RecommendationSection {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  cars: EnhancedCar[];
  algorithm: 'collaborative' | 'content-based' | 'trending' | 'similar' | 'personalized';
  priority: number;
}

export {};