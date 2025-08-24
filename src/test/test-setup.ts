/**
 * Universal Test Setup for Souk El-Syarat
 * Handles all mocking and test configuration from the root level
 */

import { vi, beforeAll, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import { Product, CarProduct } from '@/types';

// =============================================================================
// FRAMER MOTION MOCKING - COMPREHENSIVE
// =============================================================================
vi.mock('framer-motion', () => {
  const React = require('react');
  
  // Create a proper motion mock that ignores animation props
  const createMotionComponent = (Component: string) => {
    return React.forwardRef(({ children, ...props }: any, ref: any) => {
      // Filter out all motion-specific props
      const {
        animate,
        initial,
        exit,
        transition,
        whileHover,
        whileTap,
        whileFocus,
        whileInView,
        drag,
        dragConstraints,
        onAnimationStart,
        onAnimationComplete,
        ...restProps
      } = props;
      
      return React.createElement(Component, { ...restProps, ref }, children);
    });
  };

  return {
    motion: {
      div: createMotionComponent('div'),
      section: createMotionComponent('section'),
      h1: createMotionComponent('h1'),
      h2: createMotionComponent('h2'),
      h3: createMotionComponent('h3'),
      p: createMotionComponent('p'),
      button: createMotionComponent('button'),
      span: createMotionComponent('span'),
      img: createMotionComponent('img'),
      nav: createMotionComponent('nav'),
      header: createMotionComponent('header'),
      footer: createMotionComponent('footer'),
      main: createMotionComponent('main'),
      article: createMotionComponent('article'),
      aside: createMotionComponent('aside'),
    },
    AnimatePresence: ({ children }: any) => children,
    useAnimation: () => ({
      start: vi.fn(),
      stop: vi.fn(),
      set: vi.fn(),
    }),
    useMotionValue: (initial: any) => ({ get: () => initial, set: vi.fn() }),
  };
});

// =============================================================================
// REACT ROUTER MOCKING - COMPREHENSIVE
// =============================================================================
vi.mock('react-router-dom', () => {
  const React = require('react');
  
  return {
    Link: React.forwardRef(({ children, to, className, ...props }: any, ref: any) => (
      React.createElement('a', { 
        href: to, 
        className, 
        ...props, 
        ref,
        'data-testid': 'router-link' 
      }, children)
    )),
    NavLink: React.forwardRef(({ children, to, className, ...props }: any, ref: any) => (
      React.createElement('a', { 
        href: to, 
        className, 
        ...props, 
        ref,
        'data-testid': 'router-navlink' 
      }, children)
    )),
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/', search: '', hash: '', state: null }),
    useParams: () => ({}),
    BrowserRouter: ({ children }: any) => React.createElement('div', { 'data-testid': 'browser-router' }, children),
    Routes: ({ children }: any) => React.createElement('div', { 'data-testid': 'routes' }, children),
    Route: ({ element }: any) => element,
    Outlet: () => React.createElement('div', { 'data-testid': 'outlet' }),
  };
});

// =============================================================================
// HEROICONS MOCKING - COMPREHENSIVE AUTO-GENERATING
// =============================================================================
const createIconMock = (name: string) => {
  const React = require('react');
  return React.forwardRef(({ className, ...props }: any, ref: any) => (
    React.createElement('svg', {
      'data-testid': `${name.toLowerCase()}-icon`,
      className,
      ref,
      ...props,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
    })
  ));
};

// Generate all possible hero icons automatically
const heroIconNames = [
  'AcademicCap', 'AdjustmentsHorizontal', 'AdjustmentsVertical', 'Archive', 'ArrowDown', 'ArrowLeft', 'ArrowPath', 'ArrowRight', 'ArrowUp',
  'AtSymbol', 'Backspace', 'Bars2', 'Bars3', 'Bars3BottomLeft', 'Bars3BottomRight', 'Bars3CenterLeft', 'Bars4', 'Battery0', 'Battery100',
  'Battery50', 'Beaker', 'Bell', 'BellAlert', 'BellSlash', 'BellSnooze', 'Bolt', 'BoltSlash', 'Book', 'Bookmark', 'BookmarkSlash',
  'BookmarkSquare', 'BookOpen', 'Briefcase', 'BugAnt', 'Building', 'BuildingLibrary', 'BuildingOffice', 'BuildingOffice2',
  'BuildingStorefront', 'Cake', 'Calculator', 'Calendar', 'CalendarDays', 'Camera', 'ChartBar', 'ChartBarSquare', 'ChartPie',
  'ChatBubbleBottom', 'ChatBubbleBottomCenter', 'ChatBubbleBottomCenterText', 'ChatBubbleLeft', 'ChatBubbleLeftEllipsis', 'ChatBubbleLeftRight',
  'ChatBubbleOval', 'ChatBubbleOvalLeft', 'ChatBubbleOvalLeftEllipsis', 'Check', 'CheckBadge', 'CheckCircle', 'ChevronDown', 'ChevronDoubleDown',
  'ChevronDoubleLeft', 'ChevronDoubleRight', 'ChevronDoubleUp', 'ChevronLeft', 'ChevronRight', 'ChevronUp', 'ChevronUpDown', 'Circle',
  'CircleStack', 'Clipboard', 'ClipboardDocument', 'ClipboardDocumentCheck', 'ClipboardDocumentList', 'Clock', 'Cloud', 'CloudArrowDown',
  'CloudArrowUp', 'Cog', 'Cog6Tooth', 'Cog8Tooth', 'CommandLine', 'ComputerDesktop', 'CPU', 'CreditCard', 'Cube', 'CubeTransparent',
  'CurrencyBangladeshi', 'CurrencyDollar', 'CurrencyEuro', 'CurrencyPound', 'CurrencyRupee', 'CurrencyYen', 'CursorArrowRays',
  'CursorArrowRipple', 'DevicePhoneMobile', 'DeviceTablet', 'Document', 'DocumentArrowDown', 'DocumentArrowUp', 'DocumentCheck',
  'DocumentDuplicate', 'DocumentMagnifyingGlass', 'DocumentMinus', 'DocumentPlus', 'DocumentText', 'EllipsisHorizontal',
  'EllipsisHorizontalCircle', 'EllipsisVertical', 'Envelope', 'EnvelopeOpen', 'ExclamationCircle', 'ExclamationTriangle',
  'Eye', 'EyeDropper', 'EyeSlash', 'FaceFrown', 'FaceSmile', 'Film', 'Filter', 'FingerPrint', 'Fire', 'Flag', 'Folder', 'FolderArrowDown',
  'FolderMinus', 'FolderOpen', 'FolderPlus', 'Forward', 'Funnel', 'Gift', 'GiftTop', 'GlobeAlt', 'GlobeAmericas', 'GlobeAsiaAustralia',
  'GlobeEuropeAfrica', 'HandRaised', 'HandThumbDown', 'HandThumbUp', 'Hashtag', 'Heart', 'Home', 'HomeModern', 'Identification',
  'InboxArrowDown', 'InboxStack', 'InformationCircle', 'Key', 'Language', 'Lifebuoy', 'LightBulb', 'Link', 'ListBullet',
  'LockClosed', 'LockOpen', 'MagnifyingGlass', 'MagnifyingGlassCircle', 'MagnifyingGlassMinus', 'MagnifyingGlassPlus', 'Map', 'MapPin',
  'Megaphone', 'Microphone', 'Minus', 'MinusCircle', 'MinusSmall', 'Moon', 'MusicalNote', 'Newspaper', 'NoSymbol', 'PaintBrush',
  'PaperAirplane', 'PaperClip', 'Pause', 'PauseCircle', 'Pencil', 'PencilSquare', 'Phone', 'PhoneArrowDownLeft', 'PhoneArrowUpRight',
  'Photo', 'Play', 'PlayCircle', 'PlayPause', 'Plus', 'PlusCircle', 'PlusSmall', 'Power', 'PresentationChartBar', 'PresentationChartLine',
  'Printer', 'PuzzlePiece', 'QrCode', 'QuestionMarkCircle', 'QueueList', 'Radio', 'Receipt', 'RectangleGroup', 'RectangleStack',
  'ArrowPathRoundedSquare', 'ArrowTopRightOnSquare', 'ArrowTrendingDown', 'ArrowTrendingUp', 'ArrowUpCircle', 'ArrowUpLeft',
  'ArrowUpOnSquare', 'ArrowUpOnSquareStack', 'ArrowUpRight', 'ArrowUpTray', 'ArrowUturnDown', 'ArrowUturnLeft', 'ArrowUturnRight',
  'ArrowUturnUp', 'Banknotes', 'BeakerIcon', 'BoltIcon', 'BookOpenIcon', 'BriefcaseIcon', 'BuildingOfficeIcon', 'CalendarIcon',
  'CameraIcon', 'ChartBarIcon', 'ChatBubbleLeftIcon', 'CheckIcon', 'ClockIcon', 'CloudIcon', 'CogIcon', 'CreditCardIcon',
  'DocumentIcon', 'EnvelopeIcon', 'EyeIcon', 'HeartIcon', 'HomeIcon', 'KeyIcon', 'MapPinIcon', 'PhoneIcon', 'ShoppingBagIcon',
  'ShoppingCartIcon', 'StarIcon', 'UserIcon', 'UsersIcon', 'ShieldCheck', 'ShieldExclamation', 'ShoppingBag', 'ShoppingCart',
  'Signal', 'SignalSlash', 'Sparkles', 'SpeakerWave', 'SpeakerXMark', 'Square2Stack', 'Square3Stack3D', 'SquaresPlusIcon',
  'Star', 'Stop', 'StopCircle', 'Sun', 'Swatch', 'TableCells', 'Tag', 'Ticket', 'Trash', 'Trophy', 'Truck', 'TV',
  'User', 'UserCircle', 'UserGroup', 'UserMinus', 'UserPlus', 'Users', 'Variable', 'VideoCamera', 'VideoCameraSlash',
  'ViewColumns', 'ViewfinderCircle', 'Wallet', 'Wifi', 'Window', 'Wrench', 'WrenchScrewdriver', 'XCircle', 'XMark'
];

const createHeroIconsModule = () => {
  const iconModule: Record<string, any> = {};
  
  // Generate all icons with 'Icon' suffix
  heroIconNames.forEach(iconName => {
    iconModule[`${iconName}Icon`] = createIconMock(iconName);
  });
  
  // Also add icons without suffix for compatibility
  heroIconNames.forEach(iconName => {
    iconModule[iconName] = createIconMock(iconName);
  });
  
  return iconModule;
};

vi.mock('@heroicons/react/24/outline', () => createHeroIconsModule());
vi.mock('@heroicons/react/24/solid', () => createHeroIconsModule());

// =============================================================================
// FIREBASE MOCKING - COMPREHENSIVE
// =============================================================================
vi.mock('@/config/firebase.config', () => ({
  db: {
    app: { name: 'test-app' },
  },
  auth: {
    currentUser: null,
  },
  realtimeDb: {
    app: { name: 'test-realtime-app' },
  },
  storage: {
    app: { name: 'test-storage-app' },
  },
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => ({ id: 'test-collection' })),
  doc: vi.fn(() => ({ id: 'test-doc' })),
  addDoc: vi.fn(() => Promise.resolve({ id: 'test-doc-id' })),
  getDocs: vi.fn(() => Promise.resolve({ 
    docs: [],
    size: 0,
    empty: true 
  })),
  getDoc: vi.fn(() => Promise.resolve({ 
    exists: () => false,
    data: () => ({}) 
  })),
  updateDoc: vi.fn(() => Promise.resolve()),
  deleteDoc: vi.fn(() => Promise.resolve()),
  query: vi.fn(() => ({ id: 'test-query' })),
  where: vi.fn(() => ({ id: 'test-where' })),
  orderBy: vi.fn(() => ({ id: 'test-orderby' })),
  limit: vi.fn(() => ({ id: 'test-limit' })),
  onSnapshot: vi.fn((query, callback) => {
    callback({ docs: [], size: 0 });
    return vi.fn(); // unsubscribe function
  }),
  writeBatch: vi.fn(() => ({
    update: vi.fn(),
    commit: vi.fn(() => Promise.resolve()),
  })),
  serverTimestamp: vi.fn(() => ({ isEqual: () => false })),
  Timestamp: {
    now: vi.fn(() => ({ toDate: () => new Date() })),
    fromDate: vi.fn((date) => ({ toDate: () => date })),
  },
}));

