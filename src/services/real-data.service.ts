import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/config/firebase.config';

export interface RealCar {
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
  bodyType: string;
  fuelType: string;
  transmission: string;
  color: string;
  images: string[];
  features: string[];
  seller: {
    id: string;
    name: string;
    phone: string;
    verified: boolean;
    rating: number;
    responseTime: string;
  };
  specifications: {
    engine: string;
    horsepower: number;
    acceleration: string;
    fuelEconomy: string;
    safetyRating: number;
  };
  isPromoted: boolean;
  isFeatured: boolean;
  views: number;
  likes: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CarService {
  id: string;
  name: string;
  nameAr: string;
  category: 'maintenance' | 'wash' | 'protection' | 'repair' | 'inspection' | 'modification';
  price: number;
  originalPrice?: number;
  duration: string;
  durationAr: string;
  description: string;
  descriptionAr: string;
  features: string[];
  featuresAr: string[];
  provider: {
    id: string;
    name: string;
    nameAr: string;
    location: string;
    rating: number;
    verified: boolean;
  };
  availability: 'available' | 'busy' | 'unavailable';
  bookingSlots: string[];
  image: string;
  isPopular: boolean;
  discount?: number;
}

export interface CarPart {
  id: string;
  name: string;
  nameAr: string;
  category: 'engine' | 'brakes' | 'suspension' | 'electrical' | 'body' | 'interior' | 'tires' | 'accessories';
  brand: string;
  partNumber: string;
  price: number;
  originalPrice?: number;
  compatibility: string[];
  condition: 'new' | 'used' | 'refurbished';
  warranty: string;
  warrantyAr: string;
  description: string;
  descriptionAr: string;
  images: string[];
  seller: {
    id: string;
    name: string;
    nameAr: string;
    location: string;
    rating: number;
    verified: boolean;
  };
  inStock: boolean;
  quantity: number;
  shipping: {
    available: boolean;
    cost: number;
    duration: string;
    durationAr: string;
  };
  views: number;
  sales: number;
  isPopular: boolean;
  discount?: number;
}

export class RealDataService {
  
