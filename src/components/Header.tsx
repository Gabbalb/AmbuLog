'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Activity, RefreshCw, LogOut, ArrowLeftRight, Trash2 } from 'lucide-react';
import { isMockMode, resetMockData } from '@/lib/supabaseClient';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBackToPortal?: boolean;
}

export default function Header({ title = 'AmbuLog', subtitle, showBackToPortal = true }: HeaderProps) {
  const router = useRouter();
  const [activeCrew, setActiveCrew] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('amb_active_crew');
      if (stored) {
        try {
          setActiveCrew(JSON.parse(stored));
        } catch (e) {
          // Ignore
        }
      }
    }
  }, []);

  const handleWipeData = () => {
    if (confirm('Sei sicuro di voler resettare tutti i dati del database locale? Questo ripristinerà i dati iniziali di esempio.')) {
      resetMockData();
    }
  };

  const handleLogout = () => {
    if (confirm('Vuoi disconnetterti da AmbuLog?')) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('amb_user_session');
        localStorage.removeItem('amb_active_crew');
      }
      router.push('/');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b px-4 py-3 md:px-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        
        {/* Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-650 text-white shadow-md shadow-teal-500/20">
            <Activity className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-teal-650 to-indigo-600 bg-clip-text text-transparent dark:from-teal-400 dark:to-cyan-400">
              {title}
            </h1>
            {subtitle ? (
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{subtitle}</p>
            ) : activeCrew ? (
              <p className="text-xs font-semibold text-teal-600 dark:text-teal-400">
                Mezzo: {activeCrew.vehiclePlate} | CE: {activeCrew.ceName.split(' ')[0]}
              </p>
            ) : (
              <p className="text-xs text-slate-400">Servizi Sanitari Secondari</p>
            )}
          </div>
        </div>

        {/* Action Tray */}
        <div className="flex items-center gap-2">
          {/* Mock Mode Status Badge */}
          {isMockMode && (
            <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              <span className="hidden sm:inline">DATABASE MOCK</span>
              <button 
                onClick={handleWipeData}
                title="Wipe Local Database"
                className="ml-1 p-0.5 hover:bg-amber-500/20 rounded transition text-amber-700 dark:text-amber-300"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Logout button */}
          {showBackToPortal && (
            <button
              onClick={handleLogout}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-850 bg-rose-500/10 hover:bg-rose-500/25 px-3 text-xs font-semibold text-rose-600 dark:text-rose-455 transition shadow-sm"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Disconnetti</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