vi.mock('firebase/database', () => ({
  ref: vi.fn(() => ({ id: 'test-ref' })),
  set: vi.fn(() => Promise.resolve()),
  push: vi.fn(() => Promise.resolve({ key: 'test-key' })),
  onValue: vi.fn((ref, callback) => {
    callback({ val: () => null });
    return vi.fn(); // unsubscribe function
  }),
  update: vi.fn(() => Promise.resolve()),
  remove: vi.fn(() => Promise.resolve()),
}));

// =============================================================================
// STORES MOCKING - COMPREHENSIVE  
// =============================================================================
vi.mock('@/stores/appStore', () => ({
  useAppStore: () => ({
    language: 'en',
    setLanguage: vi.fn(),
    theme: 'light',
    setTheme: vi.fn(),
    favorites: [],
    addToFavorites: vi.fn(),
    removeFromFavorites: vi.fn(),
    isFavorite: vi.fn(() => false),
    cart: [],
    addToCart: vi.fn(),
    removeFromCart: vi.fn(),
    clearCart: vi.fn(),
  }),
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({
    user: {
      uid: 'test-user-id',
      email: 'test@example.com',
      displayName: 'Test User',
      role: 'customer',
    },
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
    signup: vi.fn(),
  }),
}));

// =============================================================================
// SERVICES MOCKING - COMPREHENSIVE
// =============================================================================
vi.mock('@/services/product.service', () => ({
  ProductService: {
    getFeaturedProducts: vi.fn(() => Promise.resolve([])),
    getPopularProducts: vi.fn(() => Promise.resolve([])),
    getAllProducts: vi.fn(() => Promise.resolve([])),
    getProductById: vi.fn(() => Promise.resolve(null)),
    createProduct: vi.fn(() => Promise.resolve('test-id')),
    updateProduct: vi.fn(() => Promise.resolve()),
    deleteProduct: vi.fn(() => Promise.resolve()),
  },
}));

