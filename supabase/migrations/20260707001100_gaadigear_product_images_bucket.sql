insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'gear-product-images',
  'gear-product-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read gear product images" on storage.objects;
create policy "Public read gear product images"
on storage.objects for select
using (bucket_id = 'gear-product-images');

notify pgrst, 'reload schema';
