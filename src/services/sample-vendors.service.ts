import { Vendor } from '@/types';

export class SampleVendorsService {
  /**
   * Get comprehensive sample vendors for development/demo
   */
  static getSampleVendors(): Vendor[] {
    const sampleVendors: Vendor[] = [
      {
        id: 'vendor-1',
        userId: 'user-vendor-1',
        businessName: 'معرض النخبة للسيارات الفاخرة',
        businessType: 'dealership',
        description:
          'معرض متخصص في بيع السيارات الفاخرة من BMW، Mercedes، Audi مع ضمان شامل وخدمة ما بعد البيع. خبرة أكثر من 15 عام في السوق المصري.',
        contactPerson: 'أحمد محمد السيد',
        email: 'info@elnokhba-cars.com',
        phoneNumber: '+201234567890',
        whatsappNumber: '+201234567890',
        address: {
          street: 'شارع التحرير 45، أمام مدينة نصر',
          city: 'القاهرة',
          governorate: 'Cairo',
          postalCode: '11371',
          country: 'Egypt',
          coordinates: {
            lat: 30.0444,
            lng: 31.2357,
          },
        },
        businessLicense:
          'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop',
        taxId: 'TAX-123456789',
        website: 'https://elnokhba-cars.com',
        socialMedia: {
          facebook: 'https://facebook.com/elnokhbacars',
          instagram: 'https://instagram.com/elnokhba_cars',
          twitter: 'https://twitter.com/elnokhbacars',
        },
        experience: 'أكثر من 15 عام في بيع السيارات الفاخرة',
        specializations: ['BMW', 'Mercedes-Benz', 'Audi', 'سيارات فاخرة', 'خدمة ما بعد البيع'],
        expectedMonthlyVolume: 'أكثر من 500,000 جنيه',
        logo: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200&h=200&fit=crop',
        coverImage:
          'https://images.unsplash.com/photo-1562141961-4c00e3c1e5b0?w=800&h=400&fit=crop',
        status: 'active',
        rating: 4.9,
        totalReviews: 127,
        totalSales: 2500000,
        totalProducts: 45,
        joinedDate: new Date('2020-03-15'),
        lastActive: new Date('2024-01-20'),
        isVerified: true,
        createdAt: new Date('2020-03-15'),
        updatedAt: new Date('2024-01-20'),
        documents: [
          {
            id: 'doc-1',
            type: 'business_license',
            url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop',
            name: 'رخصة تجارية',
            uploadedAt: new Date('2020-03-15'),
            verified: true,
          },
        ],
        socialLinks: {
          facebook: 'https://facebook.com/elnokhbacars',
          instagram: 'https://instagram.com/elnokhba_cars',
          linkedin: 'https://linkedin.com/company/elnokhba-cars',
        },
      },
      {
        id: 'vendor-2',
        userId: 'user-vendor-2',
        businessName: 'تويوتا الشرق الأوسط - وكيل معتمد',
        businessType: 'dealership',
        description:
          'الوكيل المعتمد لسيارات تويوتا في مصر. نقدم أحدث موديلات تويوتا مع ضمان الوكالة الكامل وشبكة خدمة شاملة في جميع أنحاء الجمهورية.',
        contactPerson: 'محمد عبد الرحمن',
        email: 'service@toyota-me.com',
        phoneNumber: '+201987654321',
        whatsappNumber: '+201987654321',
        address: {
          street: 'طريق الإسكندرية الصحراوي كم 28',
          city: 'الجيزة',
          governorate: 'Giza',
          postalCode: '12511',
          country: 'Egypt',
          coordinates: {
            lat: 30.0131,
            lng: 31.2089,
          },
        },
        businessLicense:
          'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop',
        taxId: 'TAX-987654321',
        website: 'https://toyota-egypt.com',
        socialMedia: {
          facebook: 'https://facebook.com/toyotaegypt',
          instagram: 'https://instagram.com/toyota_egypt',
        },
        experience: '25 عام كوكيل معتمد لتويوتا',
        specializations: ['Toyota', 'سيارات يابانية', 'هايبرد', 'خدمة معتمدة', 'قطع غيار أصلية'],
        expectedMonthlyVolume: 'أكثر من 1,000,000 جنيه',
        logo: 'https://images.unsplash.com/photo-1611348524140-53c9a25263d6?w=200&h=200&fit=crop',
        coverImage:
          'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=800&h=400&fit=crop',
        status: 'active',
        rating: 4.8,
        totalReviews: 89,
        totalSales: 1800000,
        totalProducts: 32,
        joinedDate: new Date('2019-08-10'),
        lastActive: new Date('2024-01-19'),
        isVerified: true,
        createdAt: new Date('2019-08-10'),
        updatedAt: new Date('2024-01-19'),
        documents: [
          {
            id: 'doc-2',
            type: 'business_license',
            url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop',
            name: 'رخصة الوكالة المعتمدة',
            uploadedAt: new Date('2019-08-10'),
            verified: true,
          },
        ],
        socialLinks: {
          facebook: 'https://facebook.com/toyotaegypt',
          instagram: 'https://instagram.com/toyota_egypt',
          youtube: 'https://youtube.com/toyotaegypt',
        },
      },
      {
        id: 'vendor-3',
        userId: 'user-vendor-3',
        businessName: 'مركز الخبراء لقطع الغيار الأصلية',
        businessType: 'parts_supplier',
        description:
          'متخصصون في توريد قطع الغيار الأصلية لجميع أنواع السيارات الأوروبية واليابانية. شراكات مع كبرى الشركات العالمية مثل Bosch، Brembo، Michelin.',
        contactPerson: 'خالد أحمد فتحي',
        email: 'sales@experts-parts.com',
        phoneNumber: '+201123456789',
        whatsappNumber: '+201123456789',
        address: {
          street: 'شارع الهرم 156، الجيزة',
          city: 'الجيزة',
          governorate: 'Giza',
          postalCode: '12613',
          country: 'Egypt',
          coordinates: {
            lat: 29.9792,
            lng: 31.1342,
          },
        },
        businessLicense:
          'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop',
        taxId: 'TAX-456789123',
        website: 'https://experts-parts.com',
        socialMedia: {
          facebook: 'https://facebook.com/expertsparts',
          instagram: 'https://instagram.com/experts_parts',
        },
        experience: '12 عام في مجال قطع الغيار الأصلية',
        specializations: [
          'Bosch',
          'Brembo',
          'Michelin',
          'قطع غيار أصلية',
          'فرامل',
          'إطارات',
          'فلاتر',
        ],
        expectedMonthlyVolume: '100,000 - 500,000 جنيه',
        logo: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=200&h=200&fit=crop',
        coverImage:
          'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&h=400&fit=crop',
        status: 'active',
        rating: 4.7,
        totalReviews: 156,
        totalSales: 890000,
        totalProducts: 128,
        joinedDate: new Date('2021-01-20'),
        lastActive: new Date('2024-01-18'),
        isVerified: true,
        createdAt: new Date('2021-01-20'),
        updatedAt: new Date('2024-01-18'),
        documents: [
          {
            id: 'doc-3',
            type: 'business_license',
            url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop',
            name: 'رخصة تجارة قطع الغيار',
            uploadedAt: new Date('2021-01-20'),
            verified: true,
          },
        ],
        socialLinks: {
          facebook: 'https://facebook.com/expertsparts',
          instagram: 'https://instagram.com/experts_parts',
        },
      },
      {
        id: 'vendor-4',
        userId: 'user-vendor-4',
        businessName: 'ورشة الماهر للصيانة والإكسسوارات',
        businessType: 'service_center',
        description:
          'مركز صيانة متكامل يقدم خدمات الصيانة الدورية، الإصلاحات، تركيب الإكسسوارات، وخدمات التنظيف والتلميع بأحدث المعدات والتقنيات.',
        contactPerson: 'عمرو حسن محمود',
        email: 'info@almaher-service.com',
        phoneNumber: '+201556789012',
        whatsappNumber: '+201556789012',
        address: {
          street: 'شارع مصطفى النحاس 89، مدينة نصر',
          city: 'القاهرة',
          governorate: 'Cairo',
          postalCode: '11371',
          country: 'Egypt',
          coordinates: {
            lat: 30.0626,
            lng: 31.3219,
          },
        },
        businessLicense:
          'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop',
        taxId: 'TAX-789123456',
        website: 'https://almaher-service.com',
        socialMedia: {
          facebook: 'https://facebook.com/almaherservice',
          instagram: 'https://instagram.com/almaher_service',
        },
        experience: '8 سنوات في مجال صيانة السيارات',
        specializations: [
          'صيانة دورية',
          'إصلاح المحركات',
          'تركيب إكسسوارات',
          'تنظيف وتلميع',
          'فحص شامل',
        ],
        expectedMonthlyVolume: '50,000 - 100,000 جنيه',
        logo: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=200&h=200&fit=crop',
        coverImage:
          'https://images.unsplash.com/photo-1632823471565-1ecdf7c24c0d?w=800&h=400&fit=crop',
        status: 'active',
        rating: 4.6,
        totalReviews: 203,
        totalSales: 450000,
        totalProducts: 67,
        joinedDate: new Date('2022-06-12'),
        lastActive: new Date('2024-01-17'),
        isVerified: true,
        createdAt: new Date('2022-06-12'),
        updatedAt: new Date('2024-01-17'),
        documents: [
          {
            id: 'doc-4',
            type: 'business_license',
            url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop',
            name: 'رخصة مركز خدمة',
            uploadedAt: new Date('2022-06-12'),
            verified: true,
          },
        ],
        socialLinks: {
          facebook: 'https://facebook.com/almaherservice',
          instagram: 'https://instagram.com/almaher_service',
        },
      },
      {
        id: 'vendor-5',
        userId: 'user-vendor-5',
        businessName: 'مركز الصفوة VIP للخدمات المتميزة',
        businessType: 'service_center',
        description:
          'مركز خدمة VIP متخصص في الصيانة الفاخرة للسيارات الفارهة. خدمات حصرية تشمل الصيانة المتقدمة، التلميع الاحترافي، والحماية الكاملة للطلاء.',
        contactPerson: 'يوسف عبد العزيز',
        email: 'vip@alsafwa-service.com',
        phoneNumber: '+201334567890',
        whatsappNumber: '+201334567890',
        address: {
          street: 'كمبوند الشيخ زايد، البوابة الثالثة',
          city: 'الشيخ زايد',
          governorate: 'Giza',
          postalCode: '12588',
          country: 'Egypt',
          coordinates: {
            lat: 30.0777,
            lng: 30.9718,
          },
        },
        businessLicense:
          'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop',
        taxId: 'TAX-321654987',
        website: 'https://alsafwa-vip.com',
        socialMedia: {
          facebook: 'https://facebook.com/alsafwavip',
          instagram: 'https://instagram.com/alsafwa_vip',
        },
        experience: '10 سنوات في خدمة السيارات الفاخرة',
        specializations: [
          'صيانة VIP',
          'سيارات فاخرة',
          'تلميع احترافي',
          'حماية الطلاء',
          'خدمة منزلية',
        ],
        expectedMonthlyVolume: '100,000 - 500,000 جنيه',
        logo: 'https://images.unsplash.com/photo-1617040619263-41c5a9ca7521?w=200&h=200&fit=crop',
        coverImage:
          'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=800&h=400&fit=crop',
        status: 'active',
        rating: 4.9,
        totalReviews: 78,
        totalSales: 680000,
        totalProducts: 23,
        joinedDate: new Date('2021-11-08'),
        lastActive: new Date('2024-01-20'),
        isVerified: true,
        createdAt: new Date('2021-11-08'),
        updatedAt: new Date('2024-01-20'),
        documents: [
          {
            id: 'doc-5',
            type: 'business_license',
            url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop',
            name: 'رخصة مركز خدمة VIP',
            uploadedAt: new Date('2021-11-08'),
            verified: true,
          },
        ],
        socialLinks: {
          facebook: 'https://facebook.com/alsafwavip',
          instagram: 'https://instagram.com/alsafwa_vip',
          linkedin: 'https://linkedin.com/company/alsafwa-vip',
        },
      },
    ];

    return sampleVendors;
  }

  /**
   * Get top vendors by rating and sales
   */
  static getTopVendors(limit: number = 3): Vendor[] {
    return this.getSampleVendors()
      .sort((a, b) => {
        // Sort by rating first, then by total sales
        if (b.rating !== a.rating) {
          return b.rating - a.rating;
        }
        return b.totalSales - a.totalSales;
      })
      .slice(0, limit);
  }

  /**
   * Get vendors by business type
   */
  static getVendorsByType(businessType: string): Vendor[] {
    return this.getSampleVendors().filter(vendor => vendor.businessType === businessType);
  }

  /**
   * Get vendor by ID
   */
  static getVendorById(id: string): Vendor | null {
    return this.getSampleVendors().find(vendor => vendor.id === id) || null;
  }
}
