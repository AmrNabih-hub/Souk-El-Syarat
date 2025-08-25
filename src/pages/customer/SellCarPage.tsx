import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PhotoIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  CameraIcon,
  TrashIcon,
  EyeIcon,
  StarIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  UserIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  CogIcon,
  BeakerIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import toast from 'react-hot-toast';

interface CarFormData {
  // Basic Info
  make: string;
  model: string;
  year: string;
  condition: string;
  mileage: string;
  price: string;
  negotiable: boolean;
  
  // Technical Specs
  fuelType: string;
  transmission: string;
  engineSize: string;
  cylinders: string;
  drivetrain: string;
  color: string;
  
  // Features & Equipment
  features: string[];
  modifications: string;
  accidents: string;
  serviceHistory: string;
  
  // Description & Details
  title: string;
  description: string;
  reasonForSelling: string;
  
  // Location & Contact
  governorate: string;
  city: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  preferredContactMethod: string;
  
  // Images
  images: File[];
  mainImageIndex: number;
}

interface ImagePreview {
  file: File;
  url: string;
  id: string;
}

const SellCarPage: React.FC = () => {
  const { user } = useAuthStore();
  const { language } = useAppStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const [showImageModal, setShowImageModal] = useState<string | null>(null);

  const [formData, setFormData] = useState<CarFormData>({
    make: '',
    model: '',
    year: '',
    condition: '',
    mileage: '',
    price: '',
    negotiable: true,
    fuelType: '',
    transmission: '',
    engineSize: '',
    cylinders: '',
    drivetrain: '',
    color: '',
    features: [],
    modifications: '',
    accidents: 'لا',
    serviceHistory: '',
    title: '',
    description: '',
    reasonForSelling: '',
    governorate: '',
    city: '',
    contactName: user?.displayName || '',
    contactPhone: user?.phoneNumber || '',
    contactEmail: user?.email || '',
    preferredContactMethod: 'phone',
    images: [],
    mainImageIndex: 0,
  });

  // Egyptian automotive data
  const carMakes = [
    'تويوتا', 'مرسيدس', 'BMW', 'أودي', 'لكزس', 'هونداي', 'كيا', 'نيسان', 
    'هوندا', 'فورد', 'شيفروليه', 'أوبل', 'فولكس واجن', 'بيجو', 'رينو', 
    'سكودا', 'سيات', 'فيات', 'ألفا روميو', 'جاكوار', 'لاند روفر', 'فولفو',
    'ميتسوبيشي', 'سوزوكي', 'مازدا', 'انفينيتي', 'أكورا', 'كاديلاك'
  ];

  const governorates = [
    'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'الشرقية', 'القليوبية',
    'كفر الشيخ', 'الغربية', 'المنوفية', 'البحيرة', 'الإسماعيلية', 'بورسعيد',
    'السويس', 'شمال سيناء', 'جنوب سيناء', 'الفيوم', 'بني سويف', 'المنيا',
    'أسيوط', 'سوهاج', 'قنا', 'الأقصر', 'أسوان', 'البحر الأحمر', 'الوادي الجديد',
    'مطروح', 'دمياط'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => (currentYear - i).toString());

  const features = [
    'تكييف أوتوماتيك', 'فتحة سقف', 'جلد طبيعي', 'نظام ملاحة GPS', 'كاميرا خلفية',
    'حساسات ركن', 'شاشة تاتش', 'بلوتوث', 'USB', 'نظام صوتي متطور', 'مقاعد كهربائية',
    'مرايا كهربائية', 'إضاءة LED', 'عجلات ألومنيوم', 'نظام أمان متطور', 'وسائد هوائية',
    'نظام فرامل ABS', 'نظام ESP', 'تحكم في السرعة', 'شحن لاسلكي', 'كاميرا 360 درجة',
    'نظام رؤية ليلية', 'مقاعد مدفأة', 'مقاعد مكيفة', 'عجلة قيادة مدفأة'
  ];

  const steps = [
    { id: 1, title: 'معلومات السيارة الأساسية', icon: DocumentTextIcon },
    { id: 2, title: 'المواصفات التقنية', icon: CogIcon },
    { id: 3, title: 'المميزات والحالة', icon: StarIcon },
    { id: 4, title: 'الصور والوسائط', icon: PhotoIcon },
    { id: 5, title: 'السعر والموقع', icon: CurrencyDollarIcon },
    { id: 6, title: 'بيانات التواصل', icon: PhoneIcon },
  ];

  const handleInputChange = (field: keyof CarFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFeatureToggle = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) return;
    
    if (imagePreviews.length + files.length > 10) {
      toast.error('يمكنك رفع حتى 10 صور فقط');
      return;
    }

    setImageUploading(true);

    try {
      const newPreviews: ImagePreview[] = [];
      
      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`حجم الصورة ${file.name} كبير جداً. الحد الأقصى 5 ميجابايت`);
          continue;
        }

        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} ليس ملف صورة صالح`);
          continue;
        }

        const url = URL.createObjectURL(file);
        newPreviews.push({
          file,
          url,
          id: `${Date.now()}-${Math.random()}`,
        });
      }

      setImagePreviews(prev => [...prev, ...newPreviews]);
      setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }));
      
      if (newPreviews.length > 0) {
        toast.success(`تم رفع ${newPreviews.length} صورة بنجاح`);
      }
    } catch (error) {
      toast.error('حدث خطأ في رفع الصور');
    } finally {
      setImageUploading(false);
    }
  }, [imagePreviews.length]);

  const removeImage = (imageId: string) => {
    const imageIndex = imagePreviews.findIndex(img => img.id === imageId);
    if (imageIndex === -1) return;

    // Clean up object URL
    URL.revokeObjectURL(imagePreviews[imageIndex].url);

    setImagePreviews(prev => prev.filter(img => img.id !== imageId));
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== imageIndex),
      mainImageIndex: prev.mainImageIndex >= imageIndex ? Math.max(0, prev.mainImageIndex - 1) : prev.mainImageIndex
    }));

    toast.success('تم حذف الصورة');
  };

  const setMainImage = (index: number) => {
    setFormData(prev => ({ ...prev, mainImageIndex: index }));
    toast.success('تم تعيين الصورة الرئيسية');
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.make && formData.model && formData.year && formData.condition);
      case 2:
        return !!(formData.fuelType && formData.transmission && formData.mileage);
      case 3:
        return !!(formData.title && formData.description);
      case 4:
        return imagePreviews.length >= 3;
      case 5:
        return !!(formData.price && formData.governorate);
      case 6:
        return !!(formData.contactName && formData.contactPhone);
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (!validateStep(currentStep)) {
      toast.error('يرجى إكمال جميع الحقول المطلوبة');
      return;
    }
    
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      toast.error('يرجى إكمال جميع الحقول المطلوبة');
      return;
    }

    if (!user) {
      toast.error('يجب تسجيل الدخول أولاً');
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real app, upload images to Firebase Storage and save form data to Firestore
      console.log('Form data:', formData);
      console.log('Images:', imagePreviews);
      
      toast.success('تم نشر إعلان سيارتك بنجاح! سيتم مراجعته خلال 24 ساعة.');
      
      // Reset form
      setFormData({
        make: '', model: '', year: '', condition: '', mileage: '', price: '', negotiable: true,
        fuelType: '', transmission: '', engineSize: '', cylinders: '', drivetrain: '', color: '',
        features: [], modifications: '', accidents: 'لا', serviceHistory: '',
        title: '', description: '', reasonForSelling: '',
        governorate: '', city: '', contactName: user?.displayName || '', 
        contactPhone: user?.phoneNumber || '', contactEmail: user?.email || '',
        preferredContactMethod: 'phone', images: [], mainImageIndex: 0,
      });
      setImagePreviews([]);
      setCurrentStep(1);
      
    } catch (error) {
      toast.error('حدث خطأ في نشر الإعلان');
    } finally {
      setIsSubmitting(false);
    }
  };

  const estimatePrice = () => {
    if (!formData.make || !formData.year || !formData.mileage) {
      toast.error('يرجى إدخال معلومات السيارة الأساسية أولاً');
      return;
    }

    // Simple price estimation logic
    const currentYear = new Date().getFullYear();
    const age = currentYear - parseInt(formData.year);
    const mileageNum = parseInt(formData.mileage.replace(/,/g, ''));
    
    let basePrice = 200000; // Default base price
    
    // Adjust based on make
    const premiumMakes = ['مرسيدس', 'BMW', 'أودي', 'لكزس'];
    if (premiumMakes.includes(formData.make)) {
      basePrice *= 2;
    }
    
    // Depreciation based on age
    basePrice *= Math.max(0.3, 1 - (age * 0.1));
    
    // Adjust for mileage
    if (mileageNum > 100000) {
      basePrice *= 0.8;
    }
    
    const estimatedPrice = Math.round(basePrice / 1000) * 1000;
    
    setFormData(prev => ({ ...prev, price: estimatedPrice.toString() }));
    toast.success(`تم تقدير سعر السيارة: ${estimatedPrice.toLocaleString()} جنيه`);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div
          className="text-center bg-white p-8 rounded-xl shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <UserIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">يجب تسجيل الدخول أولاً</h2>
          <p className="text-gray-600 mb-6">تحتاج إلى تسجيل الدخول لنشر إعلان بيع سيارة</p>
          <motion.a
            href="/login"
            className="inline-flex items-center px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            تسجيل الدخول
          </motion.a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">بيع سيارتك</h1>
          <p className="text-xl text-gray-600">
            أنشر إعلانك مجاناً ووصل لآلاف المشترين المهتمين
          </p>
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex flex-wrap justify-center gap-2 md:gap-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <motion.div
                  className={`flex items-center space-x-2 space-x-reverse px-3 py-2 rounded-lg ${
                    currentStep === step.id
                      ? 'bg-primary-500 text-white'
                      : currentStep > step.id
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                  whileHover={{ scale: 1.05 }}
                >
                  <step.icon className="w-4 h-4" />
                  <span className="text-xs md:text-sm font-medium hidden sm:block">
                    {step.title}
                  </span>
                  <span className="text-xs md:text-sm font-medium sm:hidden">
                    {step.id}
                  </span>
                </motion.div>
                {index < steps.length - 1 && (
                  <ChevronLeftIcon className="w-4 h-4 text-gray-400 mx-1" />
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 text-center text-sm text-gray-600">
            الخطوة {currentStep} من {steps.length}
          </div>
        </motion.div>

        {/* Form Content */}
        <motion.div
          className="bg-white rounded-xl shadow-lg p-6 md:p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">معلومات السيارة الأساسية</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        الماركة *
                      </label>
                      <select
                        value={formData.make}
                        onChange={(e) => handleInputChange('make', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        required
                      >
                        <option value="">اختر الماركة</option>
                        {carMakes.map(make => (
                          <option key={make} value={make}>{make}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        الموديل *
                      </label>
                      <input
                        type="text"
                        value={formData.model}
                        onChange={(e) => handleInputChange('model', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="مثال: كامري، C200، X5"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        سنة الصنع *
                      </label>
                      <select
                        value={formData.year}
                        onChange={(e) => handleInputChange('year', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        required
                      >
                        <option value="">اختر السنة</option>
                        {years.map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        حالة السيارة *
                      </label>
                      <select
                        value={formData.condition}
                        onChange={(e) => handleInputChange('condition', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        required
                      >
                        <option value="">اختر الحالة</option>
                        <option value="ممتازة">ممتازة</option>
                        <option value="جيدة جداً">جيدة جداً</option>
                        <option value="جيدة">جيدة</option>
                        <option value="مقبولة">مقبولة</option>
                        <option value="تحتاج إصلاح">تحتاج إصلاح</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Technical Specifications */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">المواصفات التقنية</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        نوع الوقود *
                      </label>
                      <select
                        value={formData.fuelType}
                        onChange={(e) => handleInputChange('fuelType', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        required
                      >
                        <option value="">اختر نوع الوقود</option>
                        <option value="بنزين">بنزين</option>
                        <option value="ديزل">ديزل</option>
                        <option value="هايبرد">هايبرد</option>
                        <option value="كهربائي">كهربائي</option>
                        <option value="CNG">غاز طبيعي (CNG)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ناقل الحركة *
                      </label>
                      <select
                        value={formData.transmission}
                        onChange={(e) => handleInputChange('transmission', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        required
                      >
                        <option value="">اختر ناقل الحركة</option>
                        <option value="أوتوماتيك">أوتوماتيك</option>
                        <option value="مانيوال">مانيوال</option>
                        <option value="CVT">CVT</option>
                        <option value="نصف أوتوماتيك">نصف أوتوماتيك</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        عداد المسافات (كم) *
                      </label>
                      <input
                        type="text"
                        value={formData.mileage}
                        onChange={(e) => handleInputChange('mileage', e.target.value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ','))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="مثال: 50,000"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        سعة المحرك
                      </label>
                      <input
                        type="text"
                        value={formData.engineSize}
                        onChange={(e) => handleInputChange('engineSize', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="مثال: 2.0 لتر، 1600 سي سي"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        عدد السلندرات
                      </label>
                      <select
                        value={formData.cylinders}
                        onChange={(e) => handleInputChange('cylinders', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="">اختر عدد السلندرات</option>
                        <option value="3">3 سلندر</option>
                        <option value="4">4 سلندر</option>
                        <option value="6">6 سلندر</option>
                        <option value="8">8 سلندر</option>
                        <option value="10">10 سلندر</option>
                        <option value="12">12 سلندر</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        اللون
                      </label>
                      <select
                        value={formData.color}
                        onChange={(e) => handleInputChange('color', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="">اختر اللون</option>
                        <option value="أبيض">أبيض</option>
                        <option value="أسود">أسود</option>
                        <option value="فضي">فضي</option>
                        <option value="رمادي">رمادي</option>
                        <option value="أحمر">أحمر</option>
                        <option value="أزرق">أزرق</option>
                        <option value="أخضر">أخضر</option>
                        <option value="بني">بني</option>
                        <option value="ذهبي">ذهبي</option>
                        <option value="أخرى">أخرى</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Features & Condition */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">المميزات والحالة</h2>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      عنوان الإعلان *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="مثال: تويوتا كامري 2021 فل كامل حالة ممتازة"
                      maxLength={100}
                      required
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {formData.title.length}/100 حرف
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      وصف تفصيلي *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      rows={5}
                      placeholder="اكتب وصفاً مفصلاً لسيارتك يشمل الحالة، المميزات، أي أعمال صيانة، إلخ..."
                      maxLength={1000}
                      required
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {formData.description.length}/1000 حرف
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">
                      المميزات والتجهيزات
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {features.map(feature => (
                        <label key={feature} className="flex items-center space-x-2 space-x-reverse">
                          <input
                            type="checkbox"
                            checked={formData.features.includes(feature)}
                            onChange={() => handleFeatureToggle(feature)}
                            className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                          />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        تعرضت لحوادث؟
                      </label>
                      <select
                        value={formData.accidents}
                        onChange={(e) => handleInputChange('accidents', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="لا">لا</option>
                        <option value="حادث بسيط">حادث بسيط</option>
                        <option value="حادث متوسط">حادث متوسط</option>
                        <option value="حادث كبير">حادث كبير</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        سبب البيع
                      </label>
                      <input
                        type="text"
                        value={formData.reasonForSelling}
                        onChange={(e) => handleInputChange('reasonForSelling', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="مثال: شراء سيارة جديدة، السفر، إلخ"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      تاريخ الصيانة
                    </label>
                    <textarea
                      value={formData.serviceHistory}
                      onChange={(e) => handleInputChange('serviceHistory', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      rows={3}
                      placeholder="اذكر آخر أعمال الصيانة والتواريخ، مثل تغيير الزيت، الفرامل، الإطارات، إلخ"
                    />
                  </div>
                </div>
              )}

              {/* Step 4: Images */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">صور السيارة</h2>
                  <p className="text-gray-600 mb-6">
                    أضف على الأقل 3 صور واضحة لسيارتك. الصور الجيدة تزيد من فرص البيع. 
                    يمكنك رفع حتى 10 صور بحد أقصى 5 ميجابايت لكل صورة.
                  </p>

                  {/* Image Upload Area */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                    <div className="text-center">
                      <PhotoIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <div className="mb-4">
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            disabled={imageUploading || imagePreviews.length >= 10}
                          />
                          <span className="inline-flex items-center px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors">
                            <CameraIcon className="w-5 h-5 mr-2" />
                            {imageUploading ? 'جاري الرفع...' : 'اختر الصور'}
                          </span>
                        </label>
                      </div>
                      <p className="text-sm text-gray-500">
                        يمكنك اختيار عدة صور معاً. PNG, JPG, JPEG حتى 5MB لكل صورة
                      </p>
                    </div>
                  </div>

                  {/* Image Previews */}
                  {imagePreviews.length > 0 && (
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">
                          الصور المرفوعة ({imagePreviews.length}/10)
                        </h3>
                        {imagePreviews.length >= 3 && (
                          <div className="flex items-center text-green-600 text-sm">
                            <CheckCircleIcon className="w-4 h-4 mr-1" />
                            العدد كافي للنشر
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {imagePreviews.map((image, index) => (
                          <motion.div
                            key={image.id}
                            className="relative group"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                              <img
                                src={image.url}
                                alt={`صورة ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            
                            {/* Main Image Badge */}
                            {index === formData.mainImageIndex && (
                              <div className="absolute top-2 right-2 bg-primary-500 text-white px-2 py-1 rounded text-xs font-bold">
                                رئيسية
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center space-x-2 space-x-reverse">
                              <motion.button
                                onClick={() => setShowImageModal(image.url)}
                                className="p-2 bg-white text-gray-800 rounded-full hover:bg-gray-100"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                title="عرض"
                              >
                                <EyeIcon className="w-4 h-4" />
                              </motion.button>
                              
                              {index !== formData.mainImageIndex && (
                                <motion.button
                                  onClick={() => setMainImage(index)}
                                  className="p-2 bg-primary-500 text-white rounded-full hover:bg-primary-600"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  title="جعل رئيسية"
                                >
                                  <StarIcon className="w-4 h-4" />
                                </motion.button>
                              )}
                              
                              <motion.button
                                onClick={() => removeImage(image.id)}
                                className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                title="حذف"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </motion.button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {imagePreviews.length < 3 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <XCircleIcon className="w-5 h-5 text-yellow-600 mr-2" />
                        <span className="text-yellow-800">
                          يجب رفع على الأقل 3 صور لنشر الإعلان
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 5: Price & Location */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">السعر والموقع</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        السعر المطلوب (جنيه) *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={formData.price}
                          onChange={(e) => handleInputChange('price', e.target.value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ','))}
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="مثال: 250,000"
                          required
                        />
                        <CurrencyDollarIcon className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                      </div>
                      <div className="mt-2 flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.negotiable}
                          onChange={(e) => handleInputChange('negotiable', e.target.checked)}
                          className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500 mr-2"
                        />
                        <label className="text-sm text-gray-700">قابل للتفاوض</label>
                      </div>
                      <motion.button
                        onClick={estimatePrice}
                        className="mt-3 text-sm text-primary-600 hover:text-primary-700 underline"
                        whileHover={{ scale: 1.05 }}
                      >
                        تقدير سعر السيارة تلقائياً
                      </motion.button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        المحافظة *
                      </label>
                      <select
                        value={formData.governorate}
                        onChange={(e) => handleInputChange('governorate', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        required
                      >
                        <option value="">اختر المحافظة</option>
                        {governorates.map(gov => (
                          <option key={gov} value={gov}>{gov}</option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        المدينة/المنطقة
                      </label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="مثال: مدينة نصر، الزمالك، المعادي"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 6: Contact Information */}
              {currentStep === 6 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">بيانات التواصل</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        الاسم *
                      </label>
                      <input
                        type="text"
                        value={formData.contactName}
                        onChange={(e) => handleInputChange('contactName', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        رقم الهاتف *
                      </label>
                      <input
                        type="tel"
                        value={formData.contactPhone}
                        onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="01xxxxxxxxx"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        البريد الإلكتروني
                      </label>
                      <input
                        type="email"
                        value={formData.contactEmail}
                        onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="example@email.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        طريقة التواصل المفضلة
                      </label>
                      <select
                        value={formData.preferredContactMethod}
                        onChange={(e) => handleInputChange('preferredContactMethod', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="phone">المكالمات الهاتفية</option>
                        <option value="whatsapp">واتساب</option>
                        <option value="email">البريد الإلكتروني</option>
                        <option value="any">أي طريقة</option>
                      </select>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="mt-8 bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">ملخص الإعلان</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div><strong>السيارة:</strong> {formData.make} {formData.model} {formData.year}</div>
                      <div><strong>الحالة:</strong> {formData.condition}</div>
                      <div><strong>المسافة:</strong> {formData.mileage} كم</div>
                      <div><strong>السعر:</strong> {formData.price} جنيه {formData.negotiable && '(قابل للتفاوض)'}</div>
                      <div><strong>الوقود:</strong> {formData.fuelType}</div>
                      <div><strong>ناقل الحركة:</strong> {formData.transmission}</div>
                      <div><strong>الموقع:</strong> {formData.governorate}</div>
                      <div><strong>عدد الصور:</strong> {imagePreviews.length}</div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t">
            <motion.button
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center space-x-2 space-x-reverse px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: currentStep === 1 ? 1 : 1.05 }}
              whileTap={{ scale: currentStep === 1 ? 1 : 0.95 }}
            >
              <ChevronRightIcon className="w-5 h-5" />
              <span>السابق</span>
            </motion.button>

            <div className="flex space-x-4 space-x-reverse">
              {currentStep < steps.length ? (
                <motion.button
                  onClick={nextStep}
                  className="flex items-center space-x-2 space-x-reverse px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>التالي</span>
                  <ChevronLeftIcon className="w-5 h-5" />
                </motion.button>
              ) : (
                <motion.button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !validateStep(currentStep)}
                  className="flex items-center space-x-2 space-x-reverse px-8 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium"
                  whileHover={{ scale: isSubmitting ? 1 : 1.05 }}
                  whileTap={{ scale: isSubmitting ? 1 : 0.95 }}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>جاري النشر...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-5 h-5" />
                      <span>نشر الإعلان</span>
                    </>
                  )}
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <motion.div
            className="relative max-w-4xl w-full h-full flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <motion.button
              onClick={() => setShowImageModal(null)}
              className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 text-white rounded-full flex items-center justify-center z-10"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <XCircleIcon className="w-6 h-6" />
            </motion.button>
            
            <img
              src={showImageModal}
              alt="معاينة الصورة"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default SellCarPage;