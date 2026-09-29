create or replace function public.es_personal()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce(
    (select rol in ('operador', 'admin') from public.perfiles where id = auth.uid()),
    false
  );
$$;

create or replace function public.crear_perfil_nuevo_usuario()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.perfiles (id, nombre)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function public.crear_perfil_nuevo_usuario();

create or replace function public.preparar_nuevo_reporte()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  new.usuario_id := auth.uid();
  new.estado := 'pendiente';
  new.asignado_a := null;
  new.resuelto_at := null;
  new.codigo_seguimiento := 'RPT-' || to_char(now(), 'YYYY') || '-'
    || lpad(nextval('public.reportes_codigo_seq')::text, 6, '0');

  select prioridad_base into new.prioridad
  from public.categorias where id = new.categoria_id;

  if (select count(*) from public.reportes
      where usuario_id = auth.uid()
        and created_at > now() - interval '24 hours') >= 10 then
    raise exception 'Límite alcanzado: máximo 10 reportes en 24 horas';
  end if;

  return new;
end;
$$;

create trigger antes_de_crear_reporte
  before insert on public.reportes
  for each row execute function public.preparar_nuevo_reporte();

create or replace function public.registrar_creacion_reporte()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.historial_estados
    (reporte_id, estado_anterior, estado_nuevo, campo_cambiado, comentario, es_publico, cambiado_por)
  values
    (new.id, null, 'pendiente', 'estado', 'Reporte creado', true, new.usuario_id);
  return new;
end;
$$;

create trigger despues_de_crear_reporte
  after insert on public.reportes
  for each row execute function public.registrar_creacion_reporte();

create or replace function public.actualizar_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger antes_de_editar_reporte
  before update on public.reportes
  for each row execute function public.actualizar_updated_at();

create or replace function public.registrar_cambios_reporte()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.prioridad is distinct from old.prioridad then
    insert into public.historial_estados
      (reporte_id, campo_cambiado, valor_anterior, valor_nuevo, es_publico, cambiado_por)
    values
      (new.id, 'prioridad', old.prioridad::text, new.prioridad::text, false, auth.uid());
  end if;

  if new.categoria_id is distinct from old.categoria_id then
    insert into public.historial_estados
      (reporte_id, campo_cambiado, valor_anterior, valor_nuevo, es_publico, cambiado_por)
    values
      (new.id, 'categoria', old.categoria_id::text, new.categoria_id::text, false, auth.uid());
  end if;

  return new;
end;
$$;

create trigger despues_de_editar_reporte
  after update of prioridad, categoria_id on public.reportes
  for each row execute function public.registrar_cambios_reporte();

create or replace function public.cambiar_estado_reporte(
  p_reporte_id uuid,
  p_nuevo_estado public.estado_reporte,
  p_comentario text default null,
  p_es_publico boolean default true,
  p_asignado_a uuid default null
)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_actual public.estado_reporte;
begin
  if not public.es_personal() then
    raise exception 'No tienes permisos para cambiar el estado';
  end if;

  select estado into v_actual
  from public.reportes where id = p_reporte_id
  for update;

  if v_actual is null then
    raise exception 'Reporte no encontrado';
  end if;

  if (v_actual::text || '>' || p_nuevo_estado::text) not in (
    'pendiente>en_revision', 'pendiente>rechazado',
    'en_revision>asignado',  'en_revision>rechazado',
    'asignado>en_progreso',  'asignado>rechazado',
    'en_progreso>resuelto'
  ) then
    raise exception 'Transición no permitida: % → %', v_actual, p_nuevo_estado;
  end if;

  if p_nuevo_estado = 'rechazado' and coalesce(trim(p_comentario), '') = '' then
    raise exception 'Para rechazar debes escribir el motivo';
  end if;

  if p_nuevo_estado = 'asignado' then
    if p_asignado_a is null then
      raise exception 'Para asignar debes elegir un responsable';
    end if;
    if not exists (select 1 from public.perfiles
                   where id = p_asignado_a and rol in ('operador', 'admin')) then
      raise exception 'El responsable debe ser un operador';
    end if;
  end if;

  update public.reportes
  set estado = p_nuevo_estado,
      asignado_a = coalesce(p_asignado_a, asignado_a),
      resuelto_at = case when p_nuevo_estado = 'resuelto' then now() else resuelto_at end
  where id = p_reporte_id;

  insert into public.historial_estados
    (reporte_id, estado_anterior, estado_nuevo, campo_cambiado, comentario, es_publico, cambiado_por)
  values
    (p_reporte_id, v_actual, p_nuevo_estado, 'estado', p_comentario, p_es_publico, auth.uid());
end;
$$;

create or replace function public.consultar_por_codigo(p_codigo text)
returns json
language sql stable security definer set search_path = ''
as $$
  select json_build_object(
    'codigo', r.codigo_seguimiento,
    'titulo', r.titulo,
    'estado', r.estado,
    'categoria', c.nombre,
    'direccion', r.direccion,
    'creado', r.created_at,
    'historial', coalesce((
      select json_agg(json_build_object(
               'estado', h.estado_nuevo,
               'comentario', h.comentario,
               'fecha', h.created_at
             ) order by h.created_at)
      from public.historial_estados h
      where h.reporte_id = r.id and h.es_publico and h.campo_cambiado = 'estado'
    ), '[]'::json)
  )
  from public.reportes r
  join public.categorias c on c.id = r.categoria_id
  where r.codigo_seguimiento = upper(trim(p_codigo));
$$;