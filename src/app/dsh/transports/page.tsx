'use client';

import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  MapPin, 
  User, 
  Truck, 
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trash2,
  ChevronDown
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import Modal from '@/components/Modal';
import FormField from '@/components/FormField';

const FREQUENT_PLACES = [
  'Ospedale di Vicenza',
  'Ospedale di Padova',
  'Poliambulatorio Santa Chiara',
  'Clinica Villa Berica',
  'Residenza San Camillo',
  'Domicilio Privato'
];

export default function DshTransports() {
  const [transports, setTransports] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Creation Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransport, setSelectedTransport] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // New Booking State
  const [newBooking, setNewBooking] = useState({
    date: new Date().toISOString().split('T')[0],
    requester_name: '',
    requester_phone: '',
    transport_type: 'visita',
    trip_type: 'andata',
    origin: '',
    destination: '',
    vehicle_id: '',
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
    cost: '150.00',
    notes: '',
  });

  const loadData = async () => {
    setLoading(true);
    const { data: tList } = await supabase
      .from('transports')
      .select('*, vehicles(*), transport_crew(*, user:users(*))')
      .order('date', { ascending: false });
    const { data: vList } = await supabase.from('vehicles').select('*').eq('active', true);
    
    if (tList) setTransports(tList);
    if (vList) setVehicles(vList);
    
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBooking.patient_name || !newBooking.origin || !newBooking.destination) {
      alert('Per favore, compila tutti i campi obbligatori (Paziente, Partenza, Arrivo)!');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        status: 'programmati' as const, // Scheduled by default
        date: newBooking.date,
        requester_name: newBooking.requester_name || newBooking.patient_name,
        requester_phone: newBooking.requester_phone,
        transport_type: newBooking.transport_type as any,
        trip_type: newBooking.trip_type as any,
        origin: newBooking.origin,
        destination: newBooking.destination,
        vehicle_id: newBooking.vehicle_id || null,
        patient_name: newBooking.patient_name,
        patient_address: newBooking.patient_address,
        patient_phone: newBooking.patient_phone,
        transport_method: newBooking.transport_method as any,
        floor: Number(newBooking.floor) || 0,
        elevator: newBooking.elevator,
        accompanied: newBooking.accompanied,
        weight: newBooking.weight ? Number(newBooking.weight) : null,
        oxygen: newBooking.oxygen ? (newBooking.oxygen_qty || 'Sì') : 'No',
        conditions: newBooking.conditions,
        cost: Number(newBooking.cost) || 0,
        notes: newBooking.notes,
        client_name: newBooking.patient_name,
        client_phone: newBooking.patient_phone,
      };

      await supabase.from('transports').insert(payload);
      
      alert('Trasporto programmato con successo!');
      setIsModalOpen(false);
      
      // Reset form
      setNewBooking({
        date: new Date().toISOString().split('T')[0],
        requester_name: '',
        requester_phone: '',
        transport_type: 'visita',
        trip_type: 'andata',
        origin: '',
        destination: '',
        vehicle_id: '',
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
        cost: '150.00',
        notes: '',
      });

      loadData();
    } catch (err) {
      console.error(err);
      alert('Errore durante la creazione della prenotazione.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Sei sicuro di voler eliminare definitivamente questo trasporto programmato?')) {
      await supabase.from('transports').delete().eq('id', id);
      loadData();
    }
  };

  const handleCancelStatus = async (id: string) => {
    if (confirm('Annullare il viaggio selezionato?')) {
      await supabase.from('transports').update({ status: 'annullato' }).eq('id', id);
      loadData();
    }
  };

  // Filter transports list
  const filteredTransports = transports.filter((t: any) => {
    const matchesSearch = t.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.destination.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter ? t.status === statusFilter : true;
    const matchesType = typeFilter ? t.transport_type === typeFilter : true;
    const matchesDate = dateFilter ? t.date === dateFilter : true;

    return matchesSearch && matchesStatus && matchesType && matchesDate;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'programmati':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400">PROGRAMMATO</span>;
      case 'attivo':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/15 border border-teal-500/30 text-teal-600 dark:text-teal-400 animate-pulse-slow">IN CORSO</span>;
      case 'completato':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">COMPLETATO</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 border border-slate-500/20 text-slate-500 dark:text-slate-400">ANNULLATO</span>;
    }
  };

  const vOptions = vehicles.map((v: any) => ({ value: v.id, label: `${v.license_plate} - ${v.type}` }));

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Gestione Trasporti Sanitari</h2>
          <p className="text-sm text-slate-400">Storico completo delle prenotazioni e pianificazione corse future</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-touch bg-teal-650 hover:bg-teal-700 text-white rounded-xl font-bold shadow-md shadow-teal-500/10 self-start sm:self-auto flex items-center gap-1.5"
        >
          <Plus className="h-4.5 w-4.5" /> Pianifica Trasporto
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row gap-3 bg-white/50 dark:bg-slate-900/40">
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Cerca per paziente, origine, destinazione..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-premium pl-10"
          />
          <Search className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
        </div>

        {/* Filters Selectors */}
        <div className="grid grid-cols-3 gap-2 shrink-0">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-premium appearance-none text-xs font-bold"
          >
            <option value="">Tutti gli Stati</option>
            <option value="programmati">Programmati</option>
            <option value="attivo">In Corso</option>
            <option value="completato">Completati</option>
            <option value="annullato">Annullati</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input-premium appearance-none text-xs font-bold"
          >
            <option value="">Tutti i Tipi</option>
            <option value="dimissione">Dimissioni</option>
            <option value="trasferimento">Trasferimenti</option>
            <option value="visita">Visite</option>
            <option value="altro">Altro</option>
          </select>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="input-premium text-xs font-bold"
          />
        </div>
      </div>

      {/* Historical Data Grid */}
      {loading ? (
        <div className="flex justify-center py-20 text-slate-400">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-teal-650 border-slate-200"></div>
        </div>
      ) : filteredTransports.length === 0 ? (
        <div className="glass-panel text-center py-16 text-slate-400 rounded-2xl border-dashed">
          Nessun trasporto corrisponde ai filtri selezionati.
        </div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden shadow-sm border bg-white/70 dark:bg-slate-900/75">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-150 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50 text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">
                  <th className="px-5 py-3.5">Stato</th>
                  <th className="px-5 py-3.5">Data & Tipo</th>
                  <th className="px-5 py-3.5">Paziente</th>
                  <th className="px-5 py-3.5">Itinerario (Da → A)</th>
                  <th className="px-5 py-3.5">Mezzo & Crew</th>
                  <th className="px-5 py-3.5">Costo</th>
                  <th className="px-5 py-3.5 text-right">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 dark:divide-slate-800 font-medium">
                {filteredTransports.map((t) => (
                  <tr key={t.id} onClick={() => setSelectedTransport(t)} className="cursor-pointer hover:bg-slate-50/40 dark:hover:bg-slate-850/20 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap">
                      {getStatusBadge(t.status)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-slate-800 dark:text-white">{t.date}</span>
                        <span className="text-[9px] font-bold uppercase text-teal-600 dark:text-teal-400">{t.transport_type} • {t.trip_type}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-slate-850 dark:text-slate-200">{t.patient_name}</span>
                        <span className="text-[10px] text-slate-400">{t.patient_phone || 'No telefono'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 max-w-xs">
                      <div className="flex flex-col gap-1 text-[11px] text-slate-600 dark:text-slate-400 leading-normal">
                        <span className="truncate"><b>Da:</b> {t.origin}</span>
                        <span className="truncate"><b>A:</b> {t.destination}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1 text-[10px]">
                        {t.vehicles ? (
                          <span className="inline-flex items-center gap-1 font-bold text-slate-700 dark:text-slate-350 bg-slate-150 dark:bg-slate-800 px-2 py-0.5 rounded">
                            <Truck className="h-3 w-3" /> {t.vehicles.license_plate}
                          </span>
                        ) : (
                          <span className="text-slate-400">Non assegnato</span>
                        )}
                        {t.transport_crew && t.transport_crew.length > 0 && (
                          <span className="text-[9px] text-teal-600 dark:text-teal-450 font-semibold truncate max-w-[120px]">
                            {t.transport_crew.map((c: any) => c.user ? c.user.name.split(' ')[0] : (c.custom_name || '').split(' ')[0]).join(' + ')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap font-bold text-slate-800 dark:text-white">
                      {t.cost ? `${Number(t.cost).toFixed(2)} €` : '--'}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        {t.status === 'programmati' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleCancelStatus(t.id); }}
                            className="p-1.5 text-slate-450 hover:text-amber-500 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title="Annulla Servizio"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}
                          className="p-1.5 text-slate-450 hover:text-rose-500 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="Elimina Prenotazione"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Pianifica Trasporto (Dashboard Centrale)"
        footer={
          <>
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 rounded-lg"
            >
              Annulla
            </button>
            <button
              onClick={handleCreateBooking}
              disabled={submitting}
              className="px-4 py-2 text-xs font-bold text-white bg-teal-650 rounded-lg hover:bg-teal-700 flex items-center gap-1 shadow-md shadow-teal-500/10"
            >
              {submitting ? 'Creazione...' : 'Programma Viaggio'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateBooking} className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-1 no-scrollbar text-left">
          
          <div className="border-b pb-2 mb-1">
            <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider">Dati Anagrafici</span>
          </div>

          <FormField
            label="Paziente (Cognome e Nome)"
            id="new-pat-name"
            value={newBooking.patient_name}
            onChange={(val) => setNewBooking(p => ({ ...p, patient_name: val }))}
            placeholder="Cognome Nome"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <FormField
              label="Indirizzo Paziente"
              id="new-pat-addr"
              value={newBooking.patient_address}
              onChange={(val) => setNewBooking(p => ({ ...p, patient_address: val }))}
              placeholder="Via, Città"
            />
            <FormField
              label="Telefono Paziente"
              id="new-pat-phone"
              type="tel"
              value={newBooking.patient_phone}
              onChange={(val) => setNewBooking(p => ({ ...p, patient_phone: val }))}
              placeholder="348..."
            />
          </div>

          <div className="border-b pb-2 mt-2 mb-1">
            <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider">Dettagli Viaggio</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <FormField
              label="Data Viaggio"
              id="new-date"
              type="date"
              value={newBooking.date}
              onChange={(val) => setNewBooking(p => ({ ...p, date: val }))}
              required
            />
            <FormField
              label="Tipo Trasporto"
              id="new-trans-type"
              type="select"
              value={newBooking.transport_type}
              onChange={(val) => setNewBooking(p => ({ ...p, transport_type: val }))}
              options={[
                { value: 'dimissione', label: 'Dimissione' },
                { value: 'trasferimento', label: 'Trasferimento' },
                { value: 'visita', label: 'Visita' },
                { value: 'altro', label: 'Altro' },
              ]}
            />
            <FormField
              label="Servizio"
              id="new-trip-type"
              type="select"
              value={newBooking.trip_type}
              onChange={(val) => setNewBooking(p => ({ ...p, trip_type: val }))}
              options={[
                { value: 'andata', label: 'Andata' },
                { value: 'ritorno', label: 'Ritorno' },
                { value: 'a/r', label: 'Andata/Ritorno' },
              ]}
            />
          </div>

          <FormField
            label="Partenza (Da)"
            id="new-origin"
            value={newBooking.origin}
            onChange={(val) => setNewBooking(p => ({ ...p, origin: val }))}
            suggestions={FREQUENT_PLACES}
            placeholder="Ospedale o Residenza"
            required
          />

          <FormField
            label="Destinazione (A)"
            id="new-dest"
            value={newBooking.destination}
            onChange={(val) => setNewBooking(p => ({ ...p, destination: val }))}
            suggestions={FREQUENT_PLACES}
            placeholder="Ospedale o Residenza"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <FormField
              label="Assegna Mezzo (Opzionale)"
              id="new-vehicle"
              type="select"
              placeholder="-- Lascia libero --"
              value={newBooking.vehicle_id}
              onChange={(val) => setNewBooking(p => ({ ...p, vehicle_id: val }))}
              options={vOptions}
            />
            <FormField
              label="Tariffa / Costo (€)"
              id="new-cost"
              type="number"
              value={newBooking.cost}
              onChange={(val) => setNewBooking(p => ({ ...p, cost: val }))}
              placeholder="150.00"
            />
          </div>

          <div className="border-b pb-2 mt-2 mb-1">
            <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider">Logistica & Richiedente</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField
              label="Richiedente (Nome)"
              id="new-req-name"
              value={newBooking.requester_name}
              onChange={(val) => setNewBooking(p => ({ ...p, requester_name: val }))}
              placeholder="Es: Figlia o Reparto"
            />
            <FormField
              label="Richiedente (Tel)"
              id="new-req-phone"
              type="tel"
              value={newBooking.requester_phone}
              onChange={(val) => setNewBooking(p => ({ ...p, requester_phone: val }))}
              placeholder="Numero"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Metodo Trasporto"
              id="new-method"
              type="select"
              value={newBooking.transport_method}
              onChange={(val) => setNewBooking(p => ({ ...p, transport_method: val }))}
              options={[
                { value: 'barella', label: 'Barella' },
                { value: 'sedia', label: 'Sedia' },
              ]}
            />
            <FormField
              label="Piano Abitazione"
              id="new-floor"
              type="number"
              value={newBooking.floor}
              onChange={(val) => setNewBooking(p => ({ ...p, floor: val }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField
              label="Ascensore Presente"
              id="new-elevator"
              type="toggle"
              placeholder={newBooking.elevator ? 'Sì' : 'No'}
              value={newBooking.elevator}
              onChange={(val) => setNewBooking(p => ({ ...p, elevator: val }))}
            />
            <FormField
              label="Accompagnato"
              id="new-accompanied"
              type="toggle"
              placeholder={newBooking.accompanied ? 'Sì' : 'No'}
              value={newBooking.accompanied}
              onChange={(val) => setNewBooking(p => ({ ...p, accompanied: val }))}
            />
          </div>

          <FormField
            label="Note per l'equipaggio"
            id="new-notes"
            type="textarea"
            value={newBooking.notes}
            onChange={(val) => setNewBooking(p => ({ ...p, notes: val }))}
            placeholder="Note particolari, campanello da suonare, ostacoli..."
          />

        </form>
      </Modal>

      {/* Details Modal */}
      <Modal
        isOpen={!!selectedTransport}
        onClose={() => setSelectedTransport(null)}
        title="Dettagli Trasporto Sanitario"
        footer={
          <button
            onClick={() => setSelectedTransport(null)}
            className="px-5 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition"
          >
            Chiudi
          </button>
        }
      >
        {selectedTransport && (
          <div className="flex flex-col gap-6 max-h-[70vh] overflow-y-auto pr-1 no-scrollbar text-left text-slate-700 dark:text-slate-200">
            
            {/* Status & ID Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-850 pb-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">ID TRASPORTO</span>
                <code className="text-xs font-mono font-bold text-slate-650 dark:text-slate-350">{selectedTransport.id}</code>
              </div>
              <div>
                {getStatusBadge(selectedTransport.status)}
              </div>
            </div>

            {/* General & Patient Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Column 1: Patient & Requester Info */}
              <div className="bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-150 dark:border-slate-800/80 flex flex-col gap-3">
                <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-teal-600 dark:text-teal-400">Paziente & Richiedente</h4>
                <div className="flex flex-col gap-2 text-xs">
                  <div className="flex flex-col">
                    <span className="text-slate-405 dark:text-slate-500 text-[9px] font-bold uppercase">Nome Paziente</span>
                    <span className="font-bold text-sm text-slate-850 dark:text-white">{selectedTransport.patient_name}</span>
                  </div>
                  {selectedTransport.patient_phone && (
                    <div className="flex flex-col">
                      <span className="text-slate-405 dark:text-slate-500 text-[9px] font-bold uppercase">Telefono Paziente</span>
                      <span className="font-semibold">{selectedTransport.patient_phone}</span>
                    </div>
                  )}
                  {selectedTransport.patient_address && (
                    <div className="flex flex-col">
                      <span className="text-slate-405 dark:text-slate-500 text-[9px] font-bold uppercase">Indirizzo Abitazione</span>
                      <span className="font-semibold">{selectedTransport.patient_address}</span>
                    </div>
                  )}
                  {(selectedTransport.requester_name || selectedTransport.requester_phone) && (
                    <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800/60 flex flex-col gap-2">
                      {selectedTransport.requester_name && (
                        <div className="flex flex-col">
                          <span className="text-slate-405 dark:text-slate-500 text-[9px] font-bold uppercase">Richiedente</span>
                          <span className="font-semibold">{selectedTransport.requester_name}</span>
                        </div>
                      )}
                      {selectedTransport.requester_phone && (
                        <div className="flex flex-col">
                          <span className="text-slate-405 dark:text-slate-500 text-[9px] font-bold uppercase">Telefono Richiedente</span>
                          <span className="font-semibold">{selectedTransport.requester_phone}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Column 2: Service & Logistical Details */}
              <div className="bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-150 dark:border-slate-800/80 flex flex-col gap-3">
                <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-teal-600 dark:text-teal-400">Logistica & Dettagli Corsa</h4>
                <div className="flex flex-col gap-2 text-xs">
                  <div className="flex flex-col">
                    <span className="text-slate-405 dark:text-slate-500 text-[9px] font-bold uppercase">Data Servizio</span>
                    <span className="font-bold">{selectedTransport.date}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                      <span className="text-slate-405 dark:text-slate-500 text-[9px] font-bold uppercase">Tipologia</span>
                      <span className="font-semibold capitalize">{selectedTransport.transport_type}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-405 dark:text-slate-500 text-[9px] font-bold uppercase">Servizio</span>
                      <span className="font-semibold capitalize">{selectedTransport.trip_type}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                      <span className="text-slate-405 dark:text-slate-500 text-[9px] font-bold uppercase">Metodo</span>
                      <span className="font-semibold capitalize">{selectedTransport.transport_method}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-405 dark:text-slate-500 text-[9px] font-bold uppercase">Piano</span>
                      <span className="font-semibold">{selectedTransport.floor} {selectedTransport.elevator ? '(Con Ascensore)' : '(Senza Ascensore)'}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                      <span className="text-slate-405 dark:text-slate-500 text-[9px] font-bold uppercase">Accompagnatore</span>
                      <span className="font-semibold">{selectedTransport.accompanied ? 'Presente' : 'Non presente'}</span>
                    </div>
                    {selectedTransport.weight && (
                      <div className="flex flex-col">
                        <span className="text-slate-405 dark:text-slate-500 text-[9px] font-bold uppercase">Peso Paziente</span>
                        <span className="font-semibold">{selectedTransport.weight} kg</span>
                      </div>
                    )}
                  </div>
                  {selectedTransport.oxygen && selectedTransport.oxygen !== 'No' && (
                    <div className="flex flex-col">
                      <span className="text-slate-405 dark:text-slate-500 text-[9px] font-bold uppercase">Ossigeno</span>
                      <span className="font-semibold text-rose-500">{selectedTransport.oxygen}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Routing, Timestamps & Odometer */}
            <div className="bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-150 dark:border-slate-800/80 flex flex-col gap-3">
              <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-teal-600 dark:text-teal-400">Itinerario, Orari & Chilometri</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="md:col-span-3 flex flex-col gap-2">
                  <div className="flex flex-col">
                    <span className="text-slate-405 dark:text-slate-500 text-[9px] font-bold uppercase">Luogo di Partenza</span>
                    <span className="font-semibold">{selectedTransport.origin}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-405 dark:text-slate-500 text-[9px] font-bold uppercase">Luogo di Arrivo</span>
                    <span className="font-semibold">{selectedTransport.destination}</span>
                  </div>
                </div>
                
                <div className="flex flex-col bg-slate-100/50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200/50 dark:border-slate-800/50 gap-1.5">
                  <span className="text-[9px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Orari</span>
                  <div className="flex flex-col gap-1">
                    <span><b>Inizio:</b> {selectedTransport.start_time ? new Date(selectedTransport.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}</span>
                    <span><b>Fine:</b> {selectedTransport.end_time ? new Date(selectedTransport.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}</span>
                    {Number(selectedTransport.wait_hours) > 0 && <span><b>Attesa:</b> {selectedTransport.wait_hours} h</span>}
                  </div>
                </div>

                <div className="flex flex-col bg-slate-100/50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200/50 dark:border-slate-800/50 gap-1.5">
                  <span className="text-[9px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Chilometri</span>
                  <div className="flex flex-col gap-1">
                    <span><b>Iniziali:</b> {selectedTransport.km_start ?? 0}</span>
                    <span><b>Finali:</b> {selectedTransport.km_end ?? 0}</span>
                    <span><b>Totali:</b> {selectedTransport.km_total ?? 0} km</span>
                  </div>
                </div>

                <div className="flex flex-col bg-slate-100/50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200/50 dark:border-slate-800/50 gap-1.5">
                  <span className="text-[9px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Mezzo & Equipaggio</span>
                  <div className="flex flex-col gap-1">
                    <span><b>Mezzo:</b> {selectedTransport.vehicles?.license_plate || '--'}</span>
                    <span className="text-[10px] text-teal-650 dark:text-teal-400 font-semibold truncate">
                      {selectedTransport.transport_crew && selectedTransport.transport_crew.length > 0 ? (
                        selectedTransport.transport_crew.map((c: any) => c.user ? c.user.name.split(' ')[0] : (c.custom_name || '').split(' ')[0]).join(' + ')
                      ) : (
                        'Nessun equipaggio'
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Billing Details */}
            <div className="bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-150 dark:border-slate-800/80 flex flex-col gap-3">
              <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-teal-600 dark:text-teal-400">Tariffazione & Fatturazione</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col">
                    <span className="text-slate-405 dark:text-slate-500 text-[9px] font-bold uppercase">Cliente Pagante</span>
                    <span className="font-semibold">{selectedTransport.client_name || selectedTransport.patient_name}</span>
                  </div>
                  {selectedTransport.client_phone && (
                    <div className="flex flex-col">
                      <span className="text-slate-405 dark:text-slate-500 text-[9px] font-bold uppercase">Telefono Cliente</span>
                      <span className="font-semibold">{selectedTransport.client_phone}</span>
                    </div>
                  )}
                  {selectedTransport.client_email && (
                    <div className="flex flex-col">
                      <span className="text-slate-405 dark:text-slate-500 text-[9px] font-bold uppercase">Email Fattura</span>
                      <span className="font-semibold text-teal-650 dark:text-teal-400 font-mono">{selectedTransport.client_email}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col justify-between bg-teal-500/[0.03] dark:bg-teal-500/[0.02] border border-teal-500/20 p-4 rounded-xl">
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-405 dark:text-slate-500 text-[9px] font-bold uppercase">Importo</span>
                    <span className="text-xl font-black text-teal-700 dark:text-teal-400">
                      {selectedTransport.cost ? `${Number(selectedTransport.cost).toFixed(2)} €` : 'Da definire'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase mt-2">
                    <span>Metodo:</span>
                    <span className="bg-teal-500/10 text-teal-700 dark:text-teal-400 px-2 py-0.5 rounded">
                      {selectedTransport.payment_method || 'Contanti'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Conditions & Notes */}
            {(selectedTransport.conditions || selectedTransport.notes) && (
              <div className="bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-150 dark:border-slate-800/80 flex flex-col gap-3">
                <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-teal-600 dark:text-teal-400">Note & Condizioni</h4>
                <div className="flex flex-col gap-3 text-xs">
                  {selectedTransport.conditions && (
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-405 dark:text-slate-500 text-[9px] font-bold uppercase">Stato / Condizioni Paziente</span>
                      <p className="bg-white dark:bg-slate-950 p-3 rounded-lg border border-slate-200/60 dark:border-slate-850/60 leading-relaxed font-semibold italic text-slate-650 dark:text-slate-350">
                        "{selectedTransport.conditions}"
                      </p>
                    </div>
                  )}
                  {selectedTransport.notes && (
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-405 dark:text-slate-500 text-[9px] font-bold uppercase">Note Equipaggio</span>
                      <p className="bg-white dark:bg-slate-950 p-3 rounded-lg border border-slate-200/60 dark:border-slate-850/60 leading-relaxed text-slate-650 dark:text-slate-300">
                        {selectedTransport.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

    </div>
  );
}