vi.mock('@/services/sample-vendors.service', () => ({
  SampleVendorsService: {
    getTopVendors: vi.fn(() => Promise.resolve([])),
    getAllVendors: vi.fn(() => Promise.resolve([])),
  },
}));

// =============================================================================
// UI COMPONENT MOCKING
// =============================================================================
vi.mock('@/components/ui/LoadingSpinner', () => ({
  default: () => React.createElement('div', { 'data-testid': 'loading-spinner' }, 'Loading...'),
}));

vi.mock('@/components/ui/EgyptianLoader', () => ({
  default: () => React.createElement('div', { 'data-testid': 'egyptian-loader' }, 'Loading...'),
}));

// =============================================================================
// REACT HOT TOAST MOCKING
// =============================================================================
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
}));

// =============================================================================
// REACT HOOK FORM MOCKING
// =============================================================================
vi.mock('react-hook-form', () => ({
  useForm: () => ({
    register: vi.fn(() => ({})),
    handleSubmit: vi.fn(fn => fn),
    formState: { errors: {}, isValid: true },
    reset: vi.fn(),
    watch: vi.fn(),
    setValue: vi.fn(),
    getValues: vi.fn(() => ({})),
  }),
  Controller: ({ render }: any) => render({
    field: { onChange: vi.fn(), value: '', name: 'test' },
    fieldState: { error: null },
  }),
}));

