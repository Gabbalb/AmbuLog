import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Detect if we should run in Mock Mode (if key is empty or default placeholder)
export const isMockMode =
  !supabaseUrl ||
  !supabaseAnonKey ||
  supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY' ||
  supabaseUrl.includes('placeholder') ||
  typeof window === 'undefined'; // Server-side pre-rendering fallback to mock to prevent crashes during build

// --- MOCK STORAGE SCHEMES ---
const MOCK_USERS = [
  { id: 'u1', role: 'admin', name: 'Centrale Operativa (Admin)', pay_n: 'ADMIN01', created_at: new Date().toISOString() },
  { id: 'u2', role: 'user', name: 'Mario Rossi (Autista)', pay_n: 'MATR101', created_at: new Date().toISOString() },
  { id: 'u3', role: 'user', name: 'Luca Bianchi (Soccorritore)', pay_n: 'MATR102', created_at: new Date().toISOString() },
  { id: 'u4', role: 'user', name: 'Giuseppe Verdi (Terzo)', pay_n: 'MATR103', created_at: new Date().toISOString() },
];

const MOCK_VEHICLES = [
  { id: 'v1', license_plate: 'AMB123XY', type: 'Ambulanza Tipo A', last_km: 145200, active: true },
  { id: 'v2', license_plate: 'AMB456ZZ', type: 'Ambulanza Tipo B', last_km: 89310, active: true },
  { id: 'v3', license_plate: 'AUTO789K', type: 'Fiat Doblò (Sedia)', last_km: 210150, active: true },
];

const MOCK_TRANSPORTS = [
  {
    id: 't1',
    status: 'programmati',
    date: new Date().toISOString().split('T')[0],
    requester_name: 'Ospedale San Raffaele',
    requester_phone: '02-26431',
    transport_type: 'dimissione',
    trip_type: 'andata',
    origin: 'Ospedale San Raffaele, Milano',
    destination: 'Via Dante 12, Sesto San Giovanni',
    start_time: null,
    end_time: null,
    wait_hours: 0,
    vehicle_id: 'v1',
    km_start: 145200,
    km_end: 0,
    km_total: 0,
    patient_name: 'Giovanni Pascoli',
    patient_address: 'Via Dante 12, Sesto San Giovanni',
    patient_phone: '348-1234567',
    transport_method: 'barella',
    floor: 3,
    elevator: true,
    accompanied: false,
    weight: 75,
    oxygen: 'No',
    conditions: 'Stabile, necessita trasporto barellato dopo dimissione da reparto ortopedia.',
    client_name: 'Giovanni Pascoli',
    client_phone: '348-1234567',
    client_email: 'g.pascoli@email.com',
    notes: 'Suonare campanello "Pascoli-Neri"',
    receipt_number: '',
    cost: 150.00,
    payment_method: 'contanti',
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 't2',
    status: 'programmati',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    requester_name: 'Famiglia Alighieri',
    requester_phone: '06-554433',
    transport_type: 'visita',
    trip_type: 'a/r',
    origin: 'Via dei Cerchi 4, Milano',
    destination: 'Centro Clinico Auxologico, Milano',
    start_time: null,
    end_time: null,
    wait_hours: 1.5,
    vehicle_id: 'v3',
    km_start: 210150,
    km_end: 0,
    km_total: 0,
    patient_name: 'Dante Alighieri',
    patient_address: 'Via dei Cerchi 4, Milano',
    patient_phone: '333-9876543',
    transport_method: 'sedia',
    floor: 0,
    elevator: false,
    accompanied: true,
    weight: 68,
    oxygen: '2L/min',
    conditions: 'Deambulante con sedia a rotelle, necessita ossigeno a flusso continuo durante il viaggio.',
    client_name: 'Gemma Donati (Moglie)',
    client_phone: '333-9876544',
    client_email: 'gemma.d@alighieri.it',
    notes: 'Richiesta fattura intestata alla moglie.',
    receipt_number: '',
    cost: 180.00,
    payment_method: 'bonifico',
    created_at: new Date().toISOString(),
  }
];

const MOCK_SHIFTS = [
  {
    id: 's1',
    user_id: 'u2', // Mario Rossi
    vehicle_id: 'v1',
    date: new Date().toISOString().split('T')[0],
    start_time: '08:00',
    end_time: '14:00',
    role: 'autista',
  },
  {
    id: 's2',
    user_id: 'u3', // Luca Bianchi
    vehicle_id: 'v1',
    date: new Date().toISOString().split('T')[0],
    start_time: '08:00',
    end_time: '14:00',
    role: 'capo_equipaggio',
  }
];

