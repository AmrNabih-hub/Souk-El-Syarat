import React from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/stores/appStore';

const PrivacyPage: React.FC = () => {
  const { language } = useAppStore();

  const sections = [
    {
      title: 'Information We Collect',
      titleAr: 'المعلومات التي نجمعها',
      content: 'We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us for support.',
      contentAr: 'نحن نجمع المعلومات التي تقدمها لنا مباشرة، مثل عند إنشاء حساب أو إجراء عملية شراء أو الاتصال بنا للحصول على الدعم.'
    },
    {
      title: 'How We Use Your Information',
      titleAr: 'كيف نستخدم معلوماتك',
      content: 'We use the information we collect to provide, maintain, and improve our services, process transactions, and communicate with you.',
      contentAr: 'نستخدم المعلومات التي نجمعها لتوفير خدماتنا وصيانتها وتحسينها، ومعالجة المعاملات، والتواصل معك.'
    },
    {
      title: 'Information Sharing',
      titleAr: 'مشاركة المعلومات',
      content: 'We do not sell, trade, or rent your personal information to third parties. We may share your information with vendors to fulfill orders.',
      contentAr: 'نحن لا نبيع أو نتاجر أو نؤجر معلوماتك الشخصية لأطراف ثالثة. قد نشارك معلوماتك مع البائعين لتنفيذ الطلبات.'
    },
    {
      title: 'Data Security',
      titleAr: 'أمن البيانات',
      content: 'We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.',
      contentAr: 'نطبق التدابير التقنية والتنظيمية المناسبة لحماية معلوماتك الشخصية من الوصول غير المصرح به أو التغيير أو الكشف أو التدمير.'
    },
    {
      title: 'Cookies',
      titleAr: 'ملفات تعريف الارتباط',
      content: 'We use cookies and similar tracking technologies to track activity on our service and hold certain information to improve your experience.',
      contentAr: 'نستخدم ملفات تعريف الارتباط وتقنيات التتبع المماثلة لتتبع النشاط على خدمتنا والاحتفاظ بمعلومات معينة لتحسين تجربتك.'
    },
    {
      title: 'Your Rights',
      titleAr: 'حقوقك',
      content: 'You have the right to access, update, or delete your personal information. You can manage your account settings or contact us for assistance.',
      contentAr: 'لديك الحق في الوصول إلى معلوماتك الشخصية أو تحديثها أو حذفها. يمكنك إدارة إعدادات حسابك أو الاتصال بنا للحصول على المساعدة.'
    },
    {
      title: 'Children\'s Privacy',
      titleAr: 'خصوصية الأطفال',
      content: 'Our service is not directed to individuals under the age of 18. We do not knowingly collect personal information from children under 18.',
      contentAr: 'خدمتنا غير موجهة للأفراد الذين تقل أعمارهم عن 18 عاماً. نحن لا نجمع عن قصد معلومات شخصية من الأطفال دون سن 18.'
    },
    {
      title: 'International Data Transfers',
      titleAr: 'نقل البيانات الدولي',
      content: 'Your information may be transferred to and maintained on servers located outside of your country. We ensure appropriate safeguards are in place.',
      contentAr: 'قد يتم نقل معلوماتك والاحتفاظ بها على خوادم موجودة خارج بلدك. نحن نضمن وجود ضمانات مناسبة.'
    },
    {
      title: 'Changes to This Policy',
      titleAr: 'التغييرات على هذه السياسة',
      content: 'We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.',
      contentAr: 'قد نقوم بتحديث سياسة الخصوصية الخاصة بنا من وقت لآخر. سنخطرك بأي تغييرات عن طريق نشر سياسة الخصوصية الجديدة على هذه الصفحة.'
    },
    {
      title: 'Contact Information',
      titleAr: 'معلومات الاتصال',
      content: 'If you have any questions about this Privacy Policy, please contact us at privacy@souk-el-syarat.com',
      contentAr: 'إذا كان لديك أي أسئلة حول سياسة الخصوصية هذه، يرجى الاتصال بنا على privacy@souk-el-syarat.com'
    }
  ];

  return (
    <div className='min-h-screen bg-gray-50 py-12'>
      <div className='max-w-4xl mx-auto px-4'>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className='text-4xl font-bold text-center mb-8 text-gray-900'>
            {language === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}
          </h1>
          
          <div className='bg-white rounded-xl shadow-lg p-8'>
            <p className='text-gray-600 mb-8'>
              {language === 'ar' 
                ? 'تاريخ السريان: يناير 2024'
                : 'Effective Date: January 2024'}
            </p>
            
            <div className='prose prose-gray max-w-none'>
              <p className='text-gray-600 mb-8'>
                {language === 'ar'
                  ? 'في سوق السيارات، نحترم خصوصيتك ونلتزم بحماية معلوماتك الشخصية. توضح سياسة الخصوصية هذه كيفية جمعنا واستخدامنا وحماية معلوماتك.'
                  : 'At Souk El-Syarat, we respect your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your information.'}
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
            </div>
            
            <div className='mt-12 p-6 bg-primary-50 rounded-lg'>
              <h3 className='text-lg font-semibold text-gray-900 mb-3'>
                {language === 'ar' ? 'حقوق حماية البيانات' : 'Data Protection Rights'}
              </h3>
              <ul className='space-y-2 text-gray-600'>
                <li>• {language === 'ar' ? 'الحق في الوصول إلى بياناتك' : 'The right to access your data'}</li>
                <li>• {language === 'ar' ? 'الحق في تصحيح بياناتك' : 'The right to rectification'}</li>
                <li>• {language === 'ar' ? 'الحق في محو بياناتك' : 'The right to erasure'}</li>
                <li>• {language === 'ar' ? 'الحق في تقييد المعالجة' : 'The right to restrict processing'}</li>
                <li>• {language === 'ar' ? 'الحق في نقل البيانات' : 'The right to data portability'}</li>
                <li>• {language === 'ar' ? 'الحق في الاعتراض' : 'The right to object'}</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PrivacyPage;