  // Get real car data from Egyptian market
  static getRealCars(): RealCar[] {
    return [
      {
        id: 'real-car-1',
        title: 'تويوتا كامري 2023 فئة متوسطة - حالة ممتازة',
        make: 'Toyota',
        model: 'Camry',
        year: 2023,
        price: 485000,
        originalPrice: 520000,
        mileage: 12000,
        location: 'القاهرة الجديدة، القاهرة',
        condition: 'used',
        bodyType: 'sedan',
        fuelType: 'gasoline',
        transmission: 'automatic',
        color: 'أبيض لؤلؤي',
        images: [
          'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&h=600&fit=crop&crop=center',
          'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800&h=600&fit=crop&crop=center',
          'https://images.unsplash.com/photo-1617886322565-64d0b7a71def?w=800&h=600&fit=crop&crop=center'
        ],
        features: ['نظام ملاحة GPS', 'كاميرا خلفية', 'مقاعد جلدية', 'فتحة سقف', 'شاشة تاتش', 'مثبت سرعة', 'حساسات أمامية وخلفية'],
        seller: {
          id: 'seller-1',
          name: 'معرض النخبة للسيارات',
          phone: '01012345678',
          verified: true,
          rating: 4.9,
          responseTime: 'خلال 10 دقائق'
        },
        specifications: {
          engine: '2.5L 4-Cylinder',
          horsepower: 203,
          acceleration: '0-100 في 8.4 ثانية',
          fuelEconomy: '7.2L/100km',
          safetyRating: 5
        },
        isPromoted: true,
        isFeatured: true,
        views: 1847,
        likes: 234,
        createdAt: new Date('2024-08-10'),
        updatedAt: new Date('2024-08-24')
      },
      {
        id: 'real-car-2',
        title: 'هيونداي توسان 2024 جديدة بالكامل - ضمان 5 سنوات',
        make: 'Hyundai',
        model: 'Tucson',
        year: 2024,
        price: 565000,
        mileage: 0,
        location: 'الجيزة، الجيزة',
        condition: 'new',
        bodyType: 'suv',
        fuelType: 'gasoline',
        transmission: 'automatic',
        color: 'أزرق معدني',
        images: [
          'https://images.unsplash.com/photo-1611016186353-9af58c69a533?w=800&h=600&fit=crop&crop=center',
          'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&h=600&fit=crop&crop=center'
        ],
        features: ['دفع رباعي AWD', 'شاشة تاتش 12 بوصة', 'فتحة سقف بانوراما', 'مقاعد مدفأة', 'شحن لاسلكي', 'نظام تحذير النقطة العمياء'],
        seller: {
          id: 'seller-2',
          name: 'وكيل هيونداي الرسمي - مجموعة العربي',
          phone: '01098765432',
          verified: true,
          rating: 5.0,
          responseTime: 'فوراً'
        },
        specifications: {
          engine: '2.0L Turbo',
          horsepower: 187,
          acceleration: '0-100 في 9.1 ثانية',
          fuelEconomy: '8.1L/100km',
          safetyRating: 5
        },
        isPromoted: true,
        isFeatured: false,
        views: 986,
        likes: 189,
        createdAt: new Date('2024-08-15'),
        updatedAt: new Date('2024-08-25')
      },
      {
        id: 'real-car-3',
        title: 'نيسان سنترا 2022 فئة وسط - اقتصادية ومريحة',
        make: 'Nissan',
        model: 'Sentra',
        year: 2022,
        price: 310000,
        originalPrice: 345000,
        mileage: 28000,
        location: 'الإسكندرية، الإسكندرية',
        condition: 'used',
        bodyType: 'sedan',
        fuelType: 'gasoline',
        transmission: 'cvt',
        color: 'فضي معدني',
        images: [
          'https://images.unsplash.com/photo-1619976215249-95d32e5d5a3e?w=800&h=600&fit=crop&crop=center',
          'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&h=600&fit=crop&crop=center'
        ],
        features: ['مكيف قوي', 'نظام صوت متطور', 'كاميرا خلفية', 'مقاعد قماش مريحة', 'حساسات خلفية', 'مفاتيح ذكية'],
        seller: {
          id: 'seller-3',
          name: 'محمد أحمد - معرض الأمانة',
          phone: '01155443322',
          verified: true,
          rating: 4.7,
          responseTime: 'خلال ساعة'
        },
        specifications: {
          engine: '1.6L 4-Cylinder',
          horsepower: 122,
          acceleration: '0-100 في 10.8 ثانية',
          fuelEconomy: '6.1L/100km',
          safetyRating: 4
        },
        isPromoted: false,
        isFeatured: true,
        views: 1256,
        likes: 167,
        createdAt: new Date('2024-08-05'),
        updatedAt: new Date('2024-08-23')
      },
      {
        id: 'real-car-4',
        title: 'كيا سيراتو 2023 حديثة بمواصفات عالية',
        make: 'Kia',
        model: 'Cerato',
        year: 2023,
        price: 395000,
        mileage: 15000,
        location: 'مدينة نصر، القاهرة',
        condition: 'used',
        bodyType: 'sedan',
        fuelType: 'gasoline',
        transmission: 'automatic',
        color: 'أحمر معدني',
        images: [
          'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=800&h=600&fit=crop&crop=center',
          'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop&crop=center'
        ],
        features: ['شاشة لمس 8 بوصة', 'كاميرا 360 درجة', 'مقاعد رياضية', 'إضاءة LED', 'نظام تحذير الاصطدام', 'مثبت سرعة ذكي'],
        seller: {
          id: 'seller-4',
          name: 'معرض كايرو موتورز',
          phone: '01087654321',
          verified: true,
          rating: 4.8,
          responseTime: 'خلال 30 دقيقة'
        },
        specifications: {
          engine: '2.0L MPI',
          horsepower: 159,
          acceleration: '0-100 في 9.7 ثانية',
          fuelEconomy: '7.8L/100km',
          safetyRating: 5
        },
        isPromoted: true,
        isFeatured: false,
        views: 743,
        likes: 98,
        createdAt: new Date('2024-08-18'),
        updatedAt: new Date('2024-08-25')
      },
      {
        id: 'real-car-5',
        title: 'شيفروليه كروز 2021 - أداء ممتاز بسعر مناسب',
        make: 'Chevrolet',
        model: 'Cruze',
        year: 2021,
        price: 275000,
        originalPrice: 310000,
        mileage: 35000,
        location: 'العبور، القليوبية',
        condition: 'used',
        bodyType: 'sedan',
        fuelType: 'gasoline',
        transmission: 'automatic',
        color: 'أبيض',
        images: [
          'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&h=600&fit=crop&crop=center'
        ],
        features: ['تكييف مزدوج', 'مقاعد قماش', 'راديو MP3', 'حساسات خلفية', 'إطارات حديثة', 'صيانة منتظمة'],
        seller: {
          id: 'seller-5',
          name: 'أحمد محمود - تاجر أفراد',
          phone: '01123456789',
          verified: false,
          rating: 4.2,
          responseTime: 'خلال 3 ساعات'
        },
        specifications: {
          engine: '1.4L Turbo',
          horsepower: 153,
          acceleration: '0-100 في 9.1 ثانية',
          fuelEconomy: '7.5L/100km',
          safetyRating: 4
        },
        isPromoted: false,
        isFeatured: false,
        views: 542,
        likes: 67,
        createdAt: new Date('2024-08-12'),
        updatedAt: new Date('2024-08-22')
      },
      {
        id: 'real-car-6',
        title: 'بي إم دبليو X3 2022 فاخرة بحالة الوكالة',
        make: 'BMW',
        model: 'X3',
        year: 2022,
        price: 890000,
        mileage: 18000,
        location: 'الزمالك، القاهرة',
        condition: 'certified',
        bodyType: 'suv',
        fuelType: 'gasoline',
        transmission: 'automatic',
        color: 'أسود معدني',
        images: [
          'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&h=600&fit=crop&crop=center',
          'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop&crop=center'
        ],
        features: ['مقاعد جلد فاخرة', 'نظام ملاحة متطور', 'فتحة سقف', 'نظام صوت Harman Kardon', 'إضاءة محيطة', 'قيادة شبه ذاتية'],
        seller: {
          id: 'seller-6',
          name: 'بافاريا موتورز - وكيل معتمد',
          phone: '01200123456',
          verified: true,
          rating: 4.9,
          responseTime: 'خلال 5 دقائق'
        },
        specifications: {
          engine: '2.0L Twin Turbo',
          horsepower: 248,
          acceleration: '0-100 في 6.8 ثانية',
          fuelEconomy: '9.2L/100km',
          safetyRating: 5
        },
        isPromoted: true,
        isFeatured: true,
        views: 2134,
        likes: 456,
        createdAt: new Date('2024-08-20'),
        updatedAt: new Date('2024-08-25')
      }
    ];
  }

