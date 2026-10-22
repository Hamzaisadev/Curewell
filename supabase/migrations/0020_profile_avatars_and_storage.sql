-- 0020_profile_avatars_and_storage.sql
-- Storage bucket and profile avatar support

-- 1. Create storage bucket for profile pictures (public read, up to 5MB, common image types)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-images',
  'profile-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 2. Storage RLS policies for profile-images
drop policy if exists "Public Profile Images are viewable by everyone" on storage.objects;
create policy "Public Profile Images are viewable by everyone"
on storage.objects for select
using (bucket_id = 'profile-images');

drop policy if exists "Users can upload their own profile image" on storage.objects;
create policy "Users can upload their own profile image"
on storage.objects for insert
with check (
  bucket_id = 'profile-images'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can update their own profile image" on storage.objects;
create policy "Users can update their own profile image"
on storage.objects for update
using (
  bucket_id = 'profile-images'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can delete their own profile image" on storage.objects;
create policy "Users can delete their own profile image"
on storage.objects for delete
using (
  bucket_id = 'profile-images'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Add avatar_url column to profiles table
alter table public.profiles add column if not exists avatar_url text;
