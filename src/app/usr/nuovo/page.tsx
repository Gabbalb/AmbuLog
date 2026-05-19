'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  MapPin, 
  Calendar, 
  Truck, 
  Users, 
  Activity, 
  UserCheck, 
  CreditCard,
  ChevronDown
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import FormField from '@/components/FormField';

// Autosuggestions list for frequent places
const FREQUENT_PLACES = [
  'Ospedale San Raffaele, Milano',
  'Ospedale Niguarda Ca Granda, Milano',
  'Istituto Clinico Humanitas, Rozzano',
  'Fondazione IRCCS Ca Granda Ospedale Maggiore Policlinico, Milano',
  'Centro Clinico Auxologico, Milano',
  'Ospedale Luigi Sacco, Milano',
  'Ospedale San Paolo, Milano',
  'Ospedale San Carlo Borromeo, Milano',
  'Ospedale Bassini, Cinisello Balsamo',
  'Ospedale Multimedica, Sesto San Giovanni',
  'Ospedale di Desio',
  'Ospedale San Gerardo, Monza',
  'Pio Albergo Trivulzio, Milano',
  'Clinica Columbus, Milano',
  'Clinica Madonnina, Milano',
];

function TransportFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const transportId = searchParams.get('id');

  const [activeCrew, setActiveCrew] = useState<any>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [openSections, setOpenSections] = useState({
    s1: true,
    s2: false,
    s3: false,
    s4: false,
  });
  const [isPatientLogisticsOpen, setIsPatientLogisticsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    // Section 1: Info Servizio & Equipaggio
    date: new Date().toISOString().split('T')[0],
    vehicle_id: '',
    driver_name: '', // A
    ce_name: '',     // CE
    third_name: '',  // Terzo
    requester_name: '',
    requester_phone: '',
    transport_type: 'altro',
    trip_type: 'andata',

    // Section 2: Percorso & Orari
    origin: '',
    destination: '',
    start_time: '',
    end_time: '',
    wait_hours: 0,
    km_start: 0,
    km_end: 0,
    km_total: 0,

    // Sub-section Dati Paziente & Logistica (nested in Section 2)
    patient_name: '',
    patient_address: '',
    patient_phone: '',
    transport_method: 'barella',
    floor: 0,
    elevator: false,
    accompanied: false,
    weight: '',
    oxygen: false,
    oxygen_qty: '',
    conditions: '',

    // Section 3: Dati Cliente (Fatturazione)
    is_client_different: false,
    client_name: '',
    client_phone: '',
    client_email: '',
    notes: '',

    // Section 4: Chiusura
    receipt_number: '',
    cost: '',
    payment_method: 'contanti',
  });

  // Calculate Km total dynamically on mileage changes
  useEffect(() => {
    const kStart = Number(formData.km_start) || 0;
    const kEnd = Number(formData.km_end) || 0;
    if (kEnd >= kStart) {
      setFormData(prev => ({ ...prev, km_total: kEnd - kStart }));
    } else {
      setFormData(prev => ({ ...prev, km_total: 0 }));
    }
  }, [formData.km_start, formData.km_end]);

  useEffect(() => {
    // 1. Get active crew configuration
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('amb_active_crew');
      if (stored) {
        const crew = JSON.parse(stored);
        setActiveCrew(crew);
        setFormData(prev => ({
          ...prev,
          vehicle_id: crew.vehicleId,
          driver_name: crew.aName,
          ce_name: crew.ceName,
          third_name: crew.thirdName || '',
        }));

        // Set starting km based on vehicle last odometer
        const loadStartingKm = async () => {
          const { data } = await supabase.from('vehicles').select('last_km').eq('id', crew.vehicleId);
          if (data && data[0]) {
            setFormData(prev => ({ ...prev, km_start: data[0].last_km }));
          }
        };
        loadStartingKm();
      }
    }

    // 2. Load vehicles & users
    const loadSetupData = async () => {
      const { data: vList } = await supabase.from('vehicles').select('*');
      const { data: uList } = await supabase.from('users').select('*');
      if (vList) setVehicles(vList);
      if (uList) setUsers(uList);
    };
    loadSetupData();

    // 3. Load transport data if ID provided (editing or completing a scheduled booking)
    const loadSelectedTransport = async () => {
      if (!transportId) return;
      setLoading(true);
      
      const { data, error } = await supabase
        .from('transports')
        .select('*')
        .eq('id', transportId)
        .single();
      
      if (data) {
        // Find crew members associated with it
        const { data: crewMembers } = await supabase
          .from('transport_crew')
          .select('*')
          .eq('transport_id', transportId);

        let driver = '';
        let ce = '';
        let third = '';

        if (crewMembers) {
          const uData = await supabase.from('users').select('*');
          const usersList = uData.data || [];
          
          crewMembers.forEach((c: any) => {
            const userObj = usersList.find((u: any) => u.id === c.user_id);
            const name = userObj ? userObj.name : (c.custom_name || '');
            if (c.role === 'autista') driver = name;
            else if (c.role === 'capo_equipaggio') ce = name;
            else if (c.role === 'terzo') third = name;
          });
        }

        let sTime = '';
        let eTime = '';
        if (data.start_time) {
          sTime = new Date(data.start_time).toTimeString().substring(0, 5);
        }
        if (data.end_time) {
          eTime = new Date(data.end_time).toTimeString().substring(0, 5);
        }

        setFormData(prev => ({
          ...prev,
          date: data.date || prev.date,
          vehicle_id: data.vehicle_id || prev.vehicle_id,
          driver_name: driver || prev.driver_name,
          ce_name: ce || prev.ce_name,
          third_name: third || prev.third_name,
          requester_name: data.requester_name || '',
          requester_phone: data.requester_phone || '',
          transport_type: data.transport_type || 'altro',
          trip_type: data.trip_type || 'andata',
          origin: data.origin || '',
          destination: data.destination || '',
          start_time: sTime,
          end_time: eTime,
          wait_hours: Number(data.wait_hours) || 0,
          km_start: Number(data.km_start) || prev.km_start,
          km_end: Number(data.km_end) || 0,
          km_total: Number(data.km_total) || 0,
          patient_name: data.patient_name || '',
          patient_address: data.patient_address || '',
          patient_phone: data.patient_phone || '',
          transport_method: data.transport_method || 'barella',
          floor: Number(data.floor) || 0,
          elevator: !!data.elevator,
          accompanied: !!data.accompanied,
          weight: data.weight ? String(data.weight) : '',
          oxygen: data.oxygen !== 'No',
          oxygen_qty: data.oxygen !== 'No' ? data.oxygen : '',
          conditions: data.conditions || '',
          is_client_different: !!(data.client_name && data.client_name !== data.patient_name),
          client_name: data.client_name || '',
          client_phone: data.client_phone || '',
          client_email: data.client_email || '',
          notes: data.notes || '',
          receipt_number: data.receipt_number || '',
          cost: data.cost ? String(data.cost) : '',
          payment_method: data.payment_method || 'contanti',
        }));
      }
      setLoading(false);
    };

    loadSelectedTransport();
  }, [transportId]);

  const toggleSection = (section: 's1' | 's2' | 's3' | 's4') => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleNextSection = (current: 's1' | 's2' | 's3', next: 's2' | 's3' | 's4') => {
    if (current === 's1') {
      if (!formData.date || !formData.vehicle_id || !formData.driver_name || !formData.ce_name) {
        alert('I campi di data, mezzo e membri dell\'equipaggio (Autista e Capo Equipaggio) sono obbligatori!');
        return;
      }
    }

    if (current === 's2') {
      if (!formData.origin || !formData.destination) {
        alert('Luogo di Partenza e Luogo di Arrivo sono obbligatori!');
        return;
      }
      if (!formData.start_time || !formData.end_time) {
        alert('Ora Inizio e Ora Fine sono obbligatorie!');
        return;
      }
      if (!formData.km_end || Number(formData.km_end) <= 0) {
        alert('I Chilometri Finali sono obbligatori e devono essere maggiori di 0!');
        return;
      }
      if (formData.km_end > 0 && formData.km_end < formData.km_start) {
        alert('I Chilometri Finali non possono essere inferiori a quelli Iniziali!');
        return;
      }
    }

    setOpenSections(prev => ({
      ...prev,
      [current]: false,
      [next]: true
    }));

    setTimeout(() => {
      const el = document.getElementById(`section-header-${next}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Final validations before submitting
    if (!formData.date || !formData.vehicle_id || !formData.driver_name || !formData.ce_name) {
      alert('I campi dell\'equipaggio (Data, Mezzo, Autista, Capo Equipaggio) sono obbligatori!');
      setOpenSections(p => ({ ...p, s1: true }));
      return;
    }
    if (!formData.origin || !formData.destination) {
      alert('Luogo di Partenza e Luogo di Arrivo sono obbligatori!');
      setOpenSections(p => ({ ...p, s2: true }));
      return;
    }
    if (!formData.start_time || !formData.end_time) {
      alert('Ora Inizio e Ora Fine sono obbligatorie!');
      setOpenSections(p => ({ ...p, s2: true }));
      return;
    }
    if (!formData.km_end || Number(formData.km_end) <= 0) {
      alert('I Chilometri Finali sono obbligatori e devono essere maggiori di 0!');
      setOpenSections(p => ({ ...p, s2: true }));
      return;
    }
    if (formData.km_end > 0 && formData.km_end < formData.km_start) {
      alert('I Chilometri Finali non possono essere inferiori a quelli Iniziali!');
      setOpenSections(p => ({ ...p, s2: true }));
      return;
    }
    if (formData.is_client_different && !formData.client_name) {
      alert('Inserisci il Nome del Cliente pagante!');
      setOpenSections(p => ({ ...p, s3: true }));
      return;
    }
    if (formData.is_client_different && formData.client_email && !formData.client_email.includes('@')) {
      alert('Inserisci un indirizzo Email valido per l\'invio della fattura!');
      setOpenSections(p => ({ ...p, s3: true }));
      return;
    }

    setLoading(true);

    try {
      // Build datetimes for start/end
      let startTimestamp = null;
      let endTimestamp = null;
      if (formData.start_time) {
        startTimestamp = new Date(`${formData.date}T${formData.start_time}:00`).toISOString();
      }
      if (formData.end_time) {
        endTimestamp = new Date(`${formData.date}T${formData.end_time}:00`).toISOString();
      }

      const cleanPatientName = formData.patient_name.trim() || '-';
      const cleanOrigin = formData.origin.trim() || '-';
      const cleanDestination = formData.destination.trim() || '-';

      const dbPayload = {
        status: 'completato' as const, // Save directly as completed from mobile
        date: formData.date,
        requester_name: formData.requester_name || null,
        requester_phone: formData.requester_phone || null,
        transport_type: formData.transport_type as any,
        trip_type: formData.trip_type as any,
        origin: cleanOrigin,
        destination: cleanDestination,
        start_time: startTimestamp,
        end_time: endTimestamp,
        wait_hours: Number(formData.wait_hours) || 0,
        vehicle_id: formData.vehicle_id || null,
        km_start: Number(formData.km_start) || 0,
        km_end: Number(formData.km_end) || 0,
        km_total: Number(formData.km_total) || 0,
        patient_name: cleanPatientName,
        patient_address: formData.patient_address || null,
        patient_phone: formData.patient_phone || null,
        transport_method: formData.transport_method as any,
        floor: Number(formData.floor) || 0,
        elevator: formData.elevator,
        accompanied: formData.accompanied,
        weight: formData.weight ? Number(formData.weight) : null,
        oxygen: formData.oxygen ? (formData.oxygen_qty || 'Sì') : 'No',
        conditions: formData.conditions || null,
        client_name: formData.is_client_different ? (formData.client_name || cleanPatientName) : cleanPatientName,
        client_phone: formData.is_client_different ? formData.client_phone : null,
        client_email: formData.is_client_different ? formData.client_email : null,
        notes: formData.notes || null,
        receipt_number: formData.receipt_number || null,
        cost: formData.cost ? Number(formData.cost) : 0,
        payment_method: formData.payment_method as any,
      };

      let insertedId = transportId;

      if (transportId) {
        // 1. Update existing scheduled/active transport
        await supabase.from('transports').update(dbPayload).eq('id', transportId);
      } else {
        // 2. Insert new "a chiamata" transport
        const { data, error } = await supabase.from('transports').insert(dbPayload).select().single();
        if (data) insertedId = data.id;
      }

      // 3. Keep crew members bridged
      if (insertedId) {
        await supabase.from('transport_crew').delete().eq('transport_id', insertedId);
        
        // Match names to registered users to insert their actual ID, or default to custom_name
        const crewInsertions = [];
        
        const dObj = users.find(u => u.name === formData.driver_name);
        crewInsertions.push({
          transport_id: insertedId,
          user_id: dObj ? dObj.id : null,
          custom_name: dObj ? null : formData.driver_name,
          role: 'autista'
        });

        const ceObj = users.find(u => u.name === formData.ce_name);
        crewInsertions.push({
          transport_id: insertedId,
          user_id: ceObj ? ceObj.id : null,
          custom_name: ceObj ? null : formData.ce_name,
          role: 'capo_equipaggio'
        });

        if (formData.third_name) {
          const tObj = users.find(u => u.name === formData.third_name);
          crewInsertions.push({
            transport_id: insertedId,
            user_id: tObj ? tObj.id : null,
            custom_name: tObj ? null : formData.third_name,
            role: 'terzo'
          });
        }

        await supabase.from('transport_crew').insert(crewInsertions);
      }

      alert('Trasporto completato e archiviato con successo!');
      router.push('/usr');
    } catch (err) {
      console.error(err);
      alert('Errore durante la chiusura del trasporto.');
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercentage = () => {
    // 9 Key fields for complete compilation status
    const keyFields = [
      formData.date,
      formData.vehicle_id,
      formData.driver_name,
      formData.ce_name,
      formData.origin,
      formData.destination,
      formData.start_time,
      formData.end_time,
      formData.km_end ? 'filled' : '',
    ];
    const filled = keyFields.filter(Boolean).length;
    return Math.round((filled / keyFields.length) * 100);
  };

  if (loading && !formData.vehicle_id) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-teal-600 border-slate-200"></div>
        <p className="mt-3 text-sm font-semibold">Caricamento scheda...</p>
      </div>
    );
  }

  const vOptions = vehicles.map(v => ({ value: v.id, label: `${v.license_plate} - ${v.type}` }));

  return (
    <div className="flex flex-col gap-6">
      {/* Back button and title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            if (confirm('Sicuro di voler abbandonare la compilazione? I dati non salvati andranno persi.')) {
              router.push('/usr');
            }
          }}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-700 shadow-sm active:scale-95 transition"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
        </button>
        <div>
          <h2 className="text-xl font-bold tracking-tight">
            {transportId ? 'Compila Trasporto' : 'Nuovo Trasporto'}
          </h2>
          <p className="text-[11px] text-slate-400">Digitalizzazione Foglio Servizio</p>
        </div>
      </div>

      {/* Modern Progress Indicator */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600/10 text-teal-600 dark:text-teal-400">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Digitalizzazione Foglio</span>
              <h4 className="text-xs font-bold text-slate-800 dark:text-white mt-0.2">
                Stato di Compilazione Scheda
              </h4>
            </div>
          </div>
          <span className="text-sm font-extrabold text-teal-600 dark:text-teal-400">{getProgressPercentage()}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
          <div 
            className="h-full bg-teal-600 transition-all duration-300 rounded-full" 
            style={{ width: `${getProgressPercentage()}%` }}
          ></div>
        </div>
      </div>

      {/* Accordion Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        
        {/* SECTION 1: EQUIPAGGIO E SERVIZIO */}
        <div id="section-header-s1" className="glass-panel rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 transition">
          {/* Header */}
          <button
            type="button"
            onClick={() => toggleSection('s1')}
            className="w-full flex items-center justify-between p-5 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-left hover:bg-slate-100/50 dark:hover:bg-slate-850/50 transition"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600/10 text-teal-600 dark:text-teal-400">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                  1. Equipaggio e Servizio
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {formData.driver_name ? `${formData.driver_name} • ${formData.ce_name || 'CE'}` : 'Inserisci i membri dell\'equipaggio'}
                </p>
              </div>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 text-slate-450 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 bg-white dark:bg-slate-900">
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${openSections.s1 ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {/* Content */}
          {openSections.s1 && (
            <div className="p-5 flex flex-col gap-4 animate-slide-in">
              <FormField
                label="Data Servizio"
                id="f-date"
                type="date"
                value={formData.date}
                onChange={(val) => setFormData(p => ({ ...p, date: val }))}
                required
              />

              <FormField
                label="Mezzo Utilizzato"
                id="f-vehicle"
                type="select"
                value={formData.vehicle_id}
                onChange={(val) => setFormData(p => ({ ...p, vehicle_id: val }))}
                options={vOptions}
                required
              />

              <FormField
                label="Autista"
                id="f-driver"
                type="text"
                value={formData.driver_name}
                onChange={(val) => setFormData(p => ({ ...p, driver_name: val }))}
                suggestions={users.map(u => u.name)}
                required
              />

              <FormField
                label="Capo Equipaggio"
                id="f-ce"
                type="text"
                value={formData.ce_name}
                onChange={(val) => setFormData(p => ({ ...p, ce_name: val }))}
                suggestions={users.map(u => u.name)}
                required
              />

              <FormField
                label="Terzo Soccorritore"
                id="f-third"
                type="text"
                value={formData.third_name}
                onChange={(val) => setFormData(p => ({ ...p, third_name: val }))}
                suggestions={users.map(u => u.name)}
                placeholder="Opzionale"
              />

              <h3 className="text-sm font-bold border-b pb-2 mt-4 text-slate-800 dark:text-slate-100 uppercase tracking-wider">Richiedente & Paziente</h3>
              
              <FormField
                label="Nome Richiedente"
                id="f-req-name"
                value={formData.requester_name}
                onChange={(val) => setFormData(p => ({ ...p, requester_name: val }))}
                placeholder="Es: Ospedale Niguarda"
              />

              <FormField
                label="Telefono Richiedente"
                id="f-req-phone"
                type="tel"
                value={formData.requester_phone}
                onChange={(val) => setFormData(p => ({ ...p, requester_phone: val }))}
                placeholder="Numero contatto"
              />

              <FormField
                label="Paziente (Cognome e Nome)"
                id="f-pat-name"
                value={formData.patient_name}
                onChange={(val) => setFormData(p => ({ ...p, patient_name: val }))}
                placeholder="Cognome Nome"
              />

              <FormField
                label="Tipologia Trasporto"
                id="f-trans-type"
                type="select"
                value={formData.transport_type}
                onChange={(val) => setFormData(p => ({ ...p, transport_type: val }))}
                options={[
                  { value: 'dimissione', label: 'Dimissione' },
                  { value: 'trasferimento', label: 'Trasferimento' },
                  { value: 'visita', label: 'Visita' },
                  { value: 'altro', label: 'Altro' },
                ]}
              />

              <FormField
                label="Tipo Servizio"
                id="f-trip-type"
                type="select"
                value={formData.trip_type}
                onChange={(val) => setFormData(p => ({ ...p, trip_type: val }))}
                options={[
                  { value: 'andata', label: 'Andata' },
                  { value: 'ritorno', label: 'Ritorno' },
                  { value: 'a/r', label: 'Andata / Ritorno' },
                ]}
              />

              <div className="flex justify-end mt-4">
                <button
                  type="button"
                  onClick={() => handleNextSection('s1', 's2')}
                  className="btn-touch bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold"
                >
                  Continua <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 2: PERCORSO, ORARI & LOGISTICA */}
        <div id="section-header-s2" className="glass-panel rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 transition">
          {/* Header */}
          <button
            type="button"
            onClick={() => toggleSection('s2')}
            className="w-full flex items-center justify-between p-5 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-left hover:bg-slate-100/50 dark:hover:bg-slate-850/50 transition"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600/10 text-teal-600 dark:text-teal-400">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                  2. Percorso, Orari & Logistica
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {formData.origin ? `${formData.origin.substring(0, 15)}... → ${formData.destination.substring(0, 15)}...` : 'Compila itinerario e orari'}
                </p>
              </div>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 text-slate-450 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 bg-white dark:bg-slate-900">
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${openSections.s2 ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {/* Content */}
          {openSections.s2 && (
            <div className="p-5 flex flex-col gap-4 animate-slide-in">
              <FormField
                label="Luogo di Partenza (Da)"
                id="f-origin"
                value={formData.origin}
                onChange={(val) => setFormData(p => ({ ...p, origin: val }))}
                suggestions={FREQUENT_PLACES}
                placeholder="Città, Via o Ospedale"
                required
              />

              <FormField
                label="Luogo di Arrivo (A)"
                id="f-dest"
                value={formData.destination}
                onChange={(val) => setFormData(p => ({ ...p, destination: val }))}
                suggestions={FREQUENT_PLACES}
                placeholder="Città, Via o Ospedale"
                required
              />

              <h3 className="text-sm font-bold border-b pb-2 mt-4 text-slate-800 dark:text-slate-100 uppercase tracking-wider">Orari & Odometer</h3>

              <FormField
                label="Ora Inizio"
                id="f-start-time"
                type="time"
                value={formData.start_time}
                onChange={(val) => setFormData(p => ({ ...p, start_time: val }))}
                required
              />

              <FormField
                label="Ora Fine"
                id="f-end-time"
                type="time"
                value={formData.end_time}
                onChange={(val) => setFormData(p => ({ ...p, end_time: val }))}
                required
              />

              <FormField
                label="Ore Sosta (Attesa)"
                id="f-wait"
                type="number"
                value={formData.wait_hours}
                onChange={(val) => setFormData(p => ({ ...p, wait_hours: val }))}
                placeholder="Ore d'attesa"
              />

              <div className="flex flex-col gap-4 mt-2 bg-slate-100/50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <FormField
                  label="Km Inizio"
                  id="f-km-start"
                  type="number"
                  value={formData.km_start}
                  onChange={(val) => setFormData(p => ({ ...p, km_start: val }))}
                />
                <FormField
                  label="Km Fine"
                  id="f-km-end"
                  type="number"
                  value={formData.km_end}
                  onChange={(val) => setFormData(p => ({ ...p, km_end: val }))}
                  required
                />
                <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-3">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Chilometri Totali</span>
                  <span className="text-xl font-black text-teal-600 dark:text-teal-400">
                    {formData.km_total} Km
                  </span>
                </div>
              </div>

              {/* Collapsible Patient Logistics Sub-section */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden mt-4">
                <button
                  type="button"
                  onClick={() => setIsPatientLogisticsOpen(!isPatientLogisticsOpen)}
                  className="w-full flex items-center justify-between p-4 bg-slate-100/40 dark:bg-slate-900/40 text-left hover:bg-slate-100/60 dark:hover:bg-slate-850/40 transition"
                >
                  <div className="flex items-center gap-2">
                    <Activity className="h-4.5 w-4.5 text-teal-600 dark:text-teal-400" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider">
                      Logistica Dettagliata Paziente
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {isPatientLogisticsOpen ? 'Nascondi' : 'Espandi'}
                    </span>
                    <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${isPatientLogisticsOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {isPatientLogisticsOpen && (
                  <div className="p-4 bg-slate-100/10 dark:bg-slate-900/10 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-4 animate-slide-in">
                    <FormField
                      label="Indirizzo Paziente"
                      id="f-pat-addr"
                      value={formData.patient_address}
                      onChange={(val) => setFormData(p => ({ ...p, patient_address: val }))}
                      placeholder="Indirizzo di residenza"
                    />

                    <FormField
                      label="Telefono Paziente"
                      id="f-pat-phone"
                      type="tel"
                      value={formData.patient_phone}
                      onChange={(val) => setFormData(p => ({ ...p, patient_phone: val }))}
                      placeholder="Es: 348 1234567"
                    />

                    <div className="flex flex-col gap-4 bg-slate-100/30 dark:bg-slate-900/30 p-3.5 rounded-xl border">
                      <FormField
                        label="Trasporto In"
                        id="f-method"
                        type="select"
                        value={formData.transport_method}
                        onChange={(val) => setFormData(p => ({ ...p, transport_method: val }))}
                        options={[
                          { value: 'barella', label: 'Barella' },
                          { value: 'sedia', label: 'Sedia portantina' },
                        ]}
                      />

                      <FormField
                        label="Piano Casa"
                        id="f-floor"
                        type="number"
                        value={formData.floor}
                        onChange={(val) => setFormData(p => ({ ...p, floor: val }))}
                      />
                    </div>

                    <FormField
                      label="Presenza Ascensore"
                      id="f-elevator"
                      type="toggle"
                      placeholder={formData.elevator ? 'Sì, utilizzabile' : 'No ascensore'}
                      value={formData.elevator}
                      onChange={(val) => setFormData(p => ({ ...p, elevator: val }))}
                    />

                    <FormField
                      label="Accompagnato"
                      id="f-accompanied"
                      type="toggle"
                      placeholder={formData.accompanied ? 'Sì, presente' : 'No accompagnatore'}
                      value={formData.accompanied}
                      onChange={(val) => setFormData(p => ({ ...p, accompanied: val }))}
                    />

                    <FormField
                      label="Peso Paziente (Kg)"
                      id="f-weight"
                      type="number"
                      value={formData.weight}
                      onChange={(val) => setFormData(p => ({ ...p, weight: val }))}
                      placeholder="Kg"
                    />

                    <FormField
                      label="Necessita Ossigeno"
                      id="f-oxygen"
                      type="toggle"
                      placeholder={formData.oxygen ? 'Sì, attivo' : 'No ossigeno'}
                      value={formData.oxygen}
                      onChange={(val) => setFormData(p => ({ ...p, oxygen: val }))}
                    />

                    {formData.oxygen && (
                      <FormField
                        label="Quantità / Flusso Ossigeno"
                        id="f-oxy-qty"
                        value={formData.oxygen_qty}
                        onChange={(val) => setFormData(p => ({ ...p, oxygen_qty: val }))}
                        placeholder="Es: 2L/min o 5L"
                      />
                    )}

                    <FormField
                      label="Condizioni Cliniche / Diagnosi"
                      id="f-cond"
                      type="textarea"
                      value={formData.conditions}
                      onChange={(val) => setFormData(p => ({ ...p, conditions: val }))}
                      placeholder="Es: Paziente stabile, debolezza post-operatoria, impossibilitato a deambulare."
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-between mt-4 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setOpenSections(p => ({ ...p, s2: false, s1: true }));
                    setTimeout(() => {
                      const el = document.getElementById('section-header-s1');
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 50);
                  }}
                  className="btn-touch flex-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 rounded-xl text-xs"
                >
                  <ArrowLeft className="h-4 w-4" /> Indietro
                </button>
                <button
                  type="button"
                  onClick={() => handleNextSection('s2', 's3')}
                  className="btn-touch flex-1 bg-teal-650 hover:bg-teal-700 text-white rounded-xl text-xs font-bold"
                >
                  Continua <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 3: FATTURAZIONE E NOTE */}
        <div id="section-header-s3" className="glass-panel rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 transition">
          {/* Header */}
          <button
            type="button"
            onClick={() => toggleSection('s3')}
            className="w-full flex items-center justify-between p-5 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-left hover:bg-slate-100/50 dark:hover:bg-slate-850/50 transition"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600/10 text-teal-600 dark:text-teal-400">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                  3. Fatturazione & Note
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {formData.is_client_different ? `Intestatario: ${formData.client_name || 'Terzo'}` : 'Intestato al paziente / Note'}
                </p>
              </div>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 text-slate-450 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 bg-white dark:bg-slate-900">
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${openSections.s3 ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {/* Content */}
          {openSections.s3 && (
            <div className="p-5 flex flex-col gap-4 animate-slide-in">
              <FormField
                label="Cliente diverso da Paziente?"
                id="f-client-diff"
                type="toggle"
                placeholder={formData.is_client_different ? 'Sì, fattura a terzi' : 'No, intestato a paziente'}
                value={formData.is_client_different}
                onChange={(val) => setFormData(p => ({ ...p, is_client_different: val }))}
              />

              {formData.is_client_different && (
                <div className="flex flex-col gap-4 p-4 border rounded-xl bg-slate-100/30 dark:bg-slate-900/30">
                  <FormField
                    label="Nome Intestatario Fattura"
                    id="f-client-name"
                    value={formData.client_name}
                    onChange={(val) => setFormData(p => ({ ...p, client_name: val }))}
                    placeholder="Cognome e Nome o Ragione Sociale"
                    required
                  />
                  
                  <FormField
                    label="Telefono Cliente"
                    id="f-client-phone"
                    type="tel"
                    value={formData.client_phone}
                    onChange={(val) => setFormData(p => ({ ...p, client_phone: val }))}
                    placeholder="Contatto"
                  />

                  <FormField
                    label="Email (Obbligatoria per Fattura)"
                    id="f-client-email"
                    type="email"
                    value={formData.client_email}
                    onChange={(val) => setFormData(p => ({ ...p, client_email: val }))}
                    placeholder="email@dominio.it"
                  />
                </div>
              )}

              <FormField
                label="Note Servizio"
                id="f-notes"
                type="textarea"
                value={formData.notes}
                onChange={(val) => setFormData(p => ({ ...p, notes: val }))}
                placeholder="Eventuali note di consegna, orari, contatti parenti, problematiche logistiche..."
              />

              <div className="flex justify-between mt-4 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setOpenSections(p => ({ ...p, s3: false, s2: true }));
                    setTimeout(() => {
                      const el = document.getElementById('section-header-s2');
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 50);
                  }}
                  className="btn-touch bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 rounded-xl text-xs"
                >
                  <ArrowLeft className="h-4 w-4" /> Indietro
                </button>
                <button
                  type="button"
                  onClick={() => handleNextSection('s3', 's4')}
                  className="btn-touch bg-teal-650 hover:bg-teal-700 text-white rounded-xl text-xs font-bold"
                >
                  Continua <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 4: CHIUSURA E PAGAMENTO */}
        <div id="section-header-s4" className="glass-panel rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 transition">
          {/* Header */}
          <button
            type="button"
            onClick={() => toggleSection('s4')}
            className="w-full flex items-center justify-between p-5 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-left hover:bg-slate-100/50 dark:hover:bg-slate-850/50 transition"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600/10 text-teal-600 dark:text-teal-400">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                  4. Chiusura e Ricevuta
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {formData.cost ? `Tariffa: ${formData.cost} € | ${formData.payment_method.toUpperCase()}` : 'Inserisci tariffa e chiudi'}
                </p>
              </div>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 text-slate-450 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 bg-white dark:bg-slate-900">
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${openSections.s4 ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {/* Content */}
          {openSections.s4 && (
            <div className="p-5 flex flex-col gap-4 animate-slide-in">
              <FormField
                label="Ricevuta Cartacea N."
                id="f-receipt"
                type="number"
                value={formData.receipt_number}
                onChange={(val) => setFormData(p => ({ ...p, receipt_number: val }))}
                placeholder="Numero ricevuta blocco"
              />

              <FormField
                label="Costo Servizio (€)"
                id="f-cost"
                type="number"
                value={formData.cost}
                onChange={(val) => setFormData(p => ({ ...p, cost: val }))}
                placeholder="Es: 150.00"
              />

              <FormField
                label="Metodo di Pagamento"
                id="f-pay-method"
                type="select"
                value={formData.payment_method}
                onChange={(val) => setFormData(p => ({ ...p, payment_method: val }))}
                options={[
                  { value: 'contanti', label: 'Contanti' },
                  { value: 'pos', label: 'POS (Carta/Bancomat)' },
                  { value: 'bonifico', label: 'Bonifico Bancario' },
                  { value: 'buono', label: 'Buono Servizio / Convenzione' },
                ]}
              />

              <div className="mt-2 p-4 border border-teal-500/20 bg-teal-500/[0.03] rounded-xl flex flex-col gap-2">
                <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">Riepilogo finale</span>
                <div className="flex flex-col gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <span>Paziente: <b>{formData.patient_name || '-'}</b></span>
                  <span>Mezzo: <b>{formData.vehicle_id ? vehicles.find(v => v.id === formData.vehicle_id)?.license_plate : '--'}</b></span>
                  <span>Percorso: <b>{formData.origin ? `${formData.origin.substring(0, 20)}...` : '--'} → {formData.destination ? `${formData.destination.substring(0, 20)}...` : '--'}</b></span>
                  <span className="text-teal-700 dark:text-teal-400 font-bold mt-1 text-sm">
                    Costo: {formData.cost || '0'} € | Pagamento: {formData.payment_method.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="flex justify-between mt-4 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setOpenSections(p => ({ ...p, s4: false, s3: true }));
                    setTimeout(() => {
                      const el = document.getElementById('section-header-s3');
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 50);
                  }}
                  className="btn-touch flex-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 rounded-xl text-xs"
                >
                  <ArrowLeft className="h-4 w-4" /> Indietro
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-touch flex-[1.5] bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-500/20 font-extrabold text-xs"
                >
                  {loading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-white border-white/20"></div>
                  ) : (
                    <>
                      <Check className="h-4 w-4" /> Termina Trasporto
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

      </form>
    </div>
  );
}

export default function UsrNuovo() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-teal-600 border-slate-200"></div>
        <p className="mt-3 text-sm font-semibold">Caricamento...</p>
      </div>
    }>
      <TransportFormContent />
    </Suspense>
  );
}
