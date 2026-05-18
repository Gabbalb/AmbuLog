-- AmbuLog Supabase Schema
-- Secondary Sanitary Transports Manager

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Custom Types
CREATE TYPE user_role AS ENUM ('admin', 'user');
CREATE TYPE transport_status AS ENUM ('programmati', 'attivo', 'completato', 'annullato');
CREATE TYPE transport_type_enum AS ENUM ('dimissione', 'trasferimento', 'visita', 'altro');
CREATE TYPE trip_type_enum AS ENUM ('andata', 'ritorno', 'a/r');
CREATE TYPE transport_method_enum AS ENUM ('barella', 'sedia');
CREATE TYPE payment_method_enum AS ENUM ('contanti', 'pos', 'bonifico', 'buono');
CREATE TYPE availability_status AS ENUM ('pending', 'approved', 'rejected');

-- 3. Create Users Table (extends auth.users conceptually)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role user_role NOT NULL DEFAULT 'user',
    name TEXT NOT NULL,
    pay_n TEXT UNIQUE NOT NULL, -- Matricola / Payroll number
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create Vehicles Table
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    license_plate TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL, -- e.g., 'Ambulanza', 'Auto', 'Pulmino'
    last_km INTEGER NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Create Transports Table
CREATE TABLE IF NOT EXISTS public.transports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    status transport_status NOT NULL DEFAULT 'programmati',
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    requester_name TEXT,
    requester_phone TEXT,
    transport_type transport_type_enum NOT NULL DEFAULT 'altro',
    trip_type trip_type_enum NOT NULL DEFAULT 'andata',
    
    -- Routing & Timing
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    wait_hours NUMERIC(4, 2) DEFAULT 0.00,
    
    -- Vehicle Stats
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
    km_start INTEGER DEFAULT 0,
    km_end INTEGER DEFAULT 0,
    km_total INTEGER DEFAULT 0,
    
    -- Patient Info & Logistics
    patient_name TEXT NOT NULL,
    patient_address TEXT,
    patient_phone TEXT,
    transport_method transport_method_enum NOT NULL DEFAULT 'barella',
    floor INTEGER DEFAULT 0,
    elevator BOOLEAN NOT NULL DEFAULT FALSE,
    accompanied BOOLEAN NOT NULL DEFAULT FALSE,
    weight NUMERIC(5, 2),
    oxygen TEXT DEFAULT 'No', -- 'No' or quantity like '2L/min'
    conditions TEXT,
    
    -- Billing
    client_name TEXT,
    client_phone TEXT,
    client_email TEXT,
    notes TEXT,
    receipt_number TEXT,
    cost NUMERIC(10, 2) DEFAULT 0.00,
    payment_method payment_method_enum,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Create Transport Crew Bridge Table (supports multiple members per transport)
CREATE TABLE IF NOT EXISTS public.transport_crew (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transport_id UUID NOT NULL REFERENCES public.transports(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    custom_name TEXT, -- Fallback for temporary text input
    role TEXT NOT NULL -- 'autista', 'capo_equipaggio', 'terzo'
);

-- 7. Create Shifts Table
CREATE TABLE IF NOT EXISTS public.shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    role TEXT NOT NULL DEFAULT 'capo_equipaggio', -- 'autista', 'capo_equipaggio', 'terzo'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Create Availabilities Table
CREATE TABLE IF NOT EXISTS public.availabilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status availability_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Automatic Updated At Trigger Function
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER set_timestamp_transports
BEFORE UPDATE ON public.transports
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- 10. Initial Seed Data (Useful for starting out)
INSERT INTO public.users (role, name, pay_n) VALUES
('admin', 'Centrale Operativa', 'ADMIN01'),
('user', 'Mario Rossi', 'MATR101'),
('user', 'Luca Bianchi', 'MATR102'),
('user', 'Giuseppe Verdi', 'MATR103')
ON CONFLICT (pay_n) DO NOTHING;

INSERT INTO public.vehicles (license_plate, type, last_km, active) VALUES
('AMB123XY', 'Ambulanza A', 145200, TRUE),
('AMB456ZZ', 'Ambulanza B', 89310, TRUE),
('AUTO789K', 'Fiat Doblò (Sedia)', 210150, TRUE)
ON CONFLICT (license_plate) DO NOTHING;
