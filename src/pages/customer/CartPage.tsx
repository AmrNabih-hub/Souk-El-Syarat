import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import {
  ShoppingCartIcon,
  TrashIcon,
  PlusIcon,
  MinusIcon,
  HeartIcon,
  ArrowLeftIcon,
  CreditCardIcon,
  TruckIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';

import { Product } from '@/types';
import { ProductService } from '@/services/product.service';
import { EgyptianLoader, LoadingSpinner } from '@/components/ui/CustomIcons';
import toast from 'react-hot-toast';

const CartPage: React.FC = () => {
  const {
    language,
    cartItems,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartItemsCount,
    addToFavorites,
  } = useAppStore();
  const { user } = useAuthStore();
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadCartProducts();
  }, [cartItems]);

  const loadCartProducts = async () => {
    try {
      setIsLoading(true);

      // Get all sample products for demo
      const sampleProducts = ProductService.getSampleProducts();
      const productMap: Record<string, Product> = {};

      // Add more sample products
      const allProducts = [
        ...sampleProducts,
        {
          ...sampleProducts[0],
          id: 'car-2',
          title: 'BMW X5 2019 - فل أوبشن',
          price: 850000,
          originalPrice: 950000,
          images: [
            {
              id: 'car-2-img-1',
              url: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&h=600&fit=crop',
              alt: 'BMW X5 2019',
              isPrimary: true,
              order: 0,
            },
          ],
        },
      ];

      allProducts.forEach(product => {
        productMap[product.id] = product;
      });

      setProducts(productMap);
    } catch (error) {
      if (process.env.NODE_ENV === 'development')
        if (process.env.NODE_ENV === 'development')
          console.error('Error loading cart products:', error);
      toast.error(language === 'ar' ? 'خطأ في تحميل المنتجات' : 'Error loading products');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuantityUpdate = async (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    const product = products[productId];
    if (!product) return;

    if (newQuantity > product.quantity) {
      toast.error(
        language === 'ar' ? 'الكمية المطلوبة غير متوفرة' : 'Requested quantity not available'
      );
      //       return;
    }

    setIsUpdating(productId);

    try {
      updateCartItemQuantity(productId, newQuantity);
      toast.success(language === 'ar' ? 'تم تحديث الكمية' : 'Quantity updated');
    } catch (error) {
      toast.error(language === 'ar' ? 'خطأ في تحديث الكمية' : 'Error updating quantity');
    } finally {
      setIsUpdating(null);
    }
  };

  const handleRemoveFromCart = (productId: string) => {
    removeFromCart(productId);
    toast.success(language === 'ar' ? 'تم حذف المنتج من السلة' : 'Product removed from cart');
  };

  const handleMoveToWishlist = (productId: string) => {
    addToFavorites(productId);
    removeFromCart(productId);
    toast.success(language === 'ar' ? 'تم نقل المنتج للمفضلة' : 'Product moved to wishlist');
  };

  const handleClearCart = () => {
    if (
      window.confirm(
        language === 'ar'
          ? 'هل تريد مسح جميع المنتجات من السلة؟'
          : 'Are you sure you want to clear all items from cart?'
      )
    ) {
      clearCart();
      toast.success(language === 'ar' ? 'تم مسح السلة' : 'Cart cleared');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const cartTotal = getCartTotal();
  const itemsCount = getCartItemsCount();
  const shippingFee = cartTotal > 1000 ? 0 : 50;
  const finalTotal = cartTotal + shippingFee;

  if (isLoading) {
    return (
      <div className='min-h-screen bg-neutral-50'>
        {/* Header */}
        <div className='bg-white border-b border-neutral-200'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
            <div className='flex items-center justify-between'>
              <div>
                <h1 className='text-3xl font-bold text-neutral-900 flex items-center'>
                  <ShoppingCartIcon className='w-8 h-8 mr-3 text-primary-500' />
                  {language === 'ar' ? 'سلة التسوق' : 'Shopping Cart'}
                </h1>
                <p className='text-neutral-600 mt-1'>
                  {language === 'ar' ? 'جاري تحميل السلة...' : 'Loading cart...'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Loading Content */}
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          <div className='flex justify-center items-center py-20'>
            <EgyptianLoader size='lg' text={language === 'ar' ? 'جاري التحميل...' : 'Loading...'} />
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className='min-h-screen bg-neutral-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
          <motion.div
            className='text-center py-20'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className='text-8xl mb-6'>🛒</div>
            <h2 className='text-3xl font-bold text-neutral-900 mb-4'>
              {language === 'ar' ? 'السلة فارغة' : 'Your cart is empty'}
            </h2>
            <p className='text-xl text-neutral-600 mb-8'>
              {language === 'ar'
                ? 'ابدأ التسوق واضف المنتجات التي تعجبك'
                : 'Start shopping and add products you like'}
            </p>
            <Link to='/marketplace' className='btn btn-primary btn-lg'>
              <ArrowLeftIcon className='w-5 h-5 mr-2' />
              {language === 'ar' ? 'تصفح المنتجات' : 'Browse Products'}
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-neutral-50'>
      {/* Header */}
      <div className='bg-white border-b border-neutral-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-neutral-900 flex items-center'>
                <ShoppingCartIcon className='w-8 h-8 mr-3 text-primary-500' />
                {language === 'ar' ? 'سلة التسوق' : 'Shopping Cart'}
              </h1>
              <p className='text-neutral-600 mt-1'>
                {language === 'ar' ? `${itemsCount} منتج في السلة` : `${itemsCount} items in cart`}
              </p>
            </div>

            <Link to='/marketplace' className='btn btn-outline'>
              <ArrowLeftIcon className='w-4 h-4 mr-2' />
              {language === 'ar' ? 'متابعة التسوق' : 'Continue Shopping'}
            </Link>
          </div>
        </div>
      </div>

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Cart Items */}
          <div className='lg:col-span-2 space-y-4'>
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-xl font-semibold text-neutral-900'>
                {language === 'ar' ? 'المنتجات' : 'Products'}
              </h2>

              <button
                onClick={handleClearCart}
                className='text-sm text-red-600 hover:text-red-700 flex items-center'
              >
                <TrashIcon className='w-4 h-4 mr-1' />
                {language === 'ar' ? 'مسح السلة' : 'Clear Cart'}
              </button>
            </div>

            <AnimatePresence>
              {cartItems.map(item => {
                const product = products[item.productId];
                if (!product) return null;

                const primaryImage = product.images.find(img => img.isPrimary) || product.images[0];
                const itemTotal = product.price * (item as any)?.quantity;

                return (
                  <motion.div
                    key={item.productId}
                    className='bg-white rounded-xl border border-neutral-200 p-6 shadow-sm'
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    layout
                  >
                    <div className='flex flex-col md:flex-row gap-6'>
                      {/* Product Image */}
                      <div className='flex-shrink-0'>
                        <div className='w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden bg-neutral-100'>
                          <img
                            src={primaryImage?.url}
                            alt={product.title}
                            className='w-full h-full object-cover'
                          />
                        </div>
                      </div>

                      {/* Product Details */}
                      <div className='flex-1 space-y-3'>
                        <div>
                          <h3 className='font-semibold text-neutral-900 text-lg'>
                            {product.title}
                          </h3>
                          <p className='text-neutral-600 text-sm line-clamp-2'>
                            {product.description}
                          </p>
                        </div>

                        {/* Features */}
                        {product.features && product.features.length > 0 && (
                          <div className='flex flex-wrap gap-1'>
                            {product.features.slice(0, 3).map((feature, index) => (
                              <span
                                key={index}
                                className='px-2 py-1 bg-neutral-100 text-neutral-600 text-xs rounded-full'
                              >
                                {feature}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Price and Actions */}
                        <div className='flex flex-col md:flex-row md:items-center justify-between space-y-3 md:space-y-0'>
                          <div className='space-y-1'>
                            <div className='flex items-center space-x-2'>
                              <span className='text-xl font-bold text-primary-600'>
                                {formatPrice(product.price)}
                              </span>
                              {product.originalPrice && product.originalPrice > product.price && (
                                <span className='text-sm text-neutral-500 line-through'>
                                  {formatPrice(product.originalPrice)}
                                </span>
                              )}
                            </div>
                            <p className='text-sm text-neutral-600'>
                              {language === 'ar' ? 'المجموع:' : 'Subtotal:'}{' '}
                              {formatPrice(itemTotal)}
                            </p>
                          </div>

                          {/* Quantity Controls */}
                          <div className='flex items-center space-x-4'>
                            <div className='flex items-center border border-neutral-300 rounded-lg'>
                              <button
                                onClick={() =>
                                  handleQuantityUpdate(item.productId, (item as any)?.quantity - 1)
                                }
                                disabled={
                                  (item as any)?.quantity <= 1 || isUpdating === item.productId
                                }
                                className='p-2 hover:bg-neutral-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                              >
                                <MinusIcon className='w-4 h-4' />
                              </button>

                              <span className='px-4 py-2 border-x border-neutral-300 font-medium min-w-[3rem] text-center'>
                                {isUpdating === item.productId ? (
                                  <LoadingSpinner size='sm' />
                                ) : (
                                  (item as any)?.quantity
                                )}
                              </span>

                              <button
                                onClick={() =>
                                  handleQuantityUpdate(item.productId, (item as any)?.quantity + 1)
                                }
                                disabled={
                                  (item as any)?.quantity >= product.quantity ||
                                  isUpdating === item.productId
                                }
                                className='p-2 hover:bg-neutral-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                              >
                                <PlusIcon className='w-4 h-4' />
                              </button>
                            </div>

                            {/* Action Buttons */}
                            <div className='flex items-center space-x-2'>
                              <button
                                onClick={() => handleMoveToWishlist(item.productId)}
                                className='p-2 text-neutral-400 hover:text-red-500 transition-colors'
                                title={language === 'ar' ? 'نقل للمفضلة' : 'Move to wishlist'}
                              >
                                <HeartIcon className='w-5 h-5' />
                              </button>

                              <button
                                onClick={() => handleRemoveFromCart(item.productId)}
                                className='p-2 text-neutral-400 hover:text-red-500 transition-colors'
                                title={language === 'ar' ? 'حذف من السلة' : 'Remove from cart'}
                              >
                                <TrashIcon className='w-5 h-5' />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Order Summary */}
          <div className='space-y-6'>
            <div className='bg-white rounded-xl border border-neutral-200 p-6 shadow-sm sticky top-4'>
              <h3 className='text-xl font-semibold text-neutral-900 mb-6'>
                {language === 'ar' ? 'ملخص الطلب' : 'Order Summary'}
              </h3>

              <div className='space-y-4 mb-6'>
                <div className='flex justify-between text-neutral-600'>
                  <span>{language === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>

                <div className='flex justify-between text-neutral-600'>
                  <span className='flex items-center'>
                    <TruckIcon className='w-4 h-4 mr-1' />
                    {language === 'ar' ? 'الشحن' : 'Shipping'}
                  </span>
                  <span>
                    {shippingFee === 0 ? (
                      <span className='text-green-600 font-medium'>
                        {language === 'ar' ? 'مجاني' : 'Free'}
                      </span>
                    ) : (
                      formatPrice(shippingFee)
                    )}
                  </span>
                </div>

                {cartTotal < 1000 && (
                  <div className='text-sm text-neutral-500 bg-neutral-50 p-3 rounded-lg'>
                    {language === 'ar'
                      ? `أضف منتجات بقيمة ${formatPrice(1000 - cartTotal)} للحصول على شحن مجاني`
                      : `Add ${formatPrice(1000 - cartTotal)} more for free shipping`}
                  </div>
                )}

                <div className='border-t border-neutral-200 pt-4'>
                  <div className='flex justify-between text-lg font-semibold text-neutral-900'>
                    <span>{language === 'ar' ? 'المجموع الكلي' : 'Total'}</span>
                    <span className='text-primary-600'>{formatPrice(finalTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Checkout Button */}
              <motion.button
                className='w-full bg-primary-500 text-white py-4 px-6 rounded-lg font-semibold hover:bg-primary-600 transition-colors flex items-center justify-center'
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (!user) {
                    toast.error(
                      language === 'ar' ? 'يجب تسجيل الدخول أولاً' : 'Please login first'
                    );
                    //                     return;
                  }
                  toast(
                    language === 'ar' ? 'قريباً - نظام الدفع' : 'Coming Soon - Payment System',
                    { icon: 'ℹ️' }
                  );
                }}
              >
                <CreditCardIcon className='w-5 h-5 mr-2' />
                {language === 'ar' ? 'إتمام الشراء' : 'Proceed to Checkout'}
              </motion.button>

              {/* Trust Badges */}
              <div className='mt-6 pt-6 border-t border-neutral-200'>
                <div className='space-y-3 text-sm text-neutral-600'>
                  <div className='flex items-center'>
                    <ShieldCheckIcon className='w-4 h-4 mr-2 text-green-500' />
                    {language === 'ar' ? 'دفع آمن ومضمون' : 'Secure payment guaranteed'}
                  </div>
                  <div className='flex items-center'>
                    <TruckIcon className='w-4 h-4 mr-2 text-blue-500' />
                    {language === 'ar' ? 'توصيل سريع' : 'Fast delivery'}
                  </div>
                  <div className='flex items-center'>
                    <ShoppingCartIcon className='w-4 h-4 mr-2 text-purple-500' />
                    {language === 'ar' ? 'إرجاع مجاني خلال 30 يوم' : '30-day free returns'}
                  </div>
                </div>
              </div>
            </div>

            {/* Recommended Products */}
            <div className='bg-white rounded-xl border border-neutral-200 p-6 shadow-sm'>
              <h4 className='font-semibold text-neutral-900 mb-4'>
                {language === 'ar' ? 'منتجات مقترحة' : 'You might also like'}
              </h4>
              <div className='space-y-3'>
                {ProductService.getSampleProducts()
                  .slice(0, 2)
                  .map(product => (
                    <div
                      key={product.id}
                      className='flex items-center space-x-3 p-3 rounded-lg hover:bg-neutral-50 transition-colors'
                    >
                      <div className='w-12 h-12 rounded-lg overflow-hidden bg-neutral-100 flex-shrink-0'>
                        <img
                          src={product.images[0]?.url}
                          alt={product.title}
                          className='w-full h-full object-cover'
                        />
                      </div>
                      <div className='flex-1 min-w-0'>
                        <h5 className='font-medium text-neutral-900 text-sm line-clamp-1'>
                          {product.title}
                        </h5>
                        <p className='text-primary-600 font-semibold text-sm'>
                          {formatPrice(product.price)}
                        </p>
                      </div>
                      <button className='btn btn-sm btn-outline'>
                        {language === 'ar' ? 'إضافة' : 'Add'}
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
