/**
 * Universal Test Setup for Souk El-Syarat
 * Handles all mocking and test configuration from the root level
 */

import React from 'react';
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
    const MotionComponent = React.forwardRef(({ children, ...props }: any, ref: any) => {
      // Filter out all motion-specific props by creating a new object without them
      const {
        animate: _animate,
        initial: _initial,
        exit: _exit,
        transition: _transition,
        whileHover: _whileHover,
        whileTap: _whileTap,
        whileFocus: _whileFocus,
        whileInView: _whileInView,
        drag: _drag,
        dragConstraints: _dragConstraints,
        onAnimationStart: _onAnimationStart,
        onAnimationComplete: _onAnimationComplete,
        ...restProps
      } = props;

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      void _animate, _initial, _exit, _transition, _whileHover, _whileTap, _whileFocus, _whileInView, _drag, _dragConstraints, _onAnimationStart, _onAnimationComplete;

      return React.createElement(Component, { ...restProps, ref }, children);
    });

    MotionComponent.displayName = `Motion${Component}`;
    return MotionComponent;
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
  
  const Link = React.forwardRef(({ children, to, className, ...props }: any, ref: any) => (
    React.createElement('a', {
      href: to,
      className,
      ...props,
      ref,
      'data-testid': 'router-link'
    }, children)
  ));
  Link.displayName = 'RouterLink';

  const NavLink = React.forwardRef(({ children, to, className, ...props }: any, ref: any) => (
    React.createElement('a', {
      href: to,
      className,
      ...props,
      ref,
      'data-testid': 'router-navlink'
    }, children)
  ));
  NavLink.displayName = 'RouterNavLink';

  return {
    Link,
    NavLink,
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
  const IconComponent = React.forwardRef(({ className, ...props }: any, ref: any) => (
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

  IconComponent.displayName = `${name}Icon`;
  return IconComponent;
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
vi.mock('@/config/firebase.config', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual && typeof actual === 'object' ? actual : {}),
    db: {
      app: { name: 'test-app' },
    },
    auth: {
      currentUser: null,
    },
    realtimeDb: {
      app: { name: 'test-realtime-app' },
      type: 'database',
    },
    storage: {
      app: { name: 'test-storage-app' },
    },
  };
});

// Create a simple in-memory store for Firebase mocking
const firestoreStore: Record<string, Record<string, any>> = {};

