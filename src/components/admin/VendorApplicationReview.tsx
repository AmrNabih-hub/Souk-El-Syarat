import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  DocumentIcon,
  BuildingStorefrontIcon,
  UserIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import { VendorApplication } from '@/services/vendor-application.service';
import { vendorApplicationService } from '@/services/vendor-application.service';
import toast from 'react-hot-toast';

interface VendorApplicationReviewProps {
  application: VendorApplication;
  onApplicationProcessed: () => void;
  language: 'ar' | 'en';
}

const VendorApplicationReview: React.FC<VendorApplicationReviewProps> = ({
  application,
  onApplicationProcessed,
  language
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'rejected'>('approved');
  const [reviewComments, setReviewComments] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleReview = async () => {
    try {
      setIsProcessing(true);
      
      if (reviewStatus === 'approved') {
        await vendorApplicationService.approveApplication(
          application.id,
          'admin',
          reviewComments || undefined
        );
        toast.success(
          language === 'ar' ? 'تم قبول الطلب بنجاح!' : 'Application approved successfully!'
        );
      } else {
        await vendorApplicationService.rejectApplication(
          application.id,
          'admin',
          reviewComments || 'Application rejected by admin'
        );
        toast.success(
          language === 'ar' ? 'تم رفض الطلب' : 'Application rejected'
        );
      }
      
      setIsModalOpen(false);
      onApplicationProcessed();
    } catch (error) {
      console.error('Error processing application:', error);
      toast.error(
        language === 'ar' ? 'حدث خطأ في معالجة الطلب' : 'Error processing application'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = () => {
    const baseClasses = 'px-3 py-1 rounded-full text-sm font-medium';
    switch (application.status) {
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'approved':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getStatusText = () => {
    switch (application.status) {
      case 'pending':
        return language === 'ar' ? 'قيد المراجعة' : 'Pending Review';
      case 'approved':
        return language === 'ar' ? 'مقبول' : 'Approved';
      case 'rejected':
        return language === 'ar' ? 'مرفوض' : 'Rejected';
      default:
        return 'Unknown';
    }
  };

  return (
    <>
      <motion.div
        className="bg-white rounded-lg shadow-md border border-gray-200 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <BuildingStorefrontIcon className="w-8 h-8 text-primary-500" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {application.applicationData.businessName}
              </h3>
              <p className="text-sm text-gray-500">
                {application.applicationData.businessType}
              </p>
            </div>
          </div>
          <span className={getStatusBadge()}>
            {getStatusText()}
          </span>
        </div>

        {/* Basic Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <UserIcon className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">
                {language === 'ar' ? 'الشخص المسؤول' : 'Contact Person'}
              </p>
              <p className="font-medium">{application.applicationData.contactPerson}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <EnvelopeIcon className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">
                {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
              </p>
              <p className="font-medium">{application.applicationData.email}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <PhoneIcon className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">
                {language === 'ar' ? 'رقم الهاتف' : 'Phone'}  
              </p>
              <p className="font-medium">{application.applicationData.phoneNumber}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <MapPinIcon className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">
                {language === 'ar' ? 'المحافظة' : 'Governorate'}
              </p>
              <p className="font-medium">{application.applicationData.address.governorate}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <CurrencyDollarIcon className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">
                {language === 'ar' ? 'الحجم المتوقع' : 'Expected Volume'}
              </p>
              <p className="font-medium">{application.applicationData.expectedMonthlyVolume}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <CalendarIcon className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">
                {language === 'ar' ? 'تاريخ التقديم' : 'Submitted'}
              </p>
              <p className="font-medium">
                {application.submittedAt.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
              </p>
            </div>
          </div>
        </div>

        {/* Specializations */}
        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-2">
            {language === 'ar' ? 'التخصصات' : 'Specializations'}
          </p>
          <div className="flex flex-wrap gap-2">
            {application.applicationData.specializations.map((spec, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
              >
                {spec}
              </span>
            ))}
          </div>
        </div>

        {/* Documents Info */}
        {(application.documentsUploaded?.length > 0 || application.invoiceScreenshot) && (
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-2">
              {language === 'ar' ? 'المستندات' : 'Documents'}
            </p>
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              {application.documentsUploaded?.length > 0 && (
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <DocumentIcon className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-blue-600">
                    {application.documentsUploaded.length} {language === 'ar' ? 'مستند' : 'documents'}
                  </span>
                </div>
              )}
              {application.invoiceScreenshot && (
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <PhotoIcon className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600">
                    {language === 'ar' ? 'فاتورة مرفقة' : 'Invoice attached'}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 rtl:space-x-reverse text-blue-600 hover:text-blue-700"
          >
            <EyeIcon className="w-4 h-4" />
            <span>{language === 'ar' ? 'عرض التفاصيل' : 'View Details'}</span>
          </button>

          {application.status === 'pending' && (
            <div className="flex space-x-2 rtl:space-x-reverse">
              <button
                onClick={() => {
                  setReviewStatus('approved');
                  setIsModalOpen(true);
                }}
                className="flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <CheckCircleIcon className="w-4 h-4" />
                <span>{language === 'ar' ? 'قبول' : 'Approve'}</span>
              </button>
              <button
                onClick={() => {
                  setReviewStatus('rejected');
                  setIsModalOpen(true);
                }}
                className="flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <XCircleIcon className="w-4 h-4" />
                <span>{language === 'ar' ? 'رفض' : 'Reject'}</span>
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Review Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">
                  {language === 'ar' ? 'تفاصيل طلب الانضمام' : 'Vendor Application Details'}
                </h2>
              </div>

              <div className="p-6 space-y-6">
                {/* Full Application Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">
                      {language === 'ar' ? 'معلومات النشاط' : 'Business Information'}
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm text-gray-500">Business Name:</label>
                        <p className="font-medium">{application.applicationData.businessName}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Business Type:</label>
                        <p className="font-medium">{application.applicationData.businessType}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Business License:</label>
                        <p className="font-medium">{application.applicationData.businessLicense}</p>
                      </div>
                      {application.applicationData.taxId && (
                        <div>
                          <label className="text-sm text-gray-500">Tax ID:</label>
                          <p className="font-medium">{application.applicationData.taxId}</p>
                        </div>
                      )}
                      {application.applicationData.website && (
                        <div>
                          <label className="text-sm text-gray-500">Website:</label>
                          <p className="font-medium">
                            <a href={application.applicationData.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {application.applicationData.website}
                            </a>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">
                      {language === 'ar' ? 'معلومات الاتصال' : 'Contact Information'}
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm text-gray-500">Contact Person:</label>
                        <p className="font-medium">{application.applicationData.contactPerson}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Email:</label>
                        <p className="font-medium">{application.applicationData.email}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Phone:</label>
                        <p className="font-medium">{application.applicationData.phoneNumber}</p>
                      </div>
                      {application.applicationData.whatsappNumber && (
                        <div>
                          <label className="text-sm text-gray-500">WhatsApp:</label>
                          <p className="font-medium">{application.applicationData.whatsappNumber}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    {language === 'ar' ? 'العنوان' : 'Address'}
                  </h3>
                  <p className="text-gray-700">
                    {application.applicationData.address.street}, {application.applicationData.address.city}, {application.applicationData.address.governorate}
                    {application.applicationData.address.postalCode && `, ${application.applicationData.address.postalCode}`}
                  </p>
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    {language === 'ar' ? 'وصف النشاط' : 'Business Description'}
                  </h3>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                    {application.applicationData.description}
                  </p>
                </div>

                {/* Review Section */}
                {application.status === 'pending' && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-3">
                      {reviewStatus === 'approved' 
                        ? (language === 'ar' ? 'قبول الطلب' : 'Approve Application')
                        : (language === 'ar' ? 'رفض الطلب' : 'Reject Application')
                      }
                    </h3>
                    <textarea
                      value={reviewComments}
                      onChange={(e) => setReviewComments(e.target.value)}
                      placeholder={
                        reviewStatus === 'approved'
                          ? (language === 'ar' ? 'ملاحظات اختيارية...' : 'Optional notes...')
                          : (language === 'ar' ? 'أسباب الرفض...' : 'Reason for rejection...')
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={4}
                    />
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end space-x-4 rtl:space-x-reverse">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  disabled={isProcessing}
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                {application.status === 'pending' && (
                  <button
                    onClick={handleReview}
                    disabled={isProcessing || (reviewStatus === 'rejected' && !reviewComments.trim())}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                      reviewStatus === 'approved'
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isProcessing 
                      ? (language === 'ar' ? 'جاري المعالجة...' : 'Processing...')
                      : (reviewStatus === 'approved' 
                          ? (language === 'ar' ? 'قبول الطلب' : 'Approve')
                          : (language === 'ar' ? 'رفض الطلب' : 'Reject')
                        )
                    }
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default VendorApplicationReview;