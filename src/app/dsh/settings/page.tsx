'use client';

import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Truck, 
  Calendar, 
  Check, 
  X, 
  Plus, 
  Trash2, 
  Settings, 
  Sparkles,
  ToggleLeft,
  ToggleRight,
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import FormField from '@/components/FormField';

export default function DshSettings() {
  const [activeTab, setActiveTab] = useState<'users' | 'vehicles' | 'shifts' | 'availabilities'>('users');
  
  // Lists State
  const [users, setUsers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [availabilities, setAvailabilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Staff creation form state
  const [newStaff, setNewStaff] = useState({ name: '', pay_n: '', role: 'user' as const });
  // Vehicle creation form state
  const [newVehicle, setNewVehicle] = useState({ license_plate: '', type: 'Ambulanza', last_km: 0 });
  // Shift creation form state
  const [newShift, setNewShift] = useState({ user_id: '', vehicle_id: '', date: new Date().toISOString().split('T')[0], start_time: '08:00', end_time: '14:00', role: 'capo_equipaggio' });

  const loadData = async () => {
    setLoading(true);
    const { data: uList } = await supabase.from('users').select('*');
    const { data: vList } = await supabase.from('vehicles').select('*');
    const { data: sList } = await supabase.from('shifts').select('*').order('date', { ascending: false });
    const { data: aList } = await supabase.from('availabilities').select('*').order('date', { ascending: false });

    if (uList) setUsers(uList);
    if (vList) setVehicles(vList);
    if (sList) setShifts(sList);
    if (aList) setAvailabilities(aList);
    
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- STAFF ACTIONS ---
  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.name || !newStaff.pay_n) return;
    
    await supabase.from('users').insert(newStaff);
    setNewStaff({ name: '', pay_n: '', role: 'user' });
    alert('Dipendente aggiunto!');
    loadData();
  };

  const handleDeleteStaff = async (id: string) => {
    if (confirm('Sicuro di voler rimuovere questo dipendente?')) {
      await supabase.from('users').delete().eq('id', id);
      loadData();
    }
  };

  // --- VEHICLE ACTIONS ---
  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehicle.license_plate) return;

    await supabase.from('vehicles').insert(newVehicle);
    setNewVehicle({ license_plate: '', type: 'Ambulanza', last_km: 0 });
    alert('Veicolo aggiunto alla flotta!');
    loadData();
  };

  const handleToggleVehicleActive = async (id: string, current: boolean) => {
    await supabase.from('vehicles').update({ active: !current }).eq('id', id);
    loadData();
  };

  const handleDeleteVehicle = async (id: string) => {
    if (confirm('Rimuovere definitivamente questo mezzo?')) {
      await supabase.from('vehicles').delete().eq('id', id);
      loadData();
    }
  };

  // --- SHIFT ACTIONS ---
  const handleAddShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShift.user_id) {
      alert('Seleziona un dipendente da assegnare!');
      return;
    }

    await supabase.from('shifts').insert(newShift);
    alert('Turno programmato con successo!');
    loadData();
  };

  const handleDeleteShift = async (id: string) => {
    if (confirm('Eliminare questo turno dal tabellone?')) {
      await supabase.from('shifts').delete().eq('id', id);
      loadData();
    }
  };

  // --- AVAILABILITY APPROVALS ---
  const handleApproveAvailability = async (id: string, approve: boolean) => {
    const status = approve ? 'approved' as const : 'rejected' as const;
    await supabase.from('availabilities').update({ status }).eq('id', id);
    alert(`Richiesta ${approve ? 'approvata' : 'rifiutata'}!`);
    loadData();
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Title */}
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight">Impostazioni & Turnazione</h2>
        <p className="text-sm text-slate-400">Pianifica i turni dell'equipaggio, gestisci il personale e approva le disponibilità</p>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 rounded-xl bg-slate-200/50 dark:bg-slate-900/50 p-1 border border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition-all ${
            activeTab === 'users'
              ? 'bg-white dark:bg-slate-800 text-teal-650 dark:text-teal-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Users className="h-4 w-4" /> Dipendenti
        </button>
        <button
          onClick={() => setActiveTab('vehicles')}
          className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition-all ${
            activeTab === 'vehicles'
              ? 'bg-white dark:bg-slate-800 text-teal-650 dark:text-teal-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Truck className="h-4 w-4" /> Flotta Mezzi
        </button>
        <button
          onClick={() => setActiveTab('shifts')}
          className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition-all ${
            activeTab === 'shifts'
              ? 'bg-white dark:bg-slate-800 text-teal-650 dark:text-teal-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Calendar className="h-4 w-4" /> Tabellone Turni
        </button>
        <button
          onClick={() => setActiveTab('availabilities')}
          className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition-all ${
            activeTab === 'availabilities'
              ? 'bg-white dark:bg-slate-800 text-teal-650 dark:text-teal-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <UserCheck className="h-4 w-4" /> Disponibilità
        </button>
      </div>

      {/* LOADING */}
      {loading ? (
        <div className="flex justify-center py-20 text-slate-400">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-teal-650 border-slate-200"></div>
        </div>
      ) : (
        <div className="animate-slide-in">
          
          {/* 1. USERS CRUD PANEL */}
          {activeTab === 'users' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form Creation Column */}
              <div className="glass-panel p-5 rounded-2xl h-fit">
                <h3 className="text-sm font-bold border-b pb-2 text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-4">Aggiungi Dipendente</h3>
                <form onSubmit={handleAddStaff} className="flex flex-col gap-4">
                  <FormField
                    label="Nome Completo"
                    id="user-name"
                    value={newStaff.name}
                    onChange={(val) => setNewStaff(p => ({ ...p, name: val }))}
                    placeholder="Mario Rossi"
                    required
                  />
                  <FormField
                    label="Matricola / Payroll N."
                    id="user-pay"
                    value={newStaff.pay_n}
                    onChange={(val) => setNewStaff(p => ({ ...p, pay_n: val }))}
                    placeholder="MATR101"
                    required
                  />
                  <FormField
                    label="Ruolo Sistema"
                    id="user-role"
                    type="select"
                    value={newStaff.role}
                    onChange={(val) => setNewStaff(p => ({ ...p, role: val as any }))}
                    options={[
                      { value: 'user', label: 'Operatore Equipaggio (User)' },
                      { value: 'admin', label: 'Operatore Centrale (Admin)' },
                    ]}
                  />
                  <button
                    type="submit"
                    className="btn-touch w-full bg-teal-650 hover:bg-teal-700 text-white rounded-xl font-bold shadow-md shadow-teal-500/10 text-xs mt-2"
                  >
                    Aggiungi Personale
                  </button>
                </form>
              </div>

              {/* Data Table Column */}
              <div className="lg:col-span-2 glass-panel rounded-2xl overflow-hidden shadow-sm border bg-white/70 dark:bg-slate-900/50">
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-150 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50 text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">
                        <th className="px-5 py-3">Nome</th>
                        <th className="px-5 py-3">Matricola</th>
                        <th className="px-5 py-3">Ruolo</th>
                        <th className="px-5 py-3 text-right">Rimuovi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 dark:divide-slate-800 font-medium">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-850/20">
                          <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-white">{u.name}</td>
                          <td className="px-5 py-3.5 font-bold text-slate-500">{u.pay_n}</td>
                          <td className="px-5 py-3.5 capitalize">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${u.role === 'admin' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'bg-slate-200/50 dark:bg-slate-850 text-slate-650'}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              onClick={() => handleDeleteStaff(u.id)}
                              className="p-1 text-slate-450 hover:text-rose-500 rounded hover:bg-slate-100 dark:hover:bg-slate-850 transition"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 2. VEHICLES CRUD PANEL */}
          {activeTab === 'vehicles' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form Creation Column */}
              <div className="glass-panel p-5 rounded-2xl h-fit">
                <h3 className="text-sm font-bold border-b pb-2 text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-4">Aggiungi Mezzo</h3>
                <form onSubmit={handleAddVehicle} className="flex flex-col gap-4">
                  <FormField
                    label="Targa Mezzo"
                    id="veh-plate"
                    value={newVehicle.license_plate}
                    onChange={(val) => setNewVehicle(p => ({ ...p, license_plate: val }))}
                    placeholder="AMB123XY"
                    required
                  />
                  <FormField
                    label="Tipologia Allestimento"
                    id="veh-type"
                    type="select"
                    value={newVehicle.type}
                    onChange={(val) => setNewVehicle(p => ({ ...p, type: val }))}
                    options={[
                      { value: 'Ambulanza Tipo A', label: 'Ambulanza Tipo A' },
                      { value: 'Ambulanza Tipo B', label: 'Ambulanza Tipo B' },
                      { value: 'Doblò (Sedia Portantina)', label: 'Fiat Doblò (Sedia)' },
                      { value: 'Pulmino Sanitario', label: 'Pulmino Sanitario' },
                    ]}
                  />
                  <FormField
                    label="Chilometraggio Iniziale (Km)"
                    id="veh-km"
                    type="number"
                    value={newVehicle.last_km}
                    onChange={(val) => setNewVehicle(p => ({ ...p, last_km: Number(val) || 0 }))}
                    placeholder="Oodometro"
                  />
                  <button
                    type="submit"
                    className="btn-touch w-full bg-teal-650 hover:bg-teal-700 text-white rounded-xl font-bold shadow-md shadow-teal-500/10 text-xs mt-2"
                  >
                    Registra Veicolo
                  </button>
                </form>
              </div>

              {/* Data Table Column */}
              <div className="lg:col-span-2 glass-panel rounded-2xl overflow-hidden shadow-sm border bg-white/70 dark:bg-slate-900/50">
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-150 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50 text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">
                        <th className="px-5 py-3">Targa</th>
                        <th className="px-5 py-3">Tipo Allestimento</th>
                        <th className="px-5 py-3">Oodometro (Km)</th>
                        <th className="px-5 py-3 text-center">Stato Mezzo</th>
                        <th className="px-5 py-3 text-right">Rimuovi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 dark:divide-slate-800 font-medium">
                      {vehicles.map((v) => (
                        <tr key={v.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-850/20">
                          <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-white">{v.license_plate}</td>
                          <td className="px-5 py-3.5 font-bold text-slate-500">{v.type}</td>
                          <td className="px-5 py-3.5 font-black text-slate-800 dark:text-white">{v.last_km} km</td>
                          <td className="px-5 py-3.5 text-center">
                            <button
                              onClick={() => handleToggleVehicleActive(v.id, v.active)}
                              className={`p-1.5 rounded-lg border transition ${v.active ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-rose-500/10 border-rose-500/20 text-rose-600'}`}
                              title={v.active ? 'Mezzo attivo, clicca per bloccare' : 'Mezzo bloccato, clicca per sbloccare'}
                            >
                              {v.active ? 'ATTIVO / OPERATIVO' : 'FUORI SERVIZIO'}
                            </button>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              onClick={() => handleDeleteVehicle(v.id)}
                              className="p-1 text-slate-450 hover:text-rose-500 rounded hover:bg-slate-100 dark:hover:bg-slate-850 transition"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 3. SHIFTS PLANNER PANEL */}
          {activeTab === 'shifts' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form creation */}
              <div className="glass-panel p-5 rounded-2xl h-fit">
                <h3 className="text-sm font-bold border-b pb-2 text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-4">Programma Turno</h3>
                <form onSubmit={handleAddShift} className="flex flex-col gap-4">
                  <FormField
                    label="Data Turno"
                    id="sh-date"
                    type="date"
                    value={newShift.date}
                    onChange={(val) => setNewShift(p => ({ ...p, date: val }))}
                    required
                  />
                  <FormField
                    label="Operatore Dipendente"
                    id="sh-user"
                    type="select"
                    placeholder="-- Seleziona Operatore --"
                    value={newShift.user_id}
                    onChange={(val) => setNewShift(p => ({ ...p, user_id: val }))}
                    options={users.filter((u: any) => u.role === 'user').map((u: any) => ({ value: u.id, label: u.name }))}
                    required
                  />
                  <FormField
                    label="Mezzo Sanitario"
                    id="sh-vehicle"
                    type="select"
                    placeholder="-- Nessun mezzo pre-assegnato --"
                    value={newShift.vehicle_id}
                    onChange={(val) => setNewShift(p => ({ ...p, vehicle_id: val }))}
                    options={vehicles.map((v: any) => ({ value: v.id, label: v.license_plate }))}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      label="Da Ora"
                      id="sh-start"
                      type="time"
                      value={newShift.start_time}
                      onChange={(val) => setNewShift(p => ({ ...p, start_time: val }))}
                      required
                    />
                    <FormField
                      label="A Ora"
                      id="sh-end"
                      type="time"
                      value={newShift.end_time}
                      onChange={(val) => setNewShift(p => ({ ...p, end_time: val }))}
                      required
                    />
                  </div>
                  <FormField
                    label="Ruolo in Equipaggio"
                    id="sh-role"
                    type="select"
                    value={newShift.role}
                    onChange={(val) => setNewShift(p => ({ ...p, role: val }))}
                    options={[
                      { value: 'capo_equipaggio', label: 'Capo Equipaggio (CE)' },
                      { value: 'autista', label: 'Autista Soccorritore (A)' },
                      { value: 'terzo', label: 'Terzo Soccorritore (3°)' },
                    ]}
                  />
                  <button
                    type="submit"
                    className="btn-touch w-full bg-teal-650 hover:bg-teal-700 text-white rounded-xl font-bold shadow-md shadow-teal-500/10 text-xs mt-2"
                  >
                    Programma Turno
                  </button>
                </form>
              </div>

              {/* Data Table */}
              <div className="lg:col-span-2 glass-panel rounded-2xl overflow-hidden shadow-sm border bg-white/70 dark:bg-slate-900/50">
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-150 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50 text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">
                        <th className="px-5 py-3">Data & Orario</th>
                        <th className="px-5 py-3">Dipendente</th>
                        <th className="px-5 py-3">Mezzo</th>
                        <th className="px-5 py-3">Ruolo Assegnato</th>
                        <th className="px-5 py-3 text-right">Rimuovi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 dark:divide-slate-800 font-medium">
                      {shifts.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-850/20">
                          <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-white">
                            <div className="flex flex-col gap-0.5">
                              <span>{s.date}</span>
                              <span className="text-[10px] font-bold text-slate-450 flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {s.start_time.substring(0, 5)} - {s.end_time.substring(0, 5)}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 font-bold text-slate-850 dark:text-slate-200">
                            {s.users ? s.users.name : 'Nessuno'}
                          </td>
                          <td className="px-5 py-3.5 font-bold text-slate-500">
                            {s.vehicles ? s.vehicles.license_plate : '--'}
                          </td>
                          <td className="px-5 py-3.5 capitalize">
                            <span className="px-2.5 py-0.5 rounded bg-teal-500/10 text-teal-600 dark:text-teal-400 text-[10px] font-bold">
                              {s.role.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              onClick={() => handleDeleteShift(s.id)}
                              className="p-1 text-slate-450 hover:text-rose-500 rounded hover:bg-slate-100 dark:hover:bg-slate-850 transition"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 4. AVAILABILITY REQUESTS PANEL */}
          {activeTab === 'availabilities' && (
            <div className="glass-panel rounded-2xl overflow-hidden shadow-sm border bg-white/70 dark:bg-slate-900/50">
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-150 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50 text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">
                      <th className="px-5 py-3.5">Operatore Dipendente</th>
                      <th className="px-5 py-3.5">Data Disponibile</th>
                      <th className="px-5 py-3.5">Orario Disponibile</th>
                      <th className="px-5 py-3.5">Stato Richiesta</th>
                      <th className="px-5 py-3.5 text-right">Azioni Approvazione</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 dark:divide-slate-800 font-medium">
                    {availabilities.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-850/20">
                        <td className="px-5 py-4 font-bold text-slate-800 dark:text-white">
                          {a.users ? a.users.name : 'Nessuno'}
                        </td>
                        <td className="px-5 py-4 font-bold text-slate-550">{a.date}</td>
                        <td className="px-5 py-4 font-bold text-slate-800 dark:text-white flex items-center gap-1.5 mt-0.5">
                          <Clock className="h-4 w-4 text-slate-400" />
                          {a.start_time.substring(0, 5)} - {a.end_time.substring(0, 5)}
                        </td>
                        <td className="px-5 py-4">
                          {a.status === 'approved' && (
                            <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 text-emerald-650 px-2 py-0.5 text-[10px] font-bold">
                              <CheckCircle2 className="h-3 w-3" /> APPROVATO
                            </span>
                          )}
                          {a.status === 'rejected' && (
                            <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 text-rose-650 px-2 py-0.5 text-[10px] font-bold">
                              <XCircle className="h-3 w-3" /> RIFIUTATO
                            </span>
                          )}
                          {a.status === 'pending' && (
                            <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 text-amber-600 px-2 py-0.5 text-[10px] font-bold animate-pulse-slow">
                              IN ATTESA
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          {a.status === 'pending' ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleApproveAvailability(a.id, false)}
                                className="p-1 text-slate-450 hover:text-rose-500 hover:bg-rose-500/10 rounded transition border"
                                title="Rifiuta disponibilità"
                              >
                                <X className="h-4.5 w-4.5" />
                              </button>
                              <button
                                onClick={() => handleApproveAvailability(a.id, true)}
                                className="p-1 text-slate-450 hover:text-emerald-500 hover:bg-emerald-500/10 rounded transition border font-bold"
                                title="Approva disponibilità"
                              >
                                <Check className="h-4.5 w-4.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-405 font-medium text-[10px] italic">Gestito</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
