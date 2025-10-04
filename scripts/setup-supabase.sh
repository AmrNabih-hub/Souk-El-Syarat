#!/bin/bash

# 🚀 Supabase Setup Script for Souk El-Sayarat
# This script helps set up the Supabase project from scratch

set -e

echo "🚀 Setting up Supabase for Souk El-Sayarat..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing..."
    npm install -g supabase
fi

# Check if we're already linked to a project
if [ -f .env ]; then
    echo "✅ Environment file found"
else
    echo "⚠️  Please create a .env file with your Supabase credentials"
    echo "   Copy .env.example to .env and fill in your values"
    exit 1
fi

# Initialize Supabase project
echo "📦 Initializing Supabase project..."
supabase init

# Check if we need to link to an existing project
read -p "Do you want to link to an existing Supabase project? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter your project reference ID: " PROJECT_REF
    supabase link --project-ref $PROJECT_REF
else
    echo "Creating a new project..."
    read -p "Enter your project name: " PROJECT_NAME
    read -p "Enter your database password: " -s DB_PASSWORD
    echo
    supabase projects create $PROJECT_NAME --db-password $DB_PASSWORD
fi

# Run database migrations
echo "🗄️  Running database migrations..."
supabase db push

# Set up storage buckets
echo "🗂️  Setting up storage buckets..."
supabase storage create product-images --public
supabase storage create vendor-documents
supabase storage create car-images --public
supabase storage create user-avatars --public
supabase storage create vendor-logos --public
supabase storage create chat-attachments

# Deploy Edge Functions
echo "⚡ Deploying Edge Functions..."
cd supabase/functions

# Create basic edge functions if they don't exist
mkdir -p process-payment send-notification generate-report ai-search image-processing email-service

# Deploy functions
supabase functions deploy process-payment
supabase functions deploy send-notification
supabase functions deploy generate-report
supabase functions deploy ai-search
supabase functions deploy image-processing
supabase functions deploy email-service

cd ../..

# Set up auth providers
echo "🔐 Configuring authentication..."
echo "Please manually configure the following in your Supabase dashboard:"
echo "1. Go to Authentication > Settings"
echo "2. Set Site URL to your domain"
echo "3. Add redirect URLs"
echo "4. Configure OAuth providers (Google, Facebook, GitHub)"
echo "5. Enable email confirmations"

# Install dependencies
echo "📦 Installing project dependencies..."
npm install

# Build project to verify everything works
echo "🔨 Building project to verify setup..."
npm run build

echo ""
echo "✅ Supabase setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update your .env file with the new project credentials"
echo "2. Configure authentication providers in Supabase dashboard"
echo "3. Set up custom SMTP for emails (optional)"
echo "4. Configure domain and SSL for production"
echo "5. Set up monitoring and backups"
echo ""
echo "🚀 Ready to start development:"
echo "   npm run dev"
echo ""