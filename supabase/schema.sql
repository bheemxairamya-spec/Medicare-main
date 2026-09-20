-- Supabase SQL Schema for Medicare ESP32 Hardware Integration
-- Run this script in the Supabase SQL Editor to create tables and indexes.

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Volunteers table (if not already existing in Supabase)
create table if not exists public.volunteers (
    id text primary key default gen_random_uuid()::text,
    name text not null,
    dob text,
    gender text default 'Female',
    blood_group text not null,
    mobile text,
    email text,
    location text,
    status text default 'pending',
    created_at timestamptz default now()
);

-- Hardware readings table
create table if not exists public.hardware_readings (
    id text primary key default gen_random_uuid()::text,
    volunteer_id text references public.volunteers(id) on delete set null,
    volunteer_name text,
    user_id text,                                         -- Generic user / patient ID
    user_name text,                                       -- Generic user / patient name
    device_id text not null default 'ESP32-MEDICARE-01',
    alcohol_level numeric(6, 3) not null default 0.000,   -- MQ-3 Alcohol BAC / ppm
    air_quality_index numeric(6, 1) not null default 45.0, -- MQ-135 Air Quality Index (AQI)
    weight_kg numeric(5, 2) not null default 65.00,       -- HX711 + Load Cell Weight in kg
    heart_rate_bpm integer not null default 75,           -- MAX30102 Heart Rate (BPM)
    body_temp_c numeric(4, 2) not null default 36.80,     -- DS18B20 Core Body Temperature in °C
    spo2_percent numeric(5, 2) not null default 98.50,    -- MAX30102 Red/IR SpO2 Saturation %
    recorded_at timestamptz not null default now(),
    is_eligible boolean default true,
    status text default 'pass',                           -- 'pass' | 'review' | 'fail'
    flagged_reasons text default ''
);

-- Indexes for fast querying
create index if not exists idx_hardware_readings_volunteer_id on public.hardware_readings(volunteer_id);
create index if not exists idx_hardware_readings_user_id on public.hardware_readings(user_id);
create index if not exists idx_hardware_readings_recorded_at on public.hardware_readings(recorded_at desc);
create index if not exists idx_hardware_readings_device_id on public.hardware_readings(device_id);

-- Enable Row Level Security (RLS)
alter table public.volunteers enable row level security;
alter table public.hardware_readings enable row level security;

-- Permissive policies for anon / authenticated access in prototype
create policy "Allow all read access to hardware_readings"
    on public.hardware_readings for select using (true);

create policy "Allow all insert access to hardware_readings"
    on public.hardware_readings for insert with check (true);

create policy "Allow all update access to hardware_readings"
    on public.hardware_readings for update using (true);

create policy "Allow all read access to volunteers"
    on public.volunteers for select using (true);

create policy "Allow all insert access to volunteers"
    on public.volunteers for insert with check (true);

create policy "Allow all update access to volunteers"
    on public.volunteers for update using (true);
