import { sendEmail } from '@/utils/replitmail';
import { useAuthStore } from '@/stores/authStore';
import { realTimeService } from './realtime-websocket.service';
import { REALTIME_EVENTS } from '@/constants/realtime-events';

export interface CarListingData {
  make: string;
  model: string;
  year: number;
  mileage: number;
  transmission: 'automatic' | 'manual';
  fuelType: string;
  color: string;
  condition: 'excellent' | 'very-good' | 'good' | 'fair';
  askingPrice: number;
  description: string;
  features: string[];
  reasonForSelling?: string;
  sellerName: string;
  phoneNumber: string;
  whatsappNumber?: string;
  location: {
    governorate: string;
    city: string;
    area: string;
  };
  hasOwnershipPapers: boolean;
  hasServiceHistory: boolean;
  hasInsurance: boolean;
  negotiable: boolean;
  availableForInspection: boolean;
  urgentSale: boolean;
  agreeToTerms: boolean;
}

export interface CarListing {
  id: string;
  userId: string;
  listingData: CarListingData;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewComments?: string;
  images: string[];
  productId?: string; // Product ID after approval
}

class CarListingService {
  private listings: Map<string, CarListing> = new Map();
  private adminEmail = 'admin@soukel-syarat.com';

  // Submit car listing
  async submitListing(
    userId: string,
    listingData: CarListingData,
    images: File[]
  ): Promise<string> {
    const listingId = `listing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Handle image uploads (mock implementation)
    const imageUrls: string[] = [];
    if (images && images.length > 0) {
      for (const img of images) {
        // In a real implementation, upload to cloud storage
        const imgUrl = `uploads/car-listings/${listingId}/${img.name}`;
        imageUrls.push(imgUrl);
      }
    }

    const listing: CarListing = {
      id: listingId,
      userId,
      listingData,
      status: 'pending',
      submittedAt: new Date(),
      images: imageUrls,
    };

    this.listings.set(listingId, listing);

    // Emit real-time event for admin dashboard
    try {
      realTimeService.sendMessage(REALTIME_EVENTS.CAR_LISTING_CREATED, {
        listingId,
        carInfo: `${listingData.make} ${listingData.model} ${listingData.year}`,
        sellerName: listingData.sellerName,
        price: listingData.askingPrice,
        status: 'pending',
        submittedAt: listing.submittedAt,
      });
    } catch (error) {
      console.warn('Failed to emit real-time car listing event:', error);
    }

    // Send notification email to admin
    try {
      await sendEmail({
        to: this.adminEmail,
        subject: `🚗 طلب بيع سيارة مستعملة جديد - ${listingData.make} ${listingData.model}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 20px; text-align: center;">
              <h1>🚗 طلب بيع سيارة مستعملة جديد</h1>
              <h2>New Used Car Listing Request</h2>
            </div>
            
            <div style="padding: 20px; background-color: #f9f9f9;">
              <h3>بيانات السيارة - Car Details</h3>
              
              <div style="background: white; padding: 15px; margin: 10px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <p><strong>🚘 الماركة | Make:</strong> ${listingData.make}</p>
                <p><strong>🏷️ الموديل | Model:</strong> ${listingData.model}</p>
                <p><strong>📅 سنة الصنع | Year:</strong> ${listingData.year}</p>
                <p><strong>📏 الكيلومترات | Mileage:</strong> ${listingData.mileage.toLocaleString()} كم</p>
                <p><strong>⚙️ ناقل الحركة | Transmission:</strong> ${
                  listingData.transmission === 'automatic' ? 'أوتوماتيك' : 'عادي'
                }</p>
                <p><strong>⛽ نوع الوقود | Fuel Type:</strong> ${listingData.fuelType}</p>
                <p><strong>🎨 اللون | Color:</strong> ${listingData.color}</p>
                <p><strong>✨ الحالة | Condition:</strong> ${listingData.condition}</p>
                <p><strong>💰 السعر المطلوب | Price:</strong> ${listingData.askingPrice.toLocaleString()} جنيه مصري</p>
              </div>
              
              <div style="background: white; padding: 15px; margin: 10px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h4>👤 بيانات البائع | Seller Information</h4>
                <p><strong>📛 الاسم | Name:</strong> ${listingData.sellerName}</p>
                <p><strong>📱 الهاتف | Phone:</strong> ${listingData.phoneNumber}</p>
                ${listingData.whatsappNumber ? `<p><strong>💬 واتساب | WhatsApp:</strong> ${listingData.whatsappNumber}</p>` : ''}
                <p><strong>📍 المحافظة | Governorate:</strong> ${listingData.location.governorate}</p>
                <p><strong>🏙️ المدينة | City:</strong> ${listingData.location.city}</p>
                <p><strong>📌 المنطقة | Area:</strong> ${listingData.location.area}</p>
              </div>
              
              <div style="background: white; padding: 15px; margin: 10px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h4>📋 تفاصيل إضافية | Additional Details</h4>
                <p><strong>📝 الوصف | Description:</strong> ${listingData.description}</p>
                <p><strong>⭐ المميزات | Features:</strong> ${listingData.features.join(', ')}</p>
                ${listingData.reasonForSelling ? `<p><strong>🔄 سبب البيع | Reason:</strong> ${listingData.reasonForSelling}</p>` : ''}
                <p><strong>💬 قابل للتفاوض | Negotiable:</strong> ${listingData.negotiable ? 'نعم ✅' : 'لا ❌'}</p>
                <p><strong>🔍 متاح للمعاينة | Inspection:</strong> ${listingData.availableForInspection ? 'نعم ✅' : 'لا ❌'}</p>
                ${listingData.urgentSale ? '<p style="color: #ef4444;"><strong>⚡ بيع عاجل | Urgent Sale:</strong> نعم ✅</p>' : ''}
              </div>
              
              <div style="background: white; padding: 15px; margin: 10px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h4>📄 الأوراق | Documents</h4>
                <p><strong>📜 أوراق الملكية | Ownership Papers:</strong> ${listingData.hasOwnershipPapers ? 'متوفرة ✅' : 'غير متوفرة ❌'}</p>
                <p><strong>🔧 تاريخ الصيانة | Service History:</strong> ${listingData.hasServiceHistory ? 'متوفر ✅' : 'غير متوفر ❌'}</p>
                <p><strong>🛡️ التأمين | Insurance:</strong> ${listingData.hasInsurance ? 'ساري ✅' : 'غير ساري ❌'}</p>
                <p><strong>🖼️ عدد الصور | Images Count:</strong> ${imageUrls.length}</p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <p style="font-size: 16px; color: #666;">
                  يرجى مراجعة الطلب في لوحة تحكم الإدارة<br>
                  Please review this listing in the admin dashboard
                </p>
                <div style="margin: 20px 0;">
                  <p style="background: #f3f4f6; padding: 15px; border-radius: 8px;">
                    <strong>📋 رقم الطلب | Listing ID:</strong> ${listingId}<br>
                    <strong>📅 تاريخ الإرسال | Submitted:</strong> ${listing.submittedAt.toLocaleString('ar-EG')}
                  </p>
                </div>
              </div>
            </div>
            
            <div style="background: #333; color: white; padding: 15px; text-align: center;">
              <p style="margin: 0;">سوق السيارات - إدارة النظام | Souk El-Syarat - System Administration</p>
            </div>
          </div>
        `,
        text: `طلب بيع سيارة مستعملة: ${listingData.make} ${listingData.model} ${listingData.year} - السعر: ${listingData.askingPrice} جنيه - البائع: ${listingData.sellerName}`,
      });
    } catch (error) {
      console.warn('Failed to send admin notification:', error);
    }

    // Send confirmation email to seller
    try {
      const userEmail = useAuthStore.getState().user?.email;
      if (userEmail) {
        await sendEmail({
          to: userEmail,
          subject: '✅ تم استلام طلب بيع سيارتك بنجاح - سوق السيارات',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; text-align: center;">
                <h1>✅ شكراً لك على اختيار سوق السيارات</h1>
                <h2>Thank You for Choosing Souk El-Syarat</h2>
              </div>
              
              <div style="padding: 20px;">
                <p style="font-size: 16px;">عزيزي ${listingData.sellerName},</p>
                <p style="font-size: 16px;">تم استلام طلب بيع سيارتك بنجاح وسيتم مراجعته من قبل فريقنا.</p>
                
                <div style="background: #f3f4f6; padding: 20px; border-radius: 10px; margin: 20px 0;">
                  <h3 style="color: #f59e0b;">ملخص طلبك | Your Request Summary</h3>
                  <p><strong>السيارة | Car:</strong> ${listingData.make} ${listingData.model} ${listingData.year}</p>
                  <p><strong>السعر | Price:</strong> ${listingData.askingPrice.toLocaleString()} جنيه مصري</p>
                  <p><strong>رقم الطلب | Listing ID:</strong> ${listingId}</p>
                </div>
                
                <div style="background: #ecfdf5; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #10b981;">
                  <h3 style="color: #059669;">الخطوات التالية | Next Steps</h3>
                  <ul style="line-height: 1.8;">
                    <li>✓ سيتم مراجعة طلبك خلال 24-48 ساعة</li>
                    <li>✓ سنقوم بالتواصل معك لتأكيد البيانات</li>
                    <li>✓ بعد الموافقة، سيتم نشر إعلانك على الموقع</li>
                    <li>✓ سنرسل لك تحديثات عن استفسارات المشترين</li>
                  </ul>
                </div>
                
                <div style="text-align: center; margin: 30px 0; padding: 20px; background: #fef3c7; border-radius: 10px;">
                  <p style="margin: 0; font-size: 14px; color: #92400e;">
                    💡 <strong>نصيحة:</strong> تأكد من توفر أوراق الملكية وتجهيز السيارة للمعاينة لتسريع عملية البيع
                  </p>
                </div>
              </div>
              
              <div style="background: #333; color: white; padding: 15px; text-align: center;">
                <p style="margin: 0;">سوق السيارات | Souk El-Syarat</p>
                <p style="margin: 5px 0; font-size: 12px;">نساعدك في بيع سيارتك بأفضل سعر</p>
              </div>
            </div>
          `,
          text: `تم استلام طلب بيع سيارتك ${listingData.make} ${listingData.model} ${listingData.year} بنجاح. رقم الطلب: ${listingId}`,
        });
      }
    } catch (error) {
      console.warn('Failed to send seller confirmation:', error);
    }

    return listingId;
  }

  // Get all pending listings (for admin)
  async getPendingListings(): Promise<CarListing[]> {
    return Array.from(this.listings.values()).filter(
      (listing) => listing.status === 'pending'
    );
  }

  // Get listing by ID
  async getListingById(listingId: string): Promise<CarListing | undefined> {
    return this.listings.get(listingId);
  }

  // Get user's listings
  async getUserListings(userId: string): Promise<CarListing[]> {
    return Array.from(this.listings.values()).filter(
      (listing) => listing.userId === userId
    );
  }

  // Approve listing (admin only)
  async approveListing(
    listingId: string,
    adminId: string,
    comments?: string
  ): Promise<void> {
    const listing = this.listings.get(listingId);
    if (!listing) {
      throw new Error('Listing not found');
    }

    // Update listing status
    listing.status = 'approved';
    listing.reviewedAt = new Date();
    listing.reviewedBy = adminId;
    listing.reviewComments = comments;

    // Here we would create the actual product in the marketplace
    // For now, we'll just generate a product ID
    listing.productId = `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.listings.set(listingId, listing);

    // Emit real-time event for seller
    try {
      realTimeService.sendMessage(REALTIME_EVENTS.CAR_LISTING_APPROVED, {
        listingId,
        productId: listing.productId,
        carInfo: `${listing.listingData.make} ${listing.listingData.model} ${listing.listingData.year}`,
        approvedAt: listing.reviewedAt,
      });
    } catch (error) {
      console.warn('Failed to emit approval event:', error);
    }

    // Send approval email to seller
    try {
      const userEmail = useAuthStore.getState().user?.email;
      if (userEmail) {
        await sendEmail({
          to: userEmail,
          subject: `🎉 تمت الموافقة على إعلان سيارتك - ${listing.listingData.make} ${listing.listingData.model}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; text-align: center;">
                <h1>🎉 تهانينا! تمت الموافقة على إعلانك</h1>
                <h2>Congratulations! Your Listing is Approved</h2>
              </div>
              
              <div style="padding: 20px;">
                <p style="font-size: 16px;">عزيزي ${listing.listingData.sellerName},</p>
                <p style="font-size: 16px;">نود إعلامك بأنه تمت الموافقة على إعلان سيارتك وتم نشره في السوق!</p>
                
                <div style="background: #f3f4f6; padding: 20px; border-radius: 10px; margin: 20px 0;">
                  <h3 style="color: #f59e0b;">تفاصيل السيارة | Car Details</h3>
                  <p><strong>السيارة:</strong> ${listing.listingData.make} ${listing.listingData.model} ${listing.listingData.year}</p>
                  <p><strong>السعر:</strong> ${listing.listingData.askingPrice.toLocaleString()} جنيه مصري</p>
                  <p><strong>رقم الإعلان:</strong> ${listing.productId}</p>
                </div>
                
                ${comments ? `
                <div style="background: #eff6ff; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #3b82f6;">
                  <h4 style="color: #1e40af;">💬 ملاحظات الإدارة | Admin Notes</h4>
                  <p style="line-height: 1.6;">${comments}</p>
                </div>
                ` : ''}
                
                <div style="background: #ecfdf5; padding: 20px; border-radius: 10px; margin: 20px 0;">
                  <h3 style="color: #059669;">ما التالي؟ | What's Next?</h3>
                  <ul style="line-height: 1.8;">
                    <li>✅ إعلانك الآن مرئي لآلاف المشترين المحتملين</li>
                    <li>✅ سنرسل لك إشعارات عند استلام استفسارات</li>
                    <li>✅ يمكنك تعديل الإعلان أو السعر في أي وقت</li>
                    <li>✅ يمكنك متابعة عدد المشاهدات والمهتمين</li>
                  </ul>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="#" style="display: inline-block; background: #f59e0b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                    شاهد إعلانك الآن | View Your Listing
                  </a>
                </div>
              </div>
              
              <div style="background: #333; color: white; padding: 15px; text-align: center;">
                <p style="margin: 0;">سوق السيارات | Souk El-Syarat</p>
                <p style="margin: 5px 0; font-size: 12px;">نتمنى لك بيعاً موفقاً!</p>
              </div>
            </div>
          `,
          text: `تمت الموافقة على إعلان سيارتك ${listing.listingData.make} ${listing.listingData.model}. رقم الإعلان: ${listing.productId}`,
        });
      }
    } catch (error) {
      console.warn('Failed to send approval email:', error);
    }
  }

  // Reject listing (admin only)
  async rejectListing(
    listingId: string,
    adminId: string,
    reason: string
  ): Promise<void> {
    const listing = this.listings.get(listingId);
    if (!listing) {
      throw new Error('Listing not found');
    }

    // Update listing status
    listing.status = 'rejected';
    listing.reviewedAt = new Date();
    listing.reviewedBy = adminId;
    listing.reviewComments = reason;

    this.listings.set(listingId, listing);

    // Emit real-time event for seller
    try {
      realTimeService.sendMessage(REALTIME_EVENTS.CAR_LISTING_REJECTED, {
        listingId,
        carInfo: `${listing.listingData.make} ${listing.listingData.model} ${listing.listingData.year}`,
        reason,
        rejectedAt: listing.reviewedAt,
      });
    } catch (error) {
      console.warn('Failed to emit rejection event:', error);
    }

    // Send rejection email to seller
    try {
      const userEmail = useAuthStore.getState().user?.email;
      if (userEmail) {
        await sendEmail({
          to: userEmail,
          subject: `❌ تنبيه: طلب بيع سيارتك يحتاج مراجعة - ${listing.listingData.make} ${listing.listingData.model}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 20px; text-align: center;">
                <h1>❌ طلب بيع سيارتك يحتاج مراجعة</h1>
                <h2>Your Listing Needs Review</h2>
              </div>
              
              <div style="padding: 20px;">
                <p style="font-size: 16px;">عزيزي ${listing.listingData.sellerName},</p>
                <p style="font-size: 16px;">نأسف لإبلاغك بأن طلب بيع سيارتك لم يتم قبوله للأسباب التالية:</p>
                
                <div style="background: #fee2e2; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #ef4444;">
                  <h4 style="color: #991b1b;">سبب الرفض | Rejection Reason</h4>
                  <p style="line-height: 1.6; color: #7f1d1d;">${reason}</p>
                </div>
                
                <div style="background: #f3f4f6; padding: 20px; border-radius: 10px; margin: 20px 0;">
                  <h3 style="color: #f59e0b;">تفاصيل الطلب | Request Details</h3>
                  <p><strong>السيارة:</strong> ${listing.listingData.make} ${listing.listingData.model} ${listing.listingData.year}</p>
                  <p><strong>السعر:</strong> ${listing.listingData.askingPrice.toLocaleString()} جنيه مصري</p>
                  <p><strong>رقم الطلب:</strong> ${listingId}</p>
                </div>
                
                <div style="background: #fef3c7; padding: 20px; border-radius: 10px; margin: 20px 0;">
                  <h3 style="color: #92400e;">ماذا يمكنك فعله؟ | What Can You Do?</h3>
                  <ul style="line-height: 1.8;">
                    <li>✓ راجع سبب الرفض وقم بتصحيح المعلومات</li>
                    <li>✓ تأكد من جودة الصور ووضوحها</li>
                    <li>✓ تحقق من دقة المعلومات المقدمة</li>
                    <li>✓ قدم الطلب مرة أخرى بعد التعديل</li>
                  </ul>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="/sell-your-car" style="display: inline-block; background: #f59e0b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                    قدم طلب جديد | Submit New Request
                  </a>
                </div>
                
                <p style="text-align: center; color: #6b7280; font-size: 14px;">
                  إذا كان لديك أي استفسار، يرجى التواصل معنا
                </p>
              </div>
              
              <div style="background: #333; color: white; padding: 15px; text-align: center;">
                <p style="margin: 0;">سوق السيارات | Souk El-Syarat</p>
                <p style="margin: 5px 0; font-size: 12px;">فريق دعم العملاء</p>
              </div>
            </div>
          `,
          text: `طلب بيع سيارتك ${listing.listingData.make} ${listing.listingData.model} لم يتم قبوله. السبب: ${reason}`,
        });
      }
    } catch (error) {
      console.warn('Failed to send rejection email:', error);
    }
  }
}

export const carListingService = new CarListingService();
