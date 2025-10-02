#!/bin/bash

# Souk El-Sayarat - Appwrite Infrastructure Automation
# This script creates all databases, collections, storage buckets, and permissions

set -e  # Exit on any error

echo "🏗️  Souk El-Sayarat - Appwrite Infrastructure Setup"
echo "===================================================="
echo ""

# Load environment variables
if [ -f .env ]; then
    source .env
else
    echo "❌ .env file not found. Please run setup-appwrite-mcp.sh first"
    exit 1
fi

# Install Appwrite CLI if not present
if ! command -v appwrite &> /dev/null; then
    echo "📦 Installing Appwrite CLI..."
    npm install -g appwrite-cli
fi

echo "✅ Appwrite CLI is ready"
echo ""

# Login to Appwrite
echo "🔐 Authenticating with Appwrite..."
appwrite client --endpoint "$VITE_APPWRITE_ENDPOINT" --project "$VITE_APPWRITE_PROJECT_ID" --key "$APPWRITE_API_KEY" || {
    echo "⚠️  Manual login required"
    appwrite login
}

echo "✅ Authenticated successfully"
echo ""

# Create Database
echo "🗄️  Creating main database..."
DATABASE_ID=$(appwrite databases create \
    --databaseId "souk_main_db" \
    --name "Souk Main Database" \
    --format json | jq -r '.$id' 2>/dev/null || echo "souk_main_db")

echo "✅ Database created: $DATABASE_ID"
echo "VITE_APPWRITE_DATABASE_ID=$DATABASE_ID" >> .env
echo ""

# Create Users Collection
echo "👥 Creating users collection..."
USERS_COLLECTION_ID=$(appwrite databases createCollection \
    --databaseId "$DATABASE_ID" \
    --collectionId "users" \
    --name "Users" \
    --permissions "read(\"any\")" "create(\"users\")" "update(\"users\")" "delete(\"users\")" \
    --format json | jq -r '.$id' 2>/dev/null || echo "users")

echo "✅ Users collection created"

# Add attributes to users collection
echo "  Adding attributes..."
appwrite databases createStringAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "$USERS_COLLECTION_ID" \
    --key "email" \
    --size 255 \
    --required true || true

appwrite databases createStringAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "$USERS_COLLECTION_ID" \
    --key "displayName" \
    --size 255 \
    --required true || true

appwrite databases createStringAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "$USERS_COLLECTION_ID" \
    --key "phoneNumber" \
    --size 20 \
    --required false || true

appwrite databases createStringAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "$USERS_COLLECTION_ID" \
    --key "photoURL" \
    --size 500 \
    --required false || true

appwrite databases createEnumAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "$USERS_COLLECTION_ID" \
    --key "role" \
    --elements "customer" "vendor" "admin" \
    --required true \
    --default "customer" || true

appwrite databases createBooleanAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "$USERS_COLLECTION_ID" \
    --key "isActive" \
    --required true \
    --default true || true

appwrite databases createStringAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "$USERS_COLLECTION_ID" \
    --key "preferences" \
    --size 10000 \
    --required false || true

appwrite databases createDatetimeAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "$USERS_COLLECTION_ID" \
    --key "createdAt" \
    --required true || true

appwrite databases createDatetimeAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "$USERS_COLLECTION_ID" \
    --key "updatedAt" \
    --required true || true

echo "  ✅ Users attributes created"
echo "VITE_APPWRITE_USERS_COLLECTION_ID=$USERS_COLLECTION_ID" >> .env
echo ""

# Create Products Collection
echo "📦 Creating products collection..."
PRODUCTS_COLLECTION_ID=$(appwrite databases createCollection \
    --databaseId "$DATABASE_ID" \
    --collectionId "products" \
    --name "Products" \
    --permissions "read(\"any\")" "create(\"users\")" "update(\"users\")" "delete(\"users\")" \
    --format json | jq -r '.$id' 2>/dev/null || echo "products")

echo "✅ Products collection created"

# Add attributes to products collection
echo "  Adding attributes..."
appwrite databases createStringAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "$PRODUCTS_COLLECTION_ID" \
    --key "vendorId" \
    --size 255 \
    --required true || true

appwrite databases createStringAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "$PRODUCTS_COLLECTION_ID" \
    --key "name" \
    --size 255 \
    --required true || true

appwrite databases createStringAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "$PRODUCTS_COLLECTION_ID" \
    --key "nameAr" \
    --size 255 \
    --required true || true

appwrite databases createStringAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "$PRODUCTS_COLLECTION_ID" \
    --key "description" \
    --size 5000 \
    --required false || true

appwrite databases createStringAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "$PRODUCTS_COLLECTION_ID" \
    --key "descriptionAr" \
    --size 5000 \
    --required false || true

appwrite databases createFloatAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "$PRODUCTS_COLLECTION_ID" \
    --key "price" \
    --required true || true

