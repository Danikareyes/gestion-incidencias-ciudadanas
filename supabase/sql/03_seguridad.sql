alter table public.perfiles enable row level security;
alter table public.categorias enable row level security;
alter table public.reportes enable row level security;
alter table public.fotos_reporte enable row level security;
alter table public.historial_estados enable row level security;

create policy "Ver mi perfil, o todos si soy personal"
  on public.perfiles for select to authenticated
  using (id = auth.uid() or public.es_personal());

create policy "Editar mi propio perfil"
  on public.perfiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

revoke update on public.perfiles from authenticated, anon;
grant update (nombre, telefono) on public.perfiles to authenticated;

create policy "Categorías activas visibles para todos"
  on public.categorias for select to anon, authenticated
  using (activa or public.es_personal());

create policy "Ciudadanos registrados crean reportes"
  on public.reportes for insert to authenticated
  with check (usuario_id = auth.uid());

create policy "Ver mis reportes, o todos si soy personal"
  on public.reportes for select to authenticated
  using (usuario_id = auth.uid() or public.es_personal());

create policy "Personal edita reportes"
  on public.reportes for update to authenticated
  using (public.es_personal()) with check (public.es_personal());

revoke update on public.reportes from authenticated, anon;
grant update (prioridad, categoria_id) on public.reportes to authenticated;

create view public.v_reportes_publicos as
  select id, codigo_seguimiento, categoria_id, titulo, lat, lng,
         direccion, estado, prioridad, created_at
  from public.reportes
  where estado <> 'rechazado';

grant select on public.v_reportes_publicos to anon, authenticated;

create policy "Ver fotos de mis reportes, o todas si soy personal"
  on public.fotos_reporte for select to authenticated
  using (
    public.es_personal()
    or exists (select 1 from public.reportes r
               where r.id = reporte_id and r.usuario_id = auth.uid())
  );

create policy "Subir fotos de evidencia o de resolución"
  on public.fotos_reporte for insert to authenticated
  with check (
    (tipo = 'evidencia' and exists (
       select 1 from public.reportes r
       where r.id = reporte_id and r.usuario_id = auth.uid() and r.estado = 'pendiente'))
    or (tipo = 'resolucion' and public.es_personal())
  );

create policy "Ver historial de mis reportes, o todo si soy personal"
  on public.historial_estados for select to authenticated
  using (
    public.es_personal()
    or (es_publico and exists (
          select 1 from public.reportes r
          where r.id = reporte_id and r.usuario_id = auth.uid()))
  );