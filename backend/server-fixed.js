/**
 * 🚀 FIREBASE APP HOSTING BACKEND - FIXED VERSION
 * Professional backend for Souk El-Sayarat with Firebase integration
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;

// Enhanced CORS configuration
app.use(cors({
  origin: [
    'https://souk-el-syarat.web.app',
    'https://souk-el-syarat.firebaseapp.com',
    'https://souk-el-sayarat-backend--souk-el-syarat.europe-west4.hosted.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'souk-el-syarat-backend',
    timestamp: new Date().toISOString(),
    version: '3.0.0-fixed',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'production',
    port: PORT
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Souk El-Sayarat Backend API',
    version: '3.0.0-fixed',
    status: 'operational',
    endpoints: [
      'GET /api/health',
      'GET /api/products',
      'GET /api/vendors',
      'GET /api/search',
      'GET /api/auth/profile',
      'GET /api/notifications'
    ]
  });
});

// Products endpoint with enhanced data
app.get('/api/products', (req, res) => {
  const mockProducts = [
    {
      id: '1',
      title: 'BMW X5 2024',
      price: 1450000,
      category: 'cars',
      status: 'active',
      description: 'Luxury SUV with premium features and advanced technology',
      brand: 'BMW',
      model: 'X5',
      year: 2024,
      mileage: 0,
      fuelType: 'Petrol',
      transmission: 'Automatic',
      color: 'Black',
      location: {
        governorate: 'Cairo',
        city: 'New Cairo'
      },
      images: [
        'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&h=600&fit=crop'
      ],
      features: ['Leather Seats', 'Sunroof', 'Navigation System', 'Bluetooth'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '2',
      title: 'Mercedes E-Class 2024',
      price: 1850000,
      category: 'cars',
      status: 'active',
      description: 'Executive sedan with advanced technology and luxury features',
      brand: 'Mercedes-Benz',
      model: 'E-Class',
      year: 2024,
      mileage: 0,
      fuelType: 'Petrol',
      transmission: 'Automatic',
      color: 'Silver',
      location: {
        governorate: 'Giza',
        city: '6th October'
      },
      images: [
        'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&h=600&fit=crop'
      ],
      features: ['Premium Sound System', 'Heated Seats', 'Parking Assist', 'LED Headlights'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '3',
      title: 'Toyota Camry 2024',
      price: 485000,
      category: 'cars',
      status: 'active',
      description: 'Reliable family sedan with excellent fuel efficiency',
      brand: 'Toyota',
      model: 'Camry',
      year: 2024,
      mileage: 0,
      fuelType: 'Hybrid',
      transmission: 'CVT',
      color: 'White',
      location: {
        governorate: 'Alexandria',
        city: 'Alexandria'
      },
      images: [
        'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&h=600&fit=crop'
      ],
      features: ['Hybrid Engine', 'Safety Sense', 'Apple CarPlay', 'Backup Camera'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '4',
      title: 'Audi A4 2024',
      price: 1250000,
      category: 'cars',
      status: 'active',
      description: 'Premium compact sedan with quattro all-wheel drive',
      brand: 'Audi',
      model: 'A4',
      year: 2024,
      mileage: 0,
      fuelType: 'Petrol',
      transmission: 'Automatic',
      color: 'Blue',
      location: {
        governorate: 'Cairo',
        city: 'Maadi'
      },
      images: [
        'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&h=600&fit=crop'
      ],
      features: ['Quattro AWD', 'Virtual Cockpit', 'Bang & Olufsen Audio', 'Adaptive Cruise Control'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '5',
      title: 'Honda Civic 2024',
      price: 425000,
      category: 'cars',
      status: 'active',
      description: 'Sporty compact car with excellent performance and reliability',
      brand: 'Honda',
      model: 'Civic',
      year: 2024,
      mileage: 0,
      fuelType: 'Petrol',
      transmission: 'Manual',
      color: 'Red',
      location: {
        governorate: 'Cairo',
        city: 'Heliopolis'
      },
      images: [
        'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop'
      ],
      features: ['Sport Mode', 'Honda Sensing', '7-inch Display', 'Lane Keep Assist'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  res.json({
    success: true,
    products: mockProducts,
    total: mockProducts.length,
    page: 1,
    limit: 20,
    timestamp: new Date().toISOString()
  });
});

// Vendors endpoint with enhanced data
app.get('/api/vendors', (req, res) => {
  const mockVendors = [
    {
      id: '1',
      name: 'معرض النخبة للسيارات الفاخرة',
      nameEn: 'Elite Luxury Cars Showroom',
      status: 'active',
      rating: 4.8,
      productsCount: 25,
      location: {
        governorate: 'Cairo',
        city: 'New Cairo',
        address: 'New Cairo, Cairo, Egypt'
      },
      contact: {
        phone: '+20 123 456 7890',
        email: 'info@eliteluxurycars.com',
        website: 'https://eliteluxurycars.com'
      },
      specialties: ['Luxury Cars', 'Sports Cars', 'Classic Cars'],
      verified: true,
      joinedDate: '2023-01-15',
      description: 'Premier destination for luxury and exotic vehicles'
    },
    {
      id: '2',
      name: 'تويوتا الشرق الأوسط',
      nameEn: 'Toyota Middle East',
      status: 'active',
      rating: 4.6,
      productsCount: 18,
      location: {
        governorate: 'Giza',
        city: '6th October',
        address: '6th October City, Giza, Egypt'
      },
      contact: {
        phone: '+20 987 654 3210',
        email: 'sales@toyotame.com',
        website: 'https://toyotame.com'
      },
      specialties: ['Toyota Vehicles', 'Hybrid Cars', 'Commercial Vehicles'],
      verified: true,
      joinedDate: '2022-08-20',
      description: 'Authorized Toyota dealer with comprehensive service'
    },
    {
      id: '3',
      name: 'مرسيدس بنز مصر',
      nameEn: 'Mercedes-Benz Egypt',
      status: 'active',
      rating: 4.9,
      productsCount: 32,
      location: {
        governorate: 'Cairo',
        city: 'Maadi',
        address: 'Maadi, Cairo, Egypt'
      },
      contact: {
        phone: '+20 111 222 3333',
        email: 'info@mercedes-egypt.com',
        website: 'https://mercedes-egypt.com'
      },
      specialties: ['Mercedes-Benz', 'AMG Performance', 'Commercial Vehicles'],
      verified: true,
      joinedDate: '2022-03-10',
      description: 'Official Mercedes-Benz dealer with premium service'
    }
  ];

  res.json({
    success: true,
    vendors: mockVendors,
    total: mockVendors.length,
    timestamp: new Date().toISOString()
  });
});

// Enhanced search endpoint
app.get('/api/search', (req, res) => {
  const { q, category, minPrice, maxPrice, location } = req.query;
  
  if (!q) {
    return res.status(400).json({ 
      success: false,
      error: 'Search query is required',
      message: 'Please provide a search term'
    });
  }

  // Mock search results
  const searchResults = [
    {
      id: 'search-1',
      title: `Search result for "${q}"`,
      type: 'product',
      relevance: 0.95
    }
  ];

  res.json({
    success: true,
    query: q,
    filters: {
      category: category || null,
      minPrice: minPrice || null,
      maxPrice: maxPrice || null,
      location: location || null
    },
    results: searchResults,
    total: searchResults.length,
    timestamp: new Date().toISOString()
  });
});

// User profile endpoint (mock)
app.get('/api/auth/profile', (req, res) => {
  res.json({
    success: true,
    user: {
      uid: 'mock-user-id',
      email: 'user@example.com',
      role: 'customer',
      name: 'Test User',
      phone: '+20 123 456 7890',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      preferences: {
        language: 'ar',
        currency: 'EGP',
        notifications: {
          email: true,
          sms: false,
          push: true
        }
      },
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    },
    timestamp: new Date().toISOString()
  });
});

// Notifications endpoint (mock)
app.get('/api/notifications', (req, res) => {
  const mockNotifications = [
    {
      id: '1',
      title: 'مرحباً بك في سوق السيارات',
      titleEn: 'Welcome to Souk El-Sayarat',
      message: 'شكراً لانضمامك إلينا! استكشف أحدث السيارات المتاحة.',
      messageEn: 'Thank you for joining us! Explore the latest available cars.',
      type: 'welcome',
      read: false,
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      title: 'عرض خاص على BMW X5',
      titleEn: 'Special Offer on BMW X5',
      message: 'احصل على خصم 10% على BMW X5 2024 لفترة محدودة!',
      messageEn: 'Get 10% discount on BMW X5 2024 for a limited time!',
      type: 'offer',
      read: false,
      createdAt: new Date().toISOString()
    }
  ];

  res.json({
    success: true,
    notifications: mockNotifications,
    total: mockNotifications.length,
    unreadCount: mockNotifications.filter(n => !n.read).length,
    timestamp: new Date().toISOString()
  });
});

// Mark notification as read (mock)
app.put('/api/notifications/:id/read', (req, res) => {
  const { id } = req.params;
  
  res.json({ 
    success: true, 
    message: 'Notification marked as read',
    notificationId: id,
    timestamp: new Date().toISOString()
  });
});

// Categories endpoint
app.get('/api/categories', (req, res) => {
  const categories = [
    { id: 'cars', name: 'سيارات', nameEn: 'Cars', count: 150 },
    { id: 'motorcycles', name: 'دراجات نارية', nameEn: 'Motorcycles', count: 45 },
    { id: 'trucks', name: 'شاحنات', nameEn: 'Trucks', count: 23 },
    { id: 'parts', name: 'قطع غيار', nameEn: 'Parts', count: 89 },
    { id: 'accessories', name: 'إكسسوارات', nameEn: 'Accessories', count: 67 }
  ];

  res.json({
    success: true,
    categories: categories,
    total: categories.length,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      'GET /api/health',
      'GET /api/products',
      'GET /api/vendors',
      'GET /api/search',
      'GET /api/auth/profile',
      'GET /api/notifications',
      'GET /api/categories'
    ],
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: 'Something went wrong on our end',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Souk El-Sayarat Backend Server Started`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`✅ Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🎯 Ready for Firebase App Hosting deployment!`);
});

module.exports = app;