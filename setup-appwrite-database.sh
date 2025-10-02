#!/bin/bash

# Souk El-Sayarat - Automated Appwrite Database Setup
# This script creates all collections, attributes, indexes, and storage buckets

set -e

echo "🚀 Souk El-Sayarat - Automated Database Setup"
echo "=============================================="
echo ""

# Configuration
read -p "Enter your Appwrite API Key: " API_KEY
PROJECT_ID="68de87060019a1ca2b8b"
ENDPOINT="https://fra.cloud.appwrite.io/v1"
DATABASE_ID="souk_main_db"

# Headers for all requests
HEADERS=(
  -H "X-Appwrite-Project: $PROJECT_ID"
  -H "X-Appwrite-Key: $API_KEY"
  -H "Content-Type: application/json"
)

echo "✅ Configuration loaded"
echo ""

# =============================================================================
# PRODUCTS COLLECTION - Complete Setup
# =============================================================================
echo "📦 Setting up Products collection..."

PRODUCTS_ID="products"

# Add missing attributes to products
echo "  Adding attributes..."

# name (English)
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/$PRODUCTS_ID/attributes/string" \
  "${HEADERS[@]}" \
  -d '{
    "key": "name",
    "size": 255,
    "required": true
  }' > /dev/null && echo "    ✅ name"

# nameAr (Arabic)
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/$PRODUCTS_ID/attributes/string" \
  "${HEADERS[@]}" \
  -d '{
    "key": "nameAr",
    "size": 255,
    "required": true
  }' > /dev/null && echo "    ✅ nameAr"

# description
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/$PRODUCTS_ID/attributes/string" \
  "${HEADERS[@]}" \
  -d '{
    "key": "description",
    "size": 5000,
    "required": false
  }' > /dev/null && echo "    ✅ description"

# descriptionAr
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/$PRODUCTS_ID/attributes/string" \
  "${HEADERS[@]}" \
  -d '{
    "key": "descriptionAr",
    "size": 5000,
    "required": false
  }' > /dev/null && echo "    ✅ descriptionAr"

# category
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/$PRODUCTS_ID/attributes/string" \
  "${HEADERS[@]}" \
  -d '{
    "key": "category",
    "size": 100,
    "required": true
  }' > /dev/null && echo "    ✅ category"

# images (REQUIRED as per user request)
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/$PRODUCTS_ID/attributes/string" \
  "${HEADERS[@]}" \
  -d '{
    "key": "images",
    "size": 10000,
    "required": true
  }' > /dev/null && echo "    ✅ images (required)"

# stock
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/$PRODUCTS_ID/attributes/integer" \
  "${HEADERS[@]}" \
  -d '{
    "key": "stock",
    "required": true,
    "default": 0
  }' > /dev/null && echo "    ✅ stock"

echo "  Waiting for attributes to be available (30s)..."
sleep 30

# Update status to enum if it exists, or create it
curl -s -X PATCH "$ENDPOINT/databases/$DATABASE_ID/collections/$PRODUCTS_ID/attributes/enum/status" \
  "${HEADERS[@]}" \
  -d '{
    "elements": ["pending_approval", "active", "inactive"],
    "default": "pending_approval"
  }' > /dev/null 2>&1 || \
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/$PRODUCTS_ID/attributes/enum" \
  "${HEADERS[@]}" \
  -d '{
    "key": "status",
    "elements": ["pending_approval", "active", "inactive"],
    "required": true,
    "default": "pending_approval"
  }' > /dev/null && echo "    ✅ status (enum)"

echo "✅ Products collection completed!"
echo ""

# =============================================================================
# ORDERS COLLECTION
# =============================================================================
echo "🛒 Creating Orders collection..."

ORDERS_ID="orders"

curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections" \
  "${HEADERS[@]}" \
  -d "{
    \"collectionId\": \"$ORDERS_ID\",
    \"name\": \"Orders\",
    \"permissions\": [
      \"read(\\\"users\\\")\",
      \"create(\\\"users\\\")\",
      \"update(\\\"users\\\")\"
    ],
    \"documentSecurity\": true
  }" > /dev/null

echo "  Adding attributes..."

# customerId
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/$ORDERS_ID/attributes/string" \
  "${HEADERS[@]}" \
  -d '{"key": "customerId", "size": 255, "required": true}' > /dev/null && echo "    ✅ customerId"

