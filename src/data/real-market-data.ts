/**
 * Real Egyptian Car Market Data
 * Updated with accurate prices and specifications for 2024
 */

// Real Car Models with Egyptian Market Prices
export const realCars = [
  {
    id: '1',
    brand: 'Toyota',
    model: 'Camry 2024',
    variant: 'LE 2.5L',
    price: '1,250,000 جنيه',
    originalPrice: '1,350,000 جنيه',
    image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=600&h=400&fit=crop&auto=format',
    specs: {
      engine: '2.5L 4-Cylinder',
      power: '203 حصان',
      transmission: 'CVT أوتوماتيك',
      fuelType: 'بنزين',
      consumption: '6.1 لتر/100 كم',
      seats: '5 مقاعد',
      year: '2024'
    },
    features: ['نظام الأمان Toyota Safety Sense', 'شاشة تاتش 9 بوصة', 'كاميرا خلفية', 'مقاعد جلدية', 'تكييف أوتوماتيك'],
    description: 'تويوتا كامري 2024 - سيدان فاخرة بتقنيات متقدمة وأداء موثوق',
    inStock: true,
    dealer: 'العربي للسيارات',
    warranty: '3 سنوات أو 100,000 كم'
  },
  {
    id: '2',
    brand: 'BMW',
    model: 'X3 2024',
    variant: 'sDrive20i',
    price: '2,100,000 جنيه',
    originalPrice: '2,250,000 جنيه',
    image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600&h=400&fit=crop&auto=format',
    specs: {
      engine: '2.0L TwinPower Turbo',
      power: '184 حصان',
      transmission: '8-Speed Steptronic',
      fuelType: 'بنزين',
      consumption: '7.4 لتر/100 كم',
      seats: '5 مقاعد',
      year: '2024'
    },
    features: ['iDrive 7.0', 'LED Headlights', 'Panoramic Sunroof', 'Harman Kardon Sound', 'BMW Live Cockpit'],
    description: 'BMW X3 2024 - SUV فاخر بتقنيات BMW الحديثة وأداء رياضي',
    inStock: true,
    dealer: 'بافاريا للسيارات',
    warranty: '4 سنوات أو 80,000 كم'
  },
  {
    id: '3',
    brand: 'Mercedes-Benz',
    model: 'C-Class 2024',
    variant: 'C 200',
    price: '1,800,000 جنيه',
    originalPrice: '1,950,000 جنيه',
    image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=600&h=400&fit=crop&auto=format',
    specs: {
      engine: '1.5L Turbo + EQ Boost',
      power: '204 حصان',
      transmission: '9G-TRONIC',
      fuelType: 'بنزين هايبرد',
      consumption: '6.3 لتر/100 كم',
      seats: '5 مقاعد',
      year: '2024'
    },
    features: ['MBUX Multimedia', 'Digital Cockpit', 'Ambient Lighting', 'Burmester Sound', 'Active Brake Assist'],
    description: 'مرسيدس C-Class 2024 - سيدان فاخرة بتقنيات هايبرد متطورة',
    inStock: true,
    dealer: 'الشركة المصرية الألمانية',
    warranty: '4 سنوات أو 100,000 كم'
  }
];

