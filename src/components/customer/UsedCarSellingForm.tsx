import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDropzone } from 'react-dropzone';
import { CloudArrowUpIcon, XMarkIcon } from '@heroicons/react/24/outline';

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { useAppStore } from '@/stores/appStore';
import { useAuthStore } from '@/stores/authStore';

import { ProductService } from '@/services/product.service';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const usedCarSchema = yup.object().shape({
  title: yup.string().min(10).required(),
  description: yup.string().min(50).required(),
  price: yup.number().positive().required(),
  make: yup.string().required(),
  model: yup.string().required(),
  year: yup
    .number()
    .min(1900)
    .max(new Date().getFullYear() + 1)
    .required(),
  mileage: yup.number().positive().required(),
  fuelType: yup.string().required(),
  transmission: yup.string().required(),
  bodyType: yup.string().required(),
  color: yup.string().required(),
  engineSize: yup.number().positive().required(),
  doors: yup.number().min(2).max(6).required(),
  seats: yup.number().min(2).max(12).required(),
  images: yup.array().min(5).max(10).required(),
  contactPhone: yup.string().required(),
  location: yup.string().required(),
  agreedToTerms: yup.boolean().oneOf([true]).required(),
});

type UsedCarFormData = yup.InferType<typeof usedCarSchema>;