vi.mock('firebase/firestore', () => {
  const mockCollection = vi.fn((db: any, collectionName: string) => ({
    id: collectionName,
    path: collectionName,
  }));

  const mockDoc = vi.fn((collectionRef: any, docId: string) => ({
    id: docId,
    path: `${collectionRef.path}/${docId}`,
  }));

  const mockSetDoc = vi.fn(async (docRef: any, data: any) => {
    const [collectionName, docId] = docRef.path.split('/');
    if (!firestoreStore[collectionName]) {
      firestoreStore[collectionName] = {};
    }
    firestoreStore[collectionName][docId] = { ...data, id: docId };
    return Promise.resolve();
  });

  const mockGetDoc = vi.fn(async (docRef: any) => {
    const [collectionName, docId] = docRef.path.split('/');
    const collection = firestoreStore[collectionName] || {};
    const data = collection[docId];

    if (data) {
      return Promise.resolve({
        exists: () => true,
        data: () => data,
        id: docId,
      });
    }

    return Promise.resolve({
      exists: () => false,
      data: () => ({}),
      id: docId,
    });
  });

  const mockGetDocs = vi.fn(async (query: any) => {
    // For simplicity, return all documents in the collection
    const collectionName = query.collection?.path || 'test-collection';
    const collection = firestoreStore[collectionName] || {};
    const docs = Object.values(collection).map(data => ({
      data: () => data,
      id: data.id,
      exists: () => true,
    }));

    return Promise.resolve({
      docs,
      size: docs.length,
      empty: docs.length === 0,
      forEach: (callback: (value: any, index: number, array: any[]) => void) => docs.forEach(callback),
    });
  });

  return {
    getFirestore: vi.fn(() => ({
      app: { name: 'test-firestore-app' },
      type: 'firestore',
    })),
    connectFirestoreEmulator: vi.fn(),
    collection: mockCollection,
    doc: mockDoc,
    setDoc: mockSetDoc,
    addDoc: vi.fn(() => Promise.resolve({ id: 'test-doc-id' })),
    getDocs: mockGetDocs,
    getDoc: mockGetDoc,
    updateDoc: vi.fn(async (docRef: any, data: any) => {
      const [collectionName, docId] = docRef.path.split('/');
      if (firestoreStore[collectionName] && firestoreStore[collectionName][docId]) {
        firestoreStore[collectionName][docId] = {
          ...firestoreStore[collectionName][docId],
          ...data,
        };
      }
      return Promise.resolve();
    }),
    deleteDoc: vi.fn(async (docRef: any) => {
      const [collectionName, docId] = docRef.path.split('/');
      if (firestoreStore[collectionName]) {
        delete firestoreStore[collectionName][docId];
      }
      return Promise.resolve();
    }),
    query: vi.fn((collectionRef: any) => ({
      collection: collectionRef,
      id: 'test-query'
    })),
    where: vi.fn((field: string, op: string, value: any) => ({
      field,
      operator: op,
      value,
    })),
    orderBy: vi.fn((field: string) => ({
      field,
      direction: 'asc',
    })),
    limit: vi.fn((count: number) => ({
      count,
    })),
    onSnapshot: vi.fn((query: any, callback: Function) => {
      // For simplicity, call callback immediately with empty results
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
      fromDate: vi.fn((date: Date) => ({ toDate: () => date })),
    },
  };
});

vi.mock('firebase/database', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual && typeof actual === 'object' ? actual : {}),
    getDatabase: vi.fn(() => ({
      app: { name: 'test-database-app' },
      type: 'database',
    })),
    ref: vi.fn(() => ({ id: 'test-ref' })),
    set: vi.fn(() => Promise.resolve()),
    push: vi.fn(() => Promise.resolve({ key: 'test-key' })),
    onValue: vi.fn((ref, callback) => {
      callback({ val: () => null });
      return vi.fn(); // unsubscribe function
    }),
    update: vi.fn(() => Promise.resolve()),
    remove: vi.fn(() => Promise.resolve()),
    get: vi.fn(() => Promise.resolve({ val: () => ({}) })),
    child: vi.fn(() => ({ key: 'test-child' })),
    off: vi.fn(),
    onDisconnect: vi.fn(() => ({
      set: vi.fn(() => Promise.resolve()),
      remove: vi.fn(() => Promise.resolve()),
    })),
  };
});

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({
    app: { name: 'test-auth-app' },
    currentUser: null,
  })),
  connectAuthEmulator: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(() => Promise.resolve({
    user: { uid: 'test-uid', email: 'test@example.com' }
  })),
  signInWithEmailAndPassword: vi.fn(() => Promise.resolve({
    user: { uid: 'test-uid', email: 'test@example.com' }
  })),
  signOut: vi.fn(() => Promise.resolve()),
  onAuthStateChanged: vi.fn((callback) => {
    callback(null);
    return vi.fn(); // unsubscribe function
  }),
}));

vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(() => ({
    app: { name: 'test-storage-app' },
    bucket: 'test-bucket',
  })),
  connectStorageEmulator: vi.fn(),
  ref: vi.fn(() => ({ bucket: 'test-bucket', fullPath: 'test-path' })),
  uploadBytes: vi.fn(() => Promise.resolve({
    metadata: { name: 'test-file.jpg' }
  })),
  getDownloadURL: vi.fn(() => Promise.resolve('https://test-storage-url.com/test-file.jpg')),
  deleteObject: vi.fn(() => Promise.resolve()),
}));

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({
    name: 'test-app',
    options: { projectId: 'test-project' }
  })),
  getApp: vi.fn(() => ({
    name: 'test-app',
    options: { projectId: 'test-project' }
  })),
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

vi.mock('@/services/secure-social-auth.service', () => ({
  secureAuthService: {
    loginWithEmail: vi.fn(() => Promise.resolve({ user: { uid: 'test-uid', email: 'test@example.com' } })),
    registerWithEmail: vi.fn(() => Promise.resolve({ user: { uid: 'test-uid', email: 'test@example.com' } })),
    validateSession: vi.fn(() => true),
    validateSecurityConfiguration: vi.fn(() => Promise.resolve(true)),
  },
}));

