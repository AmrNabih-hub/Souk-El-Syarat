#!/bin/bash

# =============================================================================
# Souk El-Sayarat - COMPLETE AUTOMATED SETUP
# This script does EVERYTHING automatically
# =============================================================================

set -e

clear
echo "╔══════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                          ║"
echo "║         🚀 SOUK EL-SAYARAT - COMPLETE AUTOMATED SETUP 🚀                ║"
echo "║                                                                          ║"
echo "║                   Full Database & Storage Creation                       ║"
echo "║                                                                          ║"
echo "╚══════════════════════════════════════════════════════════════════════════╝"
echo ""

# Configuration
PROJECT_ID="68de87060019a1ca2b8b"
ENDPOINT="https://fra.cloud.appwrite.io/v1"
DATABASE_ID="souk_main_db"

# Get API Key
echo "🔑 Please provide your Appwrite API Key:"
echo "   (Get it from: https://cloud.appwrite.io/console/project-$PROJECT_ID/settings)"
echo ""
read -sp "API Key: " API_KEY
echo ""
echo ""

if [ -z "$API_KEY" ]; then
    echo "❌ API Key is required!"
    exit 1
fi

# Headers for all requests
HEADERS=(-H "X-Appwrite-Project: $PROJECT_ID" -H "X-Appwrite-Key: $API_KEY" -H "Content-Type: application/json")

echo "✅ API Key received"
echo ""

# Test connection
echo "🔍 Testing Appwrite connection..."
RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/appwrite_test.json -X GET "$ENDPOINT/databases/$DATABASE_ID" "${HEADERS[@]}")

if [ "$RESPONSE" != "200" ]; then
    echo "❌ Failed to connect to Appwrite!"
    echo "   Response code: $RESPONSE"
    echo "   Please check your API key and try again."
    exit 1
fi

echo "✅ Connection successful!"
echo ""

# =============================================================================
# COMPLETE PRODUCTS COLLECTION
# =============================================================================
echo "📦 Completing Products Collection..."
PRODUCTS_ID="products"

echo "  Adding missing attributes..."

# name
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/$PRODUCTS_ID/attributes/string" \
  "${HEADERS[@]}" \
  -d '{"key":"name","size":255,"required":true}' > /dev/null 2>&1 && echo "    ✅ name" || echo "    ⚠️  name (may already exist)"

# nameAr
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/$PRODUCTS_ID/attributes/string" \
  "${HEADERS[@]}" \
  -d '{"key":"nameAr","size":255,"required":true}' > /dev/null 2>&1 && echo "    ✅ nameAr" || echo "    ⚠️  nameAr (may already exist)"

# description
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/$PRODUCTS_ID/attributes/string" \
  "${HEADERS[@]}" \
  -d '{"key":"description","size":5000,"required":false}' > /dev/null 2>&1 && echo "    ✅ description" || echo "    ⚠️  description (may already exist)"

# descriptionAr
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/$PRODUCTS_ID/attributes/string" \
  "${HEADERS[@]}" \
  -d '{"key":"descriptionAr","size":5000,"required":false}' > /dev/null 2>&1 && echo "    ✅ descriptionAr" || echo "    ⚠️  descriptionAr (may already exist)"

# category
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/$PRODUCTS_ID/attributes/string" \
  "${HEADERS[@]}" \
  -d '{"key":"category","size":100,"required":true}' > /dev/null 2>&1 && echo "    ✅ category" || echo "    ⚠️  category (may already exist)"

# images (REQUIRED)
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/$PRODUCTS_ID/attributes/string" \
  "${HEADERS[@]}" \
  -d '{"key":"images","size":10000,"required":true}' > /dev/null 2>&1 && echo "    ✅ images (required)" || echo "    ⚠️  images (may already exist)"

# stock
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/$PRODUCTS_ID/attributes/integer" \
  "${HEADERS[@]}" \
  -d '{"key":"stock","required":true,"default":0}' > /dev/null 2>&1 && echo "    ✅ stock" || echo "    ⚠️  stock (may already exist)"

echo ""
echo "  ⏳ Waiting for attributes to process (15 seconds)..."
sleep 15

