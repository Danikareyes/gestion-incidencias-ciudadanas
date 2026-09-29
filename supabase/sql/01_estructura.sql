create extension if not exists postgis with schema extensions;

create type public.rol_usuario as enum ('ciudadano', 'operador', 'admin');
create type public.estado_reporte as enum ('pendiente', 'en_revision', 'asignado', 'en_progreso', 'resuelto', 'rechazado');
create type public.prioridad as enum ('baja', 'media', 'alta', 'critica');
create type public.tipo_foto as enum ('evidencia', 'resolucion');

create table public.perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  telefono text,
  rol public.rol_usuario not null default 'ciudadano',
  created_at timestamptz not null default now()
);

create table public.categorias (
  id serial primary key,
  nombre text not null unique,
  descripcion text,
  icono text,
  color text,
  prioridad_base public.prioridad not null default 'media',
  es_riesgo boolean not null default false,
  activa boolean not null default true
);

create sequence public.reportes_codigo_seq;

create table public.reportes (
  id uuid primary key default gen_random_uuid(),
  codigo_seguimiento text unique,
  usuario_id uuid not null references public.perfiles(id),
  categoria_id int not null references public.categorias(id),
  titulo text not null check (char_length(titulo) between 5 and 100),
  descripcion text not null check (char_length(descripcion) between 10 and 1000),
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  ubicacion extensions.geography(point, 4326)
    generated always as (
      extensions.st_setsrid(extensions.st_makepoint(lng, lat), 4326)::extensions.geography
    ) stored,
  direccion text,
  estado public.estado_reporte not null default 'pendiente',
  prioridad public.prioridad not null default 'media',
  asignado_a uuid references public.perfiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resuelto_at timestamptz
);

create index reportes_ubicacion_idx on public.reportes using gist (ubicacion);
create index reportes_estado_idx on public.reportes (estado, prioridad);
create index reportes_usuario_idx on public.reportes (usuario_id);

create table public.fotos_reporte (
  id uuid primary key default gen_random_uuid(),
  reporte_id uuid not null references public.reportes(id) on delete cascade,
  storage_path text not null,
  tipo public.tipo_foto not null default 'evidencia',
  created_at timestamptz not null default now()
);

create index fotos_reporte_reporte_idx on public.fotos_reporte (reporte_id);

create table public.historial_estados (
  id bigint generated always as identity primary key,
  reporte_id uuid not null references public.reportes(id) on delete cascade,
  estado_anterior public.estado_reporte,
  estado_nuevo public.estado_reporte,
  campo_cambiado text not null default 'estado',
  valor_anterior text,
  valor_nuevo text,
  comentario text,
  es_publico boolean not null default true,
  cambiado_por uuid references public.perfiles(id),
  created_at timestamptz not null default now()
);

create index historial_reporte_idx on public.historial_estados (reporte_id);