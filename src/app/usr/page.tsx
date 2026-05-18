'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Calendar, 
  MapPin, 
  User, 
  Clock, 
  Truck, 
  ChevronRight, 
  Plus, 
  AlertTriangle, 
  Activity,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import Modal from '@/components/Modal';

export default function UsrHome() {
  const router = useRouter();
  const [transports, setTransports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState<'attivi' | 'completati'>('attivi');
  const [assignmentTab, setAssignmentTab] = useState<'miei' | 'tutti'>('miei');
  const [activeCrew, setActiveCrew] = useState<any>(null);

  // Force activation modal state
  const [selectedTransport, setSelectedTransport] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('amb_active_crew');
      if (stored) {
        setActiveCrew(JSON.parse(stored));
      }
    }
  }, []);

  const loadTransports = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('transports')
      .select('*')
      .order('date', { ascending: true });
    
    if (data) {
      setTransports(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTransports();
  }, []);

  const handleCardClick = (t: any) => {
    // If transport is already completed or cancelled, allow opening it for corrections
    if (t.status === 'completato' || t.status === 'annullato') {
      if (confirm(`Questo servizio è già ${t.status}. Desideri aprirlo per correggere o modificare i dati?`)) {
        router.push(`/usr/nuovo?id=${t.id}`);
      }
      return;
    }

    // Check if assigned to our vehicle or if we don't have an active crew/shift lock
    const isAssignedToUs = activeCrew ? t.vehicle_id === activeCrew.vehicleId : true;

    if (isAssignedToUs || t.status === 'attivo') {
      // Direct access to digital form starting with the current data prefilled
      router.push(`/usr/nuovo?id=${t.id}`);
    } else {
      // Open "Force Activation" alert modal
      setSelectedTransport(t);
      setIsModalOpen(true);
    }
  };

  const handleForceActivation = async () => {
    if (!selectedTransport || !activeCrew) return;

    // Update transport: set status to 'attivo', and bind to active vehicle & crew
    const updatePayload = {
      status: 'attivo',
      vehicle_id: activeCrew.vehicleId,
      km_start: selectedTransport.km_start || activeCrew.last_km || 0,
    };

    // Update main transport
    await supabase.from('transports').update(updatePayload).eq('id', selectedTransport.id);

    // Wipe any existing crew bridge entries for this transport, and inject our crew
    await supabase.from('transport_crew').delete().eq('transport_id', selectedTransport.id);
    
    const crewEntries = [
      { transport_id: selectedTransport.id, user_id: activeCrew.aId, role: 'autista' },
      { transport_id: selectedTransport.id, user_id: activeCrew.ceId, role: 'capo_equipaggio' }
    ];
    if (activeCrew.thirdId) {
      crewEntries.push({ transport_id: selectedTransport.id, user_id: activeCrew.thirdId, role: 'terzo' });
    }

    await supabase.from('transport_crew').insert(crewEntries);

    setIsModalOpen(false);
    // Redirect to digital form flow
    router.push(`/usr/nuovo?id=${selectedTransport.id}`);
  };

  // Filter transport logic
  const filteredTransports = transports.filter(t => {
    // 1. Filter by status: attivi (programmati, attivo) vs completati (completato, annullato)
    const isCompleted = t.status === 'completato' || t.status === 'annullato';
    if (statusTab === 'attivi' && isCompleted) return false;
    if (statusTab === 'completati' && !isCompleted) return false;

    // 2. Filter by crew assignment
    if (assignmentTab === 'tutti') return true;
    if (activeCrew) {
      return t.vehicle_id === activeCrew.vehicleId;
    } else {
      // Filter by logged-in user name/id in transport crew
      if (typeof window !== 'undefined') {
        const sessionStr = localStorage.getItem('amb_user_session');
        if (sessionStr) {
          try {
            const session = JSON.parse(sessionStr);
            return t.transport_crew?.some((c: any) => c.user_id === session.id || c.custom_name === session.name);
          } catch (e) {}
        }
      }
      return false;
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'programmati':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
            <Clock className="h-3 w-3" /> Programmato
          </span>
        );
      case 'attivo':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-teal-500/15 border border-teal-500/30 px-2.5 py-0.5 text-xs font-bold text-teal-600 dark:text-teal-400 animate-pulse-slow">
            <Activity className="h-3 w-3 animate-pulse" /> IN CORSO
          </span>
        );
      case 'completato':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3 w-3" /> Completato
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/10 border border-slate-500/20 px-2 py-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
            Annullato
          </span>
        );
    }
  };

  const getTransportTypeLabel = (type: string) => {
    switch (type) {
      case 'dimissione': return 'Dimissione';
      case 'trasferimento': return 'Trasferimento';
      case 'visita': return 'Visita';
      default: return 'Altro';
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header Promo Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Trasporti Sanitari</h2>
          <p className="text-xs text-slate-400">Seleziona un viaggio pianificato o avviane uno nuovo</p>
        </div>

        {/* Desktop Quick Fab */}
        <Link 
          href="/usr/nuovo"
          className="hidden md:flex items-center gap-1.5 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-md shadow-teal-500/10 transition active:scale-95"
        >
          <Plus className="h-4 w-4" /> Nuovo Trasporto
        </Link>
      </div>

      {/* Primary Status Tabs Toggle */}
      <div className="grid grid-cols-2 rounded-xl bg-slate-200/50 dark:bg-slate-900/50 p-1 border border-slate-200/80 dark:border-slate-800">
        <button
          onClick={() => setStatusTab('attivi')}
          className={`rounded-lg py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
            statusTab === 'attivi'
              ? 'bg-teal-600 text-white shadow-md'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Servizi Attivi
        </button>
        <button
          onClick={() => setStatusTab('completati')}
          className={`rounded-lg py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
            statusTab === 'completati'
              ? 'bg-teal-600 text-white shadow-md'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Storico Chiusi
        </button>
      </div>

      {/* Secondary Assignment Toggle (Pills) */}
      <div className="flex items-center gap-2 mt-1">
        <button
          onClick={() => setAssignmentTab('miei')}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${
            assignmentTab === 'miei'
              ? 'bg-slate-800 border-slate-800 text-white dark:bg-slate-100 dark:border-slate-100 dark:text-slate-950 shadow-sm'
              : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-850 text-slate-500 dark:text-slate-400 hover:bg-slate-200/80'
          }`}
        >
          {activeCrew ? 'Il Mio Mezzo' : 'I Miei Servizi'}
        </button>
        <button
          onClick={() => setAssignmentTab('tutti')}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${
            assignmentTab === 'tutti'
              ? 'bg-slate-800 border-slate-800 text-white dark:bg-slate-100 dark:border-slate-100 dark:text-slate-950 shadow-sm'
              : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-850 text-slate-500 dark:text-slate-400 hover:bg-slate-200/80'
          }`}
        >
          Tutti i Mezzi
        </button>
      </div>

      {/* Transport List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-teal-600 border-slate-200"></div>
          <p className="mt-3 text-xs font-semibold">Caricamento trasporti...</p>
        </div>
      ) : filteredTransports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 bg-white/20 dark:bg-slate-900/20">
          <AlertCircle className="h-8 w-8 text-slate-400 mb-2" />
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Nessun trasporto trovato</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-[240px]">
            {assignmentTab === 'miei' 
              ? `Non ci sono trasporti ${statusTab === 'attivi' ? 'attivi o programmati' : 'completati'} assegnati al tuo mezzo.` 
              : `Non ci sono trasporti ${statusTab === 'attivi' ? 'attivi o programmati' : 'completati'} registrati.`}
          </p>
          {statusTab === 'attivi' && (
            <Link
              href="/usr/nuovo"
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition active:scale-95 shadow-md shadow-teal-500/10"
            >
              <Plus className="h-3.5 w-3.5" /> Nuovo A Chiamata
            </Link>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredTransports.map((t) => {
            const isAssignedToUs = activeCrew && t.vehicle_id === activeCrew.vehicleId;
            return (
              <div
                key={t.id}
                onClick={() => handleCardClick(t)}
                className={`glass-card p-4 rounded-2xl flex flex-col gap-3 cursor-pointer relative overflow-hidden border-l-4 ${
                  t.status === 'attivo' 
                    ? 'border-l-teal-500 shadow-md shadow-teal-500/5 bg-teal-500/[0.02]' 
                    : isAssignedToUs 
                      ? 'border-l-indigo-500' 
                      : 'border-l-slate-350 dark:border-l-slate-700'
                }`}
              >
                {/* Odometer overlay badge if active/miei */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold tracking-wider text-teal-600 dark:text-teal-400 uppercase">
                      {getTransportTypeLabel(t.transport_type)} • {t.trip_type.toUpperCase()}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                      {t.patient_name}
                    </h3>
                  </div>
                  {getStatusBadge(t.status)}
                </div>

                {/* Logistics */}
                <div className="grid grid-cols-1 gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <span>
                      <b>Da:</b> {t.origin}
                    </span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>
                      <b>A:</b> {t.destination}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 mt-1 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                    <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      Data: {t.date}
                    </span>
                    {t.vehicles && (
                      <span className="flex items-center gap-1 bg-slate-150 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px] font-bold text-slate-600 dark:text-slate-400">
                        <Truck className="h-3 w-3" />
                        {t.vehicles.license_plate}
                      </span>
                    )}
                  </div>
                </div>

                {/* Indicator arrow */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-350 dark:text-slate-650">
                  <ChevronRight className="h-5 w-5" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Force Activation Warning Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Attivazione Cambio Mezzo"
        footer={
          <>
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 rounded-lg"
            >
              Annulla
            </button>
            <button
              onClick={handleForceActivation}
              className="px-4 py-2 text-xs font-bold text-white bg-amber-500 rounded-lg flex items-center gap-1 shadow-md shadow-amber-500/10 active:scale-95"
            >
              Forza & Attiva
            </button>
          </>
        }
      >
        <div className="flex flex-col items-center text-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h4 className="font-bold text-slate-900 dark:text-white text-base">Trasporto non assegnato a te</h4>
          <p className="text-xs text-slate-400 max-w-xs">
            Questo viaggio per <b>{selectedTransport?.patient_name}</b> è attualmente assegnato a un altro mezzo o non ha personale.
          </p>
          <div className="w-full glass-panel p-3.5 rounded-xl border-amber-500/20 bg-amber-500/[0.02] text-left text-xs text-amber-700 dark:text-amber-400 flex flex-col gap-1.5 mt-2">
            <span>• <b>Partenza:</b> {selectedTransport?.origin}</span>
            <span>• <b>Arrivo:</b> {selectedTransport?.destination}</span>
            <span className="font-bold mt-1">Confermando, questo trasporto verrà associato al tuo equipaggio ({activeCrew?.vehiclePlate}) e attivato subito!</span>
          </div>
        </div>
      </Modal>
    </div>
  );
}