const MOCK_AVAILABILITIES = [
  {
    id: 'a1',
    user_id: 'u2',
    date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], // 2 days later
    start_time: '08:00',
    end_time: '16:00',
    status: 'pending',
  },
  {
    id: 'a2',
    user_id: 'u3',
    date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0], // 3 days later
    start_time: '14:00',
    end_time: '20:00',
    status: 'approved',
  }
];

const MOCK_CREW = [
  { id: 'c1', transport_id: 't1', user_id: 'u2', custom_name: null, role: 'autista' },
  { id: 'c2', transport_id: 't1', user_id: 'u3', custom_name: null, role: 'capo_equipaggio' },
];

// Helper to initialize localStorage if not exists (runs on client only)
function getStorageItem<T>(key: string, initialData: T): T {
  if (typeof window === 'undefined') return initialData;
  const stored = localStorage.getItem(key);
  if (!stored) {
    localStorage.setItem(key, JSON.stringify(initialData));
    return initialData;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return initialData;
  }
}

function setStorageItem<T>(key: string, data: T): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(data));
  }
}

// Reset tool to wipe local storage mock data back to seed values
export function resetMockData() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('amb_users');
    localStorage.removeItem('amb_vehicles');
    localStorage.removeItem('amb_transports');
    localStorage.removeItem('amb_shifts');
    localStorage.removeItem('amb_availabilities');
    localStorage.removeItem('amb_crew');
    window.location.reload();
  }
}

// --- SECURE INITIALIZATION OF REAL OR MOCK CLIENT ---
const realSupabase = !isMockMode ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Mock Query Builder
class MockQueryBuilder {
  private tableName: string;
  private filters: Array<(item: any) => boolean> = [];
  private orderField: string | null = null;
  private orderAscending = true;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  private getData() {
    switch (this.tableName) {
      case 'users':
        return getStorageItem('amb_users', MOCK_USERS);
      case 'vehicles':
        return getStorageItem('amb_vehicles', MOCK_VEHICLES);
      case 'transports':
        return getStorageItem('amb_transports', MOCK_TRANSPORTS);
      case 'shifts':
        return getStorageItem('amb_shifts', MOCK_SHIFTS);
      case 'availabilities':
        return getStorageItem('amb_availabilities', MOCK_AVAILABILITIES);
      case 'transport_crew':
        return getStorageItem('amb_crew', MOCK_CREW);
      default:
        return [];
    }
  }

  private saveData(data: any[]) {
    switch (this.tableName) {
      case 'users':
        setStorageItem('amb_users', data);
        break;
      case 'vehicles':
        setStorageItem('amb_vehicles', data);
        break;
      case 'transports':
        setStorageItem('amb_transports', data);
        break;
      case 'shifts':
        setStorageItem('amb_shifts', data);
        break;
      case 'availabilities':
        setStorageItem('amb_availabilities', data);
        break;
      case 'transport_crew':
        setStorageItem('amb_crew', data);
        break;
    }
  }

  select(columns?: string) {
    // Returns this builder for chaining (e.g. eq(), order())
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push((item) => {
      // Direct comparison, but also supports matching nested or related structures roughly
      return item[column] === value;
    });
    return this;
  }

  neq(column: string, value: any) {
    this.filters.push((item) => item[column] !== value);
    return this;
  }

  order(column: string, { ascending = true } = {}) {
    this.orderField = column;
    this.orderAscending = ascending;
    return this;
  }

  // Chain finisher: executes selection and returns result
  async then(resolve: any) {
    let list = [...this.getData()];
    for (const filter of this.filters) {
      list = list.filter(filter);
    }

    if (this.orderField) {
      const field = this.orderField;
      list.sort((a: any, b: any) => {
        const valA = a[field] ?? '';
        const valB = b[field] ?? '';
        if (valA < valB) return this.orderAscending ? -1 : 1;
        if (valA > valB) return this.orderAscending ? 1 : -1;
        return 0;
      });
    }

    // Embed relations on high level (simulate join for crew and vehicles on transports)
    if (this.tableName === 'transports') {
      const vehicles = getStorageItem('amb_vehicles', MOCK_VEHICLES);
      const crew = getStorageItem('amb_crew', MOCK_CREW);
      const users = getStorageItem('amb_users', MOCK_USERS);
      
      list = list.map((t: any) => {
        const vehicle = vehicles.find((v: any) => v.id === t.vehicle_id) || null;
        const transportCrew = crew
          .filter((c: any) => c.transport_id === t.id)
          .map((c: any) => {
            const user = users.find((u: any) => u.id === c.user_id) || null;
            return {
              ...c,
              user,
            };
          });
        return {
          ...t,
          vehicles: vehicle,
          transport_crew: transportCrew
        };
      });
    }

    if (this.tableName === 'shifts') {
      const users = getStorageItem('amb_users', MOCK_USERS);
      const vehicles = getStorageItem('amb_vehicles', MOCK_VEHICLES);
      list = list.map((s: any) => ({
        ...s,
        users: users.find((u: any) => u.id === s.user_id) || null,
        vehicles: vehicles.find((v: any) => v.id === s.vehicle_id) || null,
      }));
    }

    if (this.tableName === 'availabilities') {
      const users = getStorageItem('amb_users', MOCK_USERS);
      list = list.map((a: any) => ({
        ...a,
        users: users.find((u: any) => u.id === a.user_id) || null,
      }));
    }

    return resolve({ data: list, error: null });
  }

