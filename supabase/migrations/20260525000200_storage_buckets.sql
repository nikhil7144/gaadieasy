insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'vehicle-media',
    'vehicle-media',
    true,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
  ),
  (
    'brand-logos',
    'brand-logos',
    true,
    3145728,
    array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
  ),
  (
    'dealer-logos',
    'dealer-logos',
    true,
    3145728,
    array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
  ),
  (
    'hero-promotions',
    'hero-promotions',
    true,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
  ),
  (
    'seo-images',
    'seo-images',
    true,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
  ),
  (
    'vehicle-documents',
    'vehicle-documents',
    false,
    10485760,
    array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
  )
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read vehicle media" on storage.objects;
create policy "Public read vehicle media"
on storage.objects for select
using (bucket_id = 'vehicle-media');

drop policy if exists "Public read brand logos" on storage.objects;
create policy "Public read brand logos"
on storage.objects for select
using (bucket_id = 'brand-logos');

drop policy if exists "Public read dealer logos" on storage.objects;
create policy "Public read dealer logos"
on storage.objects for select
using (bucket_id = 'dealer-logos');

drop policy if exists "Public read hero promotions" on storage.objects;
create policy "Public read hero promotions"
on storage.objects for select
using (bucket_id = 'hero-promotions');

drop policy if exists "Public read seo images" on storage.objects;
create policy "Public read seo images"
on storage.objects for select
using (bucket_id = 'seo-images');

notify pgrst, 'reload schema';
