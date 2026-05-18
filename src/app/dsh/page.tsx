'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Activity, 
  Calendar, 
  CheckCircle2, 
  TrendingUp, 
  Truck, 
  Users, 
  Clock, 
  MapPin, 
  DollarSign 
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function DshOverview() {
  const [stats, setStats] = useState({
    active: 0,
    scheduled: 0,
    completed: 0,
    revenue: 0,
  });
  const [transports, setTransports] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOverviewData = async () => {
      setLoading(true);
      const { data: tList } = await supabase.from('transports').select('*');
      const { data: vList } = await supabase.from('vehicles').select('*');
      
      if (tList) {
        setTransports(tList);
        
        // Calculate statistics
        const activeCount = tList.filter((t: any) => t.status === 'attivo').length;
        const scheduledCount = tList.filter((t: any) => t.status === 'programmati').length;
        const completedCount = tList.filter((t: any) => t.status === 'completato').length;
        const totalRevenue = tList
          .filter((t: any) => t.status === 'completato')
          .reduce((sum: number, t: any) => sum + (Number(t.cost) || 0), 0);

        setStats({
          active: activeCount,
          scheduled: scheduledCount,
          completed: completedCount,
          revenue: totalRevenue,
        });
      }

      if (vList) setVehicles(vList);
      setLoading(false);
    };

    loadOverviewData();
  }, []);

  const activeTransportsList = transports.filter((t: any) => t.status === 'attivo');

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight">Panoramica Amministrativa</h2>
        <p className="text-sm text-slate-400">Monitoraggio real-time flotta, fatturato e servizi in corso</p>
      </div>

      {/* Grid Stats Widgets */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="glass-panel h-28 animate-pulse rounded-2xl"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Active widget */}
          <div className="glass-panel p-4 rounded-2xl flex flex-col justify-between border-l-4 border-l-teal-500 bg-teal-500/[0.01]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">In Servizio</span>
              <div className="h-8 w-8 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <Activity className="h-4.5 w-4.5 animate-pulse" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white leading-none">
                {stats.active}
              </h3>
              <p className="text-[10px] text-teal-600 dark:text-teal-450 font-bold mt-1.5 uppercase">Equipaggi in movimento</p>
            </div>
          </div>

          {/* Scheduled widget */}
          <div className="glass-panel p-4 rounded-2xl flex flex-col justify-between border-l-4 border-l-blue-500 bg-blue-500/[0.01]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pianificati</span>
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Calendar className="h-4.5 w-4.5" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white leading-none">
                {stats.scheduled}
              </h3>
              <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold mt-1.5 uppercase">Servizi da assegnare</p>
            </div>
          </div>

          {/* Completed widget */}
          <div className="glass-panel p-4 rounded-2xl flex flex-col justify-between border-l-4 border-l-emerald-500 bg-emerald-500/[0.01]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completati</span>
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="h-4.5 w-4.5" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white leading-none">
                {stats.completed}
              </h3>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-450 font-bold mt-1.5 uppercase">Digitalizzati & Chiusi</p>
            </div>
          </div>

          {/* Turnover widget */}
          <div className="glass-panel p-4 rounded-2xl flex flex-col justify-between border-l-4 border-l-indigo-500 bg-indigo-500/[0.01]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fatturato</span>
              <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <DollarSign className="h-4.5 w-4.5" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white leading-none">
                {stats.revenue.toFixed(2)} €
              </h3>
              <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold mt-1.5 uppercase">Somma tariffe chiuse</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Active Transports Monitor */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="glass-panel p-5 rounded-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse"></span>
              Monitor Servizi in Corso (Real-time)
            </h3>

            {loading ? (
              <div className="flex justify-center py-10">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-teal-600 border-slate-200"></div>
              </div>
            ) : activeTransportsList.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                Nessun trasporto attualmente in viaggio.
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {activeTransportsList.map((t) => (
                  <div key={t.id} className="p-4 border rounded-xl bg-slate-50/50 dark:bg-slate-900/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                        {t.transport_type.toUpperCase()} • {t.trip_type.toUpperCase()}
                      </span>
                      <h4 className="text-sm font-bold text-slate-850 dark:text-slate-200 leading-none">
                        {t.patient_name}
                      </h4>
                      <div className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-450 mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-rose-500" />
                          <b>Da:</b> {t.origin}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                          <b>A:</b> {t.destination}
                        </span>
                      </div>
                    </div>

                    {t.vehicles && (
                      <div className="flex flex-col items-end gap-1.5 self-stretch sm:self-auto border-t sm:border-t-0 pt-2.5 sm:pt-0">
                        <span className="flex items-center gap-1 bg-teal-500/10 text-teal-600 dark:text-teal-450 px-2 py-0.5 rounded text-[10px] font-bold">
                          <Truck className="h-3 w-3" />
                          {t.vehicles.license_plate}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400">
                          Km partenza: <b>{t.km_start}</b>
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Fleet Status & Quick Actions */}
        <div className="flex flex-col gap-4">
          
          {/* Fleet Status Card */}
          <div className="glass-panel p-5 rounded-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-1.5">
              <Truck className="h-4.5 w-4.5 text-teal-600" /> Stato Flotta Veicoli
            </h3>

            {loading ? (
              <div className="flex justify-center py-6">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-teal-650 border-slate-200"></div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {vehicles.map((v) => {
                  const isAssigned = transports.some((t: any) => t.status === 'attivo' && t.vehicle_id === v.id);
                  return (
                    <div key={v.id} className="flex items-center justify-between p-3 border rounded-xl bg-slate-50/20 dark:bg-slate-900/10">
                      <div className="flex items-center gap-3">
                        <div className={`h-2 w-2 rounded-full ${isAssigned ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">{v.license_plate}</span>
                          <span className="text-[10px] text-slate-450 capitalize">{v.type}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-650 dark:text-slate-350">{v.last_km} km</span>
                        <p className="text-[9px] text-slate-400 mt-0.5">{isAssigned ? 'IN SERVIZIO' : 'DISPONIBILE'}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Shortcuts */}
          <div className="glass-panel p-5 rounded-2xl flex flex-col gap-3">
            <h3 className="text-sm font-extrabold text-slate-400 uppercase tracking-wider">Scorciatoie Rapide</h3>
            <Link
              href="/dsh/transports"
              className="btn-touch w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold text-center"
            >
              Pianifica Nuovo Trasporto
            </Link>
            <Link
              href="/dsh/settings"
              className="btn-touch w-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 border rounded-xl text-xs font-bold text-center"
            >
              Approva Disponibilità Dipendenti
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}