appwrite databases createStringAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "$PRODUCTS_COLLECTION_ID" \
    --key "category" \
    --size 100 \
    --required true || true

appwrite databases createStringAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "$PRODUCTS_COLLECTION_ID" \
    --key "subcategory" \
    --size 100 \
    --required false || true

appwrite databases createStringAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "$PRODUCTS_COLLECTION_ID" \
    --key "images" \
    --size 10000 \
    --array true \
    --required false || true

appwrite databases createIntegerAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "$PRODUCTS_COLLECTION_ID" \
    --key "stock" \
    --required true \
    --default 0 || true

appwrite databases createEnumAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "$PRODUCTS_COLLECTION_ID" \
    --key "status" \
    --elements "pending_approval" "active" "inactive" \
    --required true \
    --default "pending_approval" || true

appwrite databases createStringAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "$PRODUCTS_COLLECTION_ID" \
    --key "specifications" \
    --size 10000 \
    --required false || true

appwrite databases createDatetimeAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "$PRODUCTS_COLLECTION_ID" \
    --key "createdAt" \
    --required true || true

appwrite databases createDatetimeAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "$PRODUCTS_COLLECTION_ID" \
    --key "updatedAt" \
    --required true || true

echo "  ✅ Products attributes created"
echo "VITE_APPWRITE_PRODUCTS_COLLECTION_ID=$PRODUCTS_COLLECTION_ID" >> .env
echo ""

# Create Orders Collection
echo "🛒 Creating orders collection..."
ORDERS_COLLECTION_ID=$(appwrite databases createCollection \
    --databaseId "$DATABASE_ID" \
    --collectionId "orders" \
    --name "Orders" \
    --permissions "read(\"users\")" "create(\"users\")" "update(\"users\")" \
    --format json | jq -r '.$id' 2>/dev/null || echo "orders")

echo "✅ Orders collection created"

# Add attributes to orders collection
echo "  Adding attributes..."
appwrite databases createStringAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "$ORDERS_COLLECTION_ID" \
    --key "customerId" \
    --size 255 \
    --required true || true

appwrite databases createEnumAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "$ORDERS_COLLECTION_ID" \
    --key "status" \
    --elements "pending" "processing" "shipped" "delivered" "cancelled" \
    --required true \
    --default "pending" || true

appwrite databases createFloatAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "$ORDERS_COLLECTION_ID" \
    --key "totalAmount" \
    --required true || true

appwrite databases createEnumAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "$ORDERS_COLLECTION_ID" \
    --key "paymentMethod" \
    --elements "cod" "card" "wallet" \
    --required true \
    --default "cod" || true

appwrite databases createStringAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "$ORDERS_COLLECTION_ID" \
    --key "shippingAddress" \
    --size 5000 \
    --required true || true

appwrite databases createStringAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "$ORDERS_COLLECTION_ID" \
    --key "items" \
    --size 50000 \
    --required true || true

appwrite databases createDatetimeAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "$ORDERS_COLLECTION_ID" \
    --key "createdAt" \
    --required true || true

appwrite databases createDatetimeAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "$ORDERS_COLLECTION_ID" \
    --key "updatedAt" \
    --required true || true

echo "  ✅ Orders attributes created"
echo "VITE_APPWRITE_ORDERS_COLLECTION_ID=$ORDERS_COLLECTION_ID" >> .env
echo ""

# Create Vendor Applications Collection
echo "📝 Creating vendor applications collection..."
VENDOR_APPS_COLLECTION_ID=$(appwrite databases createCollection \
    --databaseId "$DATABASE_ID" \
    --collectionId "vendorApplications" \
    --name "Vendor Applications" \
    --permissions "read(\"users\")" "create(\"users\")" "update(\"users\")" \
    --format json | jq -r '.$id' 2>/dev/null || echo "vendorApplications")

echo "✅ Vendor applications collection created"

# Add attributes to vendor applications collection
echo "  Adding attributes..."
appwrite databases createStringAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "$VENDOR_APPS_COLLECTION_ID" \
    --key "userId" \
    --size 255 \
    --required true || true

appwrite databases createStringAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "$VENDOR_APPS_COLLECTION_ID" \
    --key "businessName" \
    --size 255 \
    --required true || true

appwrite databases createStringAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "$VENDOR_APPS_COLLECTION_ID" \
    --key "businessNameAr" \
    --size 255 \
    --required true || true

appwrite databases createStringAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "$VENDOR_APPS_COLLECTION_ID" \
    --key "businessLicense" \
    --size 255 \
    --required false || true

appwrite databases createStringAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "$VENDOR_APPS_COLLECTION_ID" \
    --key "taxId" \
    --size 100 \
    --required false || true

appwrite databases createStringAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "$VENDOR_APPS_COLLECTION_ID" \
    --key "phoneNumber" \
    --size 20 \
    --required true || true

