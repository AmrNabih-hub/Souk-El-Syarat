import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  BuildingStorefrontIcon,
  UserIcon,
  MapPinIcon,
  DocumentIcon,
  CheckCircleIcon,
  CloudArrowUpIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import { useAppStore } from '@/stores/appStore';
import { useAuthStore } from '@/stores/authStore';
import { BusinessType } from '@/types';
import { VendorSubscriptionPlan } from '@/types/payment';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import SubscriptionPlans from '@/components/payment/SubscriptionPlans';
import toast from 'react-hot-toast';
import { vendorApplicationService, VendorApplicationData } from '@/services/vendor-application.service';
import { EmailNotificationService } from '@/services/email-notification.service';

interface VendorApplicationFormData {
  businessName: string;
  businessType: BusinessType;
  description: string;
  contactPerson: string;
  email: string;
  phoneNumber: string;
  whatsappNumber?: string;
  address: {
    street: string;
    city: string;
    governorate: string;
    postalCode?: string;
  };
  businessLicense: string;
  taxId?: string;
  website?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  experience: string;
  specializations: string[];
  expectedMonthlyVolume: string;
  subscriptionPlan: VendorSubscriptionPlan;
  documents: FileList;
  instapayReceipt?: FileList;
  agreeToTerms: boolean;
}

const applicationSchema = yup.object().shape({
  businessName: yup.string().required('اسم النشاط التجاري مطلوب'),
  businessType: yup
    .mixed<BusinessType>()
    .oneOf([
      'dealership',
      'parts_supplier',
      'service_center',
      'individual',
      'manufacturer',
    ] as const)
    .required('نوع النشاط التجاري مطلوب'),
  description: yup
    .string()
    .min(50, 'الوصف يجب أن يكون 50 حرف على الأقل')
    .required('وصف النشاط مطلوب'),
  contactPerson: yup.string().required('اسم الشخص المسؤول مطلوب'),
  email: yup.string().email('البريد الإلكتروني غير صحيح').required('البريد الإلكتروني مطلوب'),
  phoneNumber: yup
    .string()
    .matches(/^01[0-2]\d{8}$/, 'رقم الهاتف غير صحيح')
    .required('رقم الهاتف مطلوب'),
  whatsappNumber: yup
    .string()
    .matches(/^01[0-2]\d{8}$/, 'رقم واتساب غير صحيح')
    .optional(),
  address: yup.object().shape({
    street: yup.string().required('العنوان مطلوب'),
    city: yup.string().required('المدينة مطلوبة'),
    governorate: yup.string().required('المحافظة مطلوبة'),
    postalCode: yup.string().optional(),
  }).required('معلومات العنوان مطلوبة'),
  businessLicense: yup.string().required('رقم السجل التجاري مطلوب'),
  taxId: yup.string().optional(),
  website: yup.string().url('رابط الموقع غير صحيح').optional(),
  experience: yup.string().required('سنوات الخبرة مطلوبة'),
  specializations: yup
    .array()
    .of(yup.string().required())
    .min(1, 'يجب اختيار تخصص واحد على الأقل')
    .required('التخصصات مطلوبة'),
  expectedMonthlyVolume: yup.string().required('الحجم المتوقع للمبيعات مطلوب'),
  subscriptionPlan: yup
    .mixed<VendorSubscriptionPlan>()
    .oneOf(['basic', 'premium', 'enterprise'] as const)
    .required('خطة الاشتراك مطلوبة'),
  documents: yup
    .array()
    .of(yup.mixed<File>())
    .min(1, 'يجب رفع وثيقة واحدة على الأقل')
    .required('الوثائق مطلوبة'),
  instapayReceipt: yup
    .array()
    .of(yup.mixed<File>())
    .optional(),
  agreeToTerms: yup.boolean().oneOf([true], 'يجب الموافقة على الشروط والأحكام'),
});

const VendorApplicationPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { language } = useAppStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);
  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<VendorApplicationFormData>({
    resolver: yupResolver(applicationSchema) as any,
    defaultValues: {
      email: user?.email || '',
      contactPerson: user?.displayName || '',
      specializations: [],
      agreeToTerms: false,
    },
  });

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!user) {
      toast.error(language === 'ar' ? 'يجب تسجيل الدخول أولاً' : 'Please login first');
      navigate('/login');
    }
  }, [user, navigate, language]);

  const businessTypes: { value: BusinessType; label: { ar: string; en: string } }[] = [
    { value: 'dealership', label: { ar: 'معرض سيارات', en: 'Car Dealership' } },
    { value: 'parts_supplier', label: { ar: 'مورد قطع غيار', en: 'Parts Supplier' } },
    { value: 'service_center', label: { ar: 'مركز خدمة', en: 'Service Center' } },
    { value: 'individual', label: { ar: 'فرد', en: 'Individual' } },
  ];

  const specializationOptions = [
    { value: 'new_cars', label: { ar: 'سيارات جديدة', en: 'New Cars' } },
    { value: 'used_cars', label: { ar: 'سيارات مستعملة', en: 'Used Cars' } },
    { value: 'luxury_cars', label: { ar: 'سيارات فاخرة', en: 'Luxury Cars' } },
    { value: 'commercial_vehicles', label: { ar: 'مركبات تجارية', en: 'Commercial Vehicles' } },
    { value: 'motorcycles', label: { ar: 'دراجات نارية', en: 'Motorcycles' } },
    { value: 'engine_parts', label: { ar: 'قطع المحرك', en: 'Engine Parts' } },
    { value: 'body_parts', label: { ar: 'قطع الهيكل', en: 'Body Parts' } },
    { value: 'electrical_parts', label: { ar: 'قطع كهربائية', en: 'Electrical Parts' } },
    { value: 'maintenance', label: { ar: 'صيانة عامة', en: 'General Maintenance' } },
    { value: 'ac_repair', label: { ar: 'إصلاح تكييف', en: 'AC Repair' } },
    { value: 'tire_service', label: { ar: 'خدمة الإطارات', en: 'Tire Service' } },
    { value: 'paint_service', label: { ar: 'خدمة الدهان', en: 'Paint Service' } },
  ];

  const governorates = [
    'القاهرة',
    'الجيزة',
    'الإسكندرية',
    'الدقهلية',
    'الشرقية',
    'القليوبية',
    'كفر الشيخ',
    'الغربية',
    'المنوفية',
    'البحيرة',
    'دمياط',
    'بورسعيد',
    'الإسماعيلية',
    'السويس',
    'شمال سيناء',
    'جنوب سيناء',
    'المنيا',
    'بني سويف',
    'الفيوم',
    'أسيوط',
    'سوهاج',
    'قنا',
    'الأقصر',
    'أسوان',
    'البحر الأحمر',
    'الوادي الجديد',
    'مطروح',
  ];

  const handleSpecializationChange = (specialization: string) => {
    const updatedSpecializations = selectedSpecializations.includes(specialization)
      ? selectedSpecializations.filter(s => s !== specialization)
      : [...selectedSpecializations, specialization];

    setSelectedSpecializations(updatedSpecializations);
    setValue('specializations', updatedSpecializations);
  };

  const onSubmit = async (data: VendorApplicationFormData) => {
    // Prevent multiple submissions
    if (isSubmitting || applicationSubmitted) {
      return;
    }

    try {
      setIsSubmitting(true);

      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Validate required files
      if (!data.documents || data.documents.length === 0) {
        toast.error(language === 'ar' ? 'يجب رفع وثيقة واحدة على الأقل' : 'Please upload at least one document');
        return;
      }

      const applicationData: VendorApplicationData = {
        businessName: data.businessName,
        businessType: data.businessType,
        description: data.description,
        contactPerson: data.contactPerson,
        email: data.email,
        phoneNumber: data.phoneNumber,
        whatsappNumber: data.whatsappNumber,
        address: data.address,
        businessLicense: data.businessLicense,
        taxId: data.taxId,
        website: data.website,
        socialMedia: data.socialMedia,
        experience: data.experience,
        specializations: data.specializations,
        expectedMonthlyVolume: data.expectedMonthlyVolume,
        subscriptionPlan: 'basic', // Default subscription plan
        documents: [], // File uploads would be handled here
        agreeToTerms: true, // Assuming user agreed to terms to submit
      };

      // Convert FileList to File array
      const documentsArray = data.documents ? Array.from(data.documents) : [];
      const invoiceFile = data.instapayReceipt ? data.instapayReceipt[0] : undefined;

      const applicationId = await vendorApplicationService.submitApplication(
        user.id, 
        applicationData, 
        documentsArray, 
        invoiceFile
      );
      
      console.log('Application submitted with ID:', applicationId);

      // Send notification to admin (async, don't wait)
      EmailNotificationService.notifyAdminNewVendorApplication({
        companyName: data.businessName,
        userName: user.displayName || user.email || 'Unknown',
        userEmail: user.email || '',
        licenseNumber: data.businessLicense,
        description: data.description,
        applicationId
      }).catch(err => console.error('[VendorApplication] Email error:', err));

      setApplicationSubmitted(true);
      toast.success(
        language === 'ar' 
          ? 'تم تقديم الطلب بنجاح! سيتم مراجعته خلال 3-5 أيام عمل.' 
          : 'Application submitted successfully! It will be reviewed within 3-5 business days.',
        { duration: 5000 }
      );
      
      // Update user status to indicate pending vendor application
      if (user) {
        useAuthStore.getState().setUser({ ...user, role: 'customer' }); // Keep as customer until approved
      }
      
    } catch (error) {
      console.error('Application submission error:', error);
      toast.error(
        language === 'ar' 
          ? 'حدث خطأ في تقديم الطلب. يرجى المحاولة مرة أخرى.' 
          : 'Error submitting application. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  if (applicationSubmitted) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8'>
        <div className='absolute inset-0 pyramid-pattern opacity-5'></div>
        <motion.div
          className='relative max-w-md w-full text-center'
          variants={pageVariants}
          initial='initial'
          animate='animate'
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className='w-20 h-20 bg-success-500 rounded-full flex items-center justify-center mx-auto mb-6'
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            <CheckCircleIcon className='w-10 h-10 text-white' />
          </motion.div>

          <h2 className='text-3xl font-bold text-neutral-900 mb-4'>
            {language === 'ar' ? 'تم تقديم الطلب بنجاح!' : 'Application Submitted!'}
          </h2>

          <p className='text-neutral-600 mb-8 leading-relaxed'>
            {language === 'ar'
              ? 'شكراً لك على تقديم طلب الانضمام كتاجر. سيتم مراجعة طلبك خلال 3-5 أيام عمل وسنتواصل معك قريباً.'
              : 'Thank you for submitting your vendor application. Your request will be reviewed within 3-5 business days and we will contact you soon.'}
          </p>

          <div className='space-y-4'>
            <button
              onClick={() => navigate('/customer/dashboard')}
              className='w-full btn btn-primary'
            >
              {language === 'ar' ? 'الذهاب إلى لوحة التحكم' : 'Go to Dashboard'}
            </button>

            <button onClick={() => navigate('/')} className='w-full btn btn-outline'>
              {language === 'ar' ? 'العودة إلى الصفحة الرئيسية' : 'Back to Home'}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return <LoadingSpinner size='lg' />;
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='absolute inset-0 pyramid-pattern opacity-5'></div>

      <div className='relative max-w-4xl mx-auto'>
        <motion.div
          className='text-center mb-8'
          variants={pageVariants}
          initial='initial'
          animate='animate'
          transition={{ duration: 0.5 }}
        >
          <BuildingStorefrontIcon className='w-16 h-16 text-primary-500 mx-auto mb-4' />
          <h1 className='text-4xl font-bold gradient-text mb-2'>
            {language === 'ar' ? 'طلب الانضمام كتاجر' : 'Vendor Application'}
          </h1>
          <p className='text-xl text-neutral-600'>
            {language === 'ar'
              ? 'انضم إلى أكبر منصة للتجارة الإلكترونية في مصر'
              : "Join Egypt's largest e-commerce platform"}
          </p>
        </motion.div>

        <motion.div
          className='bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden'
          variants={pageVariants}
          initial='initial'
          animate='animate'
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className='px-8 py-6 bg-gradient-to-r from-primary-500 to-secondary-500'>
            <h2 className='text-2xl font-bold text-white'>
              {language === 'ar' ? 'معلومات النشاط التجاري' : 'Business Information'}
            </h2>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className='p-8 space-y-8'>
            {/* Business Details Section */}
            <div className='space-y-6'>
              <h3 className='text-xl font-semibold text-neutral-900 flex items-center'>
                <BuildingStorefrontIcon className='w-6 h-6 text-primary-500 mr-3' />
                {language === 'ar' ? 'تفاصيل النشاط' : 'Business Details'}
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    {language === 'ar' ? 'اسم النشاط التجاري' : 'Business Name'} *
                  </label>
                  <input
                    {...register('businessName')}
                    type='text'
                    className={`input w-full ${errors.businessName ? 'border-red-500' : ''}`}
                    placeholder={
                      language === 'ar' ? 'مثال: معرض النصر للسيارات' : 'e.g. Al Nasr Car Showroom'
                    }
                  />
                  {errors.businessName && (
                    <p className='text-red-500 text-sm mt-1'>{errors.businessName.message}</p>
                  )}
                </div>

                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    {language === 'ar' ? 'نوع النشاط التجاري' : 'Business Type'} *
                  </label>
                  <select
                    {...register('businessType')}
                    className={`input w-full ${errors.businessType ? 'border-red-500' : ''}`}
                  >
                    <option value=''>
                      {language === 'ar' ? 'اختر نوع النشاط' : 'Select business type'}
                    </option>
                    {businessTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label[language]}
                      </option>
                    ))}
                  </select>
                  {errors.businessType && (
                    <p className='text-red-500 text-sm mt-1'>{errors.businessType.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>
                  {language === 'ar' ? 'وصف النشاط التجاري' : 'Business Description'} *
                </label>
                <textarea
                  {...register('description')}
                  rows={4}
                  className={`input w-full ${errors.description ? 'border-red-500' : ''}`}
                  placeholder={
                    language === 'ar'
                      ? 'اكتب وصفاً مفصلاً عن نشاطك التجاري والخدمات التي تقدمها...'
                      : 'Write a detailed description of your business and services...'
                  }
                />
                {errors.description && (
                  <p className='text-red-500 text-sm mt-1'>{errors.description.message}</p>
                )}
              </div>
            </div>

            {/* Contact Information Section */}
            <div className='space-y-6'>
              <h3 className='text-xl font-semibold text-neutral-900 flex items-center'>
                <UserIcon className='w-6 h-6 text-primary-500 mr-3' />
                {language === 'ar' ? 'معلومات الاتصال' : 'Contact Information'}
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    {language === 'ar' ? 'اسم الشخص المسؤول' : 'Contact Person'} *
                  </label>
                  <input
                    {...register('contactPerson')}
                    type='text'
                    className={`input w-full ${errors.contactPerson ? 'border-red-500' : ''}`}
                  />
                  {errors.contactPerson && (
                    <p className='text-red-500 text-sm mt-1'>{errors.contactPerson.message}</p>
                  )}
                </div>

                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    {language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'} *
                  </label>
                  <input
                    {...register('email')}
                    type='email'
                    className={`input w-full ${errors.email ? 'border-red-500' : ''}`}
                  />
                  {errors.email && (
                    <p className='text-red-500 text-sm mt-1'>{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    {language === 'ar' ? 'رقم الهاتف' : 'Phone Number'} *
                  </label>
                  <input
                    {...register('phoneNumber')}
                    type='tel'
                    className={`input w-full ${errors.phoneNumber ? 'border-red-500' : ''}`}
                    placeholder='01XXXXXXXXX'
                  />
                  {errors.phoneNumber && (
                    <p className='text-red-500 text-sm mt-1'>{errors.phoneNumber.message}</p>
                  )}
                </div>

                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    {language === 'ar' ? 'رقم واتساب (اختياري)' : 'WhatsApp Number (Optional)'}
                  </label>
                  <input
                    {...register('whatsappNumber')}
                    type='tel'
                    className={`input w-full ${errors.whatsappNumber ? 'border-red-500' : ''}`}
                    placeholder='01XXXXXXXXX'
                  />
                  {errors.whatsappNumber && (
                    <p className='text-red-500 text-sm mt-1'>{errors.whatsappNumber.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Address Section */}
            <div className='space-y-6'>
              <h3 className='text-xl font-semibold text-neutral-900 flex items-center'>
                <MapPinIcon className='w-6 h-6 text-primary-500 mr-3' />
                {language === 'ar' ? 'العنوان' : 'Address'}
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='md:col-span-2'>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    {language === 'ar' ? 'العنوان بالتفصيل' : 'Street Address'} *
                  </label>
                  <input
                    {...register('address.street')}
                    type='text'
                    className={`input w-full ${errors.address?.street ? 'border-red-500' : ''}`}
                    placeholder={
                      language === 'ar'
                        ? 'رقم المبنى، اسم الشارع، الحي'
                        : 'Building number, street name, district'
                    }
                  />
                  {errors.address?.street && (
                    <p className='text-red-500 text-sm mt-1'>{errors.address.street.message}</p>
                  )}
                </div>

                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    {language === 'ar' ? 'المدينة' : 'City'} *
                  </label>
                  <input
                    {...register('address.city')}
                    type='text'
                    className={`input w-full ${errors.address?.city ? 'border-red-500' : ''}`}
                  />
                  {errors.address?.city && (
                    <p className='text-red-500 text-sm mt-1'>{errors.address.city.message}</p>
                  )}
                </div>

                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    {language === 'ar' ? 'المحافظة' : 'Governorate'} *
                  </label>
                  <select
                    {...register('address.governorate')}
                    className={`input w-full ${errors.address?.governorate ? 'border-red-500' : ''}`}
                  >
                    <option value=''>
                      {language === 'ar' ? 'اختر المحافظة' : 'Select governorate'}
                    </option>
                    {governorates.map(gov => (
                      <option key={gov} value={gov}>
                        {gov}
                      </option>
                    ))}
                  </select>
                  {errors.address?.governorate && (
                    <p className='text-red-500 text-sm mt-1'>
                      {errors.address.governorate.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    {language === 'ar' ? 'الرمز البريدي (اختياري)' : 'Postal Code (Optional)'}
                  </label>
                  <input {...register('address.postalCode')} type='text' className='input w-full' />
                </div>
              </div>
            </div>

            {/* Legal Information Section */}
            <div className='space-y-6'>
              <h3 className='text-xl font-semibold text-neutral-900 flex items-center'>
                <DocumentIcon className='w-6 h-6 text-primary-500 mr-3' />
                {language === 'ar' ? 'المعلومات القانونية' : 'Legal Information'}
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    {language === 'ar' ? 'رقم السجل التجاري' : 'Business License Number'} *
                  </label>
                  <input
                    {...register('businessLicense')}
                    type='text'
                    className={`input w-full ${errors.businessLicense ? 'border-red-500' : ''}`}
                  />
                  {errors.businessLicense && (
                    <p className='text-red-500 text-sm mt-1'>{errors.businessLicense.message}</p>
                  )}
                </div>

                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    {language === 'ar' ? 'الرقم الضريبي (اختياري)' : 'Tax ID (Optional)'}
                  </label>
                  <input {...register('taxId')} type='text' className='input w-full' />
                </div>

                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    {language === 'ar' ? 'موقع الويب (اختياري)' : 'Website (Optional)'}
                  </label>
                  <input
                    {...register('website')}
                    type='url'
                    className={`input w-full ${errors.website ? 'border-red-500' : ''}`}
                    placeholder='https://example.com'
                  />
                  {errors.website && (
                    <p className='text-red-500 text-sm mt-1'>{errors.website.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Business Experience Section */}
            <div className='space-y-6'>
              <h3 className='text-xl font-semibold text-neutral-900'>
                {language === 'ar' ? 'الخبرة والتخصصات' : 'Experience & Specializations'}
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    {language === 'ar' ? 'سنوات الخبرة' : 'Years of Experience'} *
                  </label>
                  <select
                    {...register('experience')}
                    className={`input w-full ${errors.experience ? 'border-red-500' : ''}`}
                  >
                    <option value=''>
                      {language === 'ar' ? 'اختر سنوات الخبرة' : 'Select experience'}
                    </option>
                    <option value='less_than_1'>
                      {language === 'ar' ? 'أقل من سنة' : 'Less than 1 year'}
                    </option>
                    <option value='1_3'>{language === 'ar' ? '1-3 سنوات' : '1-3 years'}</option>
                    <option value='3_5'>{language === 'ar' ? '3-5 سنوات' : '3-5 years'}</option>
                    <option value='5_10'>{language === 'ar' ? '5-10 سنوات' : '5-10 years'}</option>
                    <option value='more_than_10'>
                      {language === 'ar' ? 'أكثر من 10 سنوات' : 'More than 10 years'}
                    </option>
                  </select>
                  {errors.experience && (
                    <p className='text-red-500 text-sm mt-1'>{errors.experience.message}</p>
                  )}
                </div>

                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    {language === 'ar'
                      ? 'الحجم المتوقع للمبيعات الشهرية'
                      : 'Expected Monthly Sales Volume'}{' '}
                    *
                  </label>
                  <select
                    {...register('expectedMonthlyVolume')}
                    className={`input w-full ${errors.expectedMonthlyVolume ? 'border-red-500' : ''}`}
                  >
                    <option value=''>
                      {language === 'ar' ? 'اختر الحجم المتوقع' : 'Select expected volume'}
                    </option>
                    <option value='less_than_50k'>
                      {language === 'ar' ? 'أقل من 50,000 جنيه' : 'Less than 50,000 EGP'}
                    </option>
                    <option value='50k_100k'>
                      {language === 'ar' ? '50,000 - 100,000 جنيه' : '50,000 - 100,000 EGP'}
                    </option>
                    <option value='100k_500k'>
                      {language === 'ar' ? '100,000 - 500,000 جنيه' : '100,000 - 500,000 EGP'}
                    </option>
                    <option value='500k_1m'>
                      {language === 'ar' ? '500,000 - 1,000,000 جنيه' : '500,000 - 1,000,000 EGP'}
                    </option>
                    <option value='more_than_1m'>
                      {language === 'ar' ? 'أكثر من 1,000,000 جنيه' : 'More than 1,000,000 EGP'}
                    </option>
                  </select>
                  {errors.expectedMonthlyVolume && (
                    <p className='text-red-500 text-sm mt-1'>
                      {errors.expectedMonthlyVolume.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-4'>
                  {language === 'ar' ? 'التخصصات' : 'Specializations'} *
                </label>
                <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
                  {specializationOptions.map(spec => (
                    <label
                      key={spec.value}
                      className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedSpecializations.includes(spec.value)
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-neutral-200 hover:border-primary-300'
                      }`}
                    >
                      <input
                        type='checkbox'
                        checked={selectedSpecializations.includes(spec.value)}
                        onChange={() => handleSpecializationChange(spec.value)}
                        className='sr-only'
                      />
                      <div
                        className={`w-4 h-4 rounded border-2 mr-3 flex items-center justify-center ${
                          selectedSpecializations.includes(spec.value)
                            ? 'border-primary-500 bg-primary-500'
                            : 'border-neutral-300'
                        }`}
                      >
                        {selectedSpecializations.includes(spec.value) && (
                          <CheckCircleIcon className='w-3 h-3 text-white' />
                        )}
                      </div>
                      <span className='text-sm font-medium text-neutral-700'>
                        {spec.label[language]}
                      </span>
                    </label>
                  ))}
                </div>
                {errors.specializations && (
                  <p className='text-red-500 text-sm mt-2'>{errors.specializations.message}</p>
                )}
              </div>
            </div>

            {/* Document Upload Section */}
            <div className='space-y-6'>
              <h3 className='text-xl font-semibold text-neutral-900 flex items-center'>
                <CloudArrowUpIcon className='w-6 h-6 text-primary-500 mr-3' />
                {language === 'ar' ? 'المستندات المطلوبة' : 'Required Documents'}
              </h3>

              <div className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    {language === 'ar' ? 'المستندات الرسمية (PDF, JPG, PNG)' : 'Official Documents (PDF, JPG, PNG)'}
                  </label>
                  <input
                    {...register('documents')}
                    type='file'
                    multiple
                    accept='.pdf,.jpg,.jpeg,.png'
                    className='input w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100'
                  />
                  <p className='text-sm text-neutral-500 mt-1'>
                    {language === 'ar' 
                      ? 'يمكنك رفع السجل التجاري، الرقم الضريبي، أو أي مستندات أخرى' 
                      : 'You can upload business license, tax certificate, or other relevant documents'}
                  </p>
                </div>

                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    {language === 'ar' ? 'صورة فاتورة الاشتراك (اختياري)' : 'Subscription Invoice Screenshot (Optional)'}
                  </label>
                  <input
                    {...register('instapayReceipt')}
                    type='file'
                    accept='.jpg,.jpeg,.png,.pdf'
                    className='input w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-secondary-50 file:text-secondary-700 hover:file:bg-secondary-100'
                  />
                  <p className='text-sm text-neutral-500 mt-1'>
                    {language === 'ar' 
                      ? 'إذا كان لديك فاتورة دفع للاشتراك، يرجى رفعها لتسريع المراجعة' 
                      : 'If you have a payment receipt for subscription, please upload it to speed up review'}
                  </p>
                </div>

                <div className='bg-blue-50 p-4 rounded-lg border border-blue-200'>
                  <div className='flex items-start'>
                    <PhotoIcon className='w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0' />
                    <div>
                      <h4 className='text-sm font-medium text-blue-900 mb-1'>
                        {language === 'ar' ? 'نصائح لرفع المستندات' : 'Document Upload Tips'}
                      </h4>
                      <ul className='text-sm text-blue-700 space-y-1'>
                        <li>• {language === 'ar' ? 'تأكد من وضوح الصور والنصوص' : 'Ensure images and text are clear'}</li>
                        <li>• {language === 'ar' ? 'الحد الأقصى لحجم الملف: 5 ميجابايت' : 'Maximum file size: 5MB'}</li>
                        <li>• {language === 'ar' ? 'الأنواع المدعومة: PDF, JPG, PNG' : 'Supported types: PDF, JPG, PNG'}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className='space-y-6'>
              <div className='bg-neutral-50 p-6 rounded-lg'>
                <label className='flex items-start'>
                  <input
                    {...register('agreeToTerms')}
                    type='checkbox'
                    className={`mt-1 mr-3 ${errors.agreeToTerms ? 'border-red-500' : ''}`}
                  />
                  <span className='text-sm text-neutral-700'>
                    {language === 'ar'
                      ? 'أوافق على الشروط والأحكام وسياسة الخصوصية الخاصة بمنصة سوق السيارات. أفهم أن طلبي سيتم مراجعته من قبل فريق الإدارة وقد يستغرق الأمر 3-5 أيام عمل للحصول على الموافقة.'
                      : 'I agree to the terms and conditions and privacy policy of Souk El-Syarat platform. I understand that my application will be reviewed by the management team and it may take 3-5 business days to get approval.'}
                  </span>
                </label>
                {errors.agreeToTerms && (
                  <p className='text-red-500 text-sm mt-2'>{errors.agreeToTerms.message}</p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className='flex justify-center pt-6'>
              <motion.button
                type='submit'
                disabled={isSubmitting}
                className={`btn btn-primary btn-lg px-12 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isSubmitting ? (
                  <div className='flex items-center'>
                    <LoadingSpinner size='sm' />
                    <span className='ml-2'>
                      {language === 'ar' ? 'جاري التقديم...' : 'Submitting...'}
                    </span>
                  </div>
                ) : language === 'ar' ? (
                  'تقديم الطلب'
                ) : (
                  'Submit Application'
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default VendorApplicationPage;