  async insert(values: any | any[]) {
    const list = this.getData();
    const isArray = Array.isArray(values);
    const toInsert = isArray ? values : [values];
    
    const inserted = toInsert.map((item: any) => {
      const newItem = {
        id: item.id || `mock_${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString(),
        ...item,
      };
      list.push(newItem);
      return newItem;
    });

    this.saveData(list);

    // If it's a transport, automatically update vehicle starting odometer if km_end is provided
    if (this.tableName === 'transports') {
      const vehicles = getStorageItem('amb_vehicles', MOCK_VEHICLES);
      inserted.forEach((t: any) => {
        if (t.vehicle_id && t.km_end > 0) {
          const vIdx = vehicles.findIndex(v => v.id === t.vehicle_id);
          if (vIdx !== -1) {
            vehicles[vIdx].last_km = t.km_end;
          }
        }
      });
      setStorageItem('amb_vehicles', vehicles);
    }

    return { data: isArray ? inserted : inserted[0], error: null };
  }

  async update(values: any) {
    const list = this.getData();
    let updatedItems: any[] = [];

    // Apply filters to find items to update
    const updatedList = list.map((item: any) => {
      let matches = true;
      for (const filter of this.filters) {
        if (!filter(item)) {
          matches = false;
          break;
        }
      }

      if (matches) {
        const updatedItem = { ...item, ...values, updated_at: new Date().toISOString() };
        updatedItems.push(updatedItem);
        return updatedItem;
      }
      return item;
    });

    this.saveData(updatedList);

    // Odometer synchronization on transport completion
    if (this.tableName === 'transports' && values.km_end > 0) {
      const vehicles = getStorageItem('amb_vehicles', MOCK_VEHICLES);
      updatedItems.forEach((t: any) => {
        if (t.vehicle_id) {
          const vIdx = vehicles.findIndex(v => v.id === t.vehicle_id);
          if (vIdx !== -1) {
            vehicles[vIdx].last_km = t.km_end;
          }
        }
      });
      setStorageItem('amb_vehicles', vehicles);
    }

    return { data: updatedItems, error: null };
  }

  async delete() {
    const list = this.getData();
    const remaining = list.filter((item: any) => {
      let matches = true;
      for (const filter of this.filters) {
        if (!filter(item)) {
          matches = false;
          break;
        }
      }
      return !matches; // Keep items that DO NOT match filters
    });

    this.saveData(remaining);
    return { data: null, error: null };
  }
}

// Mock Supabase SDK Client Wrapper
const mockSupabase = {
  from(tableName: string) {
    return new MockQueryBuilder(tableName);
  },
  auth: {
    async getUser() {
      // Mock log in as Admin by default or custom active crew user
      if (typeof window !== 'undefined') {
        const storedCrew = localStorage.getItem('amb_active_crew');
        if (storedCrew) {
          const parsed = JSON.parse(storedCrew);
          // Return role based on crew
          const users = getStorageItem('amb_users', MOCK_USERS);
          const found = users.find((u: any) => u.id === parsed.ceId || u.id === parsed.aId);
          if (found) {
            return { data: { user: { id: found.id, email: `${found.name.toLowerCase().replace(/\s/g, '')}@ambulog.it`, user_metadata: { role: found.role, name: found.name } } }, error: null };
          }
        }
      }
      return { data: { user: { id: 'u1', email: 'centrale@ambulog.it', user_metadata: { role: 'admin', name: 'Centrale Operativa' } } }, error: null };
    },
    async signOut() {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('amb_active_crew');
      }
      return { error: null };
    }
  }
};

// Export active client instance
export const supabase = isMockMode ? (mockSupabase as any) : realSupabase!;
