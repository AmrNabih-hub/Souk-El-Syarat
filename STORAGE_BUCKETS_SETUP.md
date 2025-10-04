# 🗂️ Storage Buckets Setup Guide

## Current Status: Storage buckets need to be created

Follow these steps to create the required storage buckets in your Supabase dashboard:

## 📋 Required Buckets

### 1. **product-images** (Public)
- **Name**: `product-images`
- **Public**: ✅ Yes
- **File size limit**: 10MB
- **Allowed MIME types**: `image/jpeg,image/png,image/webp,image/gif`

### 2. **vendor-documents** (Private)
- **Name**: `vendor-documents`  
- **Public**: ❌ No
- **File size limit**: 20MB
- **Allowed MIME types**: `application/pdf,image/jpeg,image/png`

### 3. **car-images** (Public)
- **Name**: `car-images`
- **Public**: ✅ Yes  
- **File size limit**: 10MB
- **Allowed MIME types**: `image/jpeg,image/png,image/webp,image/gif`

### 4. **user-avatars** (Public)
- **Name**: `user-avatars`
- **Public**: ✅ Yes
- **File size limit**: 5MB
- **Allowed MIME types**: `image/jpeg,image/png,image/webp`

### 5. **vendor-logos** (Public)
- **Name**: `vendor-logos`
- **Public**: ✅ Yes
- **File size limit**: 5MB
- **Allowed MIME types**: `image/jpeg,image/png,image/webp,image/svg+xml`

### 6. **chat-attachments** (Private)
- **Name**: `chat-attachments`
- **Public**: ❌ No
- **File size limit**: 20MB
- **Allowed MIME types**: `image/jpeg,image/png,application/pdf,text/plain`

## 🔧 How to Create Buckets

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/zgnwfnfehdwehuycbcsz
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"**
4. Fill in the bucket details as specified above
5. Click **"Create bucket"**
6. Repeat for all 6 buckets

## 🛡️ Storage Policies (Run after creating buckets)

After creating the buckets, go to **Storage > Policies** and add these policies:

### For Public Buckets (product-images, car-images, user-avatars, vendor-logos):

```sql
-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow public access to files  
CREATE POLICY "Allow public access" ON storage.objects
FOR SELECT USING (bucket_id = 'BUCKET_NAME_HERE');

-- Allow users to delete their own files
CREATE POLICY "Allow users to delete own files" ON storage.objects
FOR DELETE USING (auth.uid()::text = (storage.foldername(name))[1]);
```

### For Private Buckets (vendor-documents, chat-attachments):

```sql
-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads" ON storage.objects  
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow users to access their own files
CREATE POLICY "Allow users to access own files" ON storage.objects
FOR SELECT USING (auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own files  
CREATE POLICY "Allow users to delete own files" ON storage.objects
FOR DELETE USING (auth.uid()::text = (storage.foldername(name))[1]);
```

## ✅ Quick Validation

After creating the buckets, run this command to validate:

```bash
node scripts/validate-supabase-setup.js
```

You should see all buckets showing as "Found" ✅