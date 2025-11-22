# Supabase Storage Setup for Job Photos

This guide explains how to set up Supabase Storage for job photo uploads.

## Prerequisites

- Access to Supabase Dashboard
- Supabase project already created

## Steps

### 1. Create Storage Bucket

1. Go to https://supabase.com/dashboard
2. Select your project: **Xcellent1 Lawn Care**
3. Click **Storage** in the left sidebar
4. Click **New Bucket**
5. Enter the following details:
   - **Name**: `job-photos`
   - **Public bucket**: ✅ Check this box (photos need to be publicly accessible)
   - **File size limit**: 5 MB (optional)
   - **Allowed MIME types**: `image/jpeg,image/png,image/webp,image/heic` (optional)

6. Click **Create bucket**

### 2. Set Storage Policies

The bucket needs policies to allow:
- **Crew members** to upload photos
- **Everyone** to read/view photos (public access)

#### Policy 1: Allow Public Reads

1. Go to **Storage** → **Policies** tab
2. Click **New Policy** on the `job-photos` bucket
3. Choose **Get started quickly** → **Select all**
4. Name: `Public read access for job photos`
5. Policy definition:
   ```sql
   CREATE POLICY "Public read access for job photos"
   ON storage.objects FOR SELECT
   TO public
   USING (bucket_id = 'job-photos');
   ```
6. Click **Review** → **Save policy**

#### Policy 2: Allow Authenticated Users to Upload

1. Click **New Policy** on the `job-photos` bucket
2. Name: `Authenticated users can upload job photos`
3. Allowed operation: INSERT
4. Target roles: authenticated
5. Policy definition:
   ```sql
   CREATE POLICY "Authenticated users can upload job photos"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'job-photos');
   ```
6. Click **Review** → **Save policy**

#### Policy 3: Allow Users to Update Their Own Uploads

1. Click **New Policy** on the `job-photos` bucket
2. Name: `Users can update own uploads`
3. Allowed operation: UPDATE
4. Target roles: authenticated
5. Policy definition:
   ```sql
   CREATE POLICY "Users can update own uploads"
   ON storage.objects FOR UPDATE
   TO authenticated
   USING (bucket_id = 'job-photos' AND auth.uid() = owner);
   ```
6. Click **Review** → **Save policy**

#### Policy 4: Allow Users to Delete Their Own Uploads

1. Click **New Policy** on the `job-photos` bucket
2. Name: `Users can delete own uploads`
3. Allowed operation: DELETE
4. Target roles: authenticated
5. Policy definition:
   ```sql
   CREATE POLICY "Users can delete own uploads"
   ON storage.objects FOR DELETE
   TO authenticated
   USING (bucket_id = 'job-photos' AND auth.uid() = owner);
   ```
6. Click **Review** → **Save policy**

### 3. Verify Setup

1. Go to **Storage** → **job-photos** bucket
2. Verify the bucket shows as **Public**
3. Verify all 4 policies are listed under the **Policies** tab

### 4. Get Public URL Pattern

The public URL for uploaded files will follow this pattern:
```
https://<project-ref>.supabase.co/storage/v1/object/public/job-photos/<file-path>
```

Example:
```
https://utivthfrwgtjatsusopw.supabase.co/storage/v1/object/public/job-photos/jobs/123e4567-e89b-12d3-a456-426614174000/after-1732286400000.jpg
```

## File Naming Convention

Files will be uploaded with the following structure:
```
job-photos/
  jobs/
    {job-id}/
      {photo-type}-{timestamp}.jpg
```

Example: `jobs/abc123/before-1699900000000.jpg`

## Testing

After setup, you can test by:

1. Log in as a crew member
2. Go to crew dashboard
3. Select a job
4. Upload a photo
5. Verify it appears in the Supabase Storage bucket
6. Verify the photo is visible in the client dashboard

## Troubleshooting

**Photos not uploading?**
- Check that the bucket exists and is named exactly `job-photos`
- Verify the upload policy allows authenticated users
- Check browser console for errors

**Photos not visible?**
- Check that the bucket is set to Public
- Verify the public read policy exists
- Check the photo URL is correctly formatted

**403 Forbidden errors?**
- Verify RLS policies are set correctly
- Ensure the authenticated user has valid credentials
- Check bucket permissions in Supabase Dashboard

## Security Notes

- Photos are publicly accessible (anyone with the URL can view)
- Only authenticated crew members can upload
- Users can only modify/delete their own uploads
- Consider adding file size limits to prevent abuse
- Monitor storage usage in Supabase Dashboard (free tier: 1GB)

## Cost Estimation

Supabase Free Tier:
- Storage: 1 GB (approximately 500-1000 high-quality photos)
- Bandwidth: 2 GB/month transfers

Upgrade needed when:
- More than 1GB of photos stored
- High traffic exceeds 2GB bandwidth/month

Current pricing: https://supabase.com/pricing
