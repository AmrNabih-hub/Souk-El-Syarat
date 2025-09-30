import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  UsersIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentCheckIcon
} from '@heroicons/react/24/outline';
import { vendorApplicationService, VendorApplication } from '@/services/vendor-application.service';
import VendorApplicationReview from './VendorApplicationReview';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface VendorApplicationsListProps {
  language: 'ar' | 'en';
}

const VendorApplicationsList: React.FC<VendorApplicationsListProps> = ({ language }) => {
  const [applications, setApplications] = useState<VendorApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<VendorApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    loadApplications();
  }, []);

  useEffect(() => {
    filterApplications();
  }, [applications, searchQuery, statusFilter]);

  const loadApplications = () => {
    setIsLoading(true);
    try {
      const allApplications = vendorApplicationService.getAllApplications();
      setApplications(allApplications);
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterApplications = () => {
    let filtered = applications;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(app => 
        app.applicationData.businessName.toLowerCase().includes(query) ||
        app.applicationData.contactPerson.toLowerCase().includes(query) ||
        app.applicationData.email.toLowerCase().includes(query) ||
        app.applicationData.phoneNumber.includes(query)
      );
    }

    setFilteredApplications(filtered);
  };

  const handleApplicationProcessed = () => {
    loadApplications();
  };

  const getStatusCount = (status: 'pending' | 'approved' | 'rejected') => {
    return applications.filter(app => app.status === status).length;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <DocumentCheckIcon className="w-8 h-8 text-primary-500" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {language === 'ar' ? 'طلبات الانضمام' : 'Vendor Applications'}
            </h2>
            <p className="text-gray-600">
              {language === 'ar' ? 'مراجعة طلبات التجار الجدد' : 'Review new vendor applications'}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{applications.length}</div>
          <div className="text-sm text-gray-600">
            {language === 'ar' ? 'إجمالي الطلبات' : 'Total Applications'}
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-yellow-600">{getStatusCount('pending')}</div>
          <div className="text-sm text-gray-600">
            {language === 'ar' ? 'قيد المراجعة' : 'Pending Review'}
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-green-600">{getStatusCount('approved')}</div>
          <div className="text-sm text-gray-600">
            {language === 'ar' ? 'مقبولة' : 'Approved'}
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-red-600">{getStatusCount('rejected')}</div>
          <div className="text-sm text-gray-600">
            {language === 'ar' ? 'مرفوضة' : 'Rejected'}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={language === 'ar' ? 'البحث في الطلبات...' : 'Search applications...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rtl:pl-4 rtl:pr-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <FunnelIcon className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">{language === 'ar' ? 'جميع الطلبات' : 'All Applications'}</option>
              <option value="pending">{language === 'ar' ? 'قيد المراجعة' : 'Pending'}</option>
              <option value="approved">{language === 'ar' ? 'مقبولة' : 'Approved'}</option>
              <option value="rejected">{language === 'ar' ? 'مرفوضة' : 'Rejected'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {filteredApplications.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center border border-gray-200">
            <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {language === 'ar' ? 'لا توجد طلبات' : 'No Applications Found'}
            </h3>
            <p className="text-gray-600">
              {searchQuery || statusFilter !== 'all'
                ? (language === 'ar' ? 'لا توجد طلبات تطابق البحث المحدد' : 'No applications match the current search criteria')
                : (language === 'ar' ? 'لم يتم تقديم أي طلبات انضمام بعد' : 'No vendor applications have been submitted yet')
              }
            </p>
          </div>
        ) : (
          filteredApplications.map((application, index) => (
            <motion.div
              key={application.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <VendorApplicationReview
                application={application}
                onApplicationProcessed={handleApplicationProcessed}
                language={language}
              />
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default VendorApplicationsList;