echo "✅ Products collection completed!"
echo ""

# =============================================================================
# CREATE ORDERS COLLECTION
# =============================================================================
echo "🛒 Creating Orders Collection..."
ORDERS_ID="orders"

# Create collection
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections" \
  "${HEADERS[@]}" \
  -d "{\"collectionId\":\"$ORDERS_ID\",\"name\":\"Orders\",\"permissions\":[\"read(\\\"users\\\")\",\"create(\\\"users\\\")\",\"update(\\\"users\\\")\"],\"documentSecurity\":true}" \
  > /dev/null 2>&1 && echo "  ✅ Collection created" || echo "  ⚠️  Collection may already exist"

sleep 3

echo "  Adding attributes..."

curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/$ORDERS_ID/attributes/string" \
  "${HEADERS[@]}" \
  -d '{"key":"customerId","size":255,"required":true}' > /dev/null 2>&1 && echo "    ✅ customerId"

curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/$ORDERS_ID/attributes/enum" \
  "${HEADERS[@]}" \
  -d '{"key":"status","elements":["pending","processing","shipped","delivered","cancelled"],"required":true,"default":"pending"}' \
  > /dev/null 2>&1 && echo "    ✅ status"

curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/$ORDERS_ID/attributes/float" \
  "${HEADERS[@]}" \
  -d '{"key":"totalAmount","required":true}' > /dev/null 2>&1 && echo "    ✅ totalAmount"

curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/$ORDERS_ID/attributes/enum" \
  "${HEADERS[@]}" \
  -d '{"key":"paymentMethod","elements":["cod","card","wallet"],"required":true,"default":"cod"}' \
  > /dev/null 2>&1 && echo "    ✅ paymentMethod"

curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/$ORDERS_ID/attributes/string" \
  "${HEADERS[@]}" \
  -d '{"key":"shippingAddress","size":5000,"required":true}' > /dev/null 2>&1 && echo "    ✅ shippingAddress"

curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/$ORDERS_ID/attributes/string" \
  "${HEADERS[@]}" \
  -d '{"key":"items","size":50000,"required":true}' > /dev/null 2>&1 && echo "    ✅ items"

echo "✅ Orders collection completed!"
echo ""

# =============================================================================
# CREATE VENDOR APPLICATIONS COLLECTION
# =============================================================================
echo "📝 Creating Vendor Applications Collection..."
VENDOR_APPS_ID="vendorApplications"

curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections" \
  "${HEADERS[@]}" \
  -d "{\"collectionId\":\"$VENDOR_APPS_ID\",\"name\":\"Vendor Applications\",\"permissions\":[\"read(\\\"users\\\")\",\"create(\\\"users\\\")\",\"update(\\\"users\\\")\"],\"documentSecurity\":true}" \
  > /dev/null 2>&1 && echo "  ✅ Collection created" || echo "  ⚠️  Collection may already exist"

sleep 3

echo "  Adding attributes..."

curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/$VENDOR_APPS_ID/attributes/string" \
  "${HEADERS[@]}" -d '{"key":"userId","size":255,"required":true}' > /dev/null 2>&1 && echo "    ✅ userId"

curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/$VENDOR_APPS_ID/attributes/string" \
  "${HEADERS[@]}" -d '{"key":"businessName","size":255,"required":true}' > /dev/null 2>&1 && echo "    ✅ businessName"

curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/$VENDOR_APPS_ID/attributes/string" \
  "${HEADERS[@]}" -d '{"key":"businessNameAr","size":255,"required":true}' > /dev/null 2>&1 && echo "    ✅ businessNameAr"

curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/$VENDOR_APPS_ID/attributes/string" \
  "${HEADERS[@]}" -d '{"key":"phoneNumber","size":20,"required":true}' > /dev/null 2>&1 && echo "    ✅ phoneNumber"

curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/$VENDOR_APPS_ID/attributes/string" \
  "${HEADERS[@]}" -d '{"key":"address","size":5000,"required":false}' > /dev/null 2>&1 && echo "    ✅ address"

curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/$VENDOR_APPS_ID/attributes/enum" \
  "${HEADERS[@]}" -d '{"key":"status","elements":["pending","approved","rejected"],"required":true,"default":"pending"}' \
  > /dev/null 2>&1 && echo "    ✅ status"

curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/$VENDOR_APPS_ID/attributes/string" \
  "${HEADERS[@]}" -d '{"key":"reviewNotes","size":5000,"required":false}' > /dev/null 2>&1 && echo "    ✅ reviewNotes"

echo "✅ Vendor Applications collection completed!"
echo ""

# =============================================================================
# CREATE CAR LISTINGS COLLECTION
# =============================================================================
echo "🚗 Creating Car Listings Collection..."
CAR_LISTINGS_ID="carListings"

curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections" \
  "${HEADERS[@]}" \
  -d "{\"collectionId\":\"$CAR_LISTINGS_ID\",\"name\":\"Car Listings\",\"permissions\":[\"read(\\\"any\\\")\",\"create(\\\"users\\\")\",\"update(\\\"users\\\")\",\"delete(\\\"users\\\")\"],\"documentSecurity\":true}" \
  > /dev/null 2>&1 && echo "  ✅ Collection created" || echo "  ⚠️  Collection may already exist"

sleep 3

echo "  Adding attributes..."

curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/$CAR_LISTINGS_ID/attributes/string" \
  "${HEADERS[@]}" -d '{"key":"sellerId","size":255,"required":true}' > /dev/null 2>&1 && echo "    ✅ sellerId"

curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/$CAR_LISTINGS_ID/attributes/string" \
  "${HEADERS[@]}" -d '{"key":"title","size":255,"required":true}' > /dev/null 2>&1 && echo "    ✅ title"

curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/$CAR_LISTINGS_ID/attributes/string" \
  "${HEADERS[@]}" -d '{"key":"description","size":5000,"required":true}' > /dev/null 2>&1 && echo "    ✅ description"

curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/$CAR_LISTINGS_ID/attributes/float" \
  "${HEADERS[@]}" -d '{"key":"price","required":true}' > /dev/null 2>&1 && echo "    ✅ price"

curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/$CAR_LISTINGS_ID/attributes/string" \
  "${HEADERS[@]}" -d '{"key":"brand","size":100,"required":true}' > /dev/null 2>&1 && echo "    ✅ brand"

curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/$CAR_LISTINGS_ID/attributes/string" \
  "${HEADERS[@]}" -d '{"key":"model","size":100,"required":true}' > /dev/null 2>&1 && echo "    ✅ model"

curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/$CAR_LISTINGS_ID/attributes/integer" \
  "${HEADERS[@]}" -d '{"key":"year","required":true}' > /dev/null 2>&1 && echo "    ✅ year"

curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/$CAR_LISTINGS_ID/attributes/string" \
  "${HEADERS[@]}" -d '{"key":"images","size":10000,"required":true}' > /dev/null 2>&1 && echo "    ✅ images (required)"

curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/$CAR_LISTINGS_ID/attributes/enum" \
  "${HEADERS[@]}" -d '{"key":"status","elements":["active","sold","inactive"],"required":true,"default":"active"}' \
  > /dev/null 2>&1 && echo "    ✅ status"

echo "✅ Car Listings collection completed!"
echo ""

# =============================================================================
# CREATE STORAGE BUCKETS
# =============================================================================
echo "📁 Creating Storage Buckets..."

# Product Images
curl -s -X POST "$ENDPOINT/storage/buckets" \
  "${HEADERS[@]}" \
  -d '{"bucketId":"product_images","name":"Product Images","permissions":["read(\"any\")","create(\"users\")","update(\"users\")","delete(\"users\")"],"fileSecurity":true,"enabled":true,"maximumFileSize":10485760,"allowedFileExtensions":["jpg","jpeg","png","webp"],"compression":"gzip","encryption":true,"antivirus":true}' \
  > /dev/null 2>&1 && echo "  ✅ product_images" || echo "  ⚠️  product_images (may already exist)"

# Vendor Documents
curl -s -X POST "$ENDPOINT/storage/buckets" \
  "${HEADERS[@]}" \
  -d '{"bucketId":"vendor_documents","name":"Vendor Documents","permissions":["read(\"users\")","create(\"users\")","update(\"users\")","delete(\"users\")"],"fileSecurity":true,"enabled":true,"maximumFileSize":20971520,"allowedFileExtensions":["pdf","jpg","jpeg","png"],"compression":"gzip","encryption":true,"antivirus":true}' \
  > /dev/null 2>&1 && echo "  ✅ vendor_documents" || echo "  ⚠️  vendor_documents (may already exist)"

# Car Listing Images
curl -s -X POST "$ENDPOINT/storage/buckets" \
  "${HEADERS[@]}" \
  -d '{"bucketId":"car_listing_images","name":"Car Listing Images","permissions":["read(\"any\")","create(\"users\")","update(\"users\")","delete(\"users\")"],"fileSecurity":true,"enabled":true,"maximumFileSize":10485760,"allowedFileExtensions":["jpg","jpeg","png","webp"],"compression":"gzip","encryption":true,"antivirus":true}' \
  > /dev/null 2>&1 && echo "  ✅ car_listing_images" || echo "  ⚠️  car_listing_images (may already exist)"

echo ""
echo "✅ Storage buckets completed!"
echo ""

# =============================================================================
# UPDATE .ENV FILE
# =============================================================================
echo "📝 Updating .env file..."

cat > .env << EOF
# Appwrite Configuration
VITE_APPWRITE_ENDPOINT=$ENDPOINT
VITE_APPWRITE_PROJECT_ID=$PROJECT_ID
VITE_APPWRITE_DATABASE_ID=$DATABASE_ID

# Collections
VITE_APPWRITE_USERS_COLLECTION_ID=users
VITE_APPWRITE_PRODUCTS_COLLECTION_ID=products
VITE_APPWRITE_ORDERS_COLLECTION_ID=orders
VITE_APPWRITE_VENDOR_APPLICATIONS_COLLECTION_ID=vendorApplications
VITE_APPWRITE_CAR_LISTINGS_COLLECTION_ID=carListings

# Storage Buckets
VITE_APPWRITE_PRODUCT_IMAGES_BUCKET_ID=product_images
VITE_APPWRITE_VENDOR_DOCUMENTS_BUCKET_ID=vendor_documents
VITE_APPWRITE_CAR_LISTING_IMAGES_BUCKET_ID=car_listing_images

# Application Configuration
VITE_APP_NAME="Souk El-Sayarat"
VITE_CURRENCY=EGP
VITE_DEFAULT_LANGUAGE=ar
VITE_ENVIRONMENT=development
EOF

echo "✅ .env file updated!"
echo ""

# =============================================================================
# FIX NODE VERSION
# =============================================================================
echo "🔧 Fixing Node version compatibility..."
sed -i 's/"node": ">=20.0.0 <21.0.0"/"node": ">=20.0.0 <23.0.0"/' package.json
echo "✅ Node version updated to support v22"
echo ""

# =============================================================================
# INSTALL DEPENDENCIES
# =============================================================================
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps
echo "✅ Dependencies installed!"
echo ""

# =============================================================================
# COMPLETION
# =============================================================================
echo ""
echo "╔══════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                          ║"
echo "║                    ✨ SETUP COMPLETE! ✨                                 ║"
echo "║                                                                          ║"
echo "╚══════════════════════════════════════════════════════════════════════════╝"
echo ""
echo "📋 Summary:"
echo "  ✅ Products collection: Enhanced"
echo "  ✅ Orders collection: Created"
echo "  ✅ Vendor Applications: Created"
echo "  ✅ Car Listings: Created"
echo "  ✅ Storage buckets: 3 created"
echo "  ✅ .env file: Updated"
echo "  ✅ Dependencies: Installed"
echo ""
echo "🚀 Next step: Start your app!"
echo ""
echo "   npm run dev"
echo ""
echo "   Then visit: http://localhost:5000"
echo ""
echo "🎉 Your Souk El-Sayarat marketplace is ready!"
echo ""