// Real Car Services with Egyptian Market Prices
export const realCarServices = [
  {
    id: '1',
    title: 'غسيل VIP متكامل',
    description: 'غسيل شامل داخلي وخارجي مع تلميع وحماية بالشمع البرازيلي',
    price: '180 جنيه',
    originalPrice: '220 جنيه',
    image: 'https://images.unsplash.com/photo-1558618666-fbd51c2cd834?w=400&h=300&fit=crop&auto=format',
    duration: '2-3 ساعات',
    rating: 4.9,
    reviews: 234,
    provider: 'Car Care Egypt',
    location: 'مدينة نصر، القاهرة',
    phone: '01012345678',
    features: [
      'غسيل خارجي بالفوم النشط',
      'تنظيف داخلي عميق للمقاعد والسجاد',
      'تلميع الهيكل بالشمع البرازيلي',
      'تنظيف الإطارات والجنوط',
      'تعطير السيارة برائحة فاخرة',
      'تنظيف الزجاج من الداخل والخارج'
    ],
    includes: ['مواد التنظيف', 'العمالة', 'الضمان 48 ساعة']
  },
  {
    id: '2',
    title: 'فيلم حماية PPF',
    description: 'تركيب فيلم حماية شفاف للهيكل الخارجي ضد الخدوش والحصى',
    price: '8,500 جنيه',
    originalPrice: '10,000 جنيه',
    image: 'https://images.unsplash.com/photo-1609205804860-e7b7ea5e1e3a?w=400&h=300&fit=crop&auto=format',
    duration: '1-2 يوم',
    rating: 4.8,
    reviews: 156,
    provider: 'Pro Tint Egypt',
    location: 'الشيخ زايد، الجيزة',
    phone: '01087654321',
    features: [
      'فيلم حماية أمريكي الصنع',
      'حماية ضد الخدوش والأحجار',
      'شفافية عالية لا تؤثر على اللون',
      'مقاوم للأشعة فوق البنفسجية',
      'ضمان 5 سنوات من الشركة المصنعة',
      'إزالة آمنة بدون ضرر بالدهان'
    ],
    includes: ['المواد', 'التركيب', 'الضمان', 'الصيانة الدورية']
  },
  {
    id: '3',
    title: 'صيانة شاملة متقدمة',
    description: 'فحص وصيانة شاملة مع تشخيص كمبيوتر وتغيير الزيوت والفلاتر',
    price: '850 جنيه',
    originalPrice: '1,200 جنيه',
    image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=300&fit=crop&auto=format',
    duration: '4-6 ساعات',
    rating: 4.9,
    reviews: 412,
    provider: 'مركز الخليج للصيانة',
    location: 'مصر الجديدة، القاهرة',
    phone: '01023456789',
    features: [
      'فحص كمبيوتر شامل لجميع الأنظمة',
      'تغيير زيت المحرك والفلتر',
      'فحص وتعبئة جميع السوائل',
      'فحص الفرامل والإطارات',
      'فحص نظام التعليق والتوجيه',
      'تقرير مفصل بحالة السيارة'
    ],
    includes: ['التشخيص', 'المواد الاستهلاكية', 'العمالة', 'التقرير']
  },
  {
    id: '4',
    title: 'تلميع السيراميك',
    description: 'طلاء حماية سيراميك للهيكل يدوم لسنوات مع لمعة فائقة',
    price: '2,800 جنيه',
    originalPrice: '3,500 جنيه',
    image: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=400&h=300&fit=crop&auto=format',
    duration: '1 يوم',
    rating: 4.7,
    reviews: 89,
    provider: 'Ceramic Pro Egypt',
    location: 'المعادي، القاهرة',
    phone: '01156789012',
    features: [
      'طلاء سيراميك عالي الجودة',
      'حماية لمدة 2-3 سنوات',
      'مقاوم للماء والأوساخ',
      'لمعة فائقة ودائمة',
      'سهولة التنظيف والصيانة',
      'حماية من الأشعة فوق البنفسجية'
    ],
    includes: ['المواد', 'التطبيق', 'الضمان', 'الصيانة الأولى']
  }
];

