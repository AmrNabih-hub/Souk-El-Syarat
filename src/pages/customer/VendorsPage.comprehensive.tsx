import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  PhoneIcon,
  StarIcon,
  CheckIcon,
  EyeIcon,
  BuildingStorefrontIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  FunnelIcon,
  ShieldCheckIcon,
  CalendarIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';
import { useAppStore } from '@/stores/appStore';
import toast from 'react-hot-toast';

interface Vendor {
  id: string;
  name: string;
  description: string;
  rating: number;
  reviewCount: number;
  location: {
    city: string;
    area: string;
    address: string;
    coordinates?: { lat: number; lng: number };
  };
  contact: {
    phone: string;
    whatsapp?: string;
    email?: string;
  };
  specialties: string[];
  totalCars: number;
  establishedYear: string;
  verified: boolean;
  premium: boolean;
  images: string[];
  workingHours: {
    saturday: string;
    sunday: string;
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
  };
  services: string[];
  achievements: string[];
  priceRange: 'budget' | 'mid' | 'premium' | 'luxury';
}

interface FilterState {
  searchQuery: string;
  city: string;
  specialty: string;
  priceRange: string;
  rating: number;
  verified: boolean;
}

const VendorsPage: React.FC = () => {
  const { language } = useAppStore();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('rating');

  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    city: '',
    specialty: '',
    priceRange: '',
    rating: 0,
    verified: false,
  });

  // Mock Egyptian automotive vendors data
  const mockVendors: Vendor[] = [
    {
      id: '1',
      name: 'شركة الأمان للسيارات',
      description: 'معرض متخصص في السيارات اليابانية والأمريكية بأفضل الأسعار في السوق المصري. خبرة تزيد عن 15 سنة في مجال تجارة السيارات.',
      rating: 4.8,
      reviewCount: 156,
      location: {
        city: 'الجيزة',
        area: 'الهرم',
        address: 'شارع الهرم، أمام مترو الجيزة، الجيزة',
        coordinates: { lat: 30.0131, lng: 31.2089 }
      },
      contact: {
        phone: '01012345678',
        whatsapp: '01012345678',
        email: 'info@alamancare.com'
      },
      specialties: ['تويوتا', 'هوندا', 'نيسان', 'فورد', 'شيفروليه'],
      totalCars: 450,
      establishedYear: '2008',
      verified: true,
      premium: true,
      images: [
        'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=600&h=400&fit=crop'
      ],
      workingHours: {
        saturday: '9:00 ص - 9:00 م',
        sunday: '9:00 ص - 9:00 م',
        monday: '9:00 ص - 9:00 م',
        tuesday: '9:00 ص - 9:00 م',
        wednesday: '9:00 ص - 9:00 م',
        thursday: '9:00 ص - 9:00 م',
        friday: 'مغلق'
      },
      services: ['تمويل السيارات', 'فحص شامل', 'ضمان شامل', 'خدمة ما بعد البيع', 'استبدال السيارات'],
      achievements: ['أفضل معرض 2023', 'عضو اتحاد تجار السيارات', 'شهادة الجودة ISO'],
      priceRange: 'mid'
    },
    {
      id: '2',
      name: 'معرض الفخامة للسيارات المميزة',
      description: 'متخصصون في السيارات الأوروبية الفاخرة مع خدمة عملاء مميزة وضمان شامل. نوفر أحدث موديلات مرسيدس وBMW وأودي.',
      rating: 4.9,
      reviewCount: 89,
      location: {
        city: 'القاهرة',
        area: 'القاهرة الجديدة',
        address: 'التجمع الخامس، خلف مول القاهرة الجديدة',
      },
      contact: {
        phone: '01098765432',
        whatsapp: '01098765432',
        email: 'luxury@cars-eg.com'
      },
      specialties: ['مرسيدس', 'BMW', 'أودي', 'لكزس', 'جاكوار'],
      totalCars: 180,
      establishedYear: '2012',
      verified: true,
      premium: true,
      images: [
        'https://images.unsplash.com/photo-1606016937473-509d8ff3b4a9?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=600&h=400&fit=crop'
      ],
      workingHours: {
        saturday: '10:00 ص - 8:00 م',
        sunday: '10:00 ص - 8:00 م',
        monday: '10:00 ص - 8:00 م',
        tuesday: '10:00 ص - 8:00 م',
        wednesday: '10:00 ص - 8:00 م',
        thursday: '10:00 ص - 8:00 م',
        friday: 'مغلق'
      },
      services: ['فحص متطور', 'ضمان ممتد', 'تمويل فوري', 'صيانة دورية', 'خدمة VIP'],
      achievements: ['معرض السنة 2022', 'أعلى تقييم في القاهرة', 'شريك معتمد'],
      priceRange: 'luxury'
    },
    {
      id: '3',
      name: 'الإسكندرية موتورز',
      description: 'معرض عائلي متخصص في السيارات الاقتصادية والمتوسطة. نقدم أفضل الأسعار مع ضمان الجودة والصدق في التعامل.',
      rating: 4.6,
      reviewCount: 203,
      location: {
        city: 'الإسكندرية',
        area: 'سموحة',
        address: 'شارع فوزي معاذ، سموحة، الإسكندرية',
      },
      contact: {
        phone: '01155443322',
        whatsapp: '01155443322'
      },
      specialties: ['هونداي', 'كيا', 'شيفروليه', 'رينو', 'سكودا'],
      totalCars: 320,
      establishedYear: '2015',
      verified: true,
      premium: false,
      images: [
        'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600&h=400&fit=crop'
      ],
      workingHours: {
        saturday: '9:00 ص - 7:00 م',
        sunday: '9:00 ص - 7:00 م',
        monday: '9:00 ص - 7:00 م',
        tuesday: '9:00 ص - 7:00 م',
        wednesday: '9:00 ص - 7:00 م',
        thursday: '9:00 ص - 7:00 م',
        friday: '12:00 م - 4:00 م'
      },
      services: ['تقسيط مريح', 'فحص مجاني', 'ضمان 6 أشهر', 'استبدال مقبول'],
      achievements: ['الأكثر مبيعاً في الإسكندرية', 'خدمة عملاء ممتازة'],
      priceRange: 'budget'
    },
    {
      id: '4',
      name: 'معرض النجمة للسيارات',
      description: 'نتخصص في السيارات الكورية الحديثة مع قطع الغيار الأصلية وخدمات الصيانة. فروع في القاهرة والمعادي.',
      rating: 4.5,
      reviewCount: 134,
      location: {
        city: 'القاهرة',
        area: 'المعادي',
        address: 'شارع النصر، المعادي، القاهرة',
      },
      contact: {
        phone: '01077889900',
        whatsapp: '01077889900',
        email: 'najma@cars.com'
      },
      specialties: ['هونداي', 'كيا', 'جينسيس', 'سانج يونج'],
      totalCars: 275,
      establishedYear: '2010',
      verified: true,
      premium: false,
      images: [
        'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600&h=400&fit=crop'
      ],
      workingHours: {
        saturday: '8:00 ص - 8:00 م',
        sunday: '8:00 ص - 8:00 م',
        monday: '8:00 ص - 8:00 م',
        tuesday: '8:00 ص - 8:00 م',
        wednesday: '8:00 ص - 8:00 م',
        thursday: '8:00 ص - 8:00 م',
        friday: 'مغلق'
      },
      services: ['صيانة معتمدة', 'قطع غيار أصلية', 'تمويل سريع', 'خدمات تأمين'],
      achievements: ['وكيل معتمد', 'أفضل خدمة 2023'],
      priceRange: 'mid'
    },
    {
      id: '5',
      name: 'معرض الدلتا للسيارات',
      description: 'معرض حديث في المنصورة يقدم تشكيلة واسعة من السيارات الأمريكية والأوروبية بأسعار منافسة.',
      rating: 4.4,
      reviewCount: 92,
      location: {
        city: 'المنصورة',
        area: 'وسط البلد',
        address: 'شارع الجمهورية، المنصورة، الدقهلية',
      },
      contact: {
        phone: '01033776655'
      },
      specialties: ['فورد', 'شيفروليه', 'أوبل', 'فولكس واجن'],
      totalCars: 150,
      establishedYear: '2018',
      verified: false,
      premium: false,
      images: [
        'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=600&h=400&fit=crop'
      ],
      workingHours: {
        saturday: '9:00 ص - 6:00 م',
        sunday: '9:00 ص - 6:00 م',
        monday: '9:00 ص - 6:00 م',
        tuesday: '9:00 ص - 6:00 م',
        wednesday: '9:00 ص - 6:00 م',
        thursday: '9:00 ص - 6:00 م',
        friday: 'مغلق'
      },
      services: ['تقسيط مرن', 'فحص فني', 'ضمان محدود'],
      achievements: ['معرض ناشئ واعد'],
      priceRange: 'budget'
    },
    {
      id: '6',
      name: 'معرض أوروبا للسيارات',
      description: 'متخصصون في السيارات الأوروبية الأصلية مع إمكانيات استيراد حسب الطلب. خبرة عالمية في السوق المصري.',
      rating: 4.7,
      reviewCount: 67,
      location: {
        city: 'الزقازيق',
        area: 'الصاغة',
        address: 'شارع فريد ندا، الصاغة، الزقازيق',
      },
      contact: {
        phone: '01122334455',
        email: 'europa@cars-egypt.com'
      },
      specialties: ['فولكس واجن', 'سكودا', 'سيات', 'بيجو', 'رينو'],
      totalCars: 95,
      establishedYear: '2016',
      verified: true,
      premium: false,
      images: [
        'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=600&h=400&fit=crop'
      ],
      workingHours: {
        saturday: '10:00 ص - 7:00 م',
        sunday: '10:00 ص - 7:00 م',
        monday: '10:00 ص - 7:00 م',
        tuesday: '10:00 ص - 7:00 م',
        wednesday: '10:00 ص - 7:00 م',
        thursday: '10:00 ص - 7:00 م',
        friday: 'مغلق'
      },
      services: ['استيراد حسب الطلب', 'فحص أوروبي', 'ضمان أوروبي'],
      achievements: ['شراكات أوروبية', 'جودة مضمونة'],
      priceRange: 'premium'
    }
  ];

  const egyptianCities = ['القاهرة', 'الجيزة', 'الإسكندرية', 'المنصورة', 'الزقازيق', 'طنطا', 'أسوان', 'الأقصر'];
  const specialties = ['تويوتا', 'مرسيدس', 'BMW', 'هوندا', 'هونداي', 'نيسان', 'فورد', 'شيفروليه', 'كيا', 'فولكس واجن'];

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setVendors(mockVendors);
      setFilteredVendors(mockVendors);
      setIsLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    let filtered = [...vendors];

    if (filters.searchQuery) {
      filtered = filtered.filter(vendor => 
        vendor.name.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        vendor.description.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        vendor.specialties.some(specialty => specialty.toLowerCase().includes(filters.searchQuery.toLowerCase()))
      );
    }

    if (filters.city) {
      filtered = filtered.filter(vendor => vendor.location.city === filters.city);
    }

    if (filters.specialty) {
      filtered = filtered.filter(vendor => vendor.specialties.includes(filters.specialty));
    }

    if (filters.priceRange) {
      filtered = filtered.filter(vendor => vendor.priceRange === filters.priceRange);
    }

    if (filters.rating > 0) {
      filtered = filtered.filter(vendor => vendor.rating >= filters.rating);
    }

    if (filters.verified) {
      filtered = filtered.filter(vendor => vendor.verified);
    }

    // Apply sorting
    switch (sortBy) {
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'reviews':
        filtered.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      case 'cars':
        filtered.sort((a, b) => b.totalCars - a.totalCars);
        break;
      case 'established':
        filtered.sort((a, b) => parseInt(a.establishedYear) - parseInt(b.establishedYear));
        break;
      default:
        break;
    }

    setFilteredVendors(filtered);
  }, [vendors, filters, sortBy]);

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      searchQuery: '',
      city: '',
      specialty: '',
      priceRange: '',
      rating: 0,
      verified: false,
    });
  };

  const handleContactVendor = (vendor: Vendor) => {
    toast.success(`جاري التواصل مع ${vendor.name}`);
  };

  const handleCallVendor = (phone: string) => {
    window.open(`tel:${phone}`);
  };

  const handleWhatsApp = (phone: string) => {
    window.open(`https://wa.me/${phone.replace(/^0/, '+20')}`);
  };

  const handleViewVendor = (vendorId: string) => {
    toast.success('عرض تفاصيل المعرض');
    // In a real app, navigate to vendor details
  };

  const getPriceRangeText = (range: string) => {
    switch (range) {
      case 'budget': return 'اقتصادي';
      case 'mid': return 'متوسط';
      case 'premium': return 'مميز';
      case 'luxury': return 'فاخر';
      default: return range;
    }
  };

  const getPriceRangeColor = (range: string) => {
    switch (range) {
      case 'budget': return 'bg-green-100 text-green-800';
      case 'mid': return 'bg-blue-100 text-blue-800';
      case 'premium': return 'bg-purple-100 text-purple-800';
      case 'luxury': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">جاري تحميل المعارض...</h2>
          <p className="text-gray-600">البحث في دليل تجار السيارات المعتمدين</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">دليل معارض السيارات في مصر</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            اكتشف أفضل {vendors.length} معرض سيارات معتمد في جميع أنحاء مصر مع تقييمات العملاء الحقيقية
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4 lg:space-x-reverse items-center">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="ابحث عن معرض أو ماركة معينة..."
                value={filters.searchQuery}
                onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            
            <div className="flex items-center space-x-2 space-x-reverse">
              <motion.button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 space-x-reverse px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FunnelIcon className="w-5 h-5" />
                <span>فلاتر</span>
              </motion.button>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="rating">أعلى تقييم</option>
                <option value="reviews">أكثر تقييمات</option>
                <option value="cars">أكثر سيارات</option>
                <option value="established">الأقدم تأسيساً</option>
              </select>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <motion.div
              className="mt-6 pt-6 border-t border-gray-200"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">المحافظة</label>
                  <select
                    value={filters.city}
                    onChange={(e) => handleFilterChange('city', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">جميع المحافظات</option>
                    {egyptianCities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">التخصص</label>
                  <select
                    value={filters.specialty}
                    onChange={(e) => handleFilterChange('specialty', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">جميع التخصصات</option>
                    {specialties.map(specialty => (
                      <option key={specialty} value={specialty}>{specialty}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الفئة السعرية</label>
                  <select
                    value={filters.priceRange}
                    onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">جميع الفئات</option>
                    <option value="budget">اقتصادي</option>
                    <option value="mid">متوسط</option>
                    <option value="premium">مميز</option>
                    <option value="luxury">فاخر</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">التقييم الأدنى</label>
                  <select
                    value={filters.rating}
                    onChange={(e) => handleFilterChange('rating', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="0">جميع التقييمات</option>
                    <option value="4.5">4.5 نجوم فأكثر</option>
                    <option value="4.0">4.0 نجوم فأكثر</option>
                    <option value="3.5">3.5 نجوم فأكثر</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 space-x-reverse">
                  <input
                    type="checkbox"
                    checked={filters.verified}
                    onChange={(e) => handleFilterChange('verified', e.target.checked)}
                    className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">المعارض الموثقة فقط</span>
                </label>

                <motion.button
                  onClick={clearFilters}
                  className="text-sm text-gray-600 hover:text-gray-800 underline"
                  whileHover={{ scale: 1.05 }}
                >
                  مسح جميع الفلاتر
                </motion.button>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Results Summary */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              النتائج ({filteredVendors.length} معرض)
            </h2>
            {filters.searchQuery && (
              <p className="text-gray-600 mt-1">نتائج البحث عن: "{filters.searchQuery}"</p>
            )}
          </div>
        </div>

        {/* Vendors Grid */}
        {filteredVendors.length === 0 ? (
          <motion.div
            className="text-center py-16 bg-white rounded-xl shadow-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <BuildingStorefrontIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">لا توجد معارض مطابقة للبحث</h3>
            <p className="text-gray-600 mb-6">جرب تعديل معايير البحث أو الفلاتر</p>
            <motion.button
              onClick={clearFilters}
              className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              مسح جميع الفلاتر
            </motion.button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredVendors.map((vendor, index) => (
              <motion.div
                key={vendor.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                {/* Vendor Header */}
                <div className="relative">
                  {vendor.images.length > 0 && (
                    <img
                      src={vendor.images[0]}
                      alt={vendor.name}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  
                  {/* Badges */}
                  <div className="absolute top-4 right-4 flex flex-col space-y-2">
                    {vendor.verified && (
                      <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium flex items-center space-x-1 space-x-reverse">
                        <ShieldCheckIcon className="w-3 h-3" />
                        <span>موثق</span>
                      </span>
                    )}
                    {vendor.premium && (
                      <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-medium flex items-center space-x-1 space-x-reverse">
                        <TrophyIcon className="w-3 h-3" />
                        <span>مميز</span>
                      </span>
                    )}
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPriceRangeColor(vendor.priceRange)}`}>
                      {getPriceRangeText(vendor.priceRange)}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  {/* Vendor Info */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{vendor.name}</h3>
                      <div className="flex items-center space-x-4 space-x-reverse text-sm text-gray-600 mb-2">
                        <div className="flex items-center space-x-1 space-x-reverse">
                          <MapPinIcon className="w-4 h-4" />
                          <span>{vendor.location.area}، {vendor.location.city}</span>
                        </div>
                        <div className="flex items-center space-x-1 space-x-reverse">
                          <CalendarIcon className="w-4 h-4" />
                          <span>منذ {vendor.establishedYear}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center space-x-1 space-x-reverse mb-1">
                        <StarIcon className="w-5 h-5 text-yellow-400 fill-current" />
                        <span className="font-bold text-lg">{vendor.rating}</span>
                      </div>
                      <div className="text-xs text-gray-500">({vendor.reviewCount} تقييم)</div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{vendor.description}</p>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <div className="font-bold text-primary-600">{vendor.totalCars}</div>
                      <div className="text-xs text-gray-600">سيارة متاحة</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-green-600">{vendor.specialties.length}</div>
                      <div className="text-xs text-gray-600">ماركة</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-blue-600">{vendor.services.length}</div>
                      <div className="text-xs text-gray-600">خدمة</div>
                    </div>
                  </div>

                  {/* Specialties */}
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">التخصصات:</h4>
                    <div className="flex flex-wrap gap-2">
                      {vendor.specialties.slice(0, 4).map((specialty, idx) => (
                        <span key={idx} className="text-xs bg-primary-50 text-primary-600 px-2 py-1 rounded">
                          {specialty}
                        </span>
                      ))}
                      {vendor.specialties.length > 4 && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          +{vendor.specialties.length - 4} المزيد
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Services */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-2">الخدمات:</h4>
                    <div className="space-y-1">
                      {vendor.services.slice(0, 3).map((service, idx) => (
                        <div key={idx} className="flex items-center space-x-2 space-x-reverse text-sm">
                          <CheckIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="text-gray-700">{service}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Working Hours */}
                  <div className="mb-6 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2 space-x-reverse mb-2">
                      <ClockIcon className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold text-blue-900 text-sm">مواعيد العمل:</span>
                    </div>
                    <div className="text-xs text-blue-800">
                      السبت - الخميس: {vendor.workingHours.saturday}
                      <br />
                      الجمعة: {vendor.workingHours.friday}
                    </div>
                  </div>

                  {/* Contact Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <motion.button
                      onClick={() => handleCallVendor(vendor.contact.phone)}
                      className="flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <PhoneIcon className="w-4 h-4" />
                      <span>اتصال</span>
                    </motion.button>

                    {vendor.contact.whatsapp ? (
                      <motion.button
                        onClick={() => handleWhatsApp(vendor.contact.whatsapp!)}
                        className="flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <ChatBubbleLeftRightIcon className="w-4 h-4" />
                        <span>واتساب</span>
                      </motion.button>
                    ) : (
                      <motion.button
                        onClick={() => handleContactVendor(vendor)}
                        className="flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 border border-primary-500 text-primary-500 hover:bg-primary-50 rounded-lg font-medium"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <ChatBubbleLeftRightIcon className="w-4 h-4" />
                        <span>رسالة</span>
                      </motion.button>
                    )}
                  </div>

                  <motion.button
                    onClick={() => handleViewVendor(vendor.id)}
                    className="w-full mt-3 flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <EyeIcon className="w-4 h-4" />
                    <span>عرض جميع السيارات ({vendor.totalCars})</span>
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Load More */}
        {filteredVendors.length > 0 && (
          <motion.div
            className="text-center mt-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.button
              className="px-8 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              تحميل المزيد من المعارض
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default VendorsPage;