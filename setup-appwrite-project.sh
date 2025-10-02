#!/bin/bash

# 🚀 Appwrite Project Setup Script for Souk El-Sayarat
# This script sets up the complete Appwrite project infrastructure

set -e

echo "🚀 Setting up Appwrite project for Souk El-Sayarat..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Appwrite CLI is installed
if ! command -v appwrite &> /dev/null; then
    echo -e "${RED}❌ Appwrite CLI is not installed. Please install it first:${NC}"
    echo "npm install -g appwrite-cli"
    exit 1
fi

# Check if user is logged in
if ! appwrite account get &> /dev/null; then
    echo -e "${YELLOW}⚠️ Please log in to Appwrite first:${NC}"
    echo "appwrite login"
    exit 1
fi

echo -e "${BLUE}📋 Setting up project infrastructure...${NC}"

# Create project
echo -e "${YELLOW}Creating project...${NC}"
PROJECT_ID=$(appwrite projects create --name "Souk El-Sayarat" --teamId "" --region "us-east-1" --output json | jq -r '.$id')
echo -e "${GREEN}✅ Project created with ID: $PROJECT_ID${NC}"

# Set project
appwrite client --projectId $PROJECT_ID

# Create database
echo -e "${YELLOW}Creating database...${NC}"
DATABASE_ID=$(appwrite databases create --databaseId "souk_main_db" --name "Souk El-Sayarat Main Database" --output json | jq -r '.$id')
echo -e "${GREEN}✅ Database created with ID: $DATABASE_ID${NC}"

# Create collections
echo -e "${YELLOW}Creating collections...${NC}"

# Users collection
USERS_COLLECTION_ID=$(appwrite databases createCollection --databaseId $DATABASE_ID --collectionId "users" --name "Users" --documentSecurity false --output json | jq -r '.$id')
echo -e "${GREEN}✅ Users collection created: $USERS_COLLECTION_ID${NC}"

# Products collection
PRODUCTS_COLLECTION_ID=$(appwrite databases createCollection --databaseId $DATABASE_ID --collectionId "products" --name "Products" --documentSecurity false --output json | jq -r '.$id')
echo -e "${GREEN}✅ Products collection created: $PRODUCTS_COLLECTION_ID${NC}"

# Orders collection
ORDERS_COLLECTION_ID=$(appwrite databases createCollection --databaseId $DATABASE_ID --collectionId "orders" --name "Orders" --documentSecurity false --output json | jq -r '.$id')
echo -e "${GREEN}✅ Orders collection created: $ORDERS_COLLECTION_ID${NC}"

# Vendor Applications collection
VENDOR_APPLICATIONS_COLLECTION_ID=$(appwrite databases createCollection --databaseId $DATABASE_ID --collectionId "vendorApplications" --name "Vendor Applications" --documentSecurity false --output json | jq -r '.$id')
echo -e "${GREEN}✅ Vendor Applications collection created: $VENDOR_APPLICATIONS_COLLECTION_ID${NC}"

# Car Listings collection
CAR_LISTINGS_COLLECTION_ID=$(appwrite databases createCollection --databaseId $DATABASE_ID --collectionId "carListings" --name "Car Listings" --documentSecurity false --output json | jq -r '.$id')
echo -e "${GREEN}✅ Car Listings collection created: $CAR_LISTINGS_COLLECTION_ID${NC}"

# Create storage buckets
echo -e "${YELLOW}Creating storage buckets...${NC}"

# Product Images bucket
PRODUCT_IMAGES_BUCKET_ID=$(appwrite storage createBucket --bucketId "product_images" --name "Product Images" --fileSecurity false --enabled true --maximumFileSize 10485760 --allowedFileExtensions jpg,jpeg,png,webp --compression gzip --encryption false --antivirus false --output json | jq -r '.$id')
echo -e "${GREEN}✅ Product Images bucket created: $PRODUCT_IMAGES_BUCKET_ID${NC}"

# Vendor Documents bucket
VENDOR_DOCUMENTS_BUCKET_ID=$(appwrite storage createBucket --bucketId "vendor_documents" --name "Vendor Documents" --fileSecurity true --enabled true --maximumFileSize 26214400 --allowedFileExtensions pdf,jpg,jpeg,png --compression gzip --encryption true --antivirus true --output json | jq -r '.$id')
echo -e "${GREEN}✅ Vendor Documents bucket created: $VENDOR_DOCUMENTS_BUCKET_ID${NC}"

# Car Listing Images bucket
CAR_LISTING_IMAGES_BUCKET_ID=$(appwrite storage createBucket --bucketId "car_listing_images" --name "Car Listing Images" --fileSecurity false --enabled true --maximumFileSize 15728640 --allowedFileExtensions jpg,jpeg,png,webp --compression gzip --encryption false --antivirus false --output json | jq -r '.$id')
echo -e "${GREEN}✅ Car Listing Images bucket created: $CAR_LISTING_IMAGES_BUCKET_ID${NC}"

# User Avatars bucket
USER_AVATARS_BUCKET_ID=$(appwrite storage createBucket --bucketId "user_avatars" --name "User Avatars" --fileSecurity false --enabled true --maximumFileSize 5242880 --allowedFileExtensions jpg,jpeg,png,webp --compression gzip --encryption false --antivirus false --output json | jq -r '.$id')
echo -e "${GREEN}✅ User Avatars bucket created: $USER_AVATARS_BUCKET_ID${NC}"

# Create environment file
echo -e "${YELLOW}Creating environment configuration...${NC}"

cat > .env.local << EOF
# Appwrite Configuration
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=$PROJECT_ID
VITE_APPWRITE_DATABASE_ID=$DATABASE_ID

# Collection IDs
VITE_APPWRITE_USERS_COLLECTION_ID=$USERS_COLLECTION_ID
VITE_APPWRITE_PRODUCTS_COLLECTION_ID=$PRODUCTS_COLLECTION_ID
VITE_APPWRITE_ORDERS_COLLECTION_ID=$ORDERS_COLLECTION_ID
VITE_APPWRITE_VENDOR_APPLICATIONS_COLLECTION_ID=$VENDOR_APPLICATIONS_COLLECTION_ID
VITE_APPWRITE_CAR_LISTINGS_COLLECTION_ID=$CAR_LISTINGS_COLLECTION_ID

# Storage Bucket IDs
VITE_APPWRITE_PRODUCT_IMAGES_BUCKET_ID=$PRODUCT_IMAGES_BUCKET_ID
VITE_APPWRITE_VENDOR_DOCUMENTS_BUCKET_ID=$VENDOR_DOCUMENTS_BUCKET_ID
VITE_APPWRITE_CAR_LISTING_IMAGES_BUCKET_ID=$CAR_LISTING_IMAGES_BUCKET_ID
VITE_APPWRITE_USER_AVATARS_BUCKET_ID=$USER_AVATARS_BUCKET_ID

# Admin Configuration
VITE_ADMIN_EMAIL=soukalsayarat1@gmail.com
VITE_ADMIN_ENCRYPTION_KEY=your-32-byte-encryption-key-here
EOF

echo -e "${GREEN}✅ Environment file created: .env.local${NC}"

# Create production environment file
cat > .env.production << EOF
# Appwrite Configuration - Production
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=$PROJECT_ID
VITE_APPWRITE_DATABASE_ID=$DATABASE_ID

# Collection IDs
VITE_APPWRITE_USERS_COLLECTION_ID=$USERS_COLLECTION_ID
VITE_APPWRITE_PRODUCTS_COLLECTION_ID=$PRODUCTS_COLLECTION_ID
VITE_APPWRITE_ORDERS_COLLECTION_ID=$ORDERS_COLLECTION_ID
VITE_APPWRITE_VENDOR_APPLICATIONS_COLLECTION_ID=$VENDOR_APPLICATIONS_COLLECTION_ID
VITE_APPWRITE_CAR_LISTINGS_COLLECTION_ID=$CAR_LISTINGS_COLLECTION_ID

# Storage Bucket IDs
VITE_APPWRITE_PRODUCT_IMAGES_BUCKET_ID=$PRODUCT_IMAGES_BUCKET_ID
VITE_APPWRITE_VENDOR_DOCUMENTS_BUCKET_ID=$VENDOR_DOCUMENTS_BUCKET_ID
VITE_APPWRITE_CAR_LISTING_IMAGES_BUCKET_ID=$CAR_LISTING_IMAGES_BUCKET_ID
VITE_APPWRITE_USER_AVATARS_BUCKET_ID=$USER_AVATARS_BUCKET_ID

# Admin Configuration
VITE_ADMIN_EMAIL=soukalsayarat1@gmail.com
VITE_ADMIN_ENCRYPTION_KEY=your-32-byte-encryption-key-here
EOF

echo -e "${GREEN}✅ Production environment file created: .env.production${NC}"

echo -e "${BLUE}📋 Next steps:${NC}"
echo "1. Update .env.local and .env.production with your actual encryption key"
echo "2. Set up collection attributes and indexes"
echo "3. Configure authentication providers"
echo "4. Set up functions and messaging"
echo "5. Test the application"

echo -e "${GREEN}🎉 Appwrite project setup completed successfully!${NC}"
echo -e "${BLUE}Project ID: $PROJECT_ID${NC}"
echo -e "${BLUE}Database ID: $DATABASE_ID${NC}"
echo -e "${BLUE}Environment files created: .env.local, .env.production${NC}"
