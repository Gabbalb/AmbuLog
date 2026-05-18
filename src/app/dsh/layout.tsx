'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Activity, 
  ClipboardList, 
  Settings, 
  Heart, 
  ArrowLeftRight,
  TrendingUp,
  Sliders,
  Sparkles
} from 'lucide-react';
import Header from '@/components/Header';

export default function DshLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sessionStr = localStorage.getItem('amb_user_session');
      if (!sessionStr) {
        router.push('/');
        return;
      }
      try {
        const session = JSON.parse(sessionStr);
        if (session.role !== 'admin') {
          alert('Accesso negato! Area riservata alla Centrale Operativa.');
          router.push('/');
          return;
        }
        setAuthorized(true);
      } catch (e) {
        router.push('/');
      }
    }
  }, [router]);

  const menuItems = [
    { href: '/dsh', icon: Activity, label: 'Overview centrale' },
    { href: '/dsh/transports', icon: ClipboardList, label: 'Gestione Trasporti' },
    { href: '/dsh/settings', icon: Settings, label: 'Impostazioni & Turni' },
  ];

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-teal-500 border-slate-850"></div>
          <span className="text-xs font-semibold text-slate-400">Verifica sessione in corso...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans">
      {/* Shared Header */}
      <Header title="AmbuLog Admin" subtitle="Centrale Operativa Desktop" showBackToPortal={true} />

      <div className="flex flex-1 max-w-7xl mx-auto w-full px-4 py-6 gap-6">
        
        {/* Left Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 shrink-0 gap-4">
          <div className="glass-panel p-5 rounded-2xl flex flex-col gap-6 bg-white/70 dark:bg-slate-900/60 shadow-sm border">
            
            <div className="flex flex-col gap-1 px-1">
              <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">Console Amministrativa</span>
              <h3 className="text-lg font-black tracking-tight text-slate-800 dark:text-white">Centrale</h3>
            </div>

            {/* Sidebar Navigation */}
            <nav className="flex flex-col gap-1.5">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/dsh' && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                      isActive 
                        ? 'bg-teal-600 text-white shadow-md shadow-teal-500/10' 
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-4 border-t border-slate-150 dark:border-slate-800 pt-4 px-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-teal-500" />
                <span>Interfaccia Desktop v1.0</span>
              </div>
              <p className="leading-normal font-medium">Gestione immediata flotta, anagrafiche dipendenti e orari trasporti sanitari.</p>
            </div>
          </div>
        </aside>

        {/* Right Content Area */}
        <main className="flex-1 min-w-0 bg-white/30 dark:bg-slate-900/10 rounded-2xl animate-slide-in">
          
          {/* Top Mobile Menu Toggle (only on smaller screens) */}
          <div className="flex md:hidden items-center justify-around gap-2 mb-6 bg-slate-200/50 dark:bg-slate-900/50 p-1.5 border rounded-xl">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/dsh' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label.split(' ')[0]}</span>
                </Link>
              );
            })}
          </div>

          {children}
        </main>

      </div>
    </div>
  );
}
