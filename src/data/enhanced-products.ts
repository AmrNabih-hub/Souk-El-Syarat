/**
 * Enhanced Product Catalog
 * Comprehensive automotive marketplace inventory
 */

import { Product } from '@/types';

// Luxury Cars Collection
export const luxuryCars: Product[] = [
  {
    id: 'luxury-car-1',
    vendorId: 'premium-motors',
    title: 'Porsche 911 Turbo S 2024 - Track Performance Edition',
    description:
      'Ultimate sports car engineering with 640 HP twin-turbo flat-six engine. Carbon fiber aero package, ceramic brakes, and sport chrono package. This pristine example features Paint to Sample Riviera Blue with full leather interior.',
    category: 'cars',
    subcategory: 'sports',
    images: [
      {
        id: 'porsche-1',
        url: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1200&h=800&fit=crop&crop=center&q=90',
        alt: 'Porsche 911 Turbo S 2024 - Track Performance Edition Exterior',
        isPrimary: true,
        order: 0,
      },
      {
        id: 'porsche-2',
        url: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=1200&h=800&fit=crop&crop=center',
        alt: 'Porsche 911 Interior - Leather Sport Seats',
        isPrimary: false,
        order: 1,
      },
    ],
    price: 4500000,
    originalPrice: 4800000,
    currency: 'EGP',
    inStock: true,
    quantity: 1,
    specifications: [
      { name: 'Engine', value: '3.8L Twin-Turbo Flat-6', category: 'engine' },
      { name: 'Power', value: '640 HP @ 6,750 RPM', category: 'engine' },
      { name: 'Torque', value: '590 lb-ft @ 2,500-4,000 RPM', category: 'engine' },
      { name: '0-60 mph', value: '2.6 seconds', category: 'performance' },
      { name: 'Top Speed', value: '205 mph', category: 'performance' },
      { name: 'Transmission', value: '8-Speed PDK Dual-Clutch', category: 'transmission' },
    ],
    features: [
      'Sport Chrono Package',
      'Ceramic Composite Brakes (PCCB)',
      'Carbon Fiber Aero Kit',
      'Adaptive Sport Seats Plus',
      'Bose Surround Sound System',
      'Paint to Sample Riviera Blue',
    ],
    tags: ['porsche', '911', 'turbo-s', 'sports-car', 'luxury'],
    condition: 'new',
    warranty: { type: 'manufacturer', duration: 48, coverage: 'Full Porsche Warranty' },
    status: 'published',
    views: 245,
    favorites: 18,
    rating: 4.9,
    reviewCount: 12,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  {
    id: 'luxury-car-2',
    vendorId: 'german-excellence',
    title: 'Mercedes-AMG GT 63 S 4MATIC+ 2024 - Edition 1',
    description:
      'Four-door coupe combining luxury and performance. Hand-built AMG 4.0L V8 biturbo engine delivering 630 HP. AMG Performance 4MATIC+ all-wheel drive with drift mode. Exclusive Edition 1 package with unique styling elements.',
    category: 'cars',
    subcategory: 'luxury',
    images: [
      {
        id: 'amg-gt-1',
        url: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=1200&h=800&fit=crop&crop=center',
        alt: 'Mercedes-AMG GT 63 S - Obsidian Black Metallic',
        isPrimary: true,
        order: 0,
      },
    ],
    price: 3800000,
    currency: 'EGP',
    inStock: true,
    quantity: 1,
    specifications: [
      { name: 'Engine', value: 'AMG 4.0L V8 Biturbo', category: 'engine' },
      { name: 'Power', value: '630 HP @ 5,500-6,500 RPM', category: 'engine' },
      { name: 'Torque', value: '664 lb-ft @ 2,500-4,500 RPM', category: 'engine' },
      { name: '0-60 mph', value: '3.1 seconds', category: 'performance' },
    ],
    features: [
      'AMG Performance 4MATIC+',
      'AMG Ride Control+ Suspension',
      'Burmester 3D Surround Sound',
      'AMG Track Pace App',
      'Edition 1 Exclusive Package',
    ],
    tags: ['mercedes', 'amg', 'gt63s', 'luxury', 'performance'],
    condition: 'new',
    warranty: { type: 'manufacturer', duration: 36, coverage: 'Mercedes-AMG Warranty' },
    status: 'published',
    views: 189,
    favorites: 14,
    rating: 4.8,
    reviewCount: 9,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Premium Auto Parts Collection
export const premiumParts: Product[] = [
  {
    id: 'part-brembo-1',
    vendorId: 'performance-parts',
    title: 'Brembo GT Series 6-Piston Front Brake Kit - BMW M3/M4',
    description:
      'Professional-grade Brembo GT brake system featuring 6-piston monobloc calipers with 380mm drilled rotors. Direct bolt-on fitment for BMW M3/M4 (F80/F82/F83). Includes stainless steel braided lines and performance brake pads.',
    category: 'parts',
    subcategory: 'brake_parts',
    images: [
      {
        id: 'brembo-kit-1',
        url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=800&fit=crop&crop=center',
        alt: 'Brembo GT 6-Piston Brake Kit',
        isPrimary: true,
        order: 0,
      },
    ],
    price: 45000,
    originalPrice: 52000,
    currency: 'EGP',
    inStock: true,
    quantity: 8,
    specifications: [
      { name: 'Caliper Type', value: '6-Piston Monobloc Fixed', category: 'brake' },
      { name: 'Rotor Diameter', value: '380mm x 34mm', category: 'brake' },
      { name: 'Rotor Type', value: 'Drilled & Slotted', category: 'brake' },
      { name: 'Compatibility', value: 'BMW M3/M4 F80/F82/F83', category: 'fitment' },
    ],
    features: [
      'Brembo GT Monobloc Calipers',
      'High-Carbon Cast Iron Rotors',
      'Performance Ceramic Brake Pads',
      'Stainless Steel Braided Lines',
      'Hardware & Installation Kit',
    ],
    tags: ['brembo', 'brake-kit', 'bmw', 'm3', 'm4', 'performance'],
    condition: 'new',
    warranty: { type: 'manufacturer', duration: 24, coverage: 'Brembo Limited Warranty' },
    status: 'published',
    views: 156,
    favorites: 11,
    rating: 4.7,
    reviewCount: 8,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  {
    id: 'part-kw-1',
    vendorId: 'suspension-pro',
    title: 'KW Variant 3 Coilover System - Porsche 911 (992)',
    description:
      'Premium 3-way adjustable coilover suspension system. Independently adjustable compression and rebound damping with height adjustment. TÜV-approved for street and track use. Perfect for enthusiasts seeking ultimate handling precision.',
    category: 'parts',
    subcategory: 'suspension',
    images: [
      {
        id: 'kw-coilovers-1',
        url: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1200&h=800&fit=crop&crop=center',
        alt: 'KW Variant 3 Coilover System',
        isPrimary: true,
        order: 0,
      },
    ],
    price: 78000,
    currency: 'EGP',
    inStock: true,
    quantity: 3,
    specifications: [
      { name: 'Type', value: '3-Way Adjustable Coilover', category: 'suspension' },
      { name: 'Adjustment Range', value: '20-40mm Lowering', category: 'suspension' },
      { name: 'Damping', value: 'Independent Compression/Rebound', category: 'suspension' },
      { name: 'Compatibility', value: 'Porsche 911 (992) All Models', category: 'fitment' },
    ],
    features: [
      '3-Way Adjustable Damping',
      'Height Adjustable Springs',
      'TÜV Approval',
      'Stainless Steel Construction',
      'Track & Street Optimized',
    ],
    tags: ['kw', 'coilovers', 'suspension', 'porsche', '911', 'track'],
    condition: 'new',
    warranty: { type: 'manufacturer', duration: 24, coverage: 'KW Automotive Warranty' },
    status: 'published',
    views: 134,
    favorites: 9,
    rating: 4.6,
    reviewCount: 6,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Performance Kits Collection
export const performanceKits: Product[] = [
  {
    id: 'kit-stage-1',
    vendorId: 'tuning-specialists',
    title: 'APR Stage 1 ECU Tune + Intake System - Audi RS6/RS7 C8',
    description:
      'Complete Stage 1 performance package for Audi RS6/RS7 C8. APR ECU tune increases power to 700+ HP. Includes high-flow intake system, upgraded intercooler, and performance exhaust. Professional installation and dyno tuning included.',
    category: 'kits',
    subcategory: 'performance_kits',
    images: [
      {
        id: 'apr-stage1-1',
        url: 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=1200&h=800&fit=crop&crop=center',
        alt: 'APR Stage 1 Performance Kit',
        isPrimary: true,
        order: 0,
      },
    ],
    price: 125000,
    originalPrice: 140000,
    currency: 'EGP',
    inStock: true,
    quantity: 2,
    specifications: [
      { name: 'Power Gain', value: '+100 HP / +120 lb-ft', category: 'performance' },
      { name: 'ECU Tune', value: 'APR Stage 1 Flash', category: 'tuning' },
      { name: 'Intake', value: 'High-Flow Carbon Fiber', category: 'intake' },
      { name: 'Installation', value: 'Professional Required', category: 'service' },
    ],
    features: [
      'APR Stage 1 ECU Tune',
      'Carbon Fiber Intake System',
      'Performance Intercooler',
      'Cat-Back Exhaust System',
      'Professional Installation',
      'Dyno Tuning Session',
    ],
    tags: ['apr', 'stage1', 'tune', 'audi', 'rs6', 'rs7', 'performance'],
    condition: 'new',
    warranty: { type: 'manufacturer', duration: 12, coverage: 'APR Performance Warranty' },
    status: 'published',
    views: 98,
    favorites: 7,
    rating: 4.5,
    reviewCount: 4,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Professional Services Collection
export const automotiveServices: Product[] = [
  {
    id: 'service-detailing-1',
    vendorId: 'premium-detailing',
    title: 'Ceramic Coating Protection Package - Paint Correction + 5-Year Coating',
    description:
      'Complete paint protection service including multi-stage paint correction, ceramic coating application, and interior protection. Our certified technicians use professional-grade products for showroom-quality results lasting 5+ years.',
    category: 'services',
    subcategory: 'detailing',
    images: [
      {
        id: 'ceramic-coating-1',
        url: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=1200&h=800&fit=crop&crop=center',
        alt: 'Professional Ceramic Coating Application',
        isPrimary: true,
        order: 0,
      },
    ],
    price: 15000,
    originalPrice: 18000,
    currency: 'EGP',
    inStock: true,
    quantity: 100, // Service capacity
    specifications: [
      { name: 'Duration', value: '3-4 Days Complete Service', category: 'service' },
      { name: 'Paint Correction', value: '3-Stage Polishing Process', category: 'process' },
      { name: 'Coating', value: '9H Ceramic Professional Grade', category: 'protection' },
      { name: 'Warranty', value: '5-Year Protection Guarantee', category: 'warranty' },
    ],
    features: [
      'Multi-Stage Paint Correction',
      '9H Ceramic Coating Application',
      'Interior Leather Protection',
      'Wheel & Caliper Coating',
      '5-Year Warranty',
      'Maintenance Kit Included',
    ],
    tags: ['ceramic-coating', 'paint-correction', 'detailing', 'protection'],
    condition: 'new',
    warranty: { type: 'service', duration: 60, coverage: '5-Year Ceramic Protection' },
    status: 'published',
    views: 156,
    favorites: 12,
    rating: 4.8,
    reviewCount: 15,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  {
    id: 'service-performance-1',
    vendorId: 'performance-garage',
    title: 'Complete Performance Tuning Service - ECU + Dyno + Optimization',
    description:
      'Professional performance tuning service including ECU remapping, dyno testing, and complete vehicle optimization. Our ASE-certified technicians specialize in European performance vehicles with state-of-the-art equipment.',
    category: 'services',
    subcategory: 'tuning',
    images: [
      {
        id: 'dyno-tuning-1',
        url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&h=800&fit=crop&crop=center',
        alt: 'Professional Dyno Tuning Service',
        isPrimary: true,
        order: 0,
      },
    ],
    price: 8500,
    currency: 'EGP',
    inStock: true,
    quantity: 50,
    specifications: [
      { name: 'Power Gains', value: 'Up to 25% Increase', category: 'performance' },
      { name: 'Dyno Testing', value: 'Before & After Runs', category: 'testing' },
      { name: 'Duration', value: '1-2 Days Service', category: 'service' },
      { name: 'Certification', value: 'ASE Certified Technicians', category: 'certification' },
    ],
    features: [
      'Custom ECU Remapping',
      'Dyno Testing & Optimization',
      'Performance Data Logging',
      'Emissions Compliance Check',
      '6-Month Performance Warranty',
    ],
    tags: ['ecu-tuning', 'dyno', 'performance', 'optimization'],
    condition: 'new',
    warranty: { type: 'service', duration: 6, coverage: 'Performance Guarantee' },
    status: 'published',
    views: 87,
    favorites: 6,
    rating: 4.7,
    reviewCount: 8,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Export combined catalog
export const enhancedProductCatalog = {
  luxuryCars,
  premiumParts,
  performanceKits,
  automotiveServices,
  getAllProducts: () => [...luxuryCars, ...premiumParts, ...performanceKits, ...automotiveServices],
};
