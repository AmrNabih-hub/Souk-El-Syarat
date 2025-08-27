/**
 * Real-time Inventory Monitor Component
 * Monitors inventory levels with live updates
 */

import React, { useEffect } from 'react';
import { useRealtimeStore } from '@/stores/realtimeStore';
import { motion } from 'framer-motion';
import { 
  CubeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import { useAppStore } from '@/stores/appStore';

interface InventoryMonitorProps {
  vendorId: string;
}

const InventoryMonitor: React.FC<InventoryMonitorProps> = ({ vendorId }) => {
  const { productUpdates, listenToVendorInventory } = useRealtimeStore();
  const { language } = useAppStore();

  useEffect(() => {
    if (vendorId) {
      const unsubscribe = listenToVendorInventory(vendorId);
      return () => unsubscribe?.();
    }
  }, [vendorId]);

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) {
      return {
        label: language === 'ar' ? 'نفذ المخزون' : 'Out of Stock',
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        icon: ExclamationTriangleIcon
      };
    } else if (quantity < 10) {
      return {
        label: language === 'ar' ? 'مخزون منخفض' : 'Low Stock',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        icon: ExclamationTriangleIcon
      };
    } else {
      return {
        label: language === 'ar' ? 'متوفر' : 'In Stock',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        icon: CheckCircleIcon
      };
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          {language === 'ar' ? 'مراقبة المخزون المباشرة' : 'Live Inventory Monitor'}
        </h3>
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-3 h-3 bg-green-500 rounded-full"
          />
          <span className="text-sm text-gray-600">
            {language === 'ar' ? 'تحديثات مباشرة' : 'Live Updates'}
          </span>
        </div>
      </div>

      {/* Inventory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(productUpdates).map(([productId, product]) => {
          const status = getStockStatus(product.quantity || 0);
          const StatusIcon = status.icon;
          const trend = (product.previousQuantity || 0) - (product.quantity || 0);

          return (
            <motion.div
              key={productId}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              {/* Product Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <CubeIcon className="w-5 h-5 text-gray-400" />
                  <h4 className="font-medium text-gray-900 line-clamp-1">
                    {product.name || `Product ${productId.slice(-6)}`}
                  </h4>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${status.bgColor} ${status.color}`}>
                  <StatusIcon className="w-3 h-3 inline mr-1" />
                  {status.label}
                </span>
              </div>

              {/* Quantity Display */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {product.quantity || 0}
                  </p>
                  <p className="text-xs text-gray-500">
                    {language === 'ar' ? 'وحدة متاحة' : 'units available'}
                  </p>
                </div>
                
                {/* Trend Indicator */}
                {trend !== 0 && (
                  <div className={`flex items-center space-x-1 ${
                    trend > 0 ? 'text-red-500' : 'text-green-500'
                  }`}>
                    {trend > 0 ? (
                      <ArrowTrendingDownIcon className="w-4 h-4" />
                    ) : (
                      <ArrowTrendingUpIcon className="w-4 h-4" />
                    )}
                    <span className="text-sm font-medium">
                      {Math.abs(trend)}
                    </span>
                  </div>
                )}
              </div>

              {/* Stock Levels */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">
                    {language === 'ar' ? 'محجوز:' : 'Reserved:'}
                  </span>
                  <span className="font-medium">{product.reserved || 0}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">
                    {language === 'ar' ? 'الحد الأدنى:' : 'Min Stock:'}
                  </span>
                  <span className="font-medium">{product.minStock || 10}</span>
                </div>
              </div>

              {/* Stock Bar */}
              <div className="mt-3">
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full ${
                      product.quantity === 0 ? 'bg-red-500' :
                      product.quantity < 10 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (product.quantity / 100) * 100)}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              {/* Last Updated */}
              <p className="text-xs text-gray-400 mt-2">
                {language === 'ar' ? 'آخر تحديث:' : 'Last updated:'} {' '}
                {new Date(product.updatedAt || Date.now()).toLocaleTimeString()}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {Object.keys(productUpdates).length === 0 && (
        <div className="text-center py-12">
          <CubeIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            {language === 'ar' ? 'لا توجد منتجات للمراقبة' : 'No products to monitor'}
          </p>
        </div>
      )}

      {/* Summary Stats */}
      <div className="mt-6 pt-6 border-t grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">
            {Object.keys(productUpdates).length}
          </p>
          <p className="text-xs text-gray-500">
            {language === 'ar' ? 'إجمالي المنتجات' : 'Total Products'}
          </p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-yellow-600">
            {Object.values(productUpdates).filter(p => p.quantity < 10).length}
          </p>
          <p className="text-xs text-gray-500">
            {language === 'ar' ? 'مخزون منخفض' : 'Low Stock'}
          </p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-red-600">
            {Object.values(productUpdates).filter(p => p.quantity === 0).length}
          </p>
          <p className="text-xs text-gray-500">
            {language === 'ar' ? 'نفذ المخزون' : 'Out of Stock'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default InventoryMonitor;