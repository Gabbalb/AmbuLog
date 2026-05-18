'use client';

import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Truck, Plus, CheckCircle2, XCircle, AlertCircle, CalendarDays } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import FormField from '@/components/FormField';

export default function UsrShifts() {
  const [activeCrew, setActiveCrew] = useState<any>(null);
  const [shifts, setShifts] = useState<any[]>([]);
  const [availabilities, setAvailabilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Availability Form State
  const [date, setDate] = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0]); // Default tomorrow
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('16:00');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('amb_active_crew');
      if (stored) {
        setActiveCrew(JSON.parse(stored));
      }
    }
  }, []);

  const loadData = async () => {
    setLoading(true);
    
    // Fetch shifts for our active CE or Driver
    let userId = 'u2'; // Default mock to Mario Rossi
    if (activeCrew) {
      userId = activeCrew.ceId || activeCrew.aId;
    }

    const { data: shiftList } = await supabase
      .from('shifts')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });

    const { data: availList } = await supabase
      .from('availabilities')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });

    if (shiftList) setShifts(shiftList);
    if (availList) setAvailabilities(availList);
    
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [activeCrew]);

  const handleSubmitAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let userId = 'u2'; // Default mock to Mario Rossi
      if (activeCrew) {
        userId = activeCrew.ceId || activeCrew.aId;
      }

      const payload = {
        user_id: userId,
        date,
        start_time: startTime,
        end_time: endTime,
        status: 'pending' as const,
      };

      await supabase.from('availabilities').insert(payload);
      
      alert('Disponibilità inviata con successo alla centrale!');
      
      // Reset form & reload
      setDate(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
      setStartTime('08:00');
      setEndTime('16:00');
      loadData();
    } catch (err) {
      console.error(err);
      alert('Errore durante l\'inserimento della disponibilità.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" /> Approvato
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
            <XCircle className="h-3.5 w-3.5" /> Rifiutato
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400 animate-pulse-slow">
            <AlertCircle className="h-3.5 w-3.5" /> In attesa
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Turni & Disponibilità</h2>
        <p className="text-xs text-slate-400">Pianifica le tue disponibilità ed esamina il calendario</p>
      </div>

      {/* Shifts Section */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <CalendarDays className="h-4 w-4 text-teal-600" /> I Miei Turni Assegnati
        </h3>
        
        {loading ? (
          <div className="flex justify-center py-8 text-slate-400">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-teal-600 border-slate-200"></div>
          </div>
        ) : shifts.length === 0 ? (
          <div className="glass-panel p-5 text-center text-xs text-slate-400 rounded-2xl border-dashed">
            Nessun turno assegnato per questa settimana.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {shifts.map((s) => (
              <div key={s.id} className="glass-card p-4 rounded-xl flex items-center justify-between border-l-4 border-l-teal-650">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> {s.date}
                  </span>
                  <span className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-1">
                    <Clock className="h-4 w-4 text-teal-650" /> {s.start_time.substring(0, 5)} - {s.end_time.substring(0, 5)}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-450 dark:text-slate-500 capitalize">
                    Ruolo: {s.role.replace('_', ' ')}
                  </span>
                </div>
                {s.vehicles && (
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Mezzo</span>
                    <span className="flex items-center gap-1 bg-slate-200/50 dark:bg-slate-800/50 border px-2.5 py-1 rounded-lg text-xs font-bold text-slate-750 dark:text-slate-350">
                      <Truck className="h-3.5 w-3.5" />
                      {s.vehicles.license_plate}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Insert Availability Form */}
      <div className="glass-panel p-5 rounded-2xl border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50">
        <h3 className="text-sm font-extrabold border-b pb-2 text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
          <Plus className="h-4.5 w-4.5 text-teal-650" /> Inserisci Disponibilità
        </h3>

        <form onSubmit={handleSubmitAvailability} className="flex flex-col gap-4 mt-3">
          <FormField
            label="Data Disponibile"
            id="avail-date"
            type="date"
            value={date}
            onChange={setDate}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <FormField
              label="Da Ora"
              id="avail-start"
              type="time"
              value={startTime}
              onChange={setStartTime}
              required
            />
            <FormField
              label="A Ora"
              id="avail-end"
              type="time"
              value={endTime}
              onChange={setEndTime}
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-touch bg-teal-650 hover:bg-teal-700 text-white rounded-xl font-bold shadow-lg shadow-teal-600/10 mt-2 text-sm transition-all"
          >
            {submitting ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-t-white border-white/20"></div>
            ) : (
              'Invia Disponibilità'
            )}
          </button>
        </form>
      </div>

      {/* Availabilities List */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Stato Disponibilità Inviate
        </h3>

        {loading ? (
          <div className="flex justify-center py-8 text-slate-400">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-teal-650 border-slate-200"></div>
          </div>
        ) : availabilities.length === 0 ? (
          <div className="glass-panel p-4 text-center text-xs text-slate-400 rounded-2xl border-dashed">
            Nessuna richiesta di disponibilità inserita.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {availabilities.map((a) => (
              <div key={a.id} className="glass-card p-4 rounded-xl flex items-center justify-between border-l border-slate-250 dark:border-slate-800">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> {a.date}
                  </span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-slate-400" /> {a.start_time.substring(0, 5)} - {a.end_time.substring(0, 5)}
                  </span>
                </div>
                {getStatusBadge(a.status)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
