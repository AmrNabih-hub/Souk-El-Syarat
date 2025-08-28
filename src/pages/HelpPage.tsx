import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  QuestionMarkCircleIcon,
  ShoppingCartIcon,
  TruckIcon,
  CreditCardIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { useAppStore } from '@/stores/appStore';
import { Link } from 'react-router-dom';

interface HelpCategory {
  id: string;
  title: string;
  titleAr: string;
  icon: React.ComponentType<any>;
  articles: {
    title: string;
    titleAr: string;
    content: string;
    contentAr: string;
  }[];
}

const HelpPage: React.FC = () => {
  const { language } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);

  const helpCategories: HelpCategory[] = [
    {
      id: 'shopping',
      title: 'Shopping & Orders',
      titleAr: 'التسوق والطلبات',
      icon: ShoppingCartIcon,
      articles: [
        {
          title: 'How to place an order',
          titleAr: 'كيفية تقديم طلب',
          content: 'To place an order, browse products, add items to cart, and proceed to checkout. Fill in your delivery details and complete payment.',
          contentAr: 'لتقديم طلب، تصفح المنتجات، أضف العناصر إلى السلة، وانتقل إلى الدفع. املأ تفاصيل التوصيل وأكمل الدفع.'
        },
        {
          title: 'Order tracking',
          titleAr: 'تتبع الطلب',
          content: 'Track your order from your dashboard. You will receive updates via email and SMS about your order status.',
          contentAr: 'تتبع طلبك من لوحة التحكم الخاصة بك. ستتلقى تحديثات عبر البريد الإلكتروني والرسائل القصيرة حول حالة طلبك.'
        },
        {
          title: 'Canceling an order',
          titleAr: 'إلغاء الطلب',
          content: 'You can cancel your order within 24 hours of placing it from your order history page.',
          contentAr: 'يمكنك إلغاء طلبك خلال 24 ساعة من تقديمه من صفحة سجل الطلبات.'
        }
      ]
    },
    {
      id: 'shipping',
      title: 'Shipping & Delivery',
      titleAr: 'الشحن والتوصيل',
      icon: TruckIcon,
      articles: [
        {
          title: 'Delivery times',
          titleAr: 'أوقات التوصيل',
          content: 'Standard delivery takes 3-5 business days. Express delivery is available for 1-2 business days.',
          contentAr: 'التوصيل القياسي يستغرق 3-5 أيام عمل. التوصيل السريع متاح خلال 1-2 يوم عمل.'
        },
        {
          title: 'Shipping costs',
          titleAr: 'تكاليف الشحن',
          content: 'Shipping costs vary based on location and order size. Free shipping available for orders over 500 EGP.',
          contentAr: 'تختلف تكاليف الشحن حسب الموقع وحجم الطلب. شحن مجاني للطلبات فوق 500 جنيه.'
        },
        {
          title: 'International shipping',
          titleAr: 'الشحن الدولي',
          content: 'We currently ship within Egypt only. International shipping will be available soon.',
          contentAr: 'نقوم حالياً بالشحن داخل مصر فقط. الشحن الدولي سيكون متاحاً قريباً.'
        }
      ]
    },
    {
      id: 'payment',
      title: 'Payment & Refunds',
      titleAr: 'الدفع والاسترداد',
      icon: CreditCardIcon,
      articles: [
        {
          title: 'Payment methods',
          titleAr: 'طرق الدفع',
          content: 'We accept credit/debit cards, mobile wallets, and cash on delivery.',
          contentAr: 'نقبل البطاقات الائتمانية/الخصم، المحافظ الإلكترونية، والدفع عند الاستلام.'
        },
        {
          title: 'Refund policy',
          titleAr: 'سياسة الاسترداد',
          content: 'Refunds are processed within 7-14 business days after approval.',
          contentAr: 'تتم معالجة المبالغ المستردة خلال 7-14 يوم عمل بعد الموافقة.'
        },
        {
          title: 'Payment security',
          titleAr: 'أمان الدفع',
          content: 'All payments are secured with SSL encryption and PCI DSS compliance.',
          contentAr: 'جميع المدفوعات مؤمنة بتشفير SSL ومتوافقة مع PCI DSS.'
        }
      ]
    },
    {
      id: 'vendor',
      title: 'For Vendors',
      titleAr: 'للبائعين',
      icon: UserGroupIcon,
      articles: [
        {
          title: 'Becoming a vendor',
          titleAr: 'كيف تصبح بائع',
          content: 'Apply through our vendor application page. Approval takes 2-3 business days.',
          contentAr: 'قدم طلبك من خلال صفحة طلب البائع. الموافقة تستغرق 2-3 أيام عمل.'
        },
        {
          title: 'Vendor fees',
          titleAr: 'رسوم البائعين',
          content: 'We charge a 10% commission on successful sales. No upfront fees.',
          contentAr: 'نتقاضى عمولة 10% على المبيعات الناجحة. لا توجد رسوم مقدمة.'
        },
        {
          title: 'Managing inventory',
          titleAr: 'إدارة المخزون',
          content: 'Use your vendor dashboard to add products, update stock, and manage orders.',
          contentAr: 'استخدم لوحة تحكم البائع لإضافة المنتجات وتحديث المخزون وإدارة الطلبات.'
        }
      ]
    },
    {
      id: 'security',
      title: 'Account & Security',
      titleAr: 'الحساب والأمان',
      icon: ShieldCheckIcon,
      articles: [
        {
          title: 'Account security',
          titleAr: 'أمان الحساب',
          content: 'Enable two-factor authentication and use strong passwords to secure your account.',
          contentAr: 'قم بتفعيل المصادقة الثنائية واستخدم كلمات مرور قوية لتأمين حسابك.'
        },
        {
          title: 'Privacy settings',
          titleAr: 'إعدادات الخصوصية',
          content: 'Control your privacy settings from your profile page.',
          contentAr: 'تحكم في إعدادات الخصوصية من صفحة ملفك الشخصي.'
        },
        {
          title: 'Data protection',
          titleAr: 'حماية البيانات',
          content: 'We use industry-standard encryption to protect your personal data.',
          contentAr: 'نستخدم تشفيراً قياسياً في الصناعة لحماية بياناتك الشخصية.'
        }
      ]
    }
  ];

  const filteredCategories = helpCategories.map(category => ({
    ...category,
    articles: category.articles.filter(article => {
      const title = language === 'ar' ? article.titleAr : article.title;
      const content = language === 'ar' ? article.contentAr : article.content;
      return title.toLowerCase().includes(searchQuery.toLowerCase()) ||
             content.toLowerCase().includes(searchQuery.toLowerCase());
    })
  })).filter(category => category.articles.length > 0);

  return (
    <div className='min-h-screen bg-gray-50 py-12'>
      <div className='max-w-7xl mx-auto px-4'>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className='text-center mb-12'>
            <h1 className='text-4xl font-bold text-gray-900 mb-4'>
              {language === 'ar' ? 'مركز المساعدة' : 'Help Center'}
            </h1>
            <p className='text-xl text-gray-600'>
              {language === 'ar' ? 'كيف يمكننا مساعدتك اليوم؟' : 'How can we help you today?'}
            </p>
          </div>

          {/* Search Bar */}
          <div className='max-w-2xl mx-auto mb-12'>
            <div className='relative'>
              <MagnifyingGlassIcon className='absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
              <input
                type='text'
                placeholder={language === 'ar' ? 'ابحث عن المساعدة...' : 'Search for help...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
              />
            </div>
          </div>

          {/* Quick Links */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-12'>
            <Link
              to='/contact'
              className='bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow text-center'
            >
              <QuestionMarkCircleIcon className='w-12 h-12 text-primary-500 mx-auto mb-4' />
              <h3 className='font-semibold text-gray-900 mb-2'>
                {language === 'ar' ? 'اتصل بنا' : 'Contact Us'}
              </h3>
              <p className='text-gray-600'>
                {language === 'ar' ? 'تحدث مع فريق الدعم' : 'Talk to our support team'}
              </p>
            </Link>

            <Link
              to='/faq'
              className='bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow text-center'
            >
              <QuestionMarkCircleIcon className='w-12 h-12 text-primary-500 mx-auto mb-4' />
              <h3 className='font-semibold text-gray-900 mb-2'>
                {language === 'ar' ? 'الأسئلة الشائعة' : 'FAQ'}
              </h3>
              <p className='text-gray-600'>
                {language === 'ar' ? 'إجابات سريعة للأسئلة الشائعة' : 'Quick answers to common questions'}
              </p>
            </Link>

            <Link
              to='/vendor/apply'
              className='bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow text-center'
            >
              <UserGroupIcon className='w-12 h-12 text-primary-500 mx-auto mb-4' />
              <h3 className='font-semibold text-gray-900 mb-2'>
                {language === 'ar' ? 'كن بائعاً' : 'Become a Vendor'}
              </h3>
              <p className='text-gray-600'>
                {language === 'ar' ? 'ابدأ البيع معنا' : 'Start selling with us'}
              </p>
            </Link>
          </div>

          {/* Help Articles */}
          <div className='space-y-6'>
            {filteredCategories.map((category) => (
              <div key={category.id} className='bg-white rounded-xl shadow-sm overflow-hidden'>
                <button
                  onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
                  className='w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors'
                >
                  <div className='flex items-center space-x-3'>
                    <category.icon className='w-6 h-6 text-primary-500' />
                    <h2 className='text-xl font-semibold text-gray-900'>
                      {language === 'ar' ? category.titleAr : category.title}
                    </h2>
                  </div>
                  {expandedCategory === category.id ? (
                    <ChevronDownIcon className='w-5 h-5 text-gray-400' />
                  ) : (
                    <ChevronRightIcon className='w-5 h-5 text-gray-400' />
                  )}
                </button>

                {expandedCategory === category.id && (
                  <div className='border-t'>
                    {category.articles.map((article, index) => (
                      <div key={index} className='border-b last:border-b-0'>
                        <button
                          onClick={() => setExpandedArticle(expandedArticle === `${category.id}-${index}` ? null : `${category.id}-${index}`)}
                          className='w-full px-6 py-3 text-left hover:bg-gray-50 transition-colors'
                        >
                          <h3 className='font-medium text-gray-900'>
                            {language === 'ar' ? article.titleAr : article.title}
                          </h3>
                        </button>
                        {expandedArticle === `${category.id}-${index}` && (
                          <div className='px-6 py-3 bg-gray-50'>
                            <p className='text-gray-600'>
                              {language === 'ar' ? article.contentAr : article.content}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Still Need Help */}
          <div className='mt-12 text-center bg-primary-50 rounded-xl p-8'>
            <h2 className='text-2xl font-semibold text-gray-900 mb-4'>
              {language === 'ar' ? 'لا زلت بحاجة للمساعدة؟' : 'Still need help?'}
            </h2>
            <p className='text-gray-600 mb-6'>
              {language === 'ar' 
                ? 'فريق الدعم لدينا متاح للمساعدة'
                : 'Our support team is here to help'}
            </p>
            <Link
              to='/contact'
              className='inline-flex items-center px-6 py-3 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600 transition-colors'
            >
              {language === 'ar' ? 'تواصل معنا' : 'Contact Support'}
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default HelpPage;