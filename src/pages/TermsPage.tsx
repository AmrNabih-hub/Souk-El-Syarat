import React from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/stores/appStore';

const TermsPage: React.FC = () => {
  const { language } = useAppStore();

  const sections = [
    {
      title: 'Acceptance of Terms',
      titleAr: 'قبول الشروط',
      content: 'By accessing and using Souk El-Syarat, you accept and agree to be bound by the terms and provision of this agreement.',
      contentAr: 'من خلال الوصول إلى سوق السيارات واستخدامه، فإنك تقبل وتوافق على الالتزام بشروط وأحكام هذه الاتفاقية.'
    },
    {
      title: 'Use of Service',
      titleAr: 'استخدام الخدمة',
      content: 'You may use our service for lawful purposes only. You agree not to use the service to violate any laws or regulations.',
      contentAr: 'يمكنك استخدام خدمتنا للأغراض القانونية فقط. توافق على عدم استخدام الخدمة لانتهاك أي قوانين أو لوائح.'
    },
    {
      title: 'User Accounts',
      titleAr: 'حسابات المستخدمين',
      content: 'You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.',
      contentAr: 'أنت مسؤول عن الحفاظ على سرية حسابك وكلمة المرور. توافق على قبول المسؤولية عن جميع الأنشطة التي تحدث تحت حسابك.'
    },
    {
      title: 'Product Listings',
      titleAr: 'قوائم المنتجات',
      content: 'Vendors are responsible for the accuracy of their product listings. We do not guarantee the accuracy of product descriptions or pricing.',
      contentAr: 'البائعون مسؤولون عن دقة قوائم منتجاتهم. نحن لا نضمن دقة أوصاف المنتجات أو الأسعار.'
    },
    {
      title: 'Payment Terms',
      titleAr: 'شروط الدفع',
      content: 'All payments must be made through approved payment methods. Prices are subject to change without notice.',
      contentAr: 'يجب أن تتم جميع المدفوعات من خلال طرق الدفع المعتمدة. الأسعار قابلة للتغيير دون إشعار.'
    },
    {
      title: 'Shipping and Delivery',
      titleAr: 'الشحن والتوصيل',
      content: 'Delivery times are estimates and not guaranteed. We are not responsible for delays caused by shipping carriers.',
      contentAr: 'أوقات التسليم هي تقديرات وليست مضمونة. نحن لسنا مسؤولين عن التأخير الناجم عن شركات الشحن.'
    },
    {
      title: 'Returns and Refunds',
      titleAr: 'الإرجاع والاسترداد',
      content: 'Returns are accepted within 14 days of delivery. Products must be in original condition. Refunds are processed within 7-14 business days.',
      contentAr: 'يتم قبول الإرجاع خلال 14 يوماً من التسليم. يجب أن تكون المنتجات في حالتها الأصلية. تتم معالجة المبالغ المستردة خلال 7-14 يوم عمل.'
    },
    {
      title: 'Intellectual Property',
      titleAr: 'الملكية الفكرية',
      content: 'All content on this platform is protected by copyright and other intellectual property laws.',
      contentAr: 'جميع المحتويات على هذه المنصة محمية بموجب حقوق الطبع والنشر وقوانين الملكية الفكرية الأخرى.'
    },
    {
      title: 'Limitation of Liability',
      titleAr: 'حدود المسؤولية',
      content: 'We shall not be liable for any indirect, incidental, special, consequential, or punitive damages.',
      contentAr: 'لن نكون مسؤولين عن أي أضرار غير مباشرة أو عرضية أو خاصة أو تبعية أو عقابية.'
    },
    {
      title: 'Governing Law',
      titleAr: 'القانون الحاكم',
      content: 'These terms shall be governed by the laws of the Arab Republic of Egypt.',
      contentAr: 'تخضع هذه الشروط لقوانين جمهورية مصر العربية.'
    }
  ];

  return (
    <div className='min-h-screen bg-gray-50 py-12'>
      <div className='max-w-4xl mx-auto px-4'>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className='text-4xl font-bold text-center mb-8 text-gray-900'>
            {language === 'ar' ? 'الشروط والأحكام' : 'Terms and Conditions'}
          </h1>
          
          <div className='bg-white rounded-xl shadow-lg p-8'>
            <p className='text-gray-600 mb-8'>
              {language === 'ar' 
                ? 'آخر تحديث: يناير 2024'
                : 'Last updated: January 2024'}
            </p>
            
            <div className='space-y-8'>
              {sections.map((section, index) => (
                <div key={index}>
                  <h2 className='text-xl font-semibold text-gray-900 mb-3'>
                    {index + 1}. {language === 'ar' ? section.titleAr : section.title}
                  </h2>
                  <p className='text-gray-600 leading-relaxed'>
                    {language === 'ar' ? section.contentAr : section.content}
                  </p>
                </div>
              ))}
            </div>
            
            <div className='mt-12 pt-8 border-t'>
              <h2 className='text-xl font-semibold text-gray-900 mb-4'>
                {language === 'ar' ? 'اتصل بنا' : 'Contact Us'}
              </h2>
              <p className='text-gray-600'>
                {language === 'ar' 
                  ? 'إذا كان لديك أي أسئلة حول هذه الشروط، يرجى الاتصال بنا على:'
                  : 'If you have any questions about these Terms, please contact us at:'}
              </p>
              <p className='text-primary-600 mt-2'>legal@souk-el-syarat.com</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TermsPage;