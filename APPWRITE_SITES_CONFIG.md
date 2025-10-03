# Appwrite Sites Deployment Configuration

## Repository Information
- **Repository**: AmrNabih-hub/Souk-El-Sayarat  
- **Branch**: production

## Site Configuration

### Basic Settings
- **Name**: Souk-El-Sayarat
- **Site ID**: souk-al-sayarat
- **Framework**: React/Vite
- **Branch**: production  
- **Root Directory**: ./

### Build Settings
- **Install Command**: `npm install`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### Environment Variables
Copy from `.env.production`:

```
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=68de87060019a1ca2b8b
VITE_APPWRITE_DATABASE_ID=souk_main_db
VITE_APPWRITE_USERS_COLLECTION_ID=users
VITE_APPWRITE_PRODUCTS_COLLECTION_ID=products
VITE_APPWRITE_ORDERS_COLLECTION_ID=orders
VITE_APPWRITE_VENDOR_APPLICATIONS_COLLECTION_ID=vendorApplications
VITE_APPWRITE_CAR_LISTINGS_COLLECTION_ID=carListings
VITE_APPWRITE_PRODUCT_IMAGES_BUCKET_ID=product_images
VITE_APPWRITE_VENDOR_DOCUMENTS_BUCKET_ID=vendor_documents
VITE_APPWRITE_CAR_LISTING_IMAGES_BUCKET_ID=car_listing_images
VITE_APP_ENV=production
VITE_APP_NAME="Souk El-Sayarat"
VITE_APP_VERSION=1.0.0
VITE_ENABLE_PWA=true
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_REALTIME=true
```

### Deployment URLs
- **Production**: https://souk-al-sayarat.appwrite.network

### Node.js Version
- **Node**: 20.17.0+
- **NPM**: 10.0.0+

## Build Output Summary
- **Total Bundle Size**: ~1.2MB optimized
- **Main Bundle**: 214KB (gzipped: 66.73KB)
- **CSS Bundle**: 101KB (gzipped: 14.86KB)
- **PWA Enabled**: ✅ Service Worker + Manifest
- **Build Time**: ~42 seconds

## Files Ready for Upload
If using drag & drop upload, upload the entire `dist/` folder contents.

## Post-Deployment Checklist
1. ✅ Verify site loads correctly
2. ✅ Test authentication (login/signup)
3. ✅ Check environment variables are applied
4. ✅ Test core marketplace features
5. ✅ Verify PWA functionality
6. ✅ Test responsive design on mobile

## Support Information
- **Console**: https://cloud.appwrite.io/console/project-68de87060019a1ca2b8b
- **Sites**: https://cloud.appwrite.io/console/project-68de87060019a1ca2b8b/sites
- **Last Updated**: October 3, 2025
- **Status**: Production Ready ✅