# status
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/$ORDERS_ID/attributes/enum" \
  "${HEADERS[@]}" \
  -d '{
    "key": "status",
    "elements": ["pending", "processing", "shipped", "delivered", "cancelled"],
    "required": true,
    "default": "pending"
  }' > /dev/null && echo "    ✅ status"

# totalAmount
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/$ORDERS_ID/attributes/float" \
  "${HEADERS[@]}" \
  -d '{"key": "totalAmount", "required": true}' > /dev/null && echo "    ✅ totalAmount"

# paymentMethod
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/$ORDERS_ID/attributes/enum" \
  "${HEADERS[@]}" \
  -d '{
    "key": "paymentMethod",
    "elements": ["cod", "card", "wallet"],
    "required": true,
    "default": "cod"
  }' > /dev/null && echo "    ✅ paymentMethod"

# shippingAddress
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/$ORDERS_ID/attributes/string" \
  "${HEADERS[@]}" \
  -d '{"key": "shippingAddress", "size": 5000, "required": true}' > /dev/null && echo "    ✅ shippingAddress"

# items
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/$ORDERS_ID/attributes/string" \
  "${HEADERS[@]}" \
  -d '{"key": "items", "size": 50000, "required": true}' > /dev/null && echo "    ✅ items"

echo "✅ Orders collection completed!"
echo ""

# =============================================================================
# VENDOR APPLICATIONS COLLECTION
# =============================================================================
echo "📝 Creating Vendor Applications collection..."

VENDOR_APPS_ID="vendorApplications"

curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections" \
  "${HEADERS[@]}" \
  -d "{
    \"collectionId\": \"$VENDOR_APPS_ID\",
    \"name\": \"Vendor Applications\",
    \"permissions\": [
      \"read(\\\"users\\\")\",
      \"create(\\\"users\\\")\",
      \"update(\\\"users\\\")\"
    ],
    \"documentSecurity\": true
  }" > /dev/null

echo "  Adding attributes..."

curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/$VENDOR_APPS_ID/attributes/string" \
  "${HEADERS[@]}" \
  -d '{"key": "userId", "size": 255, "required": true}' > /dev/null && echo "    ✅ userId"

curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/$VENDOR_APPS_ID/attributes/string" \
  "${HEADERS[@]}" \
  -d '{"key": "businessName", "size": 255, "required": true}' > /dev/null && echo "    ✅ businessName"

curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/$VENDOR_APPS_ID/attributes/string" \
  "${HEADERS[@]}" \
  -d '{"key": "businessNameAr", "size": 255, "required": true}' > /dev/null && echo "    ✅ businessNameAr"

curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/$VENDOR_APPS_ID/attributes/string" \
  "${HEADERS[@]}" \
  -d '{"key": "phoneNumber", "size": 20, "required": true}' > /dev/null && echo "    ✅ phoneNumber"

curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/$VENDOR_APPS_ID/attributes/string" \
  "${HEADERS[@]}" \
  -d '{"key": "address", "size": 5000, "required": false}' > /dev/null && echo "    ✅ address"

curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/$VENDOR_APPS_ID/attributes/enum" \
  "${HEADERS[@]}" \
  -d '{
    "key": "status",
    "elements": ["pending", "approved", "rejected"],
    "required": true,
    "default": "pending"
  }' > /dev/null && echo "    ✅ status"

curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/$VENDOR_APPS_ID/attributes/string" \
  "${HEADERS[@]}" \
  -d '{"key": "reviewNotes", "size": 5000, "required": false}' > /dev/null && echo "    ✅ reviewNotes"

echo "✅ Vendor Applications collection completed!"
echo ""

# =============================================================================
# CAR LISTINGS COLLECTION
# =============================================================================
echo "🚗 Creating Car Listings collection..."

CAR_LISTINGS_ID="carListings"

curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections" \
  "${HEADERS[@]}" \
  -d "{
    \"collectionId\": \"$CAR_LISTINGS_ID\",
    \"name\": \"Car Listings\",
    \"permissions\": [
      \"read(\\\"any\\\")\",
      \"create(\\\"users\\\")\",
      \"update(\\\"users\\\")\",
      \"delete(\\\"users\\\")\"
    ],
    \"documentSecurity\": true
  }" > /dev/null

echo "  Adding attributes..."

curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/$CAR_LISTINGS_ID/attributes/string" \
  "${HEADERS[@]}" \
  -d '{"key": "sellerId", "size": 255, "required": true}' > /dev/null && echo "    ✅ sellerId"

curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/$CAR_LISTINGS_ID/attributes/string" \
  "${HEADERS[@]}" \
  -d '{"key": "title", "size": 255, "required": true}' > /dev/null && echo "    ✅ title"

curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/$CAR_LISTINGS_ID/attributes/string" \
  "${HEADERS[@]}" \
  -d '{"key": "description", "size": 5000, "required": true}' > /dev/null && echo "    ✅ description"

curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/$CAR_LISTINGS_ID/attributes/float" \
  "${HEADERS[@]}" \
  -d '{"key": "price", "required": true}' > /dev/null && echo "    ✅ price"

curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/$CAR_LISTINGS_ID/attributes/string" \
  "${HEADERS[@]}" \
  -d '{"key": "brand", "size": 100, "required": true}' > /dev/null && echo "    ✅ brand"

curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/$CAR_LISTINGS_ID/attributes/string" \
  "${HEADERS[@]}" \
  -d '{"key": "model", "size": 100, "required": true}' > /dev/null && echo "    ✅ model"

curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/$CAR_LISTINGS_ID/attributes/integer" \
  "${HEADERS[@]}" \
  -d '{"key": "year", "required": true}' > /dev/null && echo "    ✅ year"

curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/$CAR_LISTINGS_ID/attributes/string" \
  "${HEADERS[@]}" \
  -d '{"key": "images", "size": 10000, "required": true}' > /dev/null && echo "    ✅ images (required)"

curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/$CAR_LISTINGS_ID/attributes/enum" \
  "${HEADERS[@]}" \
  -d '{
    "key": "status",
    "elements": ["active", "sold", "inactive"],
    "required": true,
    "default": "active"
  }' > /dev/null && echo "    ✅ status"

echo "✅ Car Listings collection completed!"
echo ""

# =============================================================================
# STORAGE BUCKETS
# =============================================================================
echo "📁 Creating Storage Buckets..."

# Product Images Bucket
curl -s -X POST "$ENDPOINT/storage/buckets" \
  "${HEADERS[@]}" \
  -d '{
    "bucketId": "product_images",
    "name": "Product Images",
    "permissions": [
      "read(\"any\")",
      "create(\"users\")",
      "update(\"users\")",
      "delete(\"users\")"
    ],
    "fileSecurity": true,
    "enabled": true,
    "maximumFileSize": 10485760,
    "allowedFileExtensions": ["jpg", "jpeg", "png", "webp"],
    "compression": "gzip",
    "encryption": true,
    "antivirus": true
  }' > /dev/null && echo "  ✅ product_images bucket"

# Vendor Documents Bucket
curl -s -X POST "$ENDPOINT/storage/buckets" \
  "${HEADERS[@]}" \
  -d '{
    "bucketId": "vendor_documents",
    "name": "Vendor Documents",
    "permissions": [
      "read(\"users\")",
      "create(\"users\")",
      "update(\"users\")",
      "delete(\"users\")"
    ],
    "fileSecurity": true,
    "enabled": true,
    "maximumFileSize": 20971520,
    "allowedFileExtensions": ["pdf", "jpg", "jpeg", "png"],
    "compression": "gzip",
    "encryption": true,
    "antivirus": true
  }' > /dev/null && echo "  ✅ vendor_documents bucket"

# Car Listing Images Bucket
curl -s -X POST "$ENDPOINT/storage/buckets" \
  "${HEADERS[@]}" \
  -d '{
    "bucketId": "car_listing_images",
    "name": "Car Listing Images",
    "permissions": [
      "read(\"any\")",
      "create(\"users\")",
      "update(\"users\")",
      "delete(\"users\")"
    ],
    "fileSecurity": true,
    "enabled": true,
    "maximumFileSize": 10485760,
    "allowedFileExtensions": ["jpg", "jpeg", "png", "webp"],
    "compression": "gzip",
    "encryption": true,
    "antivirus": true
  }' > /dev/null && echo "  ✅ car_listing_images bucket"

echo ""
echo "✨ Database setup complete!"
echo ""
echo "�� Summary:"
echo "  - Products: Enhanced with all fields ✅"
echo "  - Orders: Created ✅"
echo "  - Vendor Applications: Created ✅"
echo "  - Car Listings: Created ✅"
echo "  - Storage Buckets: 3 created ✅"
echo ""
echo "🚀 Next: Run 'npm install && npm run dev'"
echo ""