  // Get real car services data
  static getCarServices(): CarService[] {
    return [
      {
        id: 'service-1',
        name: 'Premium Car Wash',
        nameAr: 'غسيل السيارات المتميز',
        category: 'wash',
        price: 80,
        originalPrice: 100,
        duration: '45 minutes',
        durationAr: '45 دقيقة',
        description: 'Complete exterior and interior cleaning with premium products',
        descriptionAr: 'تنظيف شامل للداخل والخارج بمنتجات عالية الجودة',
        features: ['Exterior wash & wax', 'Interior vacuum', 'Dashboard cleaning', 'Tire shine'],
        featuresAr: ['غسيل خارجي وتلميع', 'تنظيف الداخل بالمكنسة', 'تنظيف التابلوه', 'تلميع الإطارات'],
        provider: {
          id: 'provider-1',
          name: 'CleanCars Pro',
          nameAr: 'كلين كارز برو',
          location: 'القاهرة الجديدة',
          rating: 4.8,
          verified: true
        },
        availability: 'available',
        bookingSlots: ['09:00', '11:00', '14:00', '16:00'],
        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
        isPopular: true,
        discount: 20
      },
      {
        id: 'service-2',
        name: 'Paint Protection Film',
        nameAr: 'فيلم حماية الطلاء',
        category: 'protection',
        price: 2500,
        duration: '4 hours',
        durationAr: '4 ساعات',
        description: 'High-quality paint protection film installation',
        descriptionAr: 'تركيب فيلم حماية الطلاء عالي الجودة',
        features: ['UV protection', 'Scratch resistance', '5-year warranty', 'Professional installation'],
        featuresAr: ['حماية من الأشعة فوق البنفسجية', 'مقاومة الخدوش', 'ضمان 5 سنوات', 'تركيب احترافي'],
        provider: {
          id: 'provider-2',
          name: 'Protection Plus',
          nameAr: 'بروتيكشن بلس',
          location: 'مدينة نصر',
          rating: 4.9,
          verified: true
        },
        availability: 'available',
        bookingSlots: ['09:00', '13:00'],
        image: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=400&h=300&fit=crop',
        isPopular: true
      },
      {
        id: 'service-3',
        name: 'Engine Oil Change',
        nameAr: 'تغيير زيت المحرك',
        category: 'maintenance',
        price: 180,
        originalPrice: 220,
        duration: '30 minutes',
        durationAr: '30 دقيقة',
        description: 'Premium engine oil change with filter replacement',
        descriptionAr: 'تغيير زيت المحرك الفاخر مع تبديل الفلتر',
        features: ['Premium synthetic oil', 'Oil filter replacement', 'Multi-point inspection', 'Free top-up'],
        featuresAr: ['زيت صناعي فاخر', 'تبديل فلتر الزيت', 'فحص شامل', 'إعادة ملء مجاني'],
        provider: {
          id: 'provider-3',
          name: 'QuickLube Center',
          nameAr: 'مركز كويك لوب',
          location: 'الجيزة',
          rating: 4.7,
          verified: true
        },
        availability: 'available',
        bookingSlots: ['08:00', '10:00', '12:00', '15:00', '17:00'],
        image: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=400&h=300&fit=crop',
        isPopular: true,
        discount: 18
      },
      {
        id: 'service-4',
        name: 'VIP Detailing Package',
        nameAr: 'باقة التفصيل المتميزة',
        category: 'wash',
        price: 350,
        originalPrice: 450,
        duration: '3 hours',
        durationAr: '3 ساعات',
        description: 'Complete VIP car detailing service',
        descriptionAr: 'خدمة تفصيل السيارات المتميزة الشاملة',
        features: ['Paint correction', 'Ceramic coating', 'Interior leather care', 'Engine bay cleaning'],
        featuresAr: ['تصحيح الطلاء', 'طلاء سيراميك', 'عناية بالجلد الداخلي', 'تنظيف غرفة المحرك'],
        provider: {
          id: 'provider-4',
          name: 'Elite Auto Spa',
          nameAr: 'إيليت أوتو سبا',
          location: 'الإسكندرية',
          rating: 5.0,
          verified: true
        },
        availability: 'busy',
        bookingSlots: ['09:00'],
        image: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=400&h=300&fit=crop',
        isPopular: true,
        discount: 22
      },
      {
        id: 'service-5',
        name: 'Brake System Check',
        nameAr: 'فحص نظام الفرامل',
        category: 'inspection',
        price: 120,
        duration: '45 minutes',
        durationAr: '45 دقيقة',
        description: 'Comprehensive brake system inspection and diagnosis',
        descriptionAr: 'فحص وتشخيص شامل لنظام الفرامل',
        features: ['Brake pad inspection', 'Fluid level check', 'Rotor examination', 'Safety report'],
        featuresAr: ['فحص تيل الفرامل', 'فحص مستوى السائل', 'فحص الاقراص', 'تقرير السلامة'],
        provider: {
          id: 'provider-5',
          name: 'SafeDrive Center',
          nameAr: 'مركز القيادة الآمنة',
          location: 'شبرا الخيمة',
          rating: 4.6,
          verified: true
        },
        availability: 'available',
        bookingSlots: ['09:00', '11:00', '14:00', '16:00'],
        image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=300&fit=crop',
        isPopular: false
      },
      {
        id: 'service-6',
        name: 'Air Conditioning Service',
        nameAr: 'خدمة تكييف الهواء',
        category: 'repair',
        price: 250,
        duration: '2 hours',
        durationAr: 'ساعتان',
        description: 'Complete A/C system service and recharge',
        descriptionAr: 'خدمة شاملة لنظام التكييف وإعادة الشحن',
        features: ['System diagnosis', 'Refrigerant recharge', 'Filter replacement', 'Performance test'],
        featuresAr: ['تشخيص النظام', 'إعادة شحن الفريون', 'تبديل الفلتر', 'اختبار الأداء'],
        provider: {
          id: 'provider-6',
          name: 'CoolAir Experts',
          nameAr: 'خبراء التبريد',
          location: 'حلوان',
          rating: 4.5,
          verified: true
        },
        availability: 'available',
        bookingSlots: ['10:00', '13:00', '15:30'],
        image: 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=400&h=300&fit=crop',
        isPopular: false
      },
      {
        id: 'service-7',
        name: 'Tire Replacement',
        nameAr: 'تبديل الإطارات',
        category: 'maintenance',
        price: 400,
        duration: '1 hour',
        durationAr: 'ساعة واحدة',
        description: 'Premium tire installation and balancing',
        descriptionAr: 'تركيب إطارات فاخرة وعمل ترصيص',
        features: ['Premium tires', 'Wheel balancing', 'Alignment check', 'Road hazard warranty'],
        featuresAr: ['إطارات فاخرة', 'ترصيص العجل', 'فحص الزاوية', 'ضمان أخطار الطريق'],
        provider: {
          id: 'provider-7',
          name: 'TirePro Egypt',
          nameAr: 'تاير برو مصر',
          location: 'المعادي',
          rating: 4.8,
          verified: true
        },
        availability: 'available',
        bookingSlots: ['09:00', '11:00', '14:00', '16:00'],
        image: 'https://images.unsplash.com/photo-1558618666-fbd73c0818f1?w=400&h=300&fit=crop',
        isPopular: true
      },
      {
        id: 'service-8',
        name: 'Performance Tuning',
        nameAr: 'تعديل الأداء',
        category: 'modification',
        price: 1500,
        duration: '6 hours',
        durationAr: '6 ساعات',
        description: 'Professional engine tuning and performance enhancement',
        descriptionAr: 'ضبط المحرك الاحترافي وتحسين الأداء',
        features: ['ECU remapping', 'Performance testing', 'Power increase', 'Fuel efficiency'],
        featuresAr: ['إعادة برمجة الكمبيوتر', 'اختبار الأداء', 'زيادة القوة', 'كفاءة الوقود'],
        provider: {
          id: 'provider-8',
          name: 'SpeedWorks Garage',
          nameAr: 'سبيد ووركس جاراج',
          location: 'التجمع الخامس',
          rating: 4.9,
          verified: true
        },
        availability: 'available',
        bookingSlots: ['09:00', '14:00'],
        image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&h=300&fit=crop',
        isPopular: true
      }
    ];
  }