const UsedCarSellingForm: React.FC = () => {
  const { language } = useAppStore();
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isValid },
    reset,
  } = useForm<UsedCarFormData>({
    resolver: yupResolver(usedCarSchema),
    mode: 'onChange',
    defaultValues: {
      year: new Date().getFullYear(),
      doors: 4,
      seats: 5,
      images: [],
      agreedToTerms: false,
    },
  });

  const onDrop = (acceptedFiles: File[]) => {
    const newImages = [...uploadedImages, ...acceptedFiles].slice(0, 10);
    setUploadedImages(newImages);
    setValue('images', newImages);

    const newPreviewUrls = newImages.map(file => URL.createObjectURL(file));
    setImagePreviewUrls(newPreviewUrls);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxSize: 5 * 1024 * 1024,
    multiple: true,
  });

  const removeImage = (index: number) => {
    const newImages = uploadedImages.filter((_, i) => i !== index);
    setUploadedImages(newImages);
    setValue('images', newImages);

    const newPreviewUrls = newImages.map(file => URL.createObjectURL(file));
    setImagePreviewUrls(newPreviewUrls);
  };

  const onSubmit = async (data: UsedCarFormData) => {
    if (!user) {
      toast.error(language === 'ar' ? 'يجب تسجيل الدخول أولاً' : 'Please login first');
      //       return;
    }

    try {
      setIsSubmitting(true);

      const productData = {
        title: data.title,
        description: data.description,
        category: 'cars',
        subcategory: 'used_cars',
        price: data.price,
        condition: 'used',
        specifications: [
          { name: 'Make', value: data.make, category: 'General' },
          { name: 'Model', value: data.model, category: 'General' },
          { name: 'Year', value: data.year.toString(), category: 'General' },
          { name: 'Mileage', value: `${data.mileage.toLocaleString()} km`, category: 'General' },
          { name: 'Fuel Type', value: data.fuelType, category: 'Engine' },
          { name: 'Transmission', value: data.transmission, category: 'Engine' },
          { name: 'Engine Size', value: `${data.engineSize}L`, category: 'Engine' },
          { name: 'Body Type', value: data.bodyType, category: 'Body' },
          { name: 'Color', value: data.color, category: 'Body' },
          { name: 'Doors', value: data.doors.toString(), category: 'Body' },
          { name: 'Seats', value: data.seats.toString(), category: 'Body' },
        ],
        features: [],
        tags: [data.make, data.model, data.year.toString(), 'used car'],
        images: data.images,
        contactPhone: data.contactPhone,
        location: data.location,
      };

      await ProductService.createProduct(user.id, productData as any);

      toast.success(
        language === 'ar' ? 'تم إضافة السيارة المستعملة بنجاح!' : 'Used car added successfully!'
      );

      reset();
      setUploadedImages([]);
      setImagePreviewUrls([]);
    } catch (error) {
      if (process.env.NODE_ENV === 'development')
        if (process.env.NODE_ENV === 'development')
          console.error('Error submitting used car:', error);
      toast.error(language === 'ar' ? 'حدث خطأ أثناء إضافة السيارة' : 'Error adding used car');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg'>
      <div className='text-center mb-8'>
        <h1 className='text-3xl font-bold text-gray-900 mb-2'>
          {language === 'ar' ? 'بيع سيارتك المستعملة' : 'Sell Your Used Car'}
        </h1>
        <p className='text-gray-600'>
          {language === 'ar'
            ? 'أضف تفاصيل سيارتك المستعملة وابدأ في البيع'
            : 'Add details of your used car and start selling'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className='space-y-8'>
        {/* Basic Information */}
        <div className='bg-gray-50 p-6 rounded-lg'>
          <h2 className='text-xl font-semibold mb-4'>
            {language === 'ar' ? 'المعلومات الأساسية' : 'Basic Information'}
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                {language === 'ar' ? 'عنوان الإعلان' : 'Ad Title'}
              </label>
              <input
                {...register('title')}
                type='text'
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.title ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder={
                  language === 'ar'
                    ? 'مثال: تويوتا كامري 2020 ممتازة'
                    : 'Example: Excellent 2020 Toyota Camry'
                }
              />
              {errors.title && <p className='mt-1 text-sm text-red-600'>{errors.title.message}</p>}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                {language === 'ar' ? 'السعر' : 'Price'}
              </label>
              <input
                {...register('price', { valueAsNumber: true })}
                type='number'
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.price ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder='0'
              />
              {errors.price && <p className='mt-1 text-sm text-red-600'>{errors.price.message}</p>}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                {language === 'ar' ? 'الماركة' : 'Make'}
              </label>
              <input
                {...register('make')}
                type='text'
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.make ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder={language === 'ar' ? 'مثال: تويوتا' : 'Example: Toyota'}
              />
              {errors.make && <p className='mt-1 text-sm text-red-600'>{errors.make.message}</p>}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                {language === 'ar' ? 'الموديل' : 'Model'}
              </label>
              <input
                {...register('model')}
                type='text'
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.model ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder={language === 'ar' ? 'مثال: كامري' : 'Example: Camry'}
              />
              {errors.model && <p className='mt-1 text-sm text-red-600'>{errors.model.message}</p>}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                {language === 'ar' ? 'السنة' : 'Year'}
              </label>
              <input
                {...register('year', { valueAsNumber: true })}
                type='number'
                min='1900'
                max={new Date().getFullYear() + 1}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.year ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.year && <p className='mt-1 text-sm text-red-600'>{errors.year.message}</p>}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                {language === 'ar' ? 'المسافة المقطوعة (كم)' : 'Mileage (km)'}
              </label>
              <input
                {...register('mileage', { valueAsNumber: true })}
                type='number'
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.mileage ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder='0'
              />
              {errors.mileage && (
                <p className='mt-1 text-sm text-red-600'>{errors.mileage.message}</p>
              )}
            </div>
          </div>

          <div className='mt-6'>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              {language === 'ar' ? 'وصف السيارة' : 'Car Description'}
            </label>
            <textarea
              {...register('description')}
              rows={4}
              className={`w-full px-3 py-2 border rounded-md ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder={
                language === 'ar' ? 'صف سيارتك بالتفصيل...' : 'Describe your car in detail...'
              }
            />
            {errors.description && (
              <p className='mt-1 text-sm text-red-600'>{errors.description.message}</p>
            )}
          </div>
        </div>

        {/* Car Specifications */}
        <div className='bg-gray-50 p-6 rounded-lg'>
          <h2 className='text-xl font-semibold mb-4'>
            {language === 'ar' ? 'مواصفات السيارة' : 'Car Specifications'}
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                {language === 'ar' ? 'نوع الوقود' : 'Fuel Type'}
              </label>
              <select
                {...register('fuelType')}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.fuelType ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value=''>
                  {language === 'ar' ? 'اختر نوع الوقود' : 'Select Fuel Type'}
                </option>
                <option value='gasoline'>{language === 'ar' ? 'بنزين' : 'Gasoline'}</option>
                <option value='diesel'>{language === 'ar' ? 'ديزل' : 'Diesel'}</option>
                <option value='hybrid'>{language === 'ar' ? 'هجين' : 'Hybrid'}</option>
                <option value='electric'>{language === 'ar' ? 'كهربائي' : 'Electric'}</option>
              </select>
              {errors.fuelType && (
                <p className='mt-1 text-sm text-red-600'>{errors.fuelType.message}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                {language === 'ar' ? 'نوع الناقل' : 'Transmission'}
              </label>
              <select
                {...register('transmission')}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.transmission ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value=''>
                  {language === 'ar' ? 'اختر نوع الناقل' : 'Select Transmission'}
                </option>
                <option value='manual'>{language === 'ar' ? 'يدوي' : 'Manual'}</option>
                <option value='automatic'>{language === 'ar' ? 'أوتوماتيك' : 'Automatic'}</option>
                <option value='cvt'>{language === 'ar' ? 'CVT' : 'CVT'}</option>
              </select>
              {errors.transmission && (
                <p className='mt-1 text-sm text-red-600'>{errors.transmission.message}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                {language === 'ar' ? 'نوع الهيكل' : 'Body Type'}
              </label>
              <select
                {...register('bodyType')}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.bodyType ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value=''>
                  {language === 'ar' ? 'اختر نوع الهيكل' : 'Select Body Type'}
                </option>
                <option value='sedan'>{language === 'ar' ? 'سيدان' : 'Sedan'}</option>
                <option value='hatchback'>{language === 'ar' ? 'هاتشباك' : 'Hatchback'}</option>
                <option value='suv'>{language === 'ar' ? 'SUV' : 'SUV'}</option>
                <option value='coupe'>{language === 'ar' ? 'كوبيه' : 'Coupe'}</option>
              </select>
              {errors.bodyType && (
                <p className='mt-1 text-sm text-red-600'>{errors.bodyType.message}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                {language === 'ar' ? 'اللون' : 'Color'}
              </label>
              <input
                {...register('color')}
                type='text'
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.color ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder={language === 'ar' ? 'مثال: أبيض' : 'Example: White'}
              />
              {errors.color && <p className='mt-1 text-sm text-red-600'>{errors.color.message}</p>}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                {language === 'ar' ? 'حجم المحرك (لتر)' : 'Engine Size (L)'}
              </label>
              <input
                {...register('engineSize', { valueAsNumber: true })}
                type='number'
                step='0.1'
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.engineSize ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder='2.0'
              />
              {errors.engineSize && (
                <p className='mt-1 text-sm text-red-600'>{errors.engineSize.message}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                {language === 'ar' ? 'عدد الأبواب' : 'Number of Doors'}
              </label>
              <input
                {...register('doors', { valueAsNumber: true })}
                type='number'
                min='2'
                max='6'
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.doors ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.doors && <p className='mt-1 text-sm text-red-600'>{errors.doors.message}</p>}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                {language === 'ar' ? 'عدد المقاعد' : 'Number of Seats'}
              </label>
              <input
                {...register('seats', { valueAsNumber: true })}
                type='number'
                min='2'
                max='12'
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.seats ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.seats && <p className='mt-1 text-sm text-red-600'>{errors.seats.message}</p>}
            </div>
          </div>
        </div>

        {/* Images Upload */}
        <div className='bg-gray-50 p-6 rounded-lg'>
          <h2 className='text-xl font-semibold mb-4'>
            {language === 'ar' ? 'صور السيارة' : 'Car Images'}
          </h2>
          <p className='text-sm text-gray-600 mb-4'>
            {language === 'ar'
              ? 'يجب رفع 5 صور على الأقل. الحد الأقصى 10 صور. حجم كل صورة لا يتجاوز 5 ميجابايت.'
              : 'Upload at least 5 images. Maximum 10 images. Each image size should not exceed 5MB.'}
          </p>

          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <CloudArrowUpIcon className='mx-auto h-12 w-12 text-gray-400 mb-4' />
            <p className='text-lg font-medium text-gray-900 mb-2'>
              {isDragActive
                ? language === 'ar'
                  ? 'أفلت الصور هنا'
                  : 'Drop images here'
                : language === 'ar'
                  ? 'اسحب وأفلت الصور هنا'
                  : 'Drag and drop images here'}
            </p>
            <p className='text-gray-600'>
              {language === 'ar' ? 'أو انقر لاختيار الملفات' : 'Or click to select files'}
            </p>
          </div>

          {imagePreviewUrls.length > 0 && (
            <div className='mt-6'>
              <h3 className='text-lg font-medium text-gray-900 mb-4'>
                {language === 'ar' ? 'الصور المرفوعة' : 'Uploaded Images'}
              </h3>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                {imagePreviewUrls.map((url, index) => (
                  <div key={index} className='relative group'>
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className='w-full h-32 object-cover rounded-lg'
                    />
                    <button
                      type='button'
                      onClick={() => removeImage(index)}
                      className='absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity'
                    >
                      <XMarkIcon className='h-4 w-4' />
                    </button>
                  </div>
                ))}
              </div>
              <p className='mt-2 text-sm text-gray-600'>
                {language === 'ar'
                  ? `${imagePreviewUrls.length} من 10 صور`
                  : `${imagePreviewUrls.length} of 10 images`}
              </p>
            </div>
          )}

          {errors.images && <p className='mt-2 text-sm text-red-600'>{errors.images.message}</p>}
        </div>

        {/* Contact Information */}
        <div className='bg-gray-50 p-6 rounded-lg'>
          <h2 className='text-xl font-semibold mb-4'>
            {language === 'ar' ? 'معلومات الاتصال' : 'Contact Information'}
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                {language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
              </label>
              <input
                {...register('contactPhone')}
                type='tel'
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.contactPhone ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder='+20 123 456 7890'
              />
              {errors.contactPhone && (
                <p className='mt-1 text-sm text-red-600'>{errors.contactPhone.message}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                {language === 'ar' ? 'الموقع' : 'Location'}
              </label>
              <input
                {...register('location')}
                type='text'
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.location ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder={language === 'ar' ? 'مثال: القاهرة، مصر' : 'Example: Cairo, Egypt'}
              />
              {errors.location && (
                <p className='mt-1 text-sm text-red-600'>{errors.location.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Terms and Submit */}
        <div className='bg-gray-50 p-6 rounded-lg'>
          <div className='flex items-start mb-6'>
            <input
              {...register('agreedToTerms')}
              type='checkbox'
              id='agreedToTerms'
              className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1'
            />
            <label htmlFor='agreedToTerms' className='ml-2 block text-sm text-gray-900'>
              {language === 'ar'
                ? 'أوافق على شروط وأحكام الموقع وأؤكد أن جميع المعلومات المقدمة صحيحة'
                : 'I agree to the website terms and conditions and confirm that all information provided is accurate'}
            </label>
          </div>
          {errors.agreedToTerms && (
            <p className='mt-1 text-sm text-red-600'>{errors.agreedToTerms.message}</p>
          )}

          <button
            type='submit'
            disabled={!isValid || isSubmitting}
            className='w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200'
          >
            {isSubmitting ? (
              <div className='flex items-center justify-center'>
                <LoadingSpinner size='sm' />
                <span className='ml-2'>
                  {language === 'ar' ? 'جاري الإرسال...' : 'Submitting...'}
                </span>
              </div>
            ) : language === 'ar' ? (
              'إضافة السيارة'
            ) : (
              'Add Car'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UsedCarSellingForm;
