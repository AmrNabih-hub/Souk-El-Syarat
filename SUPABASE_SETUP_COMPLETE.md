# 🎉 Supabase Setup Instructions for Souk El-Sayarat

## ✅ Connection Status: SUCCESSFUL!

Your Supabase project is connected and ready. Here are the next steps to complete the setup:

## 📊 Current Status

- ✅ **Supabase Connection**: Working
- ✅ **Authentication Service**: Available
- ✅ **Storage Service**: Available
- ⚠️ **Database Tables**: Need to be created
- ⚠️ **Storage Buckets**: Need to be created

## 🗄️ Step 1: Set Up Database Schema

### 1.1 Open Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project: `zgnwfnfehdwehuycbcsz`
3. Navigate to **SQL Editor**

### 1.2 Run Database Migration
Copy and paste the entire contents of `supabase/migrations/001_initial_schema.sql` into the SQL Editor and click **Run**.

This will create:
- ✅ All database tables (users, products, orders, etc.)
- ✅ Row Level Security policies
- ✅ Indexes for performance
- ✅ Triggers for automatic timestamps
- ✅ Custom types and functions

## 🗂️ Step 2: Create Storage Buckets

### 2.1 Navigate to Storage
In your Supabase dashboard, go to **Storage** section.

### 2.2 Create Required Buckets
Create these buckets with the specified settings:

1. **product-images** (Public)
   - Name: `product-images`
   - Public: ✅ Yes
   - File size limit: 10MB
   - Allowed MIME types: `image/*`

2. **vendor-documents** (Private)
   - Name: `vendor-documents`
   - Public: ❌ No
   - File size limit: 20MB
   - Allowed MIME types: `application/pdf`, `image/*`

3. **car-images** (Public)
   - Name: `car-images`
   - Public: ✅ Yes
   - File size limit: 10MB
   - Allowed MIME types: `image/*`

4. **user-avatars** (Public)
   - Name: `user-avatars`
   - Public: ✅ Yes
   - File size limit: 5MB
   - Allowed MIME types: `image/*`

5. **vendor-logos** (Public)
   - Name: `vendor-logos`
   - Public: ✅ Yes
   - File size limit: 5MB
   - Allowed MIME types: `image/*`

6. **chat-attachments** (Private)
   - Name: `chat-attachments`
   - Public: ❌ No
   - File size limit: 20MB
   - Allowed MIME types: `image/*`, `application/pdf`

### 2.3 Set Storage Policies
For each public bucket, add this policy in **Storage > Policies**:

```sql
-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow public access to files
CREATE POLICY "Allow public access" ON storage.objects
FOR SELECT USING (bucket_id = 'bucket-name');

-- Allow users to delete their own files
CREATE POLICY "Allow users to delete own files" ON storage.objects
FOR DELETE USING (auth.uid()::text = (storage.foldername(name))[1]);
```

## 🔐 Step 3: Configure Authentication

### 3.1 Basic Auth Settings
In **Authentication > Settings**:
- **Site URL**: `http://localhost:5173` (development)
- **Redirect URLs**: Add your production domain when ready
- **Email Confirmations**: ✅ Enable
- **Secure email change**: ✅ Enable

### 3.2 Email Templates (Optional)
Customize email templates in **Authentication > Email Templates**:
- Welcome email
- Confirmation email
- Password recovery email

### 3.3 OAuth Providers (Optional)
Configure social login providers in **Authentication > Providers**:

#### Google OAuth
1. Enable Google provider
2. Add your Google OAuth credentials
3. Set authorized redirect URIs

#### GitHub OAuth
1. Enable GitHub provider
2. Add your GitHub OAuth app credentials
3. Set authorization callback URL

## ⚡ Step 4: Edge Functions (Advanced)

### 4.1 Install Supabase CLI
```bash
npm install -g supabase
```

### 4.2 Link to Project
```bash
supabase login
supabase link --project-ref zgnwfnfehdwehuycbcsz
```

### 4.3 Deploy Functions
```bash
supabase functions deploy --project-ref zgnwfnfehdwehuycbcsz
```

## 🧪 Step 5: Test Your Setup

### 5.1 Test Database Connection
Run our test script:
```bash
node test-supabase-connection.js
```

### 5.2 Test Application
```bash
npm run dev
```

Visit `http://localhost:5173` and test:
- User registration
- Login/logout
- File uploads
- Real-time features

## 🔧 Step 6: Production Configuration

### 6.1 Environment Variables
For production, update your environment variables:
```env
VITE_SUPABASE_URL=https://zgnwfnfehdwehuycbcsz.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_ENVIRONMENT=production
```

### 6.2 Domain Configuration
- Set your production domain in Supabase settings
- Configure SSL certificates
- Update CORS settings

### 6.3 Security Checklist
- ✅ Row Level Security enabled
- ✅ API keys secure
- ✅ Storage policies configured
- ✅ Email confirmations enabled
- ✅ Rate limiting configured

## 🎯 Quick Start Commands

```bash
# 1. Test connection
node test-supabase-connection.js

# 2. Start development server
npm run dev

# 3. Build for production
npm run build

# 4. Preview production build
npm run preview
```

## 📋 Success Checklist

After completing the setup, verify:

- [ ] Database tables created successfully
- [ ] Storage buckets configured
- [ ] Authentication working
- [ ] User registration/login functional
- [ ] File uploads working
- [ ] Real-time features active
- [ ] Application builds without errors

## 🆘 Troubleshooting

### Common Issues

**"Table does not exist" error**
- Run the database migration script
- Check if RLS policies are applied

**"Storage bucket not found" error**
- Create the required storage buckets
- Verify bucket names match configuration

**"Auth session missing" error**
- Expected when no user is logged in
- Test user registration/login flow

**Build/Runtime errors**
- Check environment variables
- Verify all dependencies installed
- Review browser console for errors

## 🎉 You're Ready!

Your Supabase-powered Souk El-Sayarat application is now configured and ready for development and production deployment!

## 📞 Support

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [GitHub Issues](./issues)

---

**Next**: Start building your marketplace features with the power of Supabase! 🚀