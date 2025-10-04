/**
 * My Requests Page
 * Shows user's vendor applications and car listings with real-time status
 * Professional implementation with complete workflow tracking
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  TruckIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import { supabase } from '@/config/supabase.config';
import { RealtimeWorkflowService } from '@/services/realtime-workflow.service';
import { Link } from 'react-router-dom';

interface VendorApplication {
  id: string;
  company_name: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  created_at: string;
  approved_at?: string;
  rejected_at?: string;
}

interface CarListing {
  id: string;
  title: string;
  price: number;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  created_at: string;
  approved_at?: string;
  rejected_at?: string;
}

const MyRequestsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { language } = useAppStore();
  const [vendorApps, setVendorApps] = useState<VendorApplication[]>([]);
  const [carListings, setCarListings] = useState<CarListing[]>([]);
  const [loading, setLoading] = useState(true);

  // Load user's requests
  useEffect(() => {
    if (!user?.id) return;

    async function loadRequests() {
      setLoading(true);

      // Get vendor applications
      const { data: apps } = await supabase
        .from('vendor_applications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (apps) setVendorApps(apps);

      // Get car listings
      const { data: listings } = await supabase
        .from('car_listings')
        .select('*')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (listings) setCarListings(listings);

      setLoading(false);
    }

    loadRequests();
  }, [user?.id]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user?.id) return;

    // Subscribe to vendor application updates
    const unsubscribeVendor = RealtimeWorkflowService.subscribeToUserVendorApplication(
      user.id,
      {
        onUpdate: (updated) => {
          console.log('[MyRequests] Vendor application updated:', updated);
          setVendorApps(prev =>
            prev.map(app => app.id === updated.id ? updated : app)
          );
        }
      }
    );

    // Subscribe to car listing updates
    const unsubscribeCar = RealtimeWorkflowService.subscribeToUserCarListings(
      user.id,
      {
        onUpdate: (updated) => {
          console.log('[MyRequests] Car listing updated:', updated);
          setCarListings(prev =>
            prev.map(listing => listing.id === updated.id ? updated : listing)
          );
        }
      }
    );

    return () => {
      unsubscribeVendor();
      unsubscribeCar();
    };
  }, [user?.id]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
      case 'approved':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-neutral-400" />;
    }
  };

  const getStatusText = (status: string) => {
    const statusMap = {
      ar: {
        pending: 'قيد المراجعة',
        approved: 'تمت الموافقة',
        rejected: 'مرفوض'
      },
      en: {
        pending: 'Under Review',
        approved: 'Approved',
        rejected: 'Rejected'
      }
    };

    return statusMap[language][status as keyof typeof statusMap.ar] || status;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">
            {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            {language === 'ar' ? 'طلباتي' : 'My Requests'}
          </h1>
          <p className="text-neutral-600">
            {language === 'ar' 
              ? 'تتبع حالة طلباتك وطلبات بيع سياراتك'
              : 'Track the status of your applications and car listings'}
          </p>
        </motion.div>

        {/* Vendor Applications Section */}
        {vendorApps.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-2 mb-4">
              <BuildingStorefrontIcon className="w-6 h-6 text-primary-600" />
              <h2 className="text-xl font-bold text-neutral-900">
                {language === 'ar' ? 'طلبات أن تصبح تاجر' : 'Vendor Applications'}
              </h2>
            </div>

            <div className="space-y-4">
              {vendorApps.map((app) => (
                <motion.div
                  key={app.id}
                  className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-neutral-900 mb-1">
                        {app.company_name}
                      </h3>
                      <p className="text-sm text-neutral-500">
                        {language === 'ar' ? 'قُدم في:' : 'Submitted:'}{' '}
                        {new Date(app.created_at).toLocaleDateString(
                          language === 'ar' ? 'ar-EG' : 'en-US'
                        )}
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                      app.status === 'approved' ? 'bg-green-100 text-green-700' :
                      app.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {getStatusIcon(app.status)}
                      <span>{getStatusText(app.status)}</span>
                    </div>
                  </div>

                  {/* Rejection Reason */}
                  {app.status === 'rejected' && app.rejection_reason && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                      <p className="font-semibold text-red-900 mb-1">
                        {language === 'ar' ? 'سبب الرفض:' : 'Rejection Reason:'}
                      </p>
                      <p className="text-red-700">{app.rejection_reason}</p>
                    </div>
                  )}

                  {/* Approval Info */}
                  {app.status === 'approved' && app.approved_at && (
                    <div className="bg-green-50 border-l-4 border-green-500 p-4">
                      <p className="text-green-900 font-medium">
                        {language === 'ar' 
                          ? '🎉 تهانينا! تمت الموافقة على طلبك. يمكنك الآن الوصول إلى لوحة التاجر.'
                          : '🎉 Congratulations! Your application is approved. You can now access your vendor dashboard.'}
                      </p>
                      <Link
                        to="/vendor/dashboard"
                        className="inline-block mt-2 text-green-700 hover:text-green-800 font-medium"
                      >
                        {language === 'ar' ? 'الذهاب إلى لوحة التاجر →' : 'Go to Vendor Dashboard →'}
                      </Link>
                    </div>
                  )}

                  {/* Reapply Option */}
                  {app.status === 'rejected' && (
                    <Link
                      to="/vendor/apply"
                      className="inline-block mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      {language === 'ar' ? 'إعادة التقديم' : 'Reapply'}
                    </Link>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Car Listings Section */}
        {carListings.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <TruckIcon className="w-6 h-6 text-emerald-600" />
              <h2 className="text-xl font-bold text-neutral-900">
                {language === 'ar' ? 'طلبات بيع السيارات' : 'Car Listings'}
              </h2>
            </div>

            <div className="space-y-4">
              {carListings.map((listing) => (
                <motion.div
                  key={listing.id}
                  className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-neutral-900 mb-1">
                        {listing.title}
                      </h3>
                      <p className="text-xl font-bold text-primary-600 mb-2">
                        {listing.price.toLocaleString()} {language === 'ar' ? 'ج.م' : 'EGP'}
                      </p>
                      <p className="text-sm text-neutral-500">
                        {language === 'ar' ? 'قُدم في:' : 'Submitted:'}{' '}
                        {new Date(listing.created_at).toLocaleDateString(
                          language === 'ar' ? 'ar-EG' : 'en-US'
                        )}
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                      listing.status === 'approved' ? 'bg-green-100 text-green-700' :
                      listing.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {getStatusIcon(listing.status)}
                      <span>{getStatusText(listing.status)}</span>
                    </div>
                  </div>

                  {/* Rejection Reason */}
                  {listing.status === 'rejected' && listing.rejection_reason && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                      <p className="font-semibold text-red-900 mb-1">
                        {language === 'ar' ? 'سبب الرفض:' : 'Rejection Reason:'}
                      </p>
                      <p className="text-red-700">{listing.rejection_reason}</p>
                    </div>
                  )}

                  {/* Approval Info */}
                  {listing.status === 'approved' && listing.approved_at && (
                    <div className="bg-green-50 border-l-4 border-green-500 p-4">
                      <p className="text-green-900 font-medium">
                        {language === 'ar' 
                          ? '🎉 تهانينا! تمت الموافقة على سيارتك وهي الآن ظاهرة في السوق.'
                          : '🎉 Congratulations! Your car is approved and now visible in the marketplace.'}
                      </p>
                      <Link
                        to="/marketplace"
                        className="inline-block mt-2 text-green-700 hover:text-green-800 font-medium"
                      >
                        {language === 'ar' ? 'عرض في السوق →' : 'View in Marketplace →'}
                      </Link>
                    </div>
                  )}

                  {/* Resubmit Option */}
                  {listing.status === 'rejected' && (
                    <Link
                      to="/sell-your-car"
                      className="inline-block mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      {language === 'ar' ? 'إعادة التقديم' : 'Resubmit'}
                    </Link>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Empty State */}
        {vendorApps.length === 0 && carListings.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <ClockIcon className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-neutral-600 mb-2">
              {language === 'ar' ? 'لا توجد طلبات حتى الآن' : 'No Requests Yet'}
            </h3>
            <p className="text-neutral-500 mb-6">
              {language === 'ar' 
                ? 'يمكنك التقديم لتصبح تاجر أو بيع سيارتك'
                : 'You can apply to become a vendor or sell your car'}
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                to="/vendor/apply"
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                {language === 'ar' ? 'أن تصبح تاجر' : 'Become a Vendor'}
              </Link>
              <Link
                to="/sell-your-car"
                className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                {language === 'ar' ? 'بيع سيارتك' : 'Sell Your Car'}
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MyRequestsPage;
