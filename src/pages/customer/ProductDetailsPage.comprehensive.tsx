import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HeartIcon,
  ShareIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  MapPinIcon,
  StarIcon,
  CheckIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CameraIcon,
  ClockIcon,
  EyeIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  WrenchScrewdriverIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  FuelIcon,
  CogIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';

interface VehicleDetails {
  id: string;
  title: string;
  price: string;
  originalPrice?: string;
  location: string;
  images: string[];
  vendor: {
    name: string;
    rating: number;
    reviewCount: number;
    phone: string;
    address: string;
    verified: boolean;
    establishedYear: string;
    totalCars: number;
  };
  specs: {
    year: string;
    brand: string;
    model: string;
    fuel: string;
    transmission: string;
    mileage: string;
    engine: string;
    color: string;
    bodyType: string;
    drivetrain: string;
    cylinders: string;
    horsepower: string;
    torque: string;
  };
  features: string[];
  condition: 'new' | 'used' | 'excellent';
  verified: boolean;
  discount?: number;
  description: string;
  inspectionReport?: {
    overall: 'excellent' | 'good' | 'fair';
    engine: 'excellent' | 'good' | 'fair';
    exterior: 'excellent' | 'good' | 'fair';
    interior: 'excellent' | 'good' | 'fair';
    electrical: 'excellent' | 'good' | 'fair';
    lastInspection: string;
  };
  history: {
    owners: number;
    accidents: number;
    serviceRecords: number;
    lastService: string;
  };
  financing?: {
    available: boolean;
    downPayment: string;
    monthlyPayment: string;
    term: string;
  };
  warranty?: {
    available: boolean;
    duration: string;
    coverage: string;
  };
}

interface Review {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
  verified: boolean;
  carPurchased: string;
}

const ProductDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [vehicle, setVehicle] = useState<VehicleDetails | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isFavorite, setIsFavorite] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);

  // Mock data for demonstration
  const mockVehicle: VehicleDetails = {
    id: id || '1',
    title: 'تويوتا كامري 2021 - فل كامل بالجلد الطبيعي',
    price: '285,000',
    originalPrice: '320,000',
    location: 'الجيزة',
    images: [
      'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop',
    ],
    vendor: {
      name: 'شركة الأمان للسيارات',
      rating: 4.8,
      reviewCount: 156,
      phone: '01012345678',
      address: 'شارع الهرم، الجيزة، مصر',
      verified: true,
      establishedYear: '2015',
      totalCars: 450,
    },
    specs: {
      year: '2021',
      brand: 'تويوتا',
      model: 'كامري',
      fuel: 'بنزين',
      transmission: 'أوتوماتيك CVT',
      mileage: '45,000 كم',
      engine: '2.5 لتر 4 سلندر',
      color: 'أبيض لؤلؤي',
      bodyType: 'سيدان',
      drivetrain: 'دفع أمامي FWD',
      cylinders: '4 سلندر',
      horsepower: '203 حصان',
      torque: '247 نيوتن متر',
    },
    features: [
      'فتحة سقف بانوراما',
      'جلد طبيعي فاخر',
      'نظام ملاحة GPS متطور',
      'كاميرا خلفية عالية الدقة',
      'شاشة تاتش 9 بوصة',
      'تكييف أوتوماتيك ثلاث مناطق',
      'مقاعد كهربائية مع ذاكرة',
      'نظام صوتي JBL Premium',
      'نظام أمان Toyota Safety Sense 2.0',
      'إضاءة LED كاملة',
      'عجلات ألومنيوم 18 بوصة',
      'مرايا كهربائية قابلة للطي',
      'حساسات ركن أمامية وخلفية',
      'نظام تشغيل بصمة الإصبع',
      'شحن لاسلكي للهاتف',
      'منافذ USB متعددة',
    ],
    condition: 'excellent',
    verified: true,
    discount: 11,
    description: `
      سيارة تويوتا كامري 2021 في حالة ممتازة، تم شراؤها من الوكيل المعتمد وتم الاهتمام بها بشكل مثالي.
      
      🚗 **مميزات خاصة:**
      - صيانات دورية في التوكيل المعتمد
      - لم تتعرض لأي حوادث أو أضرار
      - جميع الأوراق سليمة ومحدثة
      - فحص شامل متاح عند الطلب
      - إمكانية التقسيط والتمويل
      
      📋 **تاريخ الخدمة:**
      - آخر صيانة: أكتوبر 2024
      - تغيير الزيت والفلاتر بانتظام
      - فحص شامل للفرامل والإطارات
      - تحديث نظام الملاحة والبرمجيات
      
      💰 **العرض الخاص:**
      - السعر قابل للتفاوض للجادين فقط
      - خصم نقدي للدفع الفوري
      - إمكانية استبدال السيارة القديمة
      - ضمان لمدة 6 أشهر
    `,
    inspectionReport: {
      overall: 'excellent',
      engine: 'excellent',
      exterior: 'excellent',
      interior: 'good',
      electrical: 'excellent',
      lastInspection: '2024-01-10',
    },
    history: {
      owners: 1,
      accidents: 0,
      serviceRecords: 8,
      lastService: '2024-01-05',
    },
    financing: {
      available: true,
      downPayment: '85,000',
      monthlyPayment: '8,500',
      term: '24 شهر',
    },
    warranty: {
      available: true,
      duration: '6 أشهر',
      coverage: 'شامل للمحرك وناقل الحركة',
    },
  };

  const mockReviews: Review[] = [
    {
      id: '1',
      customerName: 'أحمد محمد',
      rating: 5,
      comment: 'تعامل ممتاز وصدق في الوصف. السيارة كما هو موضح بالضبط والبائع محترم جداً. أنصح بالتعامل معه.',
      date: '2024-01-12',
      verified: true,
      carPurchased: 'هونداي إلنترا 2020',
    },
    {
      id: '2',
      customerName: 'فاطمة أحمد',
      rating: 4,
      comment: 'سيارة جميلة وحالة جيدة، لكن السعر كان مرتفع قليلاً. بشكل عام تجربة جيدة والبائع متعاون.',
      date: '2024-01-08',
      verified: true,
      carPurchased: 'تويوتا يارس 2019',
    },
    {
      id: '3',
      customerName: 'محمود حسن',
      rating: 5,
      comment: 'أفضل معرض تعاملت معه. شفافية كاملة في العرض وضمان حقيقي. السيارة ممتازة وبدون أي مشاكل.',
      date: '2024-01-03',
      verified: true,
      carPurchased: 'نيسان صني 2021',
    },
  ];

  useEffect(() => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setVehicle(mockVehicle);
      setReviews(mockReviews);
      setIsLoading(false);
    }, 1000);
  }, [id]);

  const handlePreviousImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? (vehicle?.images.length || 1) - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === (vehicle?.images.length || 1) - 1 ? 0 : prev + 1
    );
  };

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    toast.success(isFavorite ? 'تم إزالة السيارة من المفضلة' : 'تم إضافة السيارة إلى المفضلة');
  };

  const handleContactVendor = () => {
    if (!user) {
      toast.error('يجب تسجيل الدخول أولاً');
      navigate('/login');
      return;
    }
    setShowContactForm(true);
  };

  const handleCallVendor = () => {
    if (vehicle?.vendor.phone) {
      window.open(`tel:${vehicle.vendor.phone}`);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: vehicle?.title,
          text: `اكتشف هذه السيارة الرائعة: ${vehicle?.title}`,
          url: window.location.href,
        });
      } else {
        navigator.clipboard.writeText(window.location.href);
        toast.success('تم نسخ رابط السيارة');
      }
    } catch (error) {
      navigator.clipboard.writeText(window.location.href);
      toast.success('تم نسخ رابط السيارة');
    }
  };

  const getConditionText = (condition: string) => {
    switch (condition) {
      case 'excellent': return 'ممتازة';
      case 'good': return 'جيدة';
      case 'fair': return 'مقبولة';
      default: return condition;
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'fair': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const tabs = [
    { id: 'overview', name: 'نظرة عامة', icon: EyeIcon },
    { id: 'specs', name: 'المواصفات', icon: CogIcon },
    { id: 'inspection', name: 'تقرير الفحص', icon: ShieldCheckIcon },
    { id: 'history', name: 'تاريخ السيارة', icon: DocumentTextIcon },
    { id: 'financing', name: 'التمويل', icon: CurrencyDollarIcon },
    { id: 'reviews', name: 'التقييمات', icon: StarIcon },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">جاري تحميل تفاصيل السيارة...</h2>
          <p className="text-gray-600">يرجى الانتظار لحظات</p>
        </motion.div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚗</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">السيارة غير موجودة</h2>
          <p className="text-gray-600 mb-6">لم نتمكن من العثور على السيارة المطلوبة</p>
          <motion.button
            onClick={() => navigate('/marketplace')}
            className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            العودة إلى السوق
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <motion.nav
          className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600 mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button onClick={() => navigate('/')} className="hover:text-primary-600">
            الرئيسية
          </button>
          <ChevronLeftIcon className="w-4 h-4" />
          <button onClick={() => navigate('/marketplace')} className="hover:text-primary-600">
            السوق
          </button>
          <ChevronLeftIcon className="w-4 h-4" />
          <span className="text-gray-900 font-medium">تفاصيل السيارة</span>
        </motion.nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <motion.div
              className="bg-white rounded-xl shadow-lg overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="relative">
                <img
                  src={vehicle.images[currentImageIndex]}
                  alt={vehicle.title}
                  className="w-full h-96 object-cover cursor-zoom-in"
                  onClick={() => setShowImageModal(true)}
                />
                
                {/* Navigation Arrows */}
                <button
                  onClick={handlePreviousImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>

                {/* Image Counter */}
                <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                  {currentImageIndex + 1} / {vehicle.images.length}
                </div>

                {/* Badges */}
                <div className="absolute top-4 right-4 flex flex-col space-y-2">
                  {vehicle.verified && (
                    <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                      ✓ موثق
                    </span>
                  )}
                  <span className={`text-white text-xs px-3 py-1 rounded-full font-medium ${
                    vehicle.condition === 'new' ? 'bg-blue-500' : 
                    vehicle.condition === 'excellent' ? 'bg-green-500' : 'bg-orange-500'
                  }`}>
                    {vehicle.condition === 'new' ? 'جديد' : 
                     vehicle.condition === 'excellent' ? 'ممتاز' : 'مستعمل'}
                  </span>
                  {vehicle.discount && (
                    <span className="bg-red-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                      خصم {vehicle.discount}%
                    </span>
                  )}
                </div>
              </div>

              {/* Thumbnail Gallery */}
              <div className="p-4">
                <div className="flex space-x-2 space-x-reverse overflow-x-auto">
                  {vehicle.images.map((image, index) => (
                    <motion.button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                        index === currentImageIndex ? 'border-primary-500' : 'border-transparent'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <img
                        src={image}
                        alt={`صورة ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Vehicle Info */}
            <motion.div
              className="bg-white rounded-xl shadow-lg p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{vehicle.title}</h1>
                  <div className="flex items-center space-x-4 space-x-reverse text-gray-600">
                    <div className="flex items-center space-x-1 space-x-reverse">
                      <MapPinIcon className="w-4 h-4" />
                      <span>{vehicle.location}</span>
                    </div>
                    <div className="flex items-center space-x-1 space-x-reverse">
                      <CalendarIcon className="w-4 h-4" />
                      <span>موديل {vehicle.specs.year}</span>
                    </div>
                    <div className="flex items-center space-x-1 space-x-reverse">
                      <EyeIcon className="w-4 h-4" />
                      <span>1,247 مشاهدة</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <motion.button
                    onClick={handleToggleFavorite}
                    className={`p-2 rounded-full transition-colors ${
                      isFavorite ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600 hover:text-red-600'
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <HeartIcon className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                  </motion.button>
                  <motion.button
                    onClick={handleShare}
                    className="p-2 rounded-full bg-gray-100 text-gray-600 hover:text-primary-600 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <ShareIcon className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>

              {/* Price */}
              <div className="border-t border-b border-gray-200 py-6 mb-6">
                <div className="flex items-baseline justify-between">
                  <div>
                    <div className="flex items-baseline space-x-3 space-x-reverse">
                      <span className="text-4xl font-bold text-primary-600">
                        {vehicle.price} جنيه
                      </span>
                      {vehicle.originalPrice && vehicle.originalPrice !== vehicle.price && (
                        <span className="text-xl text-gray-500 line-through">
                          {vehicle.originalPrice} جنيه
                        </span>
                      )}
                    </div>
                    {vehicle.financing && (
                      <p className="text-sm text-gray-600 mt-2">
                        أو {vehicle.financing.monthlyPayment} جنيه شهرياً لمدة {vehicle.financing.term}
                      </p>
                    )}
                  </div>
                  {vehicle.discount && (
                    <div className="text-center">
                      <div className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold">
                        خصم {vehicle.discount}%
                      </div>
                      <div className="text-sm text-green-600 mt-1">
                        توفير {parseInt(vehicle.originalPrice?.replace(/,/g, '') || '0') - parseInt(vehicle.price.replace(/,/g, ''))} جنيه
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Key Specs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <CalendarIcon className="w-6 h-6 text-primary-500 mx-auto mb-1" />
                  <div className="text-sm text-gray-600">السنة</div>
                  <div className="font-semibold">{vehicle.specs.year}</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <FuelIcon className="w-6 h-6 text-primary-500 mx-auto mb-1" />
                  <div className="text-sm text-gray-600">الوقود</div>
                  <div className="font-semibold">{vehicle.specs.fuel}</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <CogIcon className="w-6 h-6 text-primary-500 mx-auto mb-1" />
                  <div className="text-sm text-gray-600">ناقل الحركة</div>
                  <div className="font-semibold">{vehicle.specs.transmission}</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <ClockIcon className="w-6 h-6 text-primary-500 mx-auto mb-1" />
                  <div className="text-sm text-gray-600">المسافة</div>
                  <div className="font-semibold">{vehicle.specs.mileage}</div>
                </div>
              </div>

              {/* Description Preview */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">وصف السيارة</h3>
                <div className="prose prose-sm max-w-none text-gray-600">
                  {vehicle.description.split('\n').slice(0, 3).map((line, index) => (
                    <p key={index}>{line}</p>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Tabs */}
            <motion.div
              className="bg-white rounded-xl shadow-lg overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {/* Tab Navigation */}
              <div className="border-b">
                <div className="flex overflow-x-auto">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-2 space-x-reverse px-6 py-4 border-b-2 transition-colors whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'border-primary-500 text-primary-600 bg-primary-50'
                          : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <tab.icon className="w-5 h-5" />
                      <span className="font-medium">{tab.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                      <div className="space-y-6">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">وصف مفصل</h4>
                          <div className="prose prose-sm max-w-none text-gray-600">
                            {vehicle.description.split('\n').map((line, index) => (
                              <p key={index}>{line}</p>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold text-gray-900 mb-4">المميزات الرئيسية</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {vehicle.features.map((feature, index) => (
                              <div key={index} className="flex items-center space-x-2 space-x-reverse">
                                <CheckIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                                <span className="text-gray-700">{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Specifications Tab */}
                    {activeTab === 'specs' && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-4">المحرك والأداء</h4>
                            <div className="space-y-3">
                              <div className="flex justify-between py-2 border-b border-gray-100">
                                <span className="text-gray-600">المحرك</span>
                                <span className="font-medium">{vehicle.specs.engine}</span>
                              </div>
                              <div className="flex justify-between py-2 border-b border-gray-100">
                                <span className="text-gray-600">القوة</span>
                                <span className="font-medium">{vehicle.specs.horsepower}</span>
                              </div>
                              <div className="flex justify-between py-2 border-b border-gray-100">
                                <span className="text-gray-600">العزم</span>
                                <span className="font-medium">{vehicle.specs.torque}</span>
                              </div>
                              <div className="flex justify-between py-2 border-b border-gray-100">
                                <span className="text-gray-600">عدد السلندرات</span>
                                <span className="font-medium">{vehicle.specs.cylinders}</span>
                              </div>
                              <div className="flex justify-between py-2">
                                <span className="text-gray-600">نظام الدفع</span>
                                <span className="font-medium">{vehicle.specs.drivetrain}</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-semibold text-gray-900 mb-4">المواصفات العامة</h4>
                            <div className="space-y-3">
                              <div className="flex justify-between py-2 border-b border-gray-100">
                                <span className="text-gray-600">نوع الهيكل</span>
                                <span className="font-medium">{vehicle.specs.bodyType}</span>
                              </div>
                              <div className="flex justify-between py-2 border-b border-gray-100">
                                <span className="text-gray-600">اللون</span>
                                <span className="font-medium">{vehicle.specs.color}</span>
                              </div>
                              <div className="flex justify-between py-2 border-b border-gray-100">
                                <span className="text-gray-600">ناقل الحركة</span>
                                <span className="font-medium">{vehicle.specs.transmission}</span>
                              </div>
                              <div className="flex justify-between py-2 border-b border-gray-100">
                                <span className="text-gray-600">نوع الوقود</span>
                                <span className="font-medium">{vehicle.specs.fuel}</span>
                              </div>
                              <div className="flex justify-between py-2">
                                <span className="text-gray-600">عداد المسافات</span>
                                <span className="font-medium">{vehicle.specs.mileage}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Inspection Report Tab */}
                    {activeTab === 'inspection' && vehicle.inspectionReport && (
                      <div className="space-y-6">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center space-x-2 space-x-reverse mb-2">
                            <ShieldCheckIcon className="w-5 h-5 text-green-600" />
                            <h4 className="font-semibold text-green-900">تقرير فحص معتمد</h4>
                          </div>
                          <p className="text-green-700 text-sm">
                            تم فحص السيارة بواسطة خبراء معتمدين في {new Date(vehicle.inspectionReport.lastInspection).toLocaleDateString('ar-EG')}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {[
                            { key: 'overall', label: 'التقييم العام' },
                            { key: 'engine', label: 'المحرك' },
                            { key: 'exterior', label: 'الهيكل الخارجي' },
                            { key: 'interior', label: 'التشطيب الداخلي' },
                            { key: 'electrical', label: 'النظام الكهربائي' },
                          ].map(({ key, label }) => (
                            <div key={key} className="bg-gray-50 rounded-lg p-4 text-center">
                              <h5 className="font-medium text-gray-900 mb-2">{label}</h5>
                              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                getConditionColor(vehicle.inspectionReport![key as keyof typeof vehicle.inspectionReport])
                              }`}>
                                {getConditionText(vehicle.inspectionReport![key as keyof typeof vehicle.inspectionReport])}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="font-semibold text-blue-900 mb-2">ملاحظات الفحص</h4>
                          <ul className="text-blue-700 text-sm space-y-1">
                            <li>• المحرك يعمل بكفاءة عالية وبدون أصوات غريبة</li>
                            <li>• الفرامل في حالة ممتازة وتم تغيير التيل مؤخراً</li>
                            <li>• الإطارات بحالة جيدة مع عمق مداس آمن</li>
                            <li>• جميع الأنظمة الكهربائية تعمل بصورة طبيعية</li>
                            <li>• لا توجد آثار صدأ أو تآكل في الهيكل</li>
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* History Tab */}
                    {activeTab === 'history' && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-green-600">{vehicle.history.owners}</div>
                            <div className="text-sm text-green-700">مالك سابق</div>
                          </div>
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-red-600">{vehicle.history.accidents}</div>
                            <div className="text-sm text-red-700">حادث</div>
                          </div>
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-blue-600">{vehicle.history.serviceRecords}</div>
                            <div className="text-sm text-blue-700">سجل صيانة</div>
                          </div>
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                            <div className="text-xs text-purple-700 mb-1">آخر صيانة</div>
                            <div className="text-sm font-semibold text-purple-600">
                              {new Date(vehicle.history.lastService).toLocaleDateString('ar-EG')}
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 mb-3">سجل الصيانة</h4>
                          <div className="space-y-3">
                            {[
                              { date: '2024-01-05', service: 'صيانة دورية شاملة', cost: '850 جنيه' },
                              { date: '2023-10-15', service: 'تغيير زيت المحرك والفلاتر', cost: '420 جنيه' },
                              { date: '2023-07-20', service: 'فحص وضبط الفرامل', cost: '320 جنيه' },
                              { date: '2023-04-10', service: 'تغيير إطارات أمامية', cost: '1,200 جنيه' },
                              { date: '2023-01-15', service: 'صيانة نظام التكييف', cost: '650 جنيه' },
                            ].map((record, index) => (
                              <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                                <div>
                                  <div className="font-medium text-gray-900">{record.service}</div>
                                  <div className="text-sm text-gray-600">{record.date}</div>
                                </div>
                                <div className="font-semibold text-primary-600">{record.cost}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Financing Tab */}
                    {activeTab === 'financing' && vehicle.financing && (
                      <div className="space-y-6">
                        <div className="bg-gradient-to-r from-primary-50 to-secondary-50 border border-primary-200 rounded-lg p-6">
                          <h4 className="font-semibold text-primary-900 mb-4">عرض التمويل الحصري</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-primary-600">{vehicle.financing.downPayment}</div>
                              <div className="text-sm text-primary-700">دفعة أولى</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-primary-600">{vehicle.financing.monthlyPayment}</div>
                              <div className="text-sm text-primary-700">قسط شهري</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-primary-600">{vehicle.financing.term}</div>
                              <div className="text-sm text-primary-700">مدة التمويل</div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <h5 className="font-semibold text-gray-900 mb-3">مزايا التمويل</h5>
                            <ul className="space-y-2 text-sm text-gray-600">
                              <li className="flex items-center space-x-2 space-x-reverse">
                                <CheckIcon className="w-4 h-4 text-green-500" />
                                <span>موافقة فورية في 24 ساعة</span>
                              </li>
                              <li className="flex items-center space-x-2 space-x-reverse">
                                <CheckIcon className="w-4 h-4 text-green-500" />
                                <span>أسعار فائدة تنافسية</span>
                              </li>
                              <li className="flex items-center space-x-2 space-x-reverse">
                                <CheckIcon className="w-4 h-4 text-green-500" />
                                <span>مرونة في جدولة الأقساط</span>
                              </li>
                              <li className="flex items-center space-x-2 space-x-reverse">
                                <CheckIcon className="w-4 h-4 text-green-500" />
                                <span>بدون رسوم إدارية</span>
                              </li>
                              <li className="flex items-center space-x-2 space-x-reverse">
                                <CheckIcon className="w-4 h-4 text-green-500" />
                                <span>إمكانية السداد المبكر</span>
                              </li>
                            </ul>
                          </div>

                          <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <h5 className="font-semibold text-gray-900 mb-3">المستندات المطلوبة</h5>
                            <ul className="space-y-2 text-sm text-gray-600">
                              <li>• صورة بطاقة الرقم القومي</li>
                              <li>• كشف حساب بنكي لآخر 3 أشهر</li>
                              <li>• إثبات الدخل الشهري</li>
                              <li>• صورة فاتورة مرافق حديثة</li>
                              <li>• شهادة العمل أو السجل التجاري</li>
                            </ul>
                          </div>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <div className="flex items-start space-x-2 space-x-reverse">
                            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <h5 className="font-semibold text-yellow-900 mb-1">ملاحظة هامة</h5>
                              <p className="text-yellow-800 text-sm">
                                المبالغ المذكورة تقديرية وتخضع لموافقة الجهة الممولة. قد تختلف شروط التمويل حسب التقييم الائتماني للعميل.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Reviews Tab */}
                    {activeTab === 'reviews' && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-gray-900">تقييمات العملاء</h4>
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <StarIcon className="w-5 h-5 text-yellow-400 fill-current" />
                            <span className="font-semibold">{vehicle.vendor.rating}</span>
                            <span className="text-gray-500">({vehicle.vendor.reviewCount} تقييم)</span>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {reviews.map((review) => (
                            <div key={review.id} className="bg-gray-50 rounded-lg p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center space-x-3 space-x-reverse">
                                  <div className="w-10 h-10 bg-primary-500 text-white rounded-full flex items-center justify-center font-semibold">
                                    {review.customerName.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="font-medium text-gray-900">{review.customerName}</div>
                                    <div className="flex items-center space-x-1 space-x-reverse">
                                      <div className="flex">
                                        {[...Array(5)].map((_, i) => (
                                          <StarIcon
                                            key={i}
                                            className={`w-4 h-4 ${
                                              i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                            }`}
                                          />
                                        ))}
                                      </div>
                                      {review.verified && (
                                        <span className="text-green-600 text-xs">✓ مؤكد</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-sm text-gray-500">
                                  {new Date(review.date).toLocaleDateString('ar-EG')}
                                </div>
                              </div>
                              <p className="text-gray-700 mb-2">{review.comment}</p>
                              <div className="text-sm text-gray-500">
                                تم شراء: {review.carPurchased}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Vendor Info */}
              <motion.div
                className="bg-white rounded-xl shadow-lg p-6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl font-bold text-primary-600">
                      {vehicle.vendor.name.charAt(0)}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{vehicle.vendor.name}</h3>
                  <div className="flex items-center justify-center space-x-1 space-x-reverse mb-2">
                    <StarIcon className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="font-semibold">{vehicle.vendor.rating}</span>
                    <span className="text-gray-500 text-sm">({vehicle.vendor.reviewCount})</span>
                    {vehicle.vendor.verified && (
                      <CheckIcon className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{vehicle.vendor.address}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="font-semibold text-gray-900">منذ {vehicle.vendor.establishedYear}</div>
                    <div className="text-xs text-gray-600">سنة تأسيس</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-gray-900">{vehicle.vendor.totalCars}+</div>
                    <div className="text-xs text-gray-600">سيارة متاحة</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <motion.button
                    onClick={handleCallVendor}
                    className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center space-x-2 space-x-reverse"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <PhoneIcon className="w-5 h-5" />
                    <span>اتصال مباشر</span>
                  </motion.button>
                  
                  <motion.button
                    onClick={handleContactVendor}
                    className="w-full bg-primary-500 hover:bg-primary-600 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center space-x-2 space-x-reverse"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ChatBubbleLeftRightIcon className="w-5 h-5" />
                    <span>إرسال رسالة</span>
                  </motion.button>

                  <motion.button
                    className="w-full border border-primary-500 text-primary-500 hover:bg-primary-50 py-3 px-4 rounded-lg font-medium"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    عرض جميع سيارات المعرض
                  </motion.button>
                </div>
              </motion.div>

              {/* Quick Actions */}
              <motion.div
                className="bg-white rounded-xl shadow-lg p-6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h3 className="font-bold text-gray-900 mb-4">إجراءات سريعة</h3>
                <div className="space-y-3">
                  <motion.button
                    className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <WrenchScrewdriverIcon className="w-5 h-5 text-gray-500" />
                      <span className="text-gray-700">طلب فحص</span>
                    </div>
                    <ChevronLeftIcon className="w-4 h-4 text-gray-400" />
                  </motion.button>

                  <motion.button
                    className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <CurrencyDollarIcon className="w-5 h-5 text-gray-500" />
                      <span className="text-gray-700">طلب تمويل</span>
                    </div>
                    <ChevronLeftIcon className="w-4 h-4 text-gray-400" />
                  </motion.button>

                  <motion.button
                    className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <DocumentTextIcon className="w-5 h-5 text-gray-500" />
                      <span className="text-gray-700">طلب تقرير مفصل</span>
                    </div>
                    <ChevronLeftIcon className="w-4 h-4 text-gray-400" />
                  </motion.button>
                </div>
              </motion.div>

              {/* Safety Notice */}
              <motion.div
                className="bg-yellow-50 border border-yellow-200 rounded-xl p-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="flex items-start space-x-2 space-x-reverse">
                  <ShieldCheckIcon className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-900 mb-1">نصائح للأمان</h4>
                    <ul className="text-yellow-800 text-sm space-y-1">
                      <li>• تأكد من فحص السيارة قبل الشراء</li>
                      <li>• تحقق من الأوراق والوثائق</li>
                      <li>• لا تدفع أي مبالغ قبل المعاينة</li>
                      <li>• استخدم طرق الدفع الآمنة</li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-5xl w-full h-full flex items-center justify-center">
            <motion.button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-full flex items-center justify-center z-10"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <XMarkIcon className="w-5 h-5" />
            </motion.button>
            
            <motion.img
              src={vehicle.images[currentImageIndex]}
              alt={vehicle.title}
              className="max-w-full max-h-full object-contain"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            />

            <button
              onClick={handlePreviousImage}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-full flex items-center justify-center"
            >
              <ChevronRightIcon className="w-6 h-6" />
            </button>
            
            <button
              onClick={handleNextImage}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-full flex items-center justify-center"
            >
              <ChevronLeftIcon className="w-6 h-6" />
            </button>

            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full">
              {currentImageIndex + 1} / {vehicle.images.length}
            </div>
          </div>
        </div>
      )}

      {/* Contact Form Modal */}
      {showContactForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <motion.div
            className="bg-white rounded-xl max-w-md w-full p-6"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">إرسال رسالة للبائع</h3>
              <button
                onClick={() => setShowContactForm(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الرسالة</label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  rows={4}
                  placeholder={`مرحباً، أنا مهتم بسيارة ${vehicle.title}. يرجى التواصل معي.`}
                ></textarea>
              </div>
              
              <div className="flex space-x-3 space-x-reverse">
                <motion.button
                  type="submit"
                  className="flex-1 bg-primary-500 hover:bg-primary-600 text-white py-2 px-4 rounded-lg font-medium"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    toast.success('تم إرسال الرسالة بنجاح');
                    setShowContactForm(false);
                  }}
                >
                  إرسال الرسالة
                </motion.button>
                <button
                  type="button"
                  onClick={() => setShowContactForm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailsPage;