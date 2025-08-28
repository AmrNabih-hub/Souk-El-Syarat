import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useAppStore } from '@/stores/appStore';

interface FAQItem {
  question: string;
  questionAr: string;
  answer: string;
  answerAr: string;
  category: string;
}

const FAQPage: React.FC = () => {
  const { language } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItem, setExpandedItem] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All', nameAr: 'الكل' },
    { id: 'general', name: 'General', nameAr: 'عام' },
    { id: 'orders', name: 'Orders', nameAr: 'الطلبات' },
    { id: 'payment', name: 'Payment', nameAr: 'الدفع' },
    { id: 'shipping', name: 'Shipping', nameAr: 'الشحن' },
    { id: 'returns', name: 'Returns', nameAr: 'الإرجاع' },
    { id: 'vendor', name: 'Vendors', nameAr: 'البائعين' }
  ];

  const faqItems: FAQItem[] = [
    {
      question: 'What is Souk El-Syarat?',
      questionAr: 'ما هو سوق السيارات؟',
      answer: 'Souk El-Syarat is Egypt\'s premier online marketplace for cars, auto parts, and automotive services. We connect buyers with trusted vendors across the country.',
      answerAr: 'سوق السيارات هو أكبر سوق إلكتروني في مصر للسيارات وقطع الغيار والخدمات. نحن نربط المشترين بالبائعين الموثوقين في جميع أنحاء البلاد.',
      category: 'general'
    },
    {
      question: 'How do I create an account?',
      questionAr: 'كيف أقوم بإنشاء حساب؟',
      answer: 'Click on the "Sign Up" button in the top right corner, fill in your details, and verify your email address to complete registration.',
      answerAr: 'انقر على زر "التسجيل" في الزاوية العلوية اليمنى، املأ بياناتك، وتحقق من عنوان بريدك الإلكتروني لإكمال التسجيل.',
      category: 'general'
    },
    {
      question: 'How do I place an order?',
      questionAr: 'كيف أقوم بتقديم طلب؟',
      answer: 'Browse products, add items to your cart, proceed to checkout, enter your delivery details, choose a payment method, and confirm your order.',
      answerAr: 'تصفح المنتجات، أضف العناصر إلى سلة التسوق، انتقل إلى الدفع، أدخل تفاصيل التوصيل، اختر طريقة الدفع، وأكد طلبك.',
      category: 'orders'
    },
    {
      question: 'Can I track my order?',
      questionAr: 'هل يمكنني تتبع طلبي؟',
      answer: 'Yes, you can track your order from your dashboard. You\'ll also receive email and SMS updates about your order status.',
      answerAr: 'نعم، يمكنك تتبع طلبك من لوحة التحكم الخاصة بك. ستتلقى أيضاً تحديثات عبر البريد الإلكتروني والرسائل القصيرة حول حالة طلبك.',
      category: 'orders'
    },
    {
      question: 'What payment methods are accepted?',
      questionAr: 'ما هي طرق الدفع المقبولة؟',
      answer: 'We accept credit/debit cards (Visa, Mastercard), mobile wallets (Vodafone Cash, Orange Money), and cash on delivery.',
      answerAr: 'نقبل البطاقات الائتمانية/الخصم (فيزا، ماستركارد)، المحافظ الإلكترونية (فودافون كاش، أورانج موني)، والدفع عند الاستلام.',
      category: 'payment'
    },
    {
      question: 'Is online payment secure?',
      questionAr: 'هل الدفع عبر الإنترنت آمن؟',
      answer: 'Yes, all online payments are secured with SSL encryption and we are PCI DSS compliant to ensure your payment information is protected.',
      answerAr: 'نعم، جميع المدفوعات عبر الإنترنت مؤمنة بتشفير SSL ونحن متوافقون مع PCI DSS لضمان حماية معلومات الدفع الخاصة بك.',
      category: 'payment'
    },
    {
      question: 'How long does delivery take?',
      questionAr: 'كم يستغرق التوصيل؟',
      answer: 'Standard delivery takes 3-5 business days within Cairo and Giza, and 5-7 business days for other governorates. Express delivery is available for 1-2 business days.',
      answerAr: 'التوصيل القياسي يستغرق 3-5 أيام عمل داخل القاهرة والجيزة، و5-7 أيام عمل للمحافظات الأخرى. التوصيل السريع متاح خلال 1-2 يوم عمل.',
      category: 'shipping'
    },
    {
      question: 'What are the shipping costs?',
      questionAr: 'ما هي تكاليف الشحن؟',
      answer: 'Shipping costs start from 50 EGP within Cairo and vary based on location and order size. Free shipping is available for orders over 500 EGP.',
      answerAr: 'تبدأ تكاليف الشحن من 50 جنيه داخل القاهرة وتختلف حسب الموقع وحجم الطلب. الشحن المجاني متاح للطلبات فوق 500 جنيه.',
      category: 'shipping'
    },
    {
      question: 'Can I return a product?',
      questionAr: 'هل يمكنني إرجاع المنتج؟',
      answer: 'Yes, you can return products within 14 days of delivery if they are in original condition with all tags and packaging intact.',
      answerAr: 'نعم، يمكنك إرجاع المنتجات خلال 14 يوماً من التسليم إذا كانت في حالتها الأصلية مع جميع العلامات والتغليف سليم.',
      category: 'returns'
    },
    {
      question: 'How do I get a refund?',
      questionAr: 'كيف أحصل على استرداد؟',
      answer: 'Once your return is approved, refunds are processed within 7-14 business days to your original payment method.',
      answerAr: 'بمجرد الموافقة على الإرجاع، تتم معالجة المبالغ المستردة خلال 7-14 يوم عمل إلى طريقة الدفع الأصلية.',
      category: 'returns'
    },
    {
      question: 'How do I become a vendor?',
      questionAr: 'كيف أصبح بائعاً؟',
      answer: 'Click on "Become a Vendor" in the footer, fill out the application form with your business details, and submit required documents. Approval takes 2-3 business days.',
      answerAr: 'انقر على "كن بائعاً" في الفوتر، املأ نموذج الطلب ببيانات عملك، وأرسل المستندات المطلوبة. الموافقة تستغرق 2-3 أيام عمل.',
      category: 'vendor'
    },
    {
      question: 'What are the vendor fees?',
      questionAr: 'ما هي رسوم البائعين؟',
      answer: 'We charge a 10% commission on successful sales. There are no upfront fees or monthly subscriptions.',
      answerAr: 'نتقاضى عمولة 10% على المبيعات الناجحة. لا توجد رسوم مقدمة أو اشتراكات شهرية.',
      category: 'vendor'
    },
    {
      question: 'How do I contact customer support?',
      questionAr: 'كيف أتواصل مع دعم العملاء؟',
      answer: 'You can contact us through the Contact Us page, call us at +20 123 456 7890, or email support@souk-el-syarat.com.',
      answerAr: 'يمكنك التواصل معنا من خلال صفحة اتصل بنا، أو الاتصال بنا على +20 123 456 7890، أو البريد الإلكتروني support@souk-el-syarat.com.',
      category: 'general'
    }
  ];

  const filteredFAQs = faqItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const question = language === 'ar' ? item.questionAr : item.question;
    const answer = language === 'ar' ? item.answerAr : item.answer;
    const matchesSearch = question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className='min-h-screen bg-gray-50 py-12'>
      <div className='max-w-4xl mx-auto px-4'>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className='text-center mb-12'>
            <h1 className='text-4xl font-bold text-gray-900 mb-4'>
              {language === 'ar' ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
            </h1>
            <p className='text-xl text-gray-600'>
              {language === 'ar' 
                ? 'إجابات سريعة للأسئلة الأكثر شيوعاً'
                : 'Quick answers to the most common questions'}
            </p>
          </div>

          {/* Search Bar */}
          <div className='mb-8'>
            <div className='relative'>
              <MagnifyingGlassIcon className='absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
              <input
                type='text'
                placeholder={language === 'ar' ? 'ابحث في الأسئلة...' : 'Search questions...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className='mb-8 flex flex-wrap gap-2 justify-center'>
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-primary-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {language === 'ar' ? category.nameAr : category.name}
              </button>
            ))}
          </div>

          {/* FAQ Items */}
          <div className='space-y-4'>
            {filteredFAQs.length > 0 ? (
              filteredFAQs.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className='bg-white rounded-lg shadow-sm overflow-hidden'
                >
                  <button
                    onClick={() => setExpandedItem(expandedItem === index ? null : index)}
                    className='w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors flex items-center justify-between'
                  >
                    <h3 className='font-medium text-gray-900 pr-4'>
                      {language === 'ar' ? item.questionAr : item.question}
                    </h3>
                    <ChevronDownIcon
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        expandedItem === index ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  
                  {expandedItem === index && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className='px-6 py-4 bg-gray-50 border-t'
                    >
                      <p className='text-gray-600'>
                        {language === 'ar' ? item.answerAr : item.answer}
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              ))
            ) : (
              <div className='text-center py-12'>
                <p className='text-gray-500'>
                  {language === 'ar' 
                    ? 'لم يتم العثور على أسئلة مطابقة'
                    : 'No matching questions found'}
                </p>
              </div>
            )}
          </div>

          {/* Still Have Questions */}
          <div className='mt-12 bg-primary-50 rounded-xl p-8 text-center'>
            <h2 className='text-2xl font-semibold text-gray-900 mb-4'>
              {language === 'ar' ? 'لديك المزيد من الأسئلة؟' : 'Have more questions?'}
            </h2>
            <p className='text-gray-600 mb-6'>
              {language === 'ar' 
                ? 'لا تتردد في التواصل معنا للحصول على المساعدة'
                : "Don't hesitate to reach out for help"}
            </p>
            <div className='flex gap-4 justify-center'>
              <a
                href='/help'
                className='px-6 py-3 bg-white text-primary-600 font-semibold rounded-lg hover:bg-gray-50 transition-colors'
              >
                {language === 'ar' ? 'مركز المساعدة' : 'Help Center'}
              </a>
              <a
                href='/contact'
                className='px-6 py-3 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600 transition-colors'
              >
                {language === 'ar' ? 'اتصل بنا' : 'Contact Us'}
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FAQPage;