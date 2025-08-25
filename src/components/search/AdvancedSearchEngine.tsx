import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  TruckIcon,
  SparklesIcon,
  BookmarkIcon,
  AdjustmentsHorizontalIcon,
  MicrophoneIcon,
  CameraIcon
} from '@heroicons/react/24/outline';
import { useAppStore } from '@/stores/appStore';
import { debounce } from 'lodash';
import toast from 'react-hot-toast';

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

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void;
  onSaveSearch?: (filters: SearchFilters, name: string) => void;
  initialFilters?: Partial<SearchFilters>;
  showVisualSearch?: boolean;
  showVoiceSearch?: boolean;
}

const egyptianGovernoratesAR = [
  'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'البحر الأحمر', 'البحيرة',
  'الفيوم', 'الغربية', 'الإسماعيلية', 'المنوفية', 'المنيا', 'القليوبية',
  'الوادي الجديد', 'السويس', 'أسوان', 'أسيوط', 'بني سويف', 'بورسعيد',
  'دمياط', 'الشرقية', 'جنوب سيناء', 'كفر الشيخ', 'مطروح', 'الأقصر',
  'قنا', 'شمال سيناء', 'سوهاج'
];

const carMakes = [
  { ar: 'تويوتا', en: 'Toyota' },
  { ar: 'هيونداي', en: 'Hyundai' },
  { ar: 'نيسان', en: 'Nissan' },
  { ar: 'كيا', en: 'Kia' },
  { ar: 'شيفروليه', en: 'Chevrolet' },
  { ar: 'فورد', en: 'Ford' },
  { ar: 'بي إم دبليو', en: 'BMW' },
  { ar: 'مرسيدس بنز', en: 'Mercedes-Benz' },
  { ar: 'أودي', en: 'Audi' },
  { ar: 'فولكس فاجن', en: 'Volkswagen' }
];

const bodyTypes = [
  { ar: 'صالون', en: 'Sedan' },
  { ar: 'هاتشباك', en: 'Hatchback' },
  { ar: 'SUV', en: 'SUV' },
  { ar: 'كوبيه', en: 'Coupe' },
  { ar: 'كروس أوفر', en: 'Crossover' },
  { ar: 'بيك آب', en: 'Pickup' },
  { ar: 'مينى فان', en: 'Minivan' },
  { ar: 'كشف', en: 'Convertible' }
];

