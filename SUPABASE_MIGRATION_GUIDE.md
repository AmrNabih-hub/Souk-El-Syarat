# 🚀 Supabase Migration Guide for Souk El-Sayarat

## Overview

This guide covers the complete migration from Appwrite to Supabase, implementing all Supabase products for a professional e-commerce marketplace.

## 🏗️ Architecture Overview

### Supabase Products Used

1. **Database** - PostgreSQL with advanced features
2. **Auth** - User authentication with social logins
3. **Storage** - File and image storage
4. **Edge Functions** - Serverless TypeScript functions
5. **Realtime** - Live subscriptions and presence
6. **Vector/Embeddings** - AI-powered search (future)
7. **Analytics** - Usage tracking and insights

## 📋 Prerequisites

- Node.js 20.17.0+
- npm 10.0.0+
- Supabase CLI
- Git

## 🎯 Step 1: Supabase Project Setup

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new account or sign in
3. Create a new project
4. Choose a region (closest to your users)
5. Set a strong database password

### 1.2 Get Project Configuration

From your Supabase dashboard, copy:
- Project URL
- Project API (anon/public) key
- Project API (service_role/secret) key

## 🔧 Step 2: Environment Setup

### 2.1 Update Environment Variables

Copy `.env.example` to `.env` and update:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2.2 Install Dependencies

All Supabase dependencies are already installed:

```bash
npm install
```

## 🗄️ Step 3: Database Setup

### 3.1 Run Database Migration

Execute the SQL migration in Supabase dashboard > SQL Editor:

```sql
-- Run the contents of supabase/migrations/001_initial_schema.sql
```

### 3.2 Configure Storage Buckets

In Supabase dashboard > Storage, create buckets:

- `product-images` (public)
- `vendor-documents` (private)
- `car-images` (public)
- `user-avatars` (public)
- `vendor-logos` (public)
- `chat-attachments` (private)

### 3.3 Storage Policies

For each public bucket, add this policy:

```sql
-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow public access to files
CREATE POLICY "Allow public access" ON storage.objects
FOR SELECT USING (bucket_id = 'bucket-name');
```

## 🔐 Step 4: Authentication Setup

### 4.1 Configure Auth Settings

In Supabase dashboard > Authentication > Settings:

1. **Site URL**: `http://localhost:5173` (development)
2. **Redirect URLs**: Add your production domains
3. **Email Templates**: Customize as needed

### 4.2 Enable Social Providers

Configure OAuth providers:

1. **Google**: Add client ID and secret
2. **Facebook**: Add app ID and secret
3. **GitHub**: Add client ID and secret

### 4.3 Enable Email Confirmation

- Turn on "Enable email confirmations"
- Customize email templates

## ⚡ Step 5: Edge Functions Setup

### 5.1 Initialize Supabase CLI

```bash
npx supabase login
npx supabase init
```

### 5.2 Link to Your Project

```bash
npx supabase link --project-ref your-project-id
```

### 5.3 Deploy Functions

Create and deploy edge functions:

```bash
# Create functions
npx supabase functions new process-payment
npx supabase functions new send-notification
npx supabase functions new generate-report
npx supabase functions new ai-search
npx supabase functions new image-processing
npx supabase functions new email-service

# Deploy all functions
npx supabase functions deploy
```

## 🌐 Step 6: Realtime Configuration

### 6.1 Enable Realtime

In Supabase dashboard > Database > Replication:

1. Enable realtime for tables:
   - `products`
   - `orders`
   - `chat_messages`
   - `notifications`
   - `analytics_events`

### 6.2 Configure Publications

```sql
-- Enable realtime for specific tables
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

## 📊 Step 7: Analytics Setup

### 7.1 Create Analytics Schema

```sql
-- Additional analytics tables (if needed)
CREATE TABLE analytics_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    session_id TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    country TEXT,
    city TEXT,
    device_type TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER
);
```

## 🚀 Step 8: Application Updates

### 8.1 Services Migration

All services have been updated:

- ✅ `supabase-auth.service.ts` - Authentication
- ✅ `supabase-database.service.ts` - Database operations
- ✅ `supabase-storage.service.ts` - File storage
- ✅ `supabase-realtime.service.ts` - Real-time features
- ✅ `supabase-functions.service.ts` - Edge functions

### 8.2 Context Providers

- ✅ `SupabaseContext.tsx` - Main Supabase context
- ✅ Updated auth store with Supabase

### 8.3 Component Updates

Key components to update:
- Auth pages (login, register, etc.)
- Product management
- Chat components
- Admin dashboard

## 🧪 Step 9: Testing

### 9.1 Test Authentication

```bash
npm run dev
```

Test:
- Email/password signup
- Email confirmation
- Login/logout
- Social logins
- Password reset

### 9.2 Test Database Operations

- Create/read/update/delete products
- User profiles
- Orders
- Favorites

### 9.3 Test Real-time Features

- Chat messages
- Order status updates
- Notifications

### 9.4 Test Storage

- Image uploads
- File downloads
- Access permissions

## 🔧 Step 10: Production Deployment

### 10.1 Environment Variables

Set production environment variables:

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
```

### 10.2 Database Migration

Run production migration:

```bash
npx supabase db push
```

### 10.3 Functions Deployment

Deploy edge functions to production:

```bash
npx supabase functions deploy --project-ref your-project-id
```

## 📈 Step 11: Monitoring & Analytics

### 11.1 Supabase Dashboard

Monitor:
- Database performance
- API usage
- Storage usage
- Auth statistics
- Realtime connections

### 11.2 Custom Analytics

Implement custom analytics using the analytics service:

```typescript
import { functionsService } from '@/services/supabase-functions.service';

// Track user events
await functionsService.trackAnalytics(userId, 'product_view', {
  productId,
  category,
  price
});
```

## 🛡️ Step 12: Security Best Practices

### 12.1 Row Level Security

All tables have RLS enabled with appropriate policies.

### 12.2 API Keys

- Use anon key for client-side operations
- Keep service role key secure (server-side only)
- Rotate keys periodically

### 12.3 CORS Configuration

Configure allowed origins in Supabase dashboard.

## 🎉 Migration Complete!

Your application is now fully migrated to Supabase with:

✅ PostgreSQL database with advanced features
✅ Secure authentication with social logins
✅ Scalable file storage
✅ Real-time subscriptions
✅ Serverless edge functions
✅ Professional security practices
✅ Comprehensive monitoring

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [Realtime Guide](https://supabase.com/docs/guides/realtime)

## 🆘 Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Check environment variables
   - Verify project URL and keys
   - Check network connectivity

2. **RLS Policy Issues**
   - Review policy definitions
   - Test with service role key
   - Check user authentication

3. **Storage Issues**
   - Verify bucket policies
   - Check file permissions
   - Review CORS settings

4. **Real-time Issues**
   - Enable realtime on tables
   - Check publication settings
   - Verify connection status

For additional help, check the Supabase Discord community or create an issue in the project repository.