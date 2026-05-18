'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Plus, Calendar, ShieldAlert, Award, Truck, UserCheck, Users } from 'lucide-react';
import Header from '@/components/Header';
import FormField from '@/components/FormField';
import { supabase } from '@/lib/supabaseClient';

export default function UsrLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [activeCrew, setActiveCrew] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Crew Setup Form State
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedCE, setSelectedCE] = useState('');
  const [selectedThird, setSelectedThird] = useState('');

  useEffect(() => {
    // 0. Check if user session exists
    if (typeof window !== 'undefined') {
      const sessionStr = localStorage.getItem('amb_user_session');
      if (!sessionStr) {
        router.push('/');
        return;
      }
      try {
        setCurrentUser(JSON.parse(sessionStr));
      } catch (e) {}
      setAuthorized(true);
    }

    // 1. Check if crew is set in local storage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('amb_active_crew');
      if (stored) {
        try {
          setActiveCrew(JSON.parse(stored));
        } catch (e) {
          // ignore
        }
      }
      setLoading(false);
    }

    // 2. Load vehicles & users for setup selection
    const loadSetupData = async () => {
      const { data: vList } = await supabase.from('vehicles').select('*');
      const { data: uList } = await supabase.from('users').select('*').eq('role', 'user');
      
      if (vList) setVehicles(vList);
      if (uList) setUsers(uList);
    };

    loadSetupData();
  }, []);

  const handleSetupCrew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle || !selectedDriver || !selectedCE) {
      alert('Per favore seleziona il Mezzo, l\'Autista e il Capo Equipaggio!');
      return;
    }

    const vehicleObj = vehicles.find(v => v.id === selectedVehicle);
    const driverObj = users.find(u => u.id === selectedDriver);
    const ceObj = users.find(u => u.id === selectedCE);
    const thirdObj = users.find(u => u.id === selectedThird) || null;

    const crewPayload = {
      vehicleId: selectedVehicle,
      vehiclePlate: vehicleObj?.license_plate || '',
      vehicleType: vehicleObj?.type || '',
      aId: selectedDriver,
      aName: driverObj?.name || '',
      ceId: selectedCE,
      ceName: ceObj?.name || '',
      thirdId: selectedThird || null,
      thirdName: thirdObj ? thirdObj.name : '',
    };

    localStorage.setItem('amb_active_crew', JSON.stringify(crewPayload));
    setActiveCrew(crewPayload);
    window.location.reload(); // Refresh to broadcast state change
  };

  const handleChangeCrew = () => {
    if (confirm('Vuoi davvero cambiare l\'equipaggio o il mezzo attivo su questo dispositivo?')) {
      localStorage.removeItem('amb_active_crew');
      setActiveCrew(null);
    }
  };

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-teal-500 border-slate-850"></div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Verifica sessione in corso...</span>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-20 text-slate-400">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-teal-600 border-slate-200"></div>
        <p className="mt-3 text-sm font-semibold">Caricamento...</p>
      </div>
    );
  }

  // Active crew logged in
  const navItems = [
    { href: '/usr', icon: Home, label: 'Home' },
    { href: '/usr/nuovo', icon: Plus, label: 'Nuovo', highlight: true },
    { href: '/usr/turni', icon: Calendar, label: 'Turni' },
  ];

  return (
    <div className="flex flex-col flex-1 pb-20 md:pb-0 min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
      <Header 
        title="AmbuLog USR" 
        subtitle={activeCrew ? `Equipaggio: ${activeCrew.vehiclePlate}` : (currentUser ? `Operatore: ${currentUser.name}` : 'Servizi Sanitari')} 
        showBackToPortal={true} 
      />
      
      {/* Active Shift Strip (Optional) */}
      {activeCrew && (
        <div className="bg-teal-500/10 border-b border-teal-500/20 text-xs px-4 py-2 font-medium flex items-center justify-between text-teal-700 dark:text-teal-400">
          <span className="flex items-center gap-1.5">
            <Truck className="h-3.5 w-3.5" />
            <span>A: <b>{activeCrew.aName.split(' ')[0]}</b> | CE: <b>{activeCrew.ceName.split(' ')[0]}</b> {activeCrew.thirdName && `| 3°: ${activeCrew.thirdName.split(' ')[0]}`}</span>
          </span>
          <button 
            onClick={handleChangeCrew}
            className="underline hover:no-underline font-semibold"
          >
            Cambia
          </button>
        </div>
      )}

      <main className="flex-1 w-full max-w-md mx-auto px-4 py-6 animate-slide-in">
        {children}
      </main>

      {/* Bottom Nav Bar for mobile screen */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg px-6 py-2 shadow-xl flex items-center justify-around md:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/usr' && pathname.startsWith(item.href));

          if (item.highlight) {
            return (
              <Link key={item.href} href={item.href} className="relative -top-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-500/30 transition-transform active:scale-95 border-4 border-slate-50 dark:border-slate-950">
                  <Icon className="h-6 w-6" />
                </div>
                <span className="absolute left-1/2 -translate-x-1/2 bottom-[-16px] text-[10px] font-bold text-teal-600 dark:text-teal-400">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-1 px-3 transition rounded-lg ${
                isActive ? 'text-teal-600 dark:text-teal-400 font-semibold' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon className="h-5.5 w-5.5" />
              <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