vi.mock('@/services/debugging-team.service', () => ({
  debuggingTeam: {
    performStaticAnalysis: vi.fn(() => Promise.resolve({
      totalFiles: 10,
      issues: [],
      securityIssues: []
    })),
    scanSecurityVulnerabilities: vi.fn(() => Promise.resolve([])),
    checkPerformanceBottlenecks: vi.fn(() => Promise.resolve([])),
    runCrossBrowserTests: vi.fn(() => Promise.resolve({ chrome: 'pass' })),
    testResponsiveDesign: vi.fn(() => Promise.resolve({ mobile: 'pass' })),
    testAuthenticationEndpoints: vi.fn(() => Promise.resolve({ login: 'pass' })),
    testDatabaseConnections: vi.fn(() => Promise.resolve({ firestore: 'pass' })),
    generateReport: vi.fn(() => Promise.resolve({ summary: 'All tests passed' })),
    verifyAllServices: vi.fn(() => Promise.resolve(true)),
  },
  ProfessionalDebuggingTeam: {
    getInstance: vi.fn(() => ({
      performStaticAnalysis: vi.fn(() => Promise.resolve({
        totalFiles: 10,
        issues: [],
        securityIssues: []
      })),
      scanSecurityVulnerabilities: vi.fn(() => Promise.resolve([])),
      checkPerformanceBottlenecks: vi.fn(() => Promise.resolve([])),
      runCrossBrowserTests: vi.fn(() => Promise.resolve({ chrome: 'pass' })),
      testResponsiveDesign: vi.fn(() => Promise.resolve({ mobile: 'pass' })),
      testAuthenticationEndpoints: vi.fn(() => Promise.resolve({ login: 'pass' })),
      testDatabaseConnections: vi.fn(() => Promise.resolve({ firestore: 'pass' })),
      generateReport: vi.fn(() => Promise.resolve({ summary: 'All tests passed' })),
      verifyAllServices: vi.fn(() => Promise.resolve(true)),
    }))
  },
}));

vi.mock('@/services/monitoring.service', () => ({
  monitoringDashboard: {
    getDashboardData: vi.fn(() => Promise.resolve({
      performance: { avgLoadTime: 1200 },
      errors: [],
      userEvents: []
    })),
    isMonitoringActive: vi.fn(() => Promise.resolve(true)),
    trackUserEvent: vi.fn(() => Promise.resolve()),
    logErrorEvent: vi.fn(() => Promise.resolve()),
    recordBusinessMetric: vi.fn(() => Promise.resolve()),
  },
}));

vi.mock('@/services/comprehensive-monitoring.service', () => ({
  monitoringService: {
    getDashboardData: vi.fn((_period) => Promise.resolve({
      performance: {
        responseTime: 150 + Math.random() * 100,
        throughput: 1000 + Math.random() * 500,
        errorRate: Math.random() * 0.05
      },
      errors: {
        total: Math.floor(Math.random() * 10),
        critical: Math.floor(Math.random() * 3),
        resolved: Math.floor(Math.random() * 8)
      },
      userEvents: {
        pageViews: 5000 + Math.random() * 2000,
        userSessions: 800 + Math.random() * 400,
        conversions: 50 + Math.random() * 30
      },
      timestamp: new Date()
    })),
    isMonitoringActive: vi.fn(() => Promise.resolve(true)),
    trackUserEvent: vi.fn(() => Promise.resolve()),
    logErrorEvent: vi.fn(() => Promise.resolve()),
    recordBusinessMetric: vi.fn(() => Promise.resolve()),
    recordPerformanceMetrics: vi.fn(() => Promise.resolve()),
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
    root: Element | null = null;
    rootMargin: string = '';
    thresholds: ReadonlyArray<number> = [];

    constructor(_callback: (entries: IntersectionObserverEntry[], observer: IntersectionObserver) => void, _options?: { root?: Element | null; rootMargin?: string; threshold?: number | number[] }) {
      // Mock implementation - do nothing
    }

    observe(_target: Element) {
      // Mock implementation
    }

    disconnect() {
      // Mock implementation
    }

    unobserve(_target: Element) {
      // Mock implementation
    }

    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
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
        alt: 'Test Product',
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
