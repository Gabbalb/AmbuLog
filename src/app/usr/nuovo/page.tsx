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
  CreditCard
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
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Info Servizio & Equipaggio
    date: new Date().toISOString().split('T')[0],
    vehicle_id: '',
    driver_name: '', // A
    ce_name: '',     // CE
    third_name: '',  // Terzo
    requester_name: '',
    requester_phone: '',
    transport_type: 'altro',
    trip_type: 'andata',

    // Step 2: Percorso & Orari
    origin: '',
    destination: '',
    start_time: '',
    end_time: '',
    wait_hours: 0,
    km_start: 0,
    km_end: 0,
    km_total: 0,

    // Step 3: Dati Paziente & Logistica
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

    // Step 4: Dati Cliente (Fatturazione)
    is_client_different: false,
    client_name: '',
    client_phone: '',
    client_email: '',
    notes: '',

    // Step 5: Chiusura
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

        // Set start time with current hour if this transport has just been activated
        let sTime = data.start_time ? new Date(data.start_time).toISOString().substring(11, 16) : '';
        if (data.status === 'attivo' && !sTime) {
          sTime = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
        }

        const eTime = data.end_time ? new Date(data.end_time).toISOString().substring(11, 16) : '';

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

  const handleNext = () => {
    // Simple page validations
    if (currentStep === 1) {
      if (!formData.requester_name || !formData.patient_name) {
        alert('Nome Richiedente e Nome Paziente sono obbligatori!');
        return;
      }
    }
    if (currentStep === 2) {
      if (!formData.origin || !formData.destination) {
        alert('Luogo di Partenza e Luogo di Arrivo sono obbligatori!');
        return;
      }
      if (formData.km_end > 0 && formData.km_end < formData.km_start) {
        alert('I Chilometri Finali non possono essere inferiori a quelli Iniziali!');
        return;
      }
    }
    if (currentStep === 4) {
      if (formData.is_client_different && !formData.client_name) {
        alert('Inserisci il Nome del Cliente pagante!');
        return;
      }
      if (formData.is_client_different && formData.client_email && !formData.client_email.includes('@')) {
        alert('Inserisci un indirizzo Email valido per l\'invio della fattura!');
        return;
      }
    }

    setCurrentStep(prev => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      const dbPayload = {
        status: transportId ? 'completato' as const : 'completato' as const, // Save directly as completed from mobile
        date: formData.date,
        requester_name: formData.requester_name,
        requester_phone: formData.requester_phone,
        transport_type: formData.transport_type as any,
        trip_type: formData.trip_type as any,
        origin: formData.origin,
        destination: formData.destination,
        start_time: startTimestamp,
        end_time: endTimestamp,
        wait_hours: Number(formData.wait_hours) || 0,
        vehicle_id: formData.vehicle_id || null,
        km_start: Number(formData.km_start) || 0,
        km_end: Number(formData.km_end) || 0,
        km_total: Number(formData.km_total) || 0,
        patient_name: formData.patient_name,
        patient_address: formData.patient_address,
        patient_phone: formData.patient_phone,
        transport_method: formData.transport_method as any,
        floor: Number(formData.floor) || 0,
        elevator: formData.elevator,
        accompanied: formData.accompanied,
        weight: formData.weight ? Number(formData.weight) : null,
        oxygen: formData.oxygen ? (formData.oxygen_qty || 'Sì') : 'No',
        conditions: formData.conditions,
        client_name: formData.is_client_different ? formData.client_name : formData.patient_name,
        client_phone: formData.is_client_different ? formData.client_phone : formData.patient_phone,
        client_email: formData.client_email,
        notes: formData.notes,
        receipt_number: formData.receipt_number,
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

  const getStepIcon = (step: number) => {
    switch (step) {
      case 1: return <Users className="h-5 w-5" />;
      case 2: return <MapPin className="h-5 w-5" />;
      case 3: return <Activity className="h-5 w-5" />;
      case 4: return <UserCheck className="h-5 w-5" />;
      case 5: return <CreditCard className="h-5 w-5" />;
      default: return <Check className="h-5 w-5" />;
    }
  };

  if (loading && currentStep === 1) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-teal-600 border-slate-200"></div>
        <p className="mt-3 text-sm font-semibold">Caricamento scheda...</p>
      </div>
    );
  }

  const vOptions = vehicles.map(v => ({ value: v.id, label: `${v.license_plate} - ${v.type}` }));
  const uOptions = users.map(u => ({ value: u.name, label: u.name }));

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

      {/* Modern Stepper Indicator */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600/10 text-teal-600 dark:text-teal-400">
              {getStepIcon(currentStep)}
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Step {currentStep} di 5</span>
              <h4 className="text-xs font-bold text-slate-800 dark:text-white mt-0.2">
                {currentStep === 1 && 'Info Servizio & Equipaggio'}
                {currentStep === 2 && 'Percorso e Orari'}
                {currentStep === 3 && 'Dati Paziente & Logistica'}
                {currentStep === 4 && 'Dati Cliente & Note'}
                {currentStep === 5 && 'Chiusura e Ricevuta'}
              </h4>
            </div>
          </div>
          <span className="text-sm font-extrabold text-teal-600 dark:text-teal-400">{Math.round((currentStep / 5) * 100)}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
          <div 
            className="h-full bg-teal-600 transition-all duration-300 rounded-full" 
            style={{ width: `${(currentStep / 5) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Wizard Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        
        {/* STEP 1: INFO SERVIZIO & EQUIPAGGIO */}
        {currentStep === 1 && (
          <div className="glass-panel p-5 rounded-2xl flex flex-col gap-4 animate-slide-in">
            <h3 className="text-sm font-bold border-b pb-2 text-slate-800 dark:text-slate-100 uppercase tracking-wider">Equipaggio e Servizio</h3>
            
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

            <div className="grid grid-cols-2 gap-3">
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
            </div>

            <FormField
              label="Terzo Soccorritore"
              id="f-third"
              type="text"
              value={formData.third_name}
              onChange={(val) => setFormData(p => ({ ...p, third_name: val }))}
              suggestions={users.map(u => u.name)}
              placeholder="Opzionale"
            />

            <h3 className="text-sm font-bold border-b pb-2 mt-4 text-slate-800 dark:text-slate-100 uppercase tracking-wider">Richiedente</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <FormField
                label="Nome Richiedente"
                id="f-req-name"
                value={formData.requester_name}
                onChange={(val) => setFormData(p => ({ ...p, requester_name: val }))}
                placeholder="Es: Ospedale Niguarda"
                required
              />
              <FormField
                label="Telefono Richiedente"
                id="f-req-phone"
                type="tel"
                value={formData.requester_phone}
                onChange={(val) => setFormData(p => ({ ...p, requester_phone: val }))}
                placeholder="Numero contatto"
              />
            </div>

            <FormField
              label="Paziente (Cognome e Nome)"
              id="f-pat-name"
              value={formData.patient_name}
              onChange={(val) => setFormData(p => ({ ...p, patient_name: val }))}
              placeholder="Cognome Nome"
              required
            />

            <div className="grid grid-cols-2 gap-4 mt-2">
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
            </div>
          </div>
        )}

        {/* STEP 2: PERCORSO E ORARI */}
        {currentStep === 2 && (
          <div className="glass-panel p-5 rounded-2xl flex flex-col gap-4 animate-slide-in">
            <h3 className="text-sm font-bold border-b pb-2 text-slate-800 dark:text-slate-100 uppercase tracking-wider">Itinerario</h3>
            
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

            <div className="grid grid-cols-2 gap-3">
              <FormField
                label="Ora Inizio"
                id="f-start-time"
                type="time"
                value={formData.start_time}
                onChange={(val) => setFormData(p => ({ ...p, start_time: val }))}
              />
              <FormField
                label="Ora Fine"
                id="f-end-time"
                type="time"
                value={formData.end_time}
                onChange={(val) => setFormData(p => ({ ...p, end_time: val }))}
              />
            </div>

            <FormField
              label="Ore Sosta (Attesa)"
              id="f-wait"
              type="number"
              value={formData.wait_hours}
              onChange={(val) => setFormData(p => ({ ...p, wait_hours: val }))}
              placeholder="Ore d'attesa"
            />

            <div className="grid grid-cols-3 gap-2.5 mt-2 bg-slate-100/50 dark:bg-slate-900/50 p-3 rounded-xl border">
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
              />
              <div className="flex flex-col gap-1.5 justify-center items-center text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Km Totali</span>
                <span className="text-xl font-black text-teal-600 dark:text-teal-400">
                  {formData.km_total}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: DATI PAZIENTE & LOGISTICA */}
        {currentStep === 3 && (
          <div className="glass-panel p-5 rounded-2xl flex flex-col gap-4 animate-slide-in">
            <h3 className="text-sm font-bold border-b pb-2 text-slate-800 dark:text-slate-100 uppercase tracking-wider">Logistica Paziente</h3>
            
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

            <div className="grid grid-cols-2 gap-4 bg-slate-100/30 dark:bg-slate-900/30 p-3.5 rounded-xl border">
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

            <div className="grid grid-cols-2 gap-3">
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
            </div>

            <div className="grid grid-cols-2 gap-3">
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
            </div>

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

        {/* STEP 4: DATI CLIENTE & NOTE */}
        {currentStep === 4 && (
          <div className="glass-panel p-5 rounded-2xl flex flex-col gap-4 animate-slide-in">
            <h3 className="text-sm font-bold border-b pb-2 text-slate-800 dark:text-slate-100 uppercase tracking-wider">Fatturazione / Ricevuta</h3>
            
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
                
                <div className="grid grid-cols-2 gap-3">
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
          </div>
        )}

        {/* STEP 5: CHIUSURA E RICEVUTA */}
        {currentStep === 5 && (
          <div className="glass-panel p-5 rounded-2xl flex flex-col gap-4 animate-slide-in">
            <h3 className="text-sm font-bold border-b pb-2 text-slate-800 dark:text-slate-100 uppercase tracking-wider">Archiviazione & Pagamento</h3>
            
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

            <div className="mt-4 p-4 border border-teal-500/20 bg-teal-500/[0.03] rounded-xl flex flex-col gap-2">
              <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">Riepilogo finale</span>
              <div className="grid grid-cols-2 text-xs font-medium text-slate-500 dark:text-slate-400 gap-1.5">
                <span>Paziente: <b>{formData.patient_name}</b></span>
                <span>Mezzo: <b>{formData.vehicle_id ? vehicles.find(v => v.id === formData.vehicle_id)?.license_plate : '--'}</b></span>
                <span className="col-span-2">Percorso: <b>{formData.origin.substring(0, 20)}... → {formData.destination.substring(0, 20)}...</b></span>
                <span className="col-span-2 text-teal-700 dark:text-teal-400 font-bold mt-1 text-sm">
                  Costo: {formData.cost || '0'} € | Pagamento: {formData.payment_method.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between gap-4 mt-2">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="btn-touch flex-1 bg-white dark:bg-slate-900 border text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
            >
              <ArrowLeft className="h-4.5 w-4.5" /> Indietro
            </button>
          ) : (
            <div className="flex-1"></div>
          )}

          {currentStep < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              className="btn-touch flex-1 bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-lg shadow-teal-500/10"
            >
              Avanti <ArrowRight className="h-4.5 w-4.5" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="btn-touch flex-[1.5] bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-500/20 font-extrabold text-base"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-t-white border-white/20"></div>
              ) : (
                <>
                  <Check className="h-5 w-5" /> Termina Trasporto
                </>
              )}
            </button>
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
