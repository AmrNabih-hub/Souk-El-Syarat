import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  PhoneIcon,
  UserIcon,
  StarIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { useAppStore } from '@/stores/appStore';
import { useAuthStore } from '@/stores/authStore';
import RealDataService, { CarService } from '@/services/real-data.service';
import OrderTrackingService from '@/services/order-tracking.service';
import toast from 'react-hot-toast';

interface TimeSlot {
  time: string;
  available: boolean;
  booked?: boolean;
}

interface BookingData {
  serviceId: string;
  date: string;
  time: string;
  customerInfo: {
    fullName: string;
    phone: string;
    email: string;
    carInfo?: string;
    notes: string;
  };
}

const BookingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const serviceId = searchParams.get('service');
  const [service, setService] = useState<CarService | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const [customerInfo, setCustomerInfo] = useState({
    fullName: user?.displayName || '',
    phone: '',
    email: user?.email || '',
    carInfo: '',
    notes: ''
  });

  // Generate available dates (next 14 days, excluding weekends if needed)
  const generateAvailableDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Skip Fridays (5) for some services
      if (service?.category === 'wash' && date.getDay() === 5) {
        continue;
      }
      
      dates.push({
        date: date.toISOString().split('T')[0],
        displayDate: date.toLocaleDateString('ar-EG', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        dayName: date.toLocaleDateString('ar-EG', { weekday: 'long' })
      });
    }
    
    return dates;
  };

  // Generate time slots based on service availability
  const generateTimeSlots = (): TimeSlot[] => {
    if (!service || !selectedDate) return [];

    const baseSlots = service.bookingSlots || ['09:00', '11:00', '14:00', '16:00'];
    const existingBookings = getExistingBookings(serviceId!, selectedDate);

    return baseSlots.map(time => ({
      time,
      available: service.availability === 'available',
      booked: existingBookings.includes(time)
    }));
  };

  // Get existing bookings from localStorage (in real app, from backend)
  const getExistingBookings = (serviceId: string, date: string): string[] => {
    const bookings = JSON.parse(localStorage.getItem('serviceBookings') || '[]');
    return bookings
      .filter((b: BookingData) => b.serviceId === serviceId && b.date === date)
      .map((b: BookingData) => b.time);
  };

  // Load service data
  useEffect(() => {
    if (!serviceId) {
      toast.error('بيانات غير صحيحة');
      navigate('/marketplace');
      return;
    }

    const services = RealDataService.getCarServices();
    const foundService = services.find(s => s.id === serviceId);
    
    if (foundService) {
      setService(foundService);
    } else {
      toast.error('الخدمة غير موجودة');
      navigate('/marketplace');
    }
  }, [serviceId, navigate]);

  const handleBooking = async () => {
    if (!service || !user) return;

    // Validation
    if (!selectedDate || !selectedTime) {
      toast.error('يرجى اختيار التاريخ والوقت');
      return;
    }

    if (!customerInfo.fullName || !customerInfo.phone) {
      toast.error('يرجى ملء جميع البيانات المطلوبة');
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      const bookingId = `BK-${Date.now()}`;
      const appointmentDate = new Date(selectedDate + 'T' + selectedTime);

      // Create booking data for localStorage (backward compatibility)
      const bookingData: BookingData = {
        serviceId: service.id,
        date: selectedDate,
        time: selectedTime,
        customerInfo
      };

      // Save booking to localStorage
      const existingBookings = JSON.parse(localStorage.getItem('serviceBookings') || '[]');
      existingBookings.push({
        ...bookingData,
        bookingId,
        status: 'confirmed',
        createdAt: new Date().toISOString()
      });
      localStorage.setItem('serviceBookings', JSON.stringify(existingBookings));

      // Create booking tracking with real-time updates
      const trackingService = OrderTrackingService.getInstance();
      await trackingService.createBookingTracking({
        bookingId,
        userId: user.id,
        serviceId: service.id,
        serviceName: service.nameAr,
        providerId: service.provider.id || 'provider-1',
        providerName: service.provider.nameAr,
        currentStatus: 'confirmed',
        statusHistory: [
          {
            status: 'confirmed',
            timestamp: new Date(),
            notes: 'تم تأكيد الحجز'
          }
        ],
        appointmentDate,
        appointmentTime: selectedTime,
        duration: service.durationAr,
        location: service.provider.location,
        customerNotes: customerInfo.notes
      });

      // Schedule reminder notification
      await trackingService.scheduleBookingReminder(bookingId, appointmentDate);

      toast.success('تم تأكيد الحجز بنجاح!');
      
      // Redirect to booking confirmation
      navigate(`/booking-success?bookingId=${bookingId}`);

    } catch (error) {
      toast.error('حدث خطأ في معالجة الحجز');
      console.error('Booking error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getServiceIcon = (category: string) => {
    switch (category) {
      case 'wash': return '🧽';
      case 'maintenance': return '🔧';
      case 'protection': return '🛡️';
      case 'repair': return '⚙️';
      case 'inspection': return '🔍';
      case 'modification': return '⚡';
      default: return '🔧';
    }
  };

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const availableDates = generateAvailableDates();
  const timeSlots = generateTimeSlots();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">حجز خدمة</h1>
          <p className="text-gray-600">اختر الموعد المناسب واحجز خدمتك بسهولة</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Booking Form */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Service Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <div className="flex items-start gap-4">
                <img
                  src={service.image}
                  alt={service.nameAr}
                  className="w-20 h-20 object-cover rounded-xl"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{getServiceIcon(service.category)}</span>
                    <h2 className="text-xl font-bold text-gray-900">{service.nameAr}</h2>
                  </div>
                  <p className="text-gray-600 mb-3">{service.descriptionAr}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <ClockIcon className="w-4 h-4" />
                      <span>{service.durationAr}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPinIcon className="w-4 h-4" />
                      <span>{service.provider.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <StarIcon className="w-4 h-4 fill-current text-yellow-500" />
                      <span>{service.provider.rating}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-primary-600">
                        {RealDataService.formatEGP(service.price)}
                      </span>
                      {service.originalPrice && (
                        <span className="text-sm text-gray-500 line-through">
                          {RealDataService.formatEGP(service.originalPrice)}
                        </span>
                      )}
                    </div>
                    
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      service.availability === 'available' ? 'bg-green-100 text-green-800' :
                      service.availability === 'busy' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {service.availability === 'available' ? 'متاح' :
                       service.availability === 'busy' ? 'مشغول' : 'غير متاح'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Date Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                اختر التاريخ
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availableDates.map((dateOption) => (
                  <motion.button
                    key={dateOption.date}
                    onClick={() => {
                      setSelectedDate(dateOption.date);
                      setSelectedTime(''); // Reset time selection
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-4 rounded-lg border-2 text-center transition-all ${
                      selectedDate === dateOption.date
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-semibold text-gray-900">{dateOption.dayName}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(dateOption.date).toLocaleDateString('ar-EG', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Time Selection */}
            {selectedDate && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl shadow-lg p-6"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <ClockIcon className="w-5 h-5" />
                  اختر الوقت
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {timeSlots.map((slot) => (
                    <motion.button
                      key={slot.time}
                      onClick={() => setSelectedTime(slot.time)}
                      disabled={!slot.available || slot.booked}
                      whileHover={slot.available && !slot.booked ? { scale: 1.02 } : {}}
                      whileTap={slot.available && !slot.booked ? { scale: 0.98 } : {}}
                      className={`p-3 rounded-lg border-2 text-center transition-all ${
                        selectedTime === slot.time
                          ? 'border-primary-500 bg-primary-50'
                          : slot.available && !slot.booked
                          ? 'border-gray-200 hover:border-gray-300'
                          : 'border-gray-200 bg-gray-100 cursor-not-allowed'
                      }`}
                    >
                      <p className={`font-semibold ${
                        slot.available && !slot.booked ? 'text-gray-900' : 'text-gray-400'
                      }`}>
                        {slot.time}
                      </p>
                      {slot.booked && (
                        <p className="text-xs text-red-600 mt-1">محجوز</p>
                      )}
                      {!slot.available && (
                        <p className="text-xs text-gray-500 mt-1">غير متاح</p>
                      )}
                    </motion.button>
                  ))}
                </div>

                {service.availability === 'busy' && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <InformationCircleIcon className="w-5 h-5" />
                      <p className="text-sm">
                        الخدمة مشغولة حالياً. المواعيد المتاحة محدودة.
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Customer Information */}
            {selectedDate && selectedTime && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl shadow-lg p-6"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <UserIcon className="w-5 h-5" />
                  معلومات العميل
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الاسم الكامل *
                    </label>
                    <input
                      type="text"
                      value={customerInfo.fullName}
                      onChange={(e) => setCustomerInfo(prev => ({...prev, fullName: e.target.value}))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="أدخل الاسم الكامل"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      رقم الهاتف *
                    </label>
                    <input
                      type="tel"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo(prev => ({...prev, phone: e.target.value}))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="01xxxxxxxxx"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      البريد الإلكتروني
                    </label>
                    <input
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo(prev => ({...prev, email: e.target.value}))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="example@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      معلومات السيارة
                    </label>
                    <input
                      type="text"
                      value={customerInfo.carInfo}
                      onChange={(e) => setCustomerInfo(prev => ({...prev, carInfo: e.target.value}))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="مثال: تويوتا كامري 2020"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ملاحظات إضافية
                    </label>
                    <textarea
                      value={customerInfo.notes}
                      onChange={(e) => setCustomerInfo(prev => ({...prev, notes: e.target.value}))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      rows={3}
                      placeholder="أي ملاحظات أو طلبات خاصة..."
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl shadow-lg p-6 sticky top-8"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4">ملخص الحجز</h3>
              
              {/* Service Summary */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">الخدمة:</span>
                  <span className="font-medium">{service.nameAr}</span>
                </div>
                
                {selectedDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">التاريخ:</span>
                    <span className="font-medium">
                      {new Date(selectedDate).toLocaleDateString('ar-EG')}
                    </span>
                  </div>
                )}
                
                {selectedTime && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">الوقت:</span>
                    <span className="font-medium">{selectedTime}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-600">المدة:</span>
                  <span className="font-medium">{service.durationAr}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">الموقع:</span>
                  <span className="font-medium">{service.provider.location}</span>
                </div>
              </div>

              {/* Provider Info */}
              <div className="border-t border-gray-200 pt-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">مقدم الخدمة</h4>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{service.provider.nameAr}</span>
                  <div className="flex items-center gap-1">
                    <StarIcon className="w-4 h-4 fill-current text-yellow-500" />
                    <span className="text-sm font-medium">{service.provider.rating}</span>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="border-t border-gray-200 pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">المجموع:</span>
                  <span className="text-2xl font-bold text-primary-600">
                    {RealDataService.formatEGP(service.price)}
                  </span>
                </div>
                {service.discount && (
                  <p className="text-sm text-green-600 mt-1">
                    وفر {service.discount}% من السعر الأصلي
                  </p>
                )}
              </div>

              {/* Booking Button */}
              <motion.button
                onClick={handleBooking}
                disabled={!selectedDate || !selectedTime || isProcessing || service.availability === 'unavailable'}
                whileHover={selectedDate && selectedTime && !isProcessing ? { scale: 1.02 } : {}}
                whileTap={selectedDate && selectedTime && !isProcessing ? { scale: 0.98 } : {}}
                className={`w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                  selectedDate && selectedTime && !isProcessing && service.availability !== 'unavailable'
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    جاري المعالجة...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-5 h-5" />
                    تأكيد الحجز
                  </>
                )}
              </motion.button>

              {(!selectedDate || !selectedTime) && (
                <p className="text-xs text-gray-500 text-center mt-2">
                  يرجى اختيار التاريخ والوقت المناسب
                </p>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;