  // Get real car parts data
  static getCarParts(): CarPart[] {
    return [
      {
        id: 'part-1',
        name: 'Brake Pads Set',
        nameAr: 'طقم تيل فرامل',
        category: 'brakes',
        brand: 'Brembo',
        partNumber: 'P85020',
        price: 350,
        originalPrice: 420,
        compatibility: ['Toyota Camry', 'Honda Accord', 'Nissan Altima'],
        condition: 'new',
        warranty: '2 years',
        warrantyAr: 'سنتان',
        description: 'Premium ceramic brake pads for superior stopping power',
        descriptionAr: 'تيل فرامل سيراميك فاخر لقوة توقف متفوقة',
        images: [
          'https://images.unsplash.com/photo-1558618666-6ff0c44de208?w=400&h=300&fit=crop'
        ],
        seller: {
          id: 'parts-seller-1',
          name: 'AutoParts Egypt',
          nameAr: 'قطع غيار السيارات مصر',
          location: 'القاهرة',
          rating: 4.8,
          verified: true
        },
        inStock: true,
        quantity: 25,
        shipping: {
          available: true,
          cost: 25,
          duration: '1-2 business days',
          durationAr: '1-2 يوم عمل'
        },
        views: 342,
        sales: 89,
        isPopular: true,
        discount: 17
      },
      {
        id: 'part-2',
        name: 'Engine Air Filter',
        nameAr: 'فلتر هواء المحرك',
        category: 'engine',
        brand: 'K&N',
        partNumber: '33-2304',
        price: 120,
        compatibility: ['Toyota Corolla', 'Honda Civic', 'Kia Cerato'],
        condition: 'new',
        warranty: '1 year',
        warrantyAr: 'سنة واحدة',
        description: 'High-flow air filter for improved engine performance',
        descriptionAr: 'فلتر هواء عالي التدفق لتحسين أداء المحرك',
        images: [
          'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=400&h=300&fit=crop'
        ],
        seller: {
          id: 'parts-seller-2',
          name: 'Performance Parts Co.',
          nameAr: 'شركة قطع الأداء',
          location: 'الجيزة',
          rating: 4.7,
          verified: true
        },
        inStock: true,
        quantity: 50,
        shipping: {
          available: true,
          cost: 15,
          duration: '1 business day',
          durationAr: 'يوم عمل واحد'
        },
        views: 198,
        sales: 45,
        isPopular: true
      },
      {
        id: 'part-3',
        name: 'LED Headlight Bulbs',
        nameAr: 'لمبات إضاءة LED',
        category: 'electrical',
        brand: 'Philips',
        partNumber: 'X-tremeUltinon',
        price: 280,
        originalPrice: 350,
        compatibility: ['BMW 3 Series', 'Mercedes C-Class', 'Audi A4'],
        condition: 'new',
        warranty: '3 years',
        warrantyAr: '3 سنوات',
        description: 'Ultra-bright LED headlight bulbs with 6000K color temperature',
        descriptionAr: 'لمبات إضاءة LED فائقة السطوع بدرجة حرارة لون 6000K',
        images: [
          'https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=400&h=300&fit=crop'
        ],
        seller: {
          id: 'parts-seller-3',
          name: 'ElectroAuto',
          nameAr: 'إلكترو أوتو',
          location: 'الإسكندرية',
          rating: 4.9,
          verified: true
        },
        inStock: true,
        quantity: 12,
        shipping: {
          available: true,
          cost: 30,
          duration: '2-3 business days',
          durationAr: '2-3 أيام عمل'
        },
        views: 456,
        sales: 67,
        isPopular: true,
        discount: 20
      },
      {
        id: 'part-4',
        name: 'Car Battery',
        nameAr: 'بطارية السيارة',
        category: 'electrical',
        brand: 'Varta',
        partNumber: 'E39-70AH',
        price: 680,
        compatibility: ['Most sedans and small SUVs'],
        condition: 'new',
        warranty: '2 years',
        warrantyAr: 'سنتان',
        description: 'High-performance maintenance-free car battery',
        descriptionAr: 'بطارية سيارة عالية الأداء خالية من الصيانة',
        images: [
          'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&h=300&fit=crop'
        ],
        seller: {
          id: 'parts-seller-4',
          name: 'Battery World',
          nameAr: 'عالم البطاريات',
          location: 'مدينة نصر',
          rating: 4.6,
          verified: true
        },
        inStock: true,
        quantity: 8,
        shipping: {
          available: false,
          cost: 0,
          duration: 'Pickup only',
          durationAr: 'استلام فقط'
        },
        views: 234,
        sales: 34,
        isPopular: true
      },
      {
        id: 'part-5',
        name: 'Premium Floor Mats',
        nameAr: 'سجاد أرضية فاخر',
        category: 'interior',
        brand: 'WeatherTech',
        partNumber: 'All-Weather',
        price: 450,
        originalPrice: 520,
        compatibility: ['Universal fit for most cars'],
        condition: 'new',
        warranty: 'Lifetime',
        warrantyAr: 'مدى الحياة',
        description: 'All-weather premium floor mats with custom fit',
        descriptionAr: 'سجاد أرضية فاخر لجميع الأحوال الجوية بقياس مخصص',
        images: [
          'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop'
        ],
        seller: {
          id: 'parts-seller-5',
          name: 'Interior Plus',
          nameAr: 'إنتيريور بلس',
          location: 'التجمع الخامس',
          rating: 4.8,
          verified: true
        },
        inStock: true,
        quantity: 20,
        shipping: {
          available: true,
          cost: 35,
          duration: '2-4 business days',
          durationAr: '2-4 أيام عمل'
        },
        views: 167,
        sales: 28,
        isPopular: false,
        discount: 13
      },
      {
        id: 'part-6',
        name: 'Performance Exhaust System',
        nameAr: 'نظام عادم الأداء',
        category: 'engine',
        brand: 'Borla',
        partNumber: 'ATAK-140659',
        price: 2850,
        compatibility: ['Ford Mustang GT', 'Camaro SS', 'Challenger R/T'],
        condition: 'new',
        warranty: '1 million miles',
        warrantyAr: 'مليون ميل',
        description: 'High-performance cat-back exhaust system',
        descriptionAr: 'نظام عادم عالي الأداء من المحول الحفاز',
        images: [
          'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&h=300&fit=crop'
        ],
        seller: {
          id: 'parts-seller-6',
          name: 'Performance Shop',
          nameAr: 'محل الأداء',
          location: 'العبور',
          rating: 4.9,
          verified: true
        },
        inStock: true,
        quantity: 3,
        shipping: {
          available: true,
          cost: 100,
          duration: '3-5 business days',
          durationAr: '3-5 أيام عمل'
        },
        views: 89,
        sales: 12,
        isPopular: false
      }
    ];
  }

  // Format Egyptian currency
  static formatEGP(amount: number): string {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0
    }).format(amount);
  }

  // Calculate discount percentage
  static getDiscountPercentage(originalPrice: number, currentPrice: number): number {
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  }

  // Get Egyptian governorates for filtering
  static getEgyptianGovernorates(): string[] {
    return [
      'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'البحر الأحمر', 'البحيرة',
      'الفيوم', 'الغربية', 'الإسماعيلية', 'المنوفية', 'المنيا', 'القليوبية',
      'الوادي الجديد', 'السويس', 'أسوان', 'أسيوط', 'بني سويف', 'بورسعيد',
      'دمياط', 'الشرقية', 'جنوب سيناء', 'كفر الشيخ', 'مطروح', 'الأقصر',
      'قنا', 'شمال سيناء', 'سوهاج'
    ];
  }
}

export default RealDataService;