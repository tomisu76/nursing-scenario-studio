alter table public.studio_scenarios enable row level security;alter table public.studio_slides enable row level security;alter table public.studio_audio_assets enable row level security;alter table public.studio_voice_profiles enable row level security;alter table public.studio_audio_generation_jobs enable row level security;
create policy "public published scenarios" on public.studio_scenarios for select using (is_published=true);
create policy "owner scenarios all" on public.studio_scenarios for all using (auth.uid()=owner_id) with check (auth.uid()=owner_id);
create policy "public published slides" on public.studio_slides for select using (exists(select 1 from public.studio_scenarios s where s.id=scenario_id and s.is_published=true));
create policy "owner slides all" on public.studio_slides for all using (exists(select 1 from public.studio_scenarios s where s.id=scenario_id and s.owner_id=auth.uid()));
create policy "public published assets" on public.studio_audio_assets for select using (exists(select 1 from public.studio_scenarios s where s.id=scenario_id and s.is_published=true));
create policy "owner assets all" on public.studio_audio_assets for all using (auth.uid()=owner_id) with check (auth.uid()=owner_id);
create policy "owner voice profiles all" on public.studio_voice_profiles for all using (auth.uid()=owner_id) with check (auth.uid()=owner_id);
create policy "owner generation jobs all" on public.studio_audio_generation_jobs for all using (exists(select 1 from public.studio_scenarios s where s.id=scenario_id and s.owner_id=auth.uid()));
