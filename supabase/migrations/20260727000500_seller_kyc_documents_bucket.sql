insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'seller-kyc-documents',
  'seller-kyc-documents',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read seller kyc documents" on storage.objects;
create policy "Public read seller kyc documents"
on storage.objects for select
using (bucket_id = 'seller-kyc-documents');

notify pgrst, 'reload schema';