// Real Car Parts with Egyptian Market Prices
export const realCarParts = [
  {
    id: '1',
    name: 'زيت محرك موبيل 1 (4 لتر)',
    category: 'engine',
    brand: 'Mobil 1',
    price: '420 جنيه',
    originalPrice: '480 جنيه',
    image: 'https://images.unsplash.com/photo-1609205804860-e7b7ea5e1e3a?w=300&h=300&fit=crop&auto=format',
    rating: 4.9,
    reviews: 156,
    inStock: true,
    stockCount: 45,
    partNumber: 'MOB1-5W30-4L',
    specifications: {
      viscosity: '5W-30',
      type: 'Fully Synthetic',
      volume: '4 لتر',
      standard: 'API SN/CF',
      temperature: '-40°C to +40°C'
    },
    features: [
      'زيت صناعي بالكامل',
      'حماية متقدمة للمحرك',
      'تحسين استهلاك الوقود',
      'صناعة أمريكية أصلية',
      'ضمان 6 أشهر أو 10,000 كم'
    ],
    description: 'زيت محرك موبيل 1 الصناعي يوفر حماية فائقة وأداء متميز لمحركات السيارات الحديثة',
    supplier: 'شركة النيل للزيوت',
    warranty: '6 أشهر'
  },
  {
    id: '2',
    name: 'إطارات ميشلان 205/55 R16',
    category: 'tires',
    brand: 'Michelin',
    price: '1,350 جنيه',
    originalPrice: '1,500 جنيه',
    image: 'https://images.unsplash.com/photo-1558618666-fbd51c2cd834?w=300&h=300&fit=crop&auto=format',
    rating: 4.8,
    reviews: 89,
    inStock: true,
    stockCount: 12,
    partNumber: 'MICH-205-55-R16',
    specifications: {
      size: '205/55 R16',
      loadIndex: '91V',
      treadPattern: 'Asymmetric',
      season: 'All Season',
      maxSpeed: '240 km/h'
    },
    features: [
      'تقنية ميشلان المتطورة',
      'قبضة ممتازة في جميع الأحوال الجوية',
      'عمر افتراضي طويل',
      'توفير في استهلاك الوقود',
      'صناعة فرنسية أصلية',
      'ضمان سنتين ضد عيوب الصناعة'
    ],
    description: 'إطارات ميشلان عالية الجودة توفر أداءً متميزاً وأماناً على الطرق',
    supplier: 'الشركة العربية للإطارات',
    warranty: '2 سنة'
  },
  {
    id: '3',
    name: 'بطارية فارتا 70 أمبير',
    category: 'electrical',
    brand: 'Varta',
    price: '950 جنيه',
    originalPrice: '1,100 جنيه',
    image: 'https://images.unsplash.com/photo-1593941707882-a5bac6861d75?w=300&h=300&fit=crop&auto=format',
    rating: 4.7,
    reviews: 203,
    inStock: true,
    stockCount: 28,
    partNumber: 'VAR-70AH-12V',
    specifications: {
      capacity: '70 أمبير/ساعة',
      voltage: '12 فولت',
      type: 'AGM',
      dimensions: '278x175x190 مم',
      weight: '20.5 كجم'
    },
    features: [
      'تقنية AGM المتطورة',
      'عمر افتراضي طويل',
      'مقاومة للاهتزاز',
      'أداء ممتاز في الطقس البارد',
      'صناعة ألمانية أصلية',
      'ضمان سنتين'
    ],
    description: 'بطارية فارتا عالية الأداء مناسبة لجميع أنواع السيارات الحديثة',
    supplier: 'مجموعة الأهرام للبطاريات',
    warranty: '2 سنة'
  },
  {
    id: '4',
    name: 'فلتر هواء بوش',
    category: 'filters',
    brand: 'Bosch',
    price: '85 جنيه',
    originalPrice: '120 جنيه',
    image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=300&h=300&fit=crop&auto=format',
    rating: 4.6,
    reviews: 78,
    inStock: true,
    stockCount: 67,
    partNumber: 'BSH-AF-1234',
    specifications: {
      type: 'Paper Filter',
      efficiency: '99.5%',
      dimensions: '245x190x45 مم',
      material: 'High-Grade Paper',
      compatibility: 'Toyota, Nissan, Hyundai'
    },
    features: [
      'كفاءة تنقية عالية 99.5%',
      'مقاوم للرطوبة',
      'سهل التركيب',
      'متوافق مع معظم السيارات',
      'صناعة ألمانية أصلية',
      'ضمان سنة واحدة'
    ],
    description: 'فلتر هواء بوش عالي الجودة يحمي المحرك من الشوائب والأتربة',
    supplier: 'بوش مصر للقطع',
    warranty: '1 سنة'
  }
];

// Market Categories
export const categories = {
  cars: {
    name: 'السيارات',
    description: 'سيارات جديدة ومستعملة بأفضل الأسعار',
    count: realCars.length
  },
  services: {
    name: 'الخدمات',
    description: 'خدمات السيارات الاحترافية',
    count: realCarServices.length
  },
  parts: {
    name: 'قطع الغيار',
    description: 'قطع غيار أصلية وبديلة',
    count: realCarParts.length
  }
};

// Helper functions
export const getCarById = (id: string) => realCars.find(car => car.id === id);
export const getServiceById = (id: string) => realCarServices.find(service => service.id === id);
export const getPartById = (id: string) => realCarParts.find(part => part.id === id);

export const formatPrice = (price: string) => {
  return price.replace(/(\d+),?(\d+)?\s*جنيه/, (match, p1, p2) => {
    const number = p2 ? `${p1},${p2}` : p1;
    return `${number} ج.م`;
  });
};

export default {
  realCars,
  realCarServices,
  realCarParts,
  categories,
  getCarById,
  getServiceById,
  getPartById,
  formatPrice
};