appwrite databases createStringAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "$VENDOR_APPS_COLLECTION_ID" \
    --key "address" \
    --size 5000 \
    --required false || true

appwrite databases createStringAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "$VENDOR_APPS_COLLECTION_ID" \
    --key "documents" \
    --size 10000 \
    --array true \
    --required false || true

appwrite databases createEnumAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "$VENDOR_APPS_COLLECTION_ID" \
    --key "status" \
    --elements "pending" "approved" "rejected" \
    --required true \
    --default "pending" || true

appwrite databases createStringAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "$VENDOR_APPS_COLLECTION_ID" \
    --key "reviewedBy" \
    --size 255 \
    --required false || true

appwrite databases createStringAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "$VENDOR_APPS_COLLECTION_ID" \
    --key "reviewNotes" \
    --size 5000 \
    --required false || true

appwrite databases createDatetimeAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "$VENDOR_APPS_COLLECTION_ID" \
    --key "createdAt" \
    --required true || true

appwrite databases createDatetimeAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "$VENDOR_APPS_COLLECTION_ID" \
    --key "updatedAt" \
    --required true || true

echo "  ✅ Vendor applications attributes created"
echo "VITE_APPWRITE_VENDOR_APPLICATIONS_COLLECTION_ID=$VENDOR_APPS_COLLECTION_ID" >> .env
echo ""

# Create Car Listings Collection (C2C)
echo "🚗 Creating car listings collection..."
CAR_LISTINGS_COLLECTION_ID=$(appwrite databases createCollection \
    --databaseId "$DATABASE_ID" \
    --collectionId "carListings" \
    --name "Car Listings" \
    --permissions "read(\"any\")" "create(\"users\")" "update(\"users\")" "delete(\"users\")" \
    --format json | jq -r '.$id' 2>/dev/null || echo "carListings")

echo "✅ Car listings collection created"
echo "VITE_APPWRITE_CAR_LISTINGS_COLLECTION_ID=$CAR_LISTINGS_COLLECTION_ID" >> .env
echo ""

# Create Storage Buckets
echo "🗂️  Creating storage buckets..."

# Product Images Bucket
PRODUCT_IMAGES_BUCKET_ID=$(appwrite storage createBucket \
    --bucketId "product_images" \
    --name "Product Images" \
    --permissions "read(\"any\")" "create(\"users\")" "update(\"users\")" "delete(\"users\")" \
    --fileSecurity true \
    --enabled true \
    --maximumFileSize 10485760 \
    --allowedFileExtensions "jpg" "jpeg" "png" "webp" \
    --format json | jq -r '.$id' 2>/dev/null || echo "product_images")

echo "✅ Product images bucket created"
echo "VITE_APPWRITE_PRODUCT_IMAGES_BUCKET_ID=$PRODUCT_IMAGES_BUCKET_ID" >> .env

# Vendor Documents Bucket
VENDOR_DOCS_BUCKET_ID=$(appwrite storage createBucket \
    --bucketId "vendor_documents" \
    --name "Vendor Documents" \
    --permissions "read(\"users\")" "create(\"users\")" "update(\"users\")" "delete(\"users\")" \
    --fileSecurity true \
    --enabled true \
    --maximumFileSize 20971520 \
    --allowedFileExtensions "pdf" "jpg" "jpeg" "png" \
    --format json | jq -r '.$id' 2>/dev/null || echo "vendor_documents")

echo "✅ Vendor documents bucket created"
echo "VITE_APPWRITE_VENDOR_DOCUMENTS_BUCKET_ID=$VENDOR_DOCS_BUCKET_ID" >> .env

# Car Listing Images Bucket
CAR_IMAGES_BUCKET_ID=$(appwrite storage createBucket \
    --bucketId "car_listing_images" \
    --name "Car Listing Images" \
    --permissions "read(\"any\")" "create(\"users\")" "update(\"users\")" "delete(\"users\")" \
    --fileSecurity true \
    --enabled true \
    --maximumFileSize 10485760 \
    --allowedFileExtensions "jpg" "jpeg" "png" "webp" \
    --format json | jq -r '.$id' 2>/dev/null || echo "car_listing_images")

echo "✅ Car listing images bucket created"
echo "VITE_APPWRITE_CAR_LISTING_IMAGES_BUCKET_ID=$CAR_IMAGES_BUCKET_ID" >> .env
echo ""

echo "✨ Appwrite infrastructure setup complete!"
echo ""
echo "📋 Summary:"
echo "  - Database: $DATABASE_ID"
echo "  - Collections: 5 (users, products, orders, vendorApplications, carListings)"
echo "  - Storage Buckets: 3 (product_images, vendor_documents, car_listing_images)"
echo ""
echo "📝 All IDs have been saved to .env file"
echo ""
echo "🚀 Next steps:"
echo "  1. Review the .env file"
echo "  2. Run: npm run migrate:to-appwrite"
echo ""
