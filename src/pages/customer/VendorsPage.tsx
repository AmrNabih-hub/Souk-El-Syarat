import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MapPinIcon,
  PhoneIcon,
  GlobeAltIcon,
  CheckBadgeIcon,
  BuildingStorefrontIcon,
  WrenchScrewdriverIcon,
  CogIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import { useAppStore } from '@/stores/appStore';
import { SampleVendorsService } from '@/services/sample-vendors.service';
import { Vendor } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import clsx from 'clsx';

const VendorCard: React.FC<{ vendor: Vendor }> = ({ vendor }) => {
  const { language } = useAppStore();

  const businessTypeIcons: Record<string, React.ComponentType<any>> = {
    dealership: BuildingStorefrontIcon,
    parts_supplier: CogIcon,
    service_center: WrenchScrewdriverIcon,
    individual: BuildingStorefrontIcon,
    manufacturer: BuildingStorefrontIcon,
  };

  const BusinessIcon = businessTypeIcons[vendor.businessType] || BuildingStorefrontIcon;

  const businessTypeLabels: Record<string, Record<string, string>> = {
    ar: {
      dealership: 'معرض سيارات',
      parts_supplier: 'مورد قطع غيار',
      service_center: 'مركز خدمة',
      individual: 'تاجر فردي',
      manufacturer: 'شركة تصنيع',
    },
    en: {
      dealership: 'Car Dealership',
      parts_supplier: 'Parts Supplier',
      service_center: 'Service Center',
      individual: 'Individual Seller',
      manufacturer: 'Manufacturer',
    },
  };

  return (
    <motion.div
      className='bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-neutral-200'
      whileHover={{ y: -5 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Cover Image */}
      <div className='relative h-32 bg-gradient-to-r from-primary-100 to-secondary-100'>
        <img
          src={vendor.coverImage}
          alt={vendor.businessName}
          className='w-full h-full object-cover'
        />
        <div className='absolute top-4 right-4'>
          {vendor.isVerified && (
            <CheckBadgeIcon className='w-6 h-6 text-green-500 bg-white rounded-full p-1' />
          )}
        </div>
      </div>

      {/* Vendor Info */}
      <div className='p-6'>
        {/* Logo and Basic Info */}
        <div className='flex items-start space-x-4 mb-4'>
          <div className='relative'>
            <img
              src={vendor.logo}
              alt={vendor.businessName}
              className='w-16 h-16 rounded-lg object-cover border-2 border-white shadow-md'
            />
            <div className='absolute -bottom-1 -right-1 bg-primary-500 rounded-full p-1'>
              <BusinessIcon className='w-3 h-3 text-white' />
            </div>
          </div>

          <div className='flex-1'>
            <h3 className='text-lg font-bold text-neutral-900 mb-1 line-clamp-1'>
              {vendor.businessName}
            </h3>
            <p className='text-sm text-primary-600 font-medium mb-2'>
              {businessTypeLabels[language][vendor.businessType]}
            </p>

            {/* Rating */}
            <div className='flex items-center space-x-2'>
              <div className='flex items-center'>
                {[...Array(5)].map((_, i) => (
                  <StarSolid
                    key={i}
                    className={clsx(
                      'w-4 h-4',
                      i < Math.floor(vendor.rating) ? 'text-yellow-400' : 'text-neutral-300'
                    )}
                  />
                ))}
              </div>
              <span className='text-sm font-medium text-neutral-700'>
                {vendor.rating.toFixed(1)}
              </span>
              <span className='text-sm text-neutral-500'>
                ({vendor.totalReviews} {language === 'ar' ? 'تقييم' : 'reviews'})
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className='text-neutral-600 text-sm mb-4 line-clamp-3'>{vendor.description}</p>

        {/* Specializations */}
        <div className='flex flex-wrap gap-1 mb-4'>
          {vendor.specializations.slice(0, 3).map((spec, index) => (
            <span
              key={index}
              className='px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full'
            >
              {spec}
            </span>
          ))}
          {vendor.specializations.length > 3 && (
            <span className='px-2 py-1 bg-neutral-100 text-neutral-600 text-xs rounded-full'>
              +{vendor.specializations.length - 3} {language === 'ar' ? 'المزيد' : 'more'}
            </span>
          )}
        </div>

        {/* Stats */}
        <div className='grid grid-cols-2 gap-4 mb-4 text-center'>
          <div className='bg-neutral-50 rounded-lg p-3'>
            <p className='text-lg font-bold text-neutral-900'>{vendor.totalProducts}</p>
            <p className='text-xs text-neutral-600'>{language === 'ar' ? 'منتج' : 'Products'}</p>
          </div>
          <div className='bg-neutral-50 rounded-lg p-3'>
            <p className='text-lg font-bold text-neutral-900'>
              {Math.round(vendor.totalSales / 1000)}K
            </p>
            <p className='text-xs text-neutral-600'>{language === 'ar' ? 'مبيعات' : 'Sales'}</p>
          </div>
        </div>

        {/* Contact Info */}
        <div className='space-y-2 mb-4 text-sm text-neutral-600'>
          <div className='flex items-center space-x-2'>
            <MapPinIcon className='w-4 h-4' />
            <span className='line-clamp-1'>
              {vendor.address.city}, {vendor.address.governorate}
            </span>
          </div>
          <div className='flex items-center space-x-2'>
            <PhoneIcon className='w-4 h-4' />
            <span>{vendor.phoneNumber}</span>
          </div>
          {vendor.website && (
            <div className='flex items-center space-x-2'>
              <GlobeAltIcon className='w-4 h-4' />
              <a
                href={vendor.website}
                target='_blank'
                rel='noopener noreferrer'
                className='text-primary-600 hover:underline line-clamp-1'
              >
                {language === 'ar' ? 'زيارة الموقع' : 'Visit Website'}
              </a>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className='flex space-x-2'>
          <Link to={`/vendor/${vendor.id}`} className='flex-1 btn btn-primary text-center'>
            {language === 'ar' ? 'عرض المنتجات' : 'View Products'}
          </Link>
          <a
            href={`https://wa.me/${vendor.whatsappNumber?.replace('+', '') || ''}`}
            target='_blank'
            rel='noopener noreferrer'
            className='btn btn-outline px-3'
          >
            <PhoneIcon className='w-4 h-4' />
          </a>
        </div>
      </div>
    </motion.div>
  );
};

const VendorsPage: React.FC = () => {
  const { language } = useAppStore();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'sales' | 'products'>('rating');

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      const sampleVendors = SampleVendorsService.getSampleVendors();
      setVendors(sampleVendors);
      setFilteredVendors(sampleVendors);
      setIsLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    let filtered = vendors;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        vendor =>
          vendor.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          vendor.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          vendor.specializations.some(spec =>
            spec.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
    }

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(vendor => vendor.businessType === selectedType);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'sales':
          return b.totalSales - a.totalSales;
        case 'products':
          return b.totalProducts - a.totalProducts;
        default:
          return 0;
      }
    });

    setFilteredVendors(filtered);
  }, [vendors, searchQuery, selectedType, sortBy]);

  const businessTypes = [
    { value: 'all', label: language === 'ar' ? 'جميع الأنواع' : 'All Types' },
    { value: 'dealership', label: language === 'ar' ? 'معارض السيارات' : 'Car Dealerships' },
    { value: 'parts_supplier', label: language === 'ar' ? 'موردو قطع الغيار' : 'Parts Suppliers' },
    { value: 'service_center', label: language === 'ar' ? 'مراكز الخدمة' : 'Service Centers' },
    { value: 'individual', label: language === 'ar' ? 'تجار أفراد' : 'Individual Sellers' },
  ];

  const sortOptions = [
    { value: 'rating', label: language === 'ar' ? 'التقييم' : 'Rating' },
    { value: 'sales', label: language === 'ar' ? 'المبيعات' : 'Sales' },
    { value: 'products', label: language === 'ar' ? 'عدد المنتجات' : 'Products Count' },
  ];

  if (isLoading) {
    return (
      <div className='min-h-screen bg-neutral-50'>
        <div className='bg-white border-b border-neutral-200'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
            <h1 className='text-3xl font-bold text-neutral-900'>
              {language === 'ar' ? 'البائعون الموثوقون' : 'Trusted Vendors'}
            </h1>
            <p className='text-neutral-600 mt-1'>
              {language === 'ar' ? 'جاري تحميل البائعين...' : 'Loading vendors...'}
            </p>
          </div>
        </div>

        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          <div className='flex justify-center items-center py-20'>
            <LoadingSpinner size='lg' text={language === 'ar' ? 'جاري التحميل...' : 'Loading...'} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-neutral-50'>
      {/* Header */}
      <div className='bg-white border-b border-neutral-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          <motion.h1
            className='text-4xl font-bold text-neutral-900 mb-4'
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {language === 'ar' ? 'البائعون الموثوقون' : 'Trusted Vendors'}
          </motion.h1>
          <motion.p
            className='text-neutral-600 text-lg max-w-3xl'
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {language === 'ar'
              ? 'اكتشف شبكة واسعة من البائعين الموثوقين والمعتمدين في مصر. من معارض السيارات الفاخرة إلى مراكز الخدمة المتخصصة وموردي قطع الغيار الأصلية.'
              : 'Discover our extensive network of trusted and verified vendors across Egypt. From luxury car dealerships to specialized service centers and genuine parts suppliers.'}
          </motion.p>
        </div>
      </div>

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Filters */}
        <motion.div
          className='bg-white rounded-xl shadow-sm border border-neutral-200 p-6 mb-8'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-6'>
            {/* Search */}
            <div className='flex-1 max-w-md'>
              <div className='relative'>
                <MagnifyingGlassIcon className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400' />
                <input
                  type='text'
                  placeholder={language === 'ar' ? 'ابحث عن بائع...' : 'Search vendors...'}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className='w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                />
              </div>
            </div>

            {/* Type Filter */}
            <div className='flex items-center space-x-4'>
              <FunnelIcon className='w-5 h-5 text-neutral-600' />
              <select
                value={selectedType}
                onChange={e => setSelectedType(e.target.value)}
                className='border border-neutral-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
              >
                {businessTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className='flex items-center space-x-2'>
              <span className='text-sm text-neutral-600 whitespace-nowrap'>
                {language === 'ar' ? 'ترتيب حسب:' : 'Sort by:'}
              </span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className='border border-neutral-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* Results Count */}
        <motion.div
          className='mb-6'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <p className='text-neutral-600'>
            {language === 'ar'
              ? `عرض ${filteredVendors.length} من ${vendors.length} بائع`
              : `Showing ${filteredVendors.length} of ${vendors.length} vendors`}
          </p>
        </motion.div>

        {/* Vendors Grid */}
        {filteredVendors.length === 0 ? (
          <motion.div
            className='text-center py-12'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <BuildingStorefrontIcon className='w-16 h-16 text-neutral-400 mx-auto mb-4' />
            <h3 className='text-xl font-semibold text-neutral-700 mb-2'>
              {language === 'ar' ? 'لا توجد بائعين مطابقين' : 'No vendors found'}
            </h3>
            <p className='text-neutral-500'>
              {language === 'ar'
                ? 'جرب تغيير معايير البحث أو الفلاتر'
                : 'Try adjusting your search criteria or filters'}
            </p>
          </motion.div>
        ) : (
          <motion.div
            className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {filteredVendors.map((vendor, index) => (
              <motion.div
                key={vendor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <VendorCard vendor={vendor} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default VendorsPage;