// =============================================================================
// YUP RESOLVER MOCKING
// =============================================================================
vi.mock('@hookform/resolvers/yup', () => ({
  yupResolver: vi.fn(() => vi.fn()),
}));

// =============================================================================
// REACT DROPZONE MOCKING
// =============================================================================
vi.mock('react-dropzone', () => ({
  useDropzone: vi.fn(() => ({
    getRootProps: vi.fn(() => ({})),
    getInputProps: vi.fn(() => ({})),
    isDragActive: false,
    acceptedFiles: [],
  })),
}));

// =============================================================================
// GLOBAL SETUP
// =============================================================================
beforeAll(() => {
  // Mock window properties
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock IntersectionObserver
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    observe() { return null; }
    disconnect() { return null; }
    unobserve() { return null; }
  };

  // Mock console methods to reduce noise in tests
  global.console = {
    ...console,
    // Suppress console.log in tests unless explicitly needed
    log: process.env.NODE_ENV === 'test' ? vi.fn() : console.log,
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
});

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
});

// =============================================================================
// MOCK UTILITIES
// =============================================================================

/**
 * Creates a mock product for testing purposes
 */
export const createMockProduct = (overrides: Partial<Product> = {}): Product => {
  const baseProduct: Product = {
    id: 'test-product-id',
    vendorId: 'test-vendor-id',
    title: 'Test Product',
    description: 'This is a test product description',
    category: 'cars',
    subcategory: 'sedan',
    images: [
      {
        id: 'image-1',
        url: 'https://example.com/test-image.jpg',
        alt: 'Test Product Image',
        isPrimary: true,
        order: 1,
      },
    ],
    price: 25000,
    originalPrice: 30000,
    currency: 'EGP',
    inStock: true,
    quantity: 1,
    specifications: [
      {
        name: 'Year',
        value: '2020',
        category: 'basic',
      },
      {
        name: 'Mileage',
        value: '50000',
        category: 'basic',
      },
    ],
    features: ['Feature 1', 'Feature 2'],
    tags: ['test', 'car'],
    condition: 'used',
    status: 'published',
    views: 100,
    favorites: 5,
    rating: 4.5,
    reviewCount: 10,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    publishedAt: new Date('2023-01-01'),
  };

  return { ...baseProduct, ...overrides };
};

/**
 * Creates a mock car product for testing purposes
 */
export const createMockCarProduct = (overrides: Partial<CarProduct> = {}): CarProduct => {
  const baseCarProduct: CarProduct = {
    ...createMockProduct(),
    carDetails: {
      make: 'Toyota',
      model: 'Camry',
      year: 2020,
      mileage: 50000,
      fuelType: 'gasoline',
      transmission: 'automatic',
      bodyType: 'sedan',
      color: 'White',
      engineSize: 2.5,
      doors: 4,
      seats: 5,
      drivetrain: 'fwd',
      accidentHistory: false,
    },
  };

  return { ...baseCarProduct, ...overrides };
};

export const testConfig = {
  timeout: 10000,
  retries: 2,
};
