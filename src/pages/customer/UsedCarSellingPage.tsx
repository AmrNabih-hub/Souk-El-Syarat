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
  }).required('معلومات الموقع مطلوبة'),
  reasonForSelling: yup.string().required('سبب البيع مطلوب'),
  agreeToTerms: yup.boolean().oneOf([true], 'يجب الموافقة على الشروط والأحكام'),
});

const UsedCarSellingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { language } = useAppStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
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
    console.log('🔄 Attempting to move to next step from step:', currentStep);
    
    const fieldsToValidate = getStepFields(currentStep);
    console.log('📋 Fields to validate:', fieldsToValidate);
    
    try {
      const isValid = await trigger(fieldsToValidate as any);
      console.log('✅ Validation result:', isValid);
      
      // Additional validation for step 3 (features)
      if (currentStep === 3 && selectedFeatures.length === 0) {
        toast.error(language === 'ar' ? 'يرجى اختيار مميزة واحدة على الأقل' : 'Please select at least one feature');
        return;
      }
      
      if (isValid) {
        console.log('✅ Moving to step:', currentStep + 1);
        setCurrentStep(currentStep + 1);
        // Scroll to top of form
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        // Show validation errors
        console.log('❌ Validation failed for fields:', fieldsToValidate);
        toast.error(language === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      }
    } catch (error) {
      console.error('❌ Validation error:', error);
      // Fallback: move to next step anyway if validation fails
      console.log('🔄 Fallback: Moving to next step despite validation error');
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const getStepFields = (step: number) => {
    switch (step) {
      case 1: return ['make', 'model', 'year', 'mileage', 'transmission', 'fuelType', 'color'];
      case 2: return ['askingPrice', 'condition', 'hasOwnershipPapers', 'hasServiceHistory'];
      case 3: return ['description'];
      case 4: return ['sellerName', 'phoneNumber', 'location.governorate', 'location.city', 'location.area'];
      case 5: return ['reasonForSelling', 'agreeToTerms'];
      default: return [];
    }
  };

  const onSubmit = async (data: UsedCarData) => {
    console.log('📝 Form submitted for step:', currentStep);
    console.log('📊 Form data:', data);
    
    // If not on final step, validate and move to next step
    if (currentStep < 5) {
      console.log('➡️ Not final step, calling nextStep()');
      await nextStep();
      return;
    }

    // Final step - submit the form
    // Validate minimum images requirement
    if (carImages.length < 6) {
      toast.error(language === 'ar' ? 'يرجى رفع 6 صور على الأقل للسيارة' : 'Please upload at least 6 car images');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate API call delay for better UX
      await new Promise(resolve => setTimeout(resolve, 2000));
      
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

      // Show success state
      setIsSubmitting(false);
      setIsSubmitted(true);
      
      // Auto redirect after 3 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
      
    } catch (error) {
      console.error('Error submitting car listing:', error);
      setIsSubmitting(false);
      toast.error(language === 'ar' ? 'حدث خطأ في إرسال الطلب. يرجى المحاولة مرة أخرى.' : 'Error submitting listing. Please try again.');
    }
  };

  // Success screen component
  const renderSuccessScreen = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-12"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className="w-24 h-24 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center"
      >
        <motion.svg
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="w-12 h-12 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
            d="M5 13l4 4L19 7"
          />
        </motion.svg>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="text-3xl font-bold text-green-600 mb-4"
      >
        {language === 'ar' ? 'تم إرسال الطلب بنجاح!' : 'Form Submitted Successfully!'}
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="text-lg text-neutral-600 mb-6"
      >
        {language === 'ar' 
          ? 'شكراً لك! تم إرسال طلب بيع السيارة بنجاح. سنتواصل معك خلال 24-48 ساعة للرد على طلبك.'
          : 'Thank you! Your car listing request has been submitted successfully. We will contact you within 24-48 hours to respond to your request.'
        }
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
        className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6"
      >
        <p className="text-blue-800 font-medium">
          {language === 'ar' 
            ? '📧 ستصلك رسالة تأكيد على بريدك الإلكتروني قريباً'
            : '📧 You will receive a confirmation email shortly'
          }
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.3 }}
        className="text-sm text-neutral-500"
      >
        {language === 'ar' 
          ? 'سيتم توجيهك إلى لوحة التحكم خلال 3 ثوانٍ...'
          : 'Redirecting to dashboard in 3 seconds...'
        }
      </motion.div>

      <motion.div
        initial={{ width: 0 }}
        animate={{ width: '100%' }}
        transition={{ delay: 1.5, duration: 3 }}
        className="mt-4 h-1 bg-gradient-to-r from-green-500 to-blue-500 rounded-full"
      />
    </motion.div>
  );

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
          {/* Step Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-neutral-900">
                {language === 'ar' ? 'بيع سيارتك' : 'Sell Your Car'}
              </h1>
              <span className="text-sm text-neutral-500">
                {language === 'ar' ? `الخطوة ${currentStep} من 5` : `Step ${currentStep} of 5`}
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-neutral-200 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-primary-500 to-secondary-600 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(currentStep / 5) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
            </div>
            
            {/* Step Labels */}
            <div className="flex justify-between mt-4 text-xs text-neutral-600">
              <span className={currentStep >= 1 ? 'text-primary-600 font-semibold' : ''}>
                {language === 'ar' ? 'البيانات الأساسية' : 'Basic Info'}
              </span>
              <span className={currentStep >= 2 ? 'text-primary-600 font-semibold' : ''}>
                {language === 'ar' ? 'السعر والحالة' : 'Price & Condition'}
              </span>
              <span className={currentStep >= 3 ? 'text-primary-600 font-semibold' : ''}>
                {language === 'ar' ? 'الوصف والمميزات' : 'Description'}
              </span>
              <span className={currentStep >= 4 ? 'text-primary-600 font-semibold' : ''}>
                {language === 'ar' ? 'معلومات الاتصال' : 'Contact Info'}
              </span>
              <span className={currentStep >= 5 ? 'text-primary-600 font-semibold' : ''}>
                {language === 'ar' ? 'الصور والمراجعة' : 'Images & Review'}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            {isSubmitted ? renderSuccessScreen() : renderStep()}

            {/* Navigation Buttons - Hide when submitted */}
            {!isSubmitted && (
              <div className="flex justify-between pt-8 mt-8 border-t border-neutral-200">
              {currentStep > 1 && (
                <motion.button
                  type="button"
                  onClick={prevStep}
                  className="flex items-center px-6 py-3 text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg font-medium transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  {language === 'ar' ? 'السابق' : 'Previous'}
                </motion.button>
              )}

              {/* Debug Test Button - Only show on step 5 */}
              {currentStep === 5 && process.env.NODE_ENV === 'development' && (
                <motion.button
                  type="button"
                  onClick={async () => {
                    console.log('🧪 DEBUG: Force submission test');
                    const formData = watch();
                    console.log('🧪 Form data:', formData);
                    console.log('🧪 Images:', carImages.length);
                    
                    // Force submission
                    setIsSubmitting(true);
                    setTimeout(() => {
                      setIsSubmitting(false);
                      setIsSubmitted(true);
                      console.log('🧪 DEBUG: Forced success state');
                    }, 2000);
                  }}
                  className="flex items-center px-4 py-2 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors mr-2"
                >
                  🧪 Force Submit
                </motion.button>
              )}

              <motion.button
                type="button"
                onClick={async () => {
                  console.log('🔄 Next button clicked for step:', currentStep);
                  console.log('🔍 isSubmitting:', isSubmitting);
                  console.log('🔍 isSubmitted:', isSubmitted);
                  console.log('🔍 carImages.length:', carImages.length);
                  
                  // Prevent multiple clicks
                  if (isSubmitting || isSubmitted) {
                    console.log('❌ Already submitting or submitted, ignoring click');
                    return;
                  }
                  
                  if (currentStep < 5) {
                    // Basic validation before moving to next step
                    const currentFormData = watch();
                    console.log('📊 Current form data:', currentFormData);
                    
                    // Check if basic required fields are filled for current step
                    let canProceed = true;
                    
                    if (currentStep === 1) {
                      // Step 1: Basic car info
                      if (!currentFormData.make || !currentFormData.model || !currentFormData.year) {
                        toast.error(language === 'ar' ? 'يرجى ملء البيانات الأساسية للسيارة' : 'Please fill in basic car information');
                        canProceed = false;
                      }
                    } else if (currentStep === 2) {
                      // Step 2: Price and condition
                      if (!currentFormData.askingPrice || !currentFormData.condition) {
                        toast.error(language === 'ar' ? 'يرجى ملء السعر وحالة السيارة' : 'Please fill in price and condition');
                        canProceed = false;
                      }
                    } else if (currentStep === 3) {
                      // Step 3: Description and features
                      if (!currentFormData.description || selectedFeatures.length === 0) {
                        toast.error(language === 'ar' ? 'يرجى كتابة الوصف واختيار المميزات' : 'Please write description and select features');
                        canProceed = false;
                      }
                    } else if (currentStep === 4) {
                      // Step 4: Contact info
                      if (!currentFormData.sellerName || !currentFormData.phoneNumber || !currentFormData.location?.governorate) {
                        toast.error(language === 'ar' ? 'يرجى ملء معلومات الاتصال والموقع' : 'Please fill in contact information and location');
                        canProceed = false;
                      }
                    }
                    
                    if (canProceed) {
                      console.log('✅ Validation passed, moving to next step');
                      setCurrentStep(currentStep + 1);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    } else {
                      console.log('❌ Validation failed, staying on current step');
                    }
                  } else {
                    // For final step, trigger form submission
                    console.log('📝 Final step - submitting form');
                    const formData = watch();
                    console.log('📊 Final form data:', formData);
                    
                    // Check if we have minimum images
                    if (carImages.length < 6) {
                      toast.error(language === 'ar' ? 'يرجى رفع 6 صور على الأقل للسيارة' : 'Please upload at least 6 car images');
                      return;
                    }
                    
                    // Direct submission - bypass form validation
                    console.log('🚀 Direct submission - calling onSubmit');
                    try {
                      await onSubmit(formData);
                    } catch (error) {
                      console.error('❌ Direct submission error:', error);
                      toast.error(language === 'ar' ? 'حدث خطأ في الإرسال' : 'Submission error');
                    }
                  }
                }}
                disabled={isSubmitting}
                className={`flex items-center px-8 py-3 bg-gradient-to-r from-primary-500 to-secondary-600 text-white rounded-lg font-semibold hover:from-primary-600 hover:to-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all ${currentStep === 1 ? 'ml-auto' : ''}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                    />
                    {language === 'ar' ? 'جاري الإرسال...' : 'Submitting...'}
                  </div>
                ) : currentStep === 5 ? (
                  <>
                    {language === 'ar' ? 'إرسال الطلب' : 'Submit Listing'}
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </>
                ) : (
                  <>
                    {language === 'ar' ? 'التالي' : 'Next'}
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </motion.button>
              </div>
            )}
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default UsedCarSellingPage;