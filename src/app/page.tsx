'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Activity, 
  Smartphone, 
  Monitor, 
  Database, 
  ChevronRight, 
  RefreshCw, 
  ShieldAlert, 
  HeartHandshake, 
  Truck,
  Users
} from 'lucide-react';
import { isMockMode, resetMockData } from '@/lib/supabaseClient';

export default function Home() {
  const [activeCrew, setActiveCrew] = useState<any>(null);
  const [dbStatus, setDbStatus] = useState<string>('checking');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('amb_active_crew');
      if (stored) {
        try {
          setActiveCrew(JSON.parse(stored));
        } catch (e) {}
      }
    }
    setDbStatus(isMockMode ? 'mock' : 'live');
  }, []);

  const handleResetData = () => {
    if (confirm('Sei sicuro di voler resettare tutti i dati locali del database di test? Verrà ricaricata la pagina con i dati predefiniti.')) {
      resetMockData();
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 min-h-screen">
      
      {/* Background ambient glows */}
      <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-teal-500/10 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>

      <main className="relative z-10 w-full max-w-3xl glass-panel p-6 md:p-10 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-2xl flex flex-col gap-8 animate-slide-in">
        
        {/* Brand Banner */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-650 text-white shadow-xl shadow-teal-500/20">
            <Activity className="h-7 w-7 animate-pulse" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-gradient-to-r from-teal-650 via-teal-500 to-indigo-600 bg-clip-text text-transparent dark:from-teal-400 dark:via-cyan-400 dark:to-indigo-400">
              AmbuLog
            </h1>
            <p className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">
              Portale Servizi Sanitari Secondari
            </p>
          </div>
          <p className="text-xs md:text-sm text-slate-400 dark:text-slate-350 max-w-md mt-1 leading-relaxed">
            Piattaforma full-stack per la digitalizzazione dei moduli cartacei di trasporto sanitario, dimissioni, visite e trasferimenti.
          </p>
        </div>

        {/* Database Status Pill */}
        <div className="mx-auto flex items-center justify-center">
          {dbStatus === 'mock' ? (
            <div className="flex flex-col sm:flex-row items-center gap-2 rounded-2xl bg-amber-500/10 border border-amber-500/25 px-4 py-2.5 text-xs text-amber-700 dark:text-amber-400">
              <div className="flex items-center gap-1.5 font-bold">
                <Database className="h-4 w-4" />
                <span>DATABASE DI PROVA LOCALE ATTIVO (localStorage)</span>
              </div>
              <button 
                onClick={handleResetData}
                className="mt-1 sm:mt-0 sm:ml-2 flex items-center gap-1 px-2.5 py-1 bg-amber-500 text-white font-extrabold rounded-lg hover:bg-amber-600 active:scale-95 transition"
              >
                <RefreshCw className="h-3 w-3" /> Resetta Database
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-450">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>CONNESSO AL DATABASE SUPABASE LIVE</span>
            </div>
          )}
        </div>

        {/* Dual Role Selector Interface */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
          
          {/* USR Card Selector */}
          <Link
            href="/usr"
            className="group glass-card p-6 rounded-2xl border text-left flex flex-col justify-between gap-4 transition active:scale-[0.98] bg-white/40 dark:bg-slate-900/40"
          >
            <div className="flex justify-between items-start">
              <div className="h-10 w-10 rounded-xl bg-teal-600/10 text-teal-600 dark:text-teal-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Smartphone className="h-5.5 w-5.5" />
              </div>
              <span className="text-[10px] font-bold text-teal-650 dark:text-teal-405 bg-teal-500/10 px-2 py-0.5 rounded uppercase">Mobile-First</span>
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-850 dark:text-white leading-none">
                Equipaggio Bordo (USR)
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed font-medium">
                Interfaccia per soccorritori/autisti sul mezzo. Compilazione a step rapida, orari, tragitti, logistica paziente e chiusura foglio servizio.
              </p>
            </div>
            <div className="flex items-center justify-between text-xs font-extrabold text-teal-600 dark:text-teal-400 border-t pt-3 mt-2 border-slate-100 dark:border-slate-850">
              <span>{activeCrew ? `Continua turno: ${activeCrew.vehiclePlate}` : 'Avvia Turno'}</span>
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* DSH Card Selector */}
          <Link
            href="/dsh"
            className="group glass-card p-6 rounded-2xl border text-left flex flex-col justify-between gap-4 transition active:scale-[0.98] bg-white/40 dark:bg-slate-900/40"
          >
            <div className="flex justify-between items-start">
              <div className="h-10 w-10 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Monitor className="h-5.5 w-5.5" />
              </div>
              <span className="text-[10px] font-bold text-indigo-650 dark:text-indigo-405 bg-indigo-500/10 px-2 py-0.5 rounded uppercase">Desktop-First</span>
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-850 dark:text-white leading-none">
                Centrale Operativa (DSH)
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed font-medium">
                Pannello per ufficio. Gestione storica, programmazione trasporti futuri, anagrafiche mezzi/personale e approvazione disponibilità turni.
              </p>
            </div>
            <div className="flex items-center justify-between text-xs font-extrabold text-indigo-600 dark:text-indigo-400 border-t pt-3 mt-2 border-slate-100 dark:border-slate-850">
              <span>Accedi alla Dashboard</span>
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

        </div>

        {/* Feature Specs Footer */}
        <div className="grid grid-cols-3 gap-3 border-t border-slate-200/50 dark:border-slate-800 pt-6 mt-2 text-center text-slate-500 dark:text-slate-400 text-[10px] md:text-xs">
          <div className="flex flex-col items-center gap-1">
            <Truck className="h-4.5 w-4.5 text-teal-600" />
            <span className="font-bold text-slate-700 dark:text-slate-350">Gestione Odomotrica</span>
            <p className="hidden md:block text-[10px] text-slate-400 font-medium">Calcolo delta-km automatico agganciato a veicoli</p>
          </div>
          <div className="flex flex-col items-center gap-1 border-x border-slate-200/50 dark:border-slate-800">
            <Users className="h-4.5 w-4.5 text-teal-650" />
            <span className="font-bold text-slate-700 dark:text-slate-350">Turnistica Intelligente</span>
            <p className="hidden md:block text-[10px] text-slate-400 font-medium">Equipaggi a turni e approvazione disponibilità calendarizzate</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <HeartHandshake className="h-4.5 w-4.5 text-indigo-600" />
            <span className="font-bold text-slate-700 dark:text-slate-350">Digitalizzazione Modulo</span>
            <p className="hidden md:block text-[10px] text-slate-400 font-medium">Mappatura completa e fatturazione a ricevuta cartacea</p>
          </div>
        </div>

      </main>

    </div>
  );
}
