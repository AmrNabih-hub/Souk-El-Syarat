import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  TruckIcon,
  CameraIcon,
  DocumentIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  SparklesIcon,
  WrenchScrewdriverIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

import { useAppStore } from '@/stores/appStore';
import { useAuthStore } from '@/stores/authStore';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { carListingService } from '@/services/car-listing.service';

interface UsedCarData {
  // Basic Car Information
  make: string;
  model: string;
  year: number;
  mileage: number;
  transmission: 'manual' | 'automatic';
  fuelType: 'gasoline' | 'diesel' | 'hybrid' | 'electric';
  color: string;
  
  // Pricing and Condition
  askingPrice: number;
  condition: 'excellent' | 'very_good' | 'good' | 'fair' | 'needs_work';
  
  // Documentation
  hasOwnershipPapers: boolean;
  hasServiceHistory: boolean;
  hasInsurance: boolean;
  registrationLocation: string;
  
  // Description and Features
  description: string;
  features: string[];
  
  // Contact Information
  sellerName: string;
  phoneNumber: string;
  whatsappNumber?: string;
  preferredContactTime: string;
  location: {
    governorate: string;
    city: string;
    area: string;
  };
  
  // Additional Information
  reasonForSelling: string;
  negotiable: boolean;
  availableForInspection: boolean;
  urgentSale: boolean;
  
  // Terms
  agreeToTerms: boolean;
}

const carFormSchema = yup.object().shape({
  make: yup.string().required('ماركة السيارة مطلوبة'),
  model: yup.string().required('موديل السيارة مطلوب'),
  year: yup.number()
    .min(1990, 'سنة الصنع يجب أن تكون 1990 أو أحدث')
    .max(new Date().getFullYear(), 'سنة الصنع غير صحيحة')
    .required('سنة الصنع مطلوبة'),
  mileage: yup.number()
    .min(0, 'الكيلومترات يجب أن تكون رقم موجب')
    .required('عدد الكيلومترات مطلوب'),
  transmission: yup.string().oneOf(['manual', 'automatic']).required('نوع ناقل الحركة مطلوب'),
  fuelType: yup.string().oneOf(['gasoline', 'diesel', 'hybrid', 'electric']).required('نوع الوقود مطلوب'),
  color: yup.string().required('لون السيارة مطلوب'),
  askingPrice: yup.number()
    .min(1000, 'السعر يجب أن يكون 1000 جنيه على الأقل')
    .required('السعر المطلوب مطلوب'),
  condition: yup.string().oneOf(['excellent', 'very_good', 'good', 'fair', 'needs_work']).required('حالة السيارة مطلوبة'),
  hasOwnershipPapers: yup.boolean().oneOf([true], 'يجب أن تكون أوراق الملكية متوفرة'),
  description: yup.string()
    .min(20, 'الوصف يجب أن يكون 20 حرف على الأقل')
    .required('وصف السيارة مطلوب'),
  sellerName: yup.string().required('اسم البائع مطلوب'),
  phoneNumber: yup.string()
    .matches(/^01[0-2]\d{8}$/, 'رقم الهاتف غير صحيح')
    .required('رقم الهاتف مطلوب'),
  location: yup.object().shape({
    governorate: yup.string().required('المحافظة مطلوبة'),
    city: yup.string().required('المدينة مطلوبة'),
    area: yup.string().required('المنطقة مطلوبة'),
  }),
  reasonForSelling: yup.string().required('سبب البيع مطلوب'),
  agreeToTerms: yup.boolean().oneOf([true], 'يجب الموافقة على الشروط والأحكام'),
});

const UsedCarSellingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { language } = useAppStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [carImages, setCarImages] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger
  } = useForm<UsedCarData>({
    resolver: yupResolver(carFormSchema) as any,
    defaultValues: {
      sellerName: user?.displayName || '',
      features: [],
      hasOwnershipPapers: false,
      hasServiceHistory: false,
      hasInsurance: false,
      negotiable: true,
      availableForInspection: true,
      urgentSale: false,
      agreeToTerms: false,
    },
  });

  // Check if user is authenticated
  React.useEffect(() => {
    if (!user) {
      toast.error(language === 'ar' ? 'يجب تسجيل الدخول أولاً' : 'Please login first');
      navigate('/login');
    }
  }, [user, navigate, language]);

  const availableFeatures = [
    'مكيف هواء', 'نوافذ كهربائية', 'إنذار', 'نظام صوتي', 'فتحة سقف',
    'مقاعد جلد', 'عجلة قيادة كهربائية', 'فرامل ABS', 'وسائد هوائية',
    'نظام ملاحة GPS', 'كاميرا خلفية', 'حساسات ركن', 'تحكم بالسرعة'
  ];

  const egyptianGovernorates = [
    'القاهرة', 'الجيزة', 'الاسكندرية', 'الدقهلية', 'البحر الأحمر', 'البحيرة',
    'الفيوم', 'الغربية', 'الاسماعيلية', 'المنوفية', 'المنيا', 'القليوبية',
    'الوادي الجديد', 'السويس', 'اسوان', 'اسيوط', 'بني سويف', 'بورسعيد',
    'دمياط', 'الشرقية', 'جنوب سيناء', 'كفر الشيخ', 'مطروح', 'الاقصر',
    'قنا', 'شمال سيناء', 'سوهاج'
  ];

  const handleFeatureToggle = (feature: string) => {
    const newFeatures = selectedFeatures.includes(feature)
      ? selectedFeatures.filter(f => f !== feature)
      : [...selectedFeatures, feature];
    
    setSelectedFeatures(newFeatures);
    setValue('features', newFeatures);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length + carImages.length > 10) {
      toast.error('يمكن رفع 10 صور كحد أقصى');
      return;
    }
    setCarImages([...carImages, ...files]);
  };

  const removeImage = (index: number) => {
    setCarImages(carImages.filter((_, i) => i !== index));
  };

  const nextStep = async () => {
    const fieldsToValidate = getStepFields(currentStep);
    const isValid = await trigger(fieldsToValidate as any);
    
    if (isValid) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const getStepFields = (step: number) => {
    switch (step) {
      case 1: return ['make', 'model', 'year', 'mileage', 'transmission', 'fuelType', 'color'];
      case 2: return ['askingPrice', 'condition', 'hasOwnershipPapers', 'hasServiceHistory'];
      case 3: return ['description', 'features'];
      case 4: return ['sellerName', 'phoneNumber', 'location'];
      default: return [];
    }
  };

  const onSubmit = async (data: UsedCarData) => {
    if (currentStep < 5) {
      await nextStep();
      return;
    }

    // Validate minimum images requirement
    if (carImages.length < 6) {
      toast.error('يرجى رفع 6 صور على الأقل للسيارة');
      return;
    }

    setIsSubmitting(true);
    try {
      // Submit car listing through the service (includes real-time notifications and emails)
      const listingId = await carListingService.submitListing(
        user?.id || '',
        {
          make: data.make,
          model: data.model,
          year: data.year,
          mileage: data.mileage,
          transmission: data.transmission,
          fuelType: data.fuelType,
          color: data.color,
          condition: data.condition as any,
          askingPrice: data.askingPrice,
          description: data.description,
          features: data.features,
          reasonForSelling: data.reasonForSelling,
          sellerName: data.sellerName,
          phoneNumber: data.phoneNumber,
          whatsappNumber: data.whatsappNumber,
          location: data.location,
          hasOwnershipPapers: data.hasOwnershipPapers,
          hasServiceHistory: data.hasServiceHistory,
          hasInsurance: data.hasInsurance,
          negotiable: data.negotiable,
          availableForInspection: data.availableForInspection,
          urgentSale: data.urgentSale,
          agreeToTerms: data.agreeToTerms,
        },
        carImages
      );

      toast.success('تم إرسال طلب بيع السيارة بنجاح! سنتواصل معك خلال 24-48 ساعة.');
      navigate('/dashboard');
      
    } catch (error) {
      console.error('Error submitting car listing:', error);
      toast.error('حدث خطأ في إرسال الطلب. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <TruckIcon className="w-16 h-16 text-primary-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-neutral-900">بيانات السيارة الأساسية</h2>
              <p className="text-neutral-600">أدخل المعلومات الأساسية عن سيارتك</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  ماركة السيارة *
                </label>
                <select
                  {...register('make')}
                  className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">اختر الماركة</option>
                  <option value="Toyota">تويوتا</option>
                  <option value="Honda">هوندا</option>
                  <option value="Nissan">نيسان</option>
                  <option value="Hyundai">هيونداي</option>
                  <option value="Kia">كيا</option>
                  <option value="Chevrolet">شيفروليه</option>
                  <option value="Ford">فورد</option>
                  <option value="BMW">بي إم دبليو</option>
                  <option value="Mercedes">مرسيدس</option>
                  <option value="Audi">أودي</option>
                </select>
                {errors.make && <p className="text-red-500 text-sm mt-1">{errors.make.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  الموديل *
                </label>
                <input
                  type="text"
                  {...register('model')}
                  placeholder="مثال: كامري، أكورد، التيما"
                  className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                {errors.model && <p className="text-red-500 text-sm mt-1">{errors.model.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  سنة الصنع *
                </label>
                <input
                  type="number"
                  {...register('year')}
                  min="1990"
                  max={new Date().getFullYear()}
                  className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                {errors.year && <p className="text-red-500 text-sm mt-1">{errors.year.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  عدد الكيلومترات *
                </label>
                <input
                  type="number"
                  {...register('mileage')}
                  placeholder="مثال: 75000"
                  className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                {errors.mileage && <p className="text-red-500 text-sm mt-1">{errors.mileage.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  ناقل الحركة *
                </label>
                <select
                  {...register('transmission')}
                  className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">اختر نوع ناقل الحركة</option>
                  <option value="manual">عادي (مانيوال)</option>
                  <option value="automatic">أوتوماتيك</option>
                </select>
                {errors.transmission && <p className="text-red-500 text-sm mt-1">{errors.transmission.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  نوع الوقود *
                </label>
                <select
                  {...register('fuelType')}
                  className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">اختر نوع الوقود</option>
                  <option value="gasoline">بنزين</option>
                  <option value="diesel">سولار</option>
                  <option value="hybrid">هايبرد</option>
                  <option value="electric">كهربائي</option>
                </select>
                {errors.fuelType && <p className="text-red-500 text-sm mt-1">{errors.fuelType.message}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  لون السيارة *
                </label>
                <input
                  type="text"
                  {...register('color')}
                  placeholder="مثال: أبيض، أسود، فضي، أحمر"
                  className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                {errors.color && <p className="text-red-500 text-sm mt-1">{errors.color.message}</p>}
              </div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <CurrencyDollarIcon className="w-16 h-16 text-primary-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-neutral-900">السعر والحالة</h2>
              <p className="text-neutral-600">حدد سعر السيارة وحالتها الحالية</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  السعر المطلوب (جنيه مصري) *
                </label>
                <input
                  type="number"
                  {...register('askingPrice')}
                  placeholder="مثال: 250000"
                  className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                {errors.askingPrice && <p className="text-red-500 text-sm mt-1">{errors.askingPrice.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  حالة السيارة *
                </label>
                <select
                  {...register('condition')}
                  className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">اختر حالة السيارة</option>
                  <option value="excellent">ممتازة</option>
                  <option value="very_good">جيدة جداً</option>
                  <option value="good">جيدة</option>
                  <option value="fair">مقبولة</option>
                  <option value="needs_work">تحتاج إصلاح</option>
                </select>
                {errors.condition && <p className="text-red-500 text-sm mt-1">{errors.condition.message}</p>}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-neutral-900">الأوراق والوثائق</h3>
              
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    {...register('hasOwnershipPapers')}
                    className="w-5 h-5 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-neutral-700">
                    أوراق الملكية متوفرة وسارية *
                  </span>
                </label>
                {errors.hasOwnershipPapers && <p className="text-red-500 text-sm">{errors.hasOwnershipPapers.message}</p>}

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    {...register('hasServiceHistory')}
                    className="w-5 h-5 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-neutral-700">
                    تاريخ الصيانة متوفر
                  </span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    {...register('hasInsurance')}
                    className="w-5 h-5 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-neutral-700">
                    التأمين ساري
                  </span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                مكان الترخيص
              </label>
              <select
                {...register('registrationLocation')}
                className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">اختر محافظة الترخيص</option>
                {egyptianGovernorates.map(gov => (
                  <option key={gov} value={gov}>{gov}</option>
                ))}
              </select>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <SparklesIcon className="w-16 h-16 text-primary-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-neutral-900">الوصف والمميزات</h2>
              <p className="text-neutral-600">اكتب وصفاً مفصلاً واختر مميزات السيارة</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                وصف السيارة *
              </label>
              <textarea
                {...register('description')}
                rows={5}
                placeholder="اكتب وصفاً مفصلاً عن السيارة، حالتها، أي أعمال صيانة تمت، وأي معلومات أخرى مهمة..."
                className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-3">
                مميزات السيارة
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availableFeatures.map(feature => (
                  <label key={feature} className="flex items-center space-x-2 p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedFeatures.includes(feature)}
                      onChange={() => handleFeatureToggle(feature)}
                      className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-neutral-700">{feature}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-3">
                صور السيارة (اختياري - حتى 10 صور)
              </label>
              <div className="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center">
                <CameraIcon className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="car-images"
                />
                <label
                  htmlFor="car-images"
                  className="cursor-pointer bg-primary-50 text-primary-600 px-4 py-2 rounded-lg hover:bg-primary-100 transition-colors"
                >
                  اختر الصور
                </label>
                <p className="text-sm text-neutral-500 mt-2">
                  رفع صور واضحة من جميع الزوايا يساعد في بيع السيارة بشكل أسرع
                </p>
              </div>
              
              {carImages.length > 0 && (
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mt-4">
                  {carImages.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Car ${index + 1}`}
                        className="w-full h-20 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <UserIcon className="w-16 h-16 text-primary-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-neutral-900">معلومات التواصل</h2>
              <p className="text-neutral-600">معلومات للتواصل مع المشترين المهتمين</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  اسم البائع *
                </label>
                <input
                  type="text"
                  {...register('sellerName')}
                  className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                {errors.sellerName && <p className="text-red-500 text-sm mt-1">{errors.sellerName.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  رقم الهاتف *
                </label>
                <input
                  type="tel"
                  {...register('phoneNumber')}
                  placeholder="01xxxxxxxxx"
                  className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                {errors.phoneNumber && <p className="text-red-500 text-sm mt-1">{errors.phoneNumber.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  رقم الواتساب (اختياري)
                </label>
                <input
                  type="tel"
                  {...register('whatsappNumber')}
                  placeholder="01xxxxxxxxx"
                  className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  أوقات التواصل المفضلة
                </label>
                <select
                  {...register('preferredContactTime')}
                  className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">اختر الوقت المناسب</option>
                  <option value="morning">صباحاً (8 ص - 12 ظ)</option>
                  <option value="afternoon">ظهراً (12 ظ - 4 م)</option>
                  <option value="evening">مساءً (4 م - 8 م)</option>
                  <option value="night">ليلاً (8 م - 11 م)</option>
                  <option value="anytime">أي وقت</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-neutral-900">موقع السيارة</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    المحافظة *
                  </label>
                  <select
                    {...register('location.governorate')}
                    className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">اختر المحافظة</option>
                    {egyptianGovernorates.map(gov => (
                      <option key={gov} value={gov}>{gov}</option>
                    ))}
                  </select>
                  {errors.location?.governorate && <p className="text-red-500 text-sm mt-1">{errors.location.governorate.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    المدينة *
                  </label>
                  <input
                    type="text"
                    {...register('location.city')}
                    placeholder="مثال: الزقازيق، المنصورة"
                    className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  {errors.location?.city && <p className="text-red-500 text-sm mt-1">{errors.location.city.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    المنطقة *
                  </label>
                  <input
                    type="text"
                    {...register('location.area')}
                    placeholder="مثال: وسط البلد، الصاغة"
                    className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  {errors.location?.area && <p className="text-red-500 text-sm mt-1">{errors.location.area.message}</p>}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                سبب البيع *
              </label>
              <textarea
                {...register('reasonForSelling')}
                rows={3}
                placeholder="مثال: شراء سيارة جديدة، السفر، عدم الحاجة..."
                className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              {errors.reasonForSelling && <p className="text-red-500 text-sm mt-1">{errors.reasonForSelling.message}</p>}
            </div>

            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  {...register('negotiable')}
                  className="w-5 h-5 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-neutral-700">
                  السعر قابل للتفاوض
                </span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  {...register('availableForInspection')}
                  className="w-5 h-5 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-neutral-700">
                  متاح للمعاينة
                </span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  {...register('urgentSale')}
                  className="w-5 h-5 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-neutral-700">
                  بيع عاجل
                </span>
              </label>
            </div>
          </motion.div>
        );

      case 5:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-neutral-900">مراجعة وتأكيد</h2>
              <p className="text-neutral-600">راجع جميع البيانات قبل الإرسال</p>
            </div>

            <div className="bg-neutral-50 p-6 rounded-lg space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-3">بيانات السيارة</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <p><span className="font-medium">السيارة:</span> {watch('make')} {watch('model')} {watch('year')}</p>
                  <p><span className="font-medium">الكيلومترات:</span> {watch('mileage')?.toLocaleString()} كم</p>
                  <p><span className="font-medium">السعر:</span> {watch('askingPrice')?.toLocaleString()} جنيه</p>
                  <p><span className="font-medium">الحالة:</span> {watch('condition')}</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-3">بيانات التواصل</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <p><span className="font-medium">البائع:</span> {watch('sellerName')}</p>
                  <p><span className="font-medium">الهاتف:</span> {watch('phoneNumber')}</p>
                  <p><span className="font-medium">الموقع:</span> {watch('location.governorate')}, {watch('location.city')}</p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">تنبيه مهم:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• سيتم مراجعة طلبك خلال 24-48 ساعة</li>
                <li>• تأكد من صحة جميع البيانات المدخلة</li>
                <li>• سنتواصل معك لتأكيد البيانات قبل النشر</li>
                <li>• رسوم النشر: مجاني لأول إعلان، 50 جنيه للإعلانات الإضافية</li>
              </ul>
            </div>

            <div>
              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  {...register('agreeToTerms')}
                  className="w-5 h-5 text-primary-600 border-neutral-300 rounded focus:ring-primary-500 mt-1"
                />
                <span className="text-sm text-neutral-700">
                  أوافق على <a href="/terms" className="text-primary-600 hover:underline">الشروط والأحكام</a> و 
                  <a href="/privacy" className="text-primary-600 hover:underline"> سياسة الخصوصية</a> الخاصة بسوق السيارات.
                  أتحمل المسؤولية الكاملة عن صحة البيانات المقدمة.
                </span>
              </label>
              {errors.agreeToTerms && <p className="text-red-500 text-sm mt-1">{errors.agreeToTerms.message}</p>}
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  if (!user) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-neutral-600">
              خطوة {currentStep} من 5
            </span>
            <span className="text-sm font-medium text-neutral-600">
              {Math.round((currentStep / 5) * 100)}%
            </span>
          </div>
          <div className="w-full bg-neutral-200 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / 5) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Form Card */}
        <motion.div
          className="bg-white rounded-2xl shadow-xl p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <form onSubmit={handleSubmit(onSubmit)}>
            {renderStep()}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-8 mt-8 border-t border-neutral-200">
              {currentStep > 1 && (
                <motion.button
                  type="button"
                  onClick={prevStep}
                  className="btn btn-outline"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  السابق
                </motion.button>
              )}

              <motion.button
                type="submit"
                disabled={isSubmitting}
                className={`btn btn-primary ${currentStep === 1 ? 'mr-auto' : ''}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isSubmitting ? (
                  <LoadingSpinner />
                ) : currentStep === 5 ? (
                  'إرسال الطلب'
                ) : (
                  'التالي'
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default UsedCarSellingPage;