const AdvancedSearchEngine: React.FC<AdvancedSearchProps> = ({
  onSearch,
  onSaveSearch,
  initialFilters = {},
  showVisualSearch = true,
  showVoiceSearch = true
}) => {
  const { language } = useAppStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [savedSearchName, setSavedSearchName] = useState('');
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);

  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    make: '',
    model: '',
    yearFrom: null,
    yearTo: null,
    priceFrom: null,
    priceTo: null,
    mileageMax: null,
    location: '',
    condition: '',
    bodyType: '',
    fuelType: '',
    transmission: '',
    drivetrain: '',
    exteriorColor: '',
    interiorColor: '',
    features: [],
    sortBy: 'popularity',
    ...initialFilters
  });

  // Smart search suggestions
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((searchFilters: SearchFilters) => {
      onSearch(searchFilters);
    }, 300),
    [onSearch]
  );

  // Auto-search when filters change
  useEffect(() => {
    debouncedSearch(filters);
  }, [filters, debouncedSearch]);

  // Generate search suggestions based on query
  const generateSuggestions = useCallback((query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const mockSuggestions = [
      `${query} مستعمل`,
      `${query} جديد`,
      `${query} أوتوماتيك`,
      `${query} في القاهرة`,
      `${query} تحت 500 ألف`,
      `${query} موديل حديث`
    ];

    setSuggestions(mockSuggestions.slice(0, 6));
    setShowSuggestions(true);
  }, []);

  const handleQueryChange = (query: string) => {
    setFilters(prev => ({ ...prev, query }));
    generateSuggestions(query);
  };

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      make: '',
      model: '',
      yearFrom: null,
      yearTo: null,
      priceFrom: null,
      priceTo: null,
      mileageMax: null,
      location: '',
      condition: '',
      bodyType: '',
      fuelType: '',
      transmission: '',
      drivetrain: '',
      exteriorColor: '',
      interiorColor: '',
      features: [],
      sortBy: 'popularity'
    });
  };

  const saveSearch = () => {
    if (savedSearchName.trim() && onSaveSearch) {
      onSaveSearch(filters, savedSearchName.trim());
      setSavedSearchName('');
      setShowSaveDialog(false);
      toast.success('تم حفظ البحث بنجاح');
    }
  };

  // Voice Search Implementation
  const startVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('البحث الصوتي غير مدعوم في هذا المتصفح');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = language === 'ar' ? 'ar-SA' : 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    setIsVoiceRecording(true);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      handleQueryChange(transcript);
      setIsVoiceRecording(false);
      toast.success('تم التعرف على الصوت بنجاح');
    };

    recognition.onerror = (event) => {
      setIsVoiceRecording(false);
      toast.error('فشل في التعرف على الصوت');
    };

    recognition.onend = () => {
      setIsVoiceRecording(false);
    };

    recognition.start();
  };

  // Visual Search Implementation
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Simulate AI-powered visual search
    const reader = new FileReader();
    reader.onload = () => {
      // In a real implementation, this would send the image to a computer vision API
      toast.success('جاري البحث بالصورة...');
      setTimeout(() => {
        handleQueryChange('BMW X5 أسود');
        toast.success('تم العثور على سيارات مشابهة');
      }, 2000);
    };
    reader.readAsDataURL(file);
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.make) count++;
    if (filters.yearFrom || filters.yearTo) count++;
    if (filters.priceFrom || filters.priceTo) count++;
    if (filters.location) count++;
    if (filters.condition) count++;
    if (filters.bodyType) count++;
    if (filters.mileageMax) count++;
    return count;
  }, [filters]);

  return (
    <div className="w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Main Search Bar */}
      <div className="p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Input with Suggestions */}
          <div className="relative flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
              <input
                type="text"
                value={filters.query}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder={language === 'ar' ? 'ابحث عن السيارة المثالية... (مثال: تويوتا كامري أزرق)' : 'Search for your perfect car...'}
                className="w-full pl-12 pr-16 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />
              
              {/* Voice and Visual Search Buttons */}
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
                {showVoiceSearch && (
                  <motion.button
                    onClick={startVoiceSearch}
                    disabled={isVoiceRecording}
                    className={`p-2 rounded-lg transition-colors ${
                      isVoiceRecording
                        ? 'bg-red-100 text-red-600 animate-pulse'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                    }`}
                    whileTap={{ scale: 0.95 }}
                  >
                    <MicrophoneIcon className="w-5 h-5" />
                  </motion.button>
                )}
                
                {showVisualSearch && (
                  <label className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 cursor-pointer transition-colors">
                    <CameraIcon className="w-5 h-5" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Search Suggestions */}
            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 mt-1"
                >
                  {suggestions.map((suggestion, index) => (
                    <motion.button
                      key={index}
                      onClick={() => {
                        handleQueryChange(suggestion);
                        setShowSuggestions(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                      whileHover={{ backgroundColor: '#f9fafb' }}
                    >
                      <div className="flex items-center space-x-3">
                        <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-800">{suggestion}</span>
                      </div>
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex space-x-2">
            <motion.button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`flex items-center space-x-2 px-6 py-4 rounded-xl transition-all ${
                isExpanded
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              <FunnelIcon className="w-5 h-5" />
              <span className="font-medium">
                {language === 'ar' ? 'تصفية متقدمة' : 'Advanced Filters'}
                {activeFiltersCount > 0 && (
                  <span className="ml-1 bg-white text-primary-600 px-2 py-1 rounded-full text-xs font-bold">
                    {activeFiltersCount}
                  </span>
                )}
              </span>
            </motion.button>

            <motion.button
              onClick={() => setShowSaveDialog(true)}
              className="flex items-center space-x-2 px-4 py-4 rounded-xl bg-green-100 hover:bg-green-200 text-green-700 transition-all"
              whileTap={{ scale: 0.95 }}
            >
              <BookmarkIcon className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2 mt-4">
          <select
            value={filters.make}
            onChange={(e) => handleFilterChange('make', e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{language === 'ar' ? 'الماركة' : 'Make'}</option>
            {carMakes.map(make => (
              <option key={make.en} value={make.en}>
                {language === 'ar' ? make.ar : make.en}
              </option>
            ))}
          </select>

          <select
            value={filters.condition}
            onChange={(e) => handleFilterChange('condition', e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{language === 'ar' ? 'الحالة' : 'Condition'}</option>
            <option value="new">{language === 'ar' ? 'جديد' : 'New'}</option>
            <option value="used">{language === 'ar' ? 'مستعمل' : 'Used'}</option>
            <option value="certified">{language === 'ar' ? 'معتمد' : 'Certified'}</option>
          </select>

          <select
            value={filters.location}
            onChange={(e) => handleFilterChange('location', e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{language === 'ar' ? 'المحافظة' : 'Location'}</option>
            {egyptianGovernoratesAR.map(gov => (
              <option key={gov} value={gov}>{gov}</option>
            ))}
          </select>

          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
          >
            <option value="popularity">{language === 'ar' ? 'الأكثر شيوعاً' : 'Most Popular'}</option>
            <option value="price-asc">{language === 'ar' ? 'السعر: من الأقل للأعلى' : 'Price: Low to High'}</option>
            <option value="price-desc">{language === 'ar' ? 'السعر: من الأعلى للأقل' : 'Price: High to Low'}</option>
            <option value="year-desc">{language === 'ar' ? 'الأحدث' : 'Newest First'}</option>
            <option value="year-asc">{language === 'ar' ? 'الأقدم' : 'Oldest First'}</option>
            <option value="mileage-asc">{language === 'ar' ? 'أقل مسافة' : 'Lowest Mileage'}</option>
            <option value="distance">{language === 'ar' ? 'الأقرب' : 'Nearest'}</option>
          </select>

          {activeFiltersCount > 0 && (
            <motion.button
              onClick={clearFilters}
              className="flex items-center space-x-1 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm transition-colors"
              whileTap={{ scale: 0.95 }}
            >
              <XMarkIcon className="w-4 h-4" />
              <span>{language === 'ar' ? 'مسح الكل' : 'Clear All'}</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-100 bg-gray-50"
          >
            <div className="p-6 space-y-6">
              {/* Price Range */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <CurrencyDollarIcon className="w-5 h-5 mr-2" />
                  {language === 'ar' ? 'السعر (جنيه مصري)' : 'Price Range (EGP)'}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="number"
                    placeholder={language === 'ar' ? 'من' : 'From'}
                    value={filters.priceFrom || ''}
                    onChange={(e) => handleFilterChange('priceFrom', e.target.value ? Number(e.target.value) : null)}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                  <input
                    type="number"
                    placeholder={language === 'ar' ? 'إلى' : 'To'}
                    value={filters.priceTo || ''}
                    onChange={(e) => handleFilterChange('priceTo', e.target.value ? Number(e.target.value) : null)}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Year Range */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <CalendarIcon className="w-5 h-5 mr-2" />
                  {language === 'ar' ? 'سنة الصنع' : 'Year Range'}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="number"
                    placeholder={language === 'ar' ? 'من سنة' : 'From Year'}
                    min="1980"
                    max="2025"
                    value={filters.yearFrom || ''}
                    onChange={(e) => handleFilterChange('yearFrom', e.target.value ? Number(e.target.value) : null)}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                  <input
                    type="number"
                    placeholder={language === 'ar' ? 'إلى سنة' : 'To Year'}
                    min="1980"
                    max="2025"
                    value={filters.yearTo || ''}
                    onChange={(e) => handleFilterChange('yearTo', e.target.value ? Number(e.target.value) : null)}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Body Type and Specifications */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'نوع الهيكل' : 'Body Type'}
                  </label>
                  <select
                    value={filters.bodyType}
                    onChange={(e) => handleFilterChange('bodyType', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">{language === 'ar' ? 'جميع الأنواع' : 'All Types'}</option>
                    {bodyTypes.map(type => (
                      <option key={type.en} value={type.en}>
                        {language === 'ar' ? type.ar : type.en}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'نوع الوقود' : 'Fuel Type'}
                  </label>
                  <select
                    value={filters.fuelType}
                    onChange={(e) => handleFilterChange('fuelType', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">{language === 'ar' ? 'جميع الأنواع' : 'All Types'}</option>
                    <option value="gasoline">{language === 'ar' ? 'بنزين' : 'Gasoline'}</option>
                    <option value="diesel">{language === 'ar' ? 'ديزل' : 'Diesel'}</option>
                    <option value="hybrid">{language === 'ar' ? 'هايبرد' : 'Hybrid'}</option>
                    <option value="electric">{language === 'ar' ? 'كهربائي' : 'Electric'}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'ناقل الحركة' : 'Transmission'}
                  </label>
                  <select
                    value={filters.transmission}
                    onChange={(e) => handleFilterChange('transmission', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">{language === 'ar' ? 'جميع الأنواع' : 'All Types'}</option>
                    <option value="manual">{language === 'ar' ? 'يدوي' : 'Manual'}</option>
                    <option value="automatic">{language === 'ar' ? 'أوتوماتيك' : 'Automatic'}</option>
                    <option value="cvt">{language === 'ar' ? 'CVT' : 'CVT'}</option>
                  </select>
                </div>
              </div>

              {/* Mileage */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <TruckIcon className="w-5 h-5 mr-2" />
                  {language === 'ar' ? 'المسافة المقطوعة (كيلومتر)' : 'Mileage (KM)'}
                </h4>
                <input
                  type="number"
                  placeholder={language === 'ar' ? 'الحد الأقصى للمسافة' : 'Maximum Mileage'}
                  value={filters.mileageMax || ''}
                  onChange={(e) => handleFilterChange('mileageMax', e.target.value ? Number(e.target.value) : null)}
                  className="w-full md:w-1/3 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save Search Dialog */}
      <AnimatePresence>
        {showSaveDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-md"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {language === 'ar' ? 'حفظ البحث' : 'Save Search'}
              </h3>
              <input
                type="text"
                placeholder={language === 'ar' ? 'اسم البحث المحفوظ' : 'Search Name'}
                value={savedSearchName}
                onChange={(e) => setSavedSearchName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-primary-500"
              />
              <div className="flex space-x-3">
                <motion.button
                  onClick={saveSearch}
                  disabled={!savedSearchName.trim()}
                  className="flex-1 bg-primary-600 text-white py-3 rounded-lg font-medium disabled:bg-gray-300 transition-colors"
                  whileTap={{ scale: 0.95 }}
                >
                  {language === 'ar' ? 'حفظ' : 'Save'}
                </motion.button>
                <motion.button
                  onClick={() => setShowSaveDialog(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-medium transition-colors"
                  whileTap={{ scale: 0.95 }}
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdvancedSearchEngine;