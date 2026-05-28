insert into storage.buckets (id,name,public) values ('scenario-audio','scenario-audio',false) on conflict do nothing;
create policy "owner read audio" on storage.objects for select using (bucket_id='scenario-audio' and split_part(name,'/',1)=auth.uid()::text);
create policy "owner insert audio" on storage.objects for insert with check (bucket_id='scenario-audio' and split_part(name,'/',1)=auth.uid()::text);
create policy "owner update audio" on storage.objects for update using (bucket_id='scenario-audio' and split_part(name,'/',1)=auth.uid()::text);
create policy "owner delete audio" on storage.objects for delete using (bucket_id='scenario-audio' and split_part(name,'/',1)=auth.uid()::text);
