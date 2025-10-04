/**
 * Admin Approval Interface Component
 * Professional UI for approving/rejecting requests
 * Complete workflow with reason tracking
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { AdminActionsService } from '@/services/admin-actions.service';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import toast from 'react-hot-toast';

interface ApprovalInterfaceProps {
  type: 'vendor' | 'car';
  itemId: string;
  itemTitle: string;
  onSuccess?: () => void;
}

const ApprovalInterface: React.FC<ApprovalInterfaceProps> = ({
  type,
  itemId,
  itemTitle,
  onSuccess
}) => {
  const { user } = useAuthStore();
  const { language } = useAppStore();
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleApprove = async () => {
    if (!user?.id) return;

    setProcessing(true);

    try {
      let result;
      
      if (type === 'vendor') {
        result = await AdminActionsService.approveVendorApplication({
          applicationId: itemId,
          adminId: user.id,
          adminNotes
        });
      } else {
        result = await AdminActionsService.approveCarListing({
          listingId: itemId,
          adminId: user.id,
          adminNotes
        });
      }

      if (result.success) {
        toast.success(
          language === 'ar'
            ? '✅ تمت الموافقة بنجاح'
            : '✅ Approved successfully',
          { duration: 4000 }
        );
        onSuccess?.();
      } else {
        toast.error(result.error || 'Approval failed');
      }
    } catch (error: any) {
      console.error('[ApprovalInterface] Error:', error);
      toast.error(error.message || 'An error occurred');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!user?.id) return;
    if (!rejectionReason.trim()) {
      toast.error(language === 'ar' ? 'يرجى إدخال سبب الرفض' : 'Please enter rejection reason');
      return;
    }

    setProcessing(true);

    try {
      let result;
      
      if (type === 'vendor') {
        result = await AdminActionsService.rejectVendorApplication({
          applicationId: itemId,
          adminId: user.id,
          reason: rejectionReason,
          adminNotes
        });
      } else {
        result = await AdminActionsService.rejectCarListing({
          listingId: itemId,
          adminId: user.id,
          reason: rejectionReason,
          adminNotes
        });
      }

      if (result.success) {
        toast.success(
          language === 'ar'
            ? '✅ تم الرفض وإرسال الإشعار'
            : '✅ Rejected and user notified',
          { duration: 4000 }
        );
        setShowRejectModal(false);
        onSuccess?.();
      } else {
        toast.error(result.error || 'Rejection failed');
      }
    } catch (error: any) {
      console.error('[ApprovalInterface] Error:', error);
      toast.error(error.message || 'An error occurred');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      {/* Action Buttons */}
      <div className="flex gap-3">
        {/* Approve Button */}
        <motion.button
          onClick={handleApprove}
          disabled={processing}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <CheckIcon className="w-4 h-4" />
          <span>{language === 'ar' ? 'موافقة' : 'Approve'}</span>
        </motion.button>

        {/* Reject Button */}
        <motion.button
          onClick={() => setShowRejectModal(true)}
          disabled={processing}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <XMarkIcon className="w-4 h-4" />
          <span>{language === 'ar' ? 'رفض' : 'Reject'}</span>
        </motion.button>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            className="bg-white rounded-xl max-w-md w-full p-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <h3 className="text-xl font-bold text-neutral-900 mb-4">
              {language === 'ar' ? 'رفض الطلب' : 'Reject Request'}
            </h3>
            
            <p className="text-neutral-600 mb-4">
              {language === 'ar' 
                ? 'يرجى إدخال سبب الرفض. سيتم إرسال هذا السبب إلى المستخدم.'
                : 'Please enter the reason for rejection. This will be sent to the user.'}
            </p>

            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder={language === 'ar' ? 'سبب الرفض...' : 'Rejection reason...'}
              className="w-full p-3 border border-neutral-300 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 mb-4"
              rows={4}
            />

            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder={language === 'ar' ? 'ملاحظات داخلية (اختياري)...' : 'Internal notes (optional)...'}
              className="w-full p-3 border border-neutral-300 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 mb-6"
              rows={2}
            />

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleReject}
                disabled={processing || !rejectionReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing 
                  ? (language === 'ar' ? 'جاري الرفض...' : 'Rejecting...') 
                  : (language === 'ar' ? 'تأكيد الرفض' : 'Confirm Rejection')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default ApprovalInterface;
