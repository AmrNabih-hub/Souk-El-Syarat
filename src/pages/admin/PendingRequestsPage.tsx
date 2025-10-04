/**
 * Admin Pending Requests Page
 * Professional interface for reviewing and approving requests
 * Real-time updates, complete workflow
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ClockIcon,
  BuildingStorefrontIcon,
  TruckIcon,
  UserIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import { AdminActionsService } from '@/services/admin-actions.service';
import { RealtimeWorkflowService } from '@/services/realtime-workflow.service';
import ApprovalInterface from '@/components/admin/ApprovalInterface';
import toast from 'react-hot-toast';

const PendingRequestsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { language } = useAppStore();
  const [vendorApps, setVendorApps] = useState<any[]>([]);
  const [carListings, setCarListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'vendor' | 'car'>('vendor');

  // Load pending requests
  useEffect(() => {
    async function loadRequests() {
      setLoading(true);

      const [apps, listings] = await Promise.all([
        AdminActionsService.getPendingVendorApplications(),
        AdminActionsService.getPendingCarListings()
      ]);

      setVendorApps(apps);
      setCarListings(listings);
      setLoading(false);
    }

    loadRequests();
  }, []);

  // Subscribe to real-time updates
  useEffect(() => {
    // Subscribe to new vendor applications
    const unsubVendor = RealtimeWorkflowService.subscribeToVendorApplications({
      onInsert: (newApp) => {
        console.log('[Admin] New vendor application received:', newApp);
        setVendorApps(prev => [newApp, ...prev]);
        toast.success('New vendor application received!', {
          icon: '🔔',
          duration: 4000
        });
      },
      onUpdate: (updated) => {
        // Remove from pending if status changed
        if (updated.status !== 'pending') {
          setVendorApps(prev => prev.filter(app => app.id !== updated.id));
        }
      }
    });

    // Subscribe to new car listings
    const unsubCar = RealtimeWorkflowService.subscribeToCarListings({
      onInsert: (newListing) => {
        console.log('[Admin] New car listing received:', newListing);
        setCarListings(prev => [newListing, ...prev]);
        toast.success('New car listing received!', {
          icon: '🚗',
          duration: 4000
        });
      },
      onUpdate: (updated) => {
        // Remove from pending if status changed
        if (updated.status !== 'pending') {
          setCarListings(prev => prev.filter(listing => listing.id !== updated.id));
        }
      }
    });

    return () => {
      unsubVendor();
      unsubCar();
    };
  }, []);

  const handleRequestProcessed = () => {
    // Reload requests after approval/rejection
    AdminActionsService.getPendingVendorApplications().then(setVendorApps);
    AdminActionsService.getPendingCarListings().then(setCarListings);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p>{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            {language === 'ar' ? 'الطلبات المعلقة' : 'Pending Requests'}
          </h1>
          <p className="text-neutral-600">
            {language === 'ar'
              ? 'مراجعة والموافقة على طلبات التجار والسيارات'
              : 'Review and approve vendor applications and car listings'}
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('vendor')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'vendor'
                ? 'bg-primary-600 text-white shadow-lg'
                : 'bg-white text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            <BuildingStorefrontIcon className="w-5 h-5 inline mr-2" />
            {language === 'ar' ? 'طلبات التجار' : 'Vendor Applications'}
            {vendorApps.length > 0 && (
              <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                {vendorApps.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('car')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'car'
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'bg-white text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            <TruckIcon className="w-5 h-5 inline mr-2" />
            {language === 'ar' ? 'طلبات السيارات' : 'Car Listings'}
            {carListings.length > 0 && (
              <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                {carListings.length}
              </span>
            )}
          </button>
        </div>

        {/* Vendor Applications */}
        {activeTab === 'vendor' && (
          <div className="space-y-4">
            {vendorApps.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <ClockIcon className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                <p className="text-neutral-600">
                  {language === 'ar' ? 'لا توجد طلبات معلقة' : 'No pending applications'}
                </p>
              </div>
            ) : (
              vendorApps.map((app) => (
                <motion.div
                  key={app.id}
                  className="bg-white rounded-lg shadow-md border border-neutral-200 p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-neutral-900 mb-2">
                        {app.company_name}
                      </h3>
                      <div className="space-y-1 text-sm text-neutral-600">
                        <div className="flex items-center gap-2">
                          <UserIcon className="w-4 h-4" />
                          <span>{app.users?.profiles?.display_name || app.users?.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <EnvelopeIcon className="w-4 h-4" />
                          <span>{app.users?.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ClockIcon className="w-4 h-4" />
                          <span>
                            {language === 'ar' ? 'قُدم في:' : 'Submitted:'}  {' '}
                            {new Date(app.created_at).toLocaleDateString(
                              language === 'ar' ? 'ar-EG' : 'en-US'
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <ApprovalInterface
                      type="vendor"
                      itemId={app.id}
                      itemTitle={app.company_name}
                      onSuccess={handleRequestProcessed}
                    />
                  </div>

                  {/* Application Details */}
                  <div className="grid md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-neutral-200">
                    <div>
                      <p className="text-sm font-semibold text-neutral-700 mb-1">
                        {language === 'ar' ? 'رقم الترخيص:' : 'License Number:'}
                      </p>
                      <p className="text-sm text-neutral-900">{app.license_number}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-700 mb-1">
                        {language === 'ar' ? 'نوع النشاط:' : 'Business Type:'}
                      </p>
                      <p className="text-sm text-neutral-900">{app.business_type}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm font-semibold text-neutral-700 mb-1">
                        {language === 'ar' ? 'الوصف:' : 'Description:'}
                      </p>
                      <p className="text-sm text-neutral-600">{app.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* Car Listings */}
        {activeTab === 'car' && (
          <div className="space-y-4">
            {carListings.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <TruckIcon className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                <p className="text-neutral-600">
                  {language === 'ar' ? 'لا توجد سيارات معلقة' : 'No pending car listings'}
                </p>
              </div>
            ) : (
              carListings.map((listing) => (
                <motion.div
                  key={listing.id}
                  className="bg-white rounded-lg shadow-md border border-neutral-200 p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-neutral-900 mb-2">
                        {listing.title}
                      </h3>
                      <p className="text-2xl font-bold text-emerald-600 mb-3">
                        {listing.price?.toLocaleString()} {language === 'ar' ? 'ج.م' : 'EGP'}
                      </p>
                      <div className="space-y-1 text-sm text-neutral-600">
                        <div className="flex items-center gap-2">
                          <UserIcon className="w-4 h-4" />
                          <span>{listing.users?.profiles?.display_name || listing.users?.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <EnvelopeIcon className="w-4 h-4" />
                          <span>{listing.users?.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <PhoneIcon className="w-4 h-4" />
                          <span>{listing.contact_phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPinIcon className="w-4 h-4" />
                          <span>{listing.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ClockIcon className="w-4 h-4" />
                          <span>
                            {language === 'ar' ? 'قُدم في:' : 'Submitted:'} {' '}
                            {new Date(listing.created_at).toLocaleDateString(
                              language === 'ar' ? 'ar-EG' : 'en-US'
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <ApprovalInterface
                      type="car"
                      itemId={listing.id}
                      itemTitle={listing.title}
                      onSuccess={handleRequestProcessed}
                    />
                  </div>

                  {/* Car Details */}
                  <div className="grid md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-neutral-200">
                    <div>
                      <p className="text-sm font-semibold text-neutral-700 mb-1">
                        {language === 'ar' ? 'الصنع والموديل:' : 'Make & Model:'}
                      </p>
                      <p className="text-sm text-neutral-900">{listing.make} {listing.model}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-700 mb-1">
                        {language === 'ar' ? 'السنة:' : 'Year:'}
                      </p>
                      <p className="text-sm text-neutral-900">{listing.year}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-700 mb-1">
                        {language === 'ar' ? 'الكيلومترات:' : 'Mileage:'}
                      </p>
                      <p className="text-sm text-neutral-900">{listing.mileage?.toLocaleString()} km</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-700 mb-1">
                        {language === 'ar' ? 'ناقل الحركة:' : 'Transmission:'}
                      </p>
                      <p className="text-sm text-neutral-900">{listing.transmission}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-700 mb-1">
                        {language === 'ar' ? 'نوع الوقود:' : 'Fuel Type:'}
                      </p>
                      <p className="text-sm text-neutral-900">{listing.fuel_type}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-700 mb-1">
                        {language === 'ar' ? 'اللون:' : 'Color:'}
                      </p>
                      <p className="text-sm text-neutral-900">{listing.color}</p>
                    </div>
                    <div className="md:col-span-3">
                      <p className="text-sm font-semibold text-neutral-700 mb-1">
                        {language === 'ar' ? 'الوصف:' : 'Description:'}
                      </p>
                      <p className="text-sm text-neutral-600">{listing.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* Summary Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div className="bg-primary-50 rounded-lg p-6 border border-primary-200">
            <p className="text-sm text-primary-700 mb-1">
              {language === 'ar' ? 'طلبات التجار المعلقة' : 'Pending Vendor Applications'}
            </p>
            <p className="text-3xl font-bold text-primary-600">{vendorApps.length}</p>
          </div>
          <div className="bg-emerald-50 rounded-lg p-6 border border-emerald-200">
            <p className="text-sm text-emerald-700 mb-1">
              {language === 'ar' ? 'طلبات السيارات المعلقة' : 'Pending Car Listings'}
            </p>
            <p className="text-3xl font-bold text-emerald-600">{carListings.length}</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PendingRequestsPage;
