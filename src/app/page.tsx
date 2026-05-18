'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Activity, 
  KeyRound, 
  Database, 
  RefreshCw, 
  HelpCircle,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { supabase, isMockMode, resetMockData } from '@/lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const [matricola, setMatricola] = useState('');
  const [password, setPassword] = useState(''); // Visual input field for premium layout
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<string>('checking');
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    setDbStatus(isMockMode ? 'mock' : 'live');
    // Clear any stale session on loading page
    if (typeof window !== 'undefined') {
      localStorage.removeItem('amb_user_session');
    }
  }, []);

  const handleResetData = () => {
    if (confirm('Sei sicuro di voler resettare tutti i dati locali del database di test? Verrà ricaricata la pagina con i dati predefiniti.')) {
      resetMockData();
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matricola.trim()) {
      setError('Inserisci la tua matricola.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Query users table for matching Payroll Number / Matricola
      const { data, error: queryError } = await supabase
        .from('users')
        .select('*')
        .eq('pay_n', matricola.trim().toUpperCase());

      if (queryError) {
        throw new Error(queryError.message);
      }

      const user = data && data[0];

      if (!user) {
        setError('Matricola non valida o inesistente nel database. Riprova.');
        setLoading(false);
        return;
      }

      // Save user session in localStorage
      localStorage.setItem('amb_user_session', JSON.stringify(user));

      // Direct based on role
      if (user.role === 'admin') {
        router.push('/dsh');
      } else {
        router.push('/usr');
      }
    } catch (err: any) {
      console.error(err);
      setError('Errore di connessione al database: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectTestCred = (code: string) => {
    setMatricola(code);
    setPassword('••••••••');
    setError(null);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 min-h-screen relative">
      
      {/* Background ambient glows */}
      <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-teal-500/10 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>

      <main className="relative z-10 w-full max-w-md glass-panel p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 shadow-2xl flex flex-col gap-6 animate-slide-in">
        
        {/* Brand Banner */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-650 text-white shadow-xl shadow-teal-500/20">
            <Activity className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight bg-gradient-to-r from-teal-650 via-teal-500 to-indigo-600 bg-clip-text text-transparent dark:from-teal-400 dark:via-cyan-400 dark:to-indigo-400">
              AmbuLog
            </h1>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">
              Accesso Portale Servizi Sanitari
            </p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4 mt-2">
          
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-semibold leading-relaxed animate-shake">
              ⚠️ {error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Codice Matricola</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Es: MATR101 o ADMIN01"
                value={matricola}
                onChange={(e) => setMatricola(e.target.value)}
                className="w-full pl-3 pr-10 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 font-medium text-sm text-slate-800 dark:text-white focus:outline-none focus:border-teal-500 transition-colors uppercase"
                disabled={loading}
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-450">
                <KeyRound className="h-4.5 w-4.5" />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Password (Opzionale per test)</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 font-medium text-sm text-slate-800 dark:text-white focus:outline-none focus:border-teal-500 transition-colors"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-touch w-full py-3 bg-teal-650 hover:bg-teal-700 text-white rounded-xl font-bold shadow-lg shadow-teal-500/10 flex items-center justify-center gap-1.5 active:scale-95 transition-all mt-2 text-sm"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-white border-white/20"></div>
            ) : (
              <>
                Accedi al Portale
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Database Status info */}
        <div className="border-t border-slate-200/50 dark:border-slate-800 pt-4 flex flex-col gap-3">
          
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-450 font-bold uppercase flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-teal-650" />
              Stato Connessione
            </span>
            {dbStatus === 'mock' ? (
              <span className="text-[10px] font-extrabold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">MOCK LOCAL</span>
            ) : (
              <span className="text-[10px] font-extrabold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">SUPABASE LIVE</span>
            )}
          </div>

          {/* Quick Helper for Test users */}
          <div className="rounded-xl bg-slate-550/[0.03] border border-slate-200/55 dark:border-slate-800 p-3">
            <button
              onClick={() => setShowHelp(!showHelp)}
              type="button"
              className="w-full flex items-center justify-between text-left text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              <span className="flex items-center gap-1">
                <HelpCircle className="h-3.5 w-3.5 text-teal-500" />
                Credenziali di Collaudo (Seleziona)
              </span>
              <span className="text-xs">{showHelp ? '▲' : '▼'}</span>
            </button>

            {showHelp && (
              <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-dashed border-slate-200 dark:border-slate-800 text-[10px] text-slate-450 font-medium">
                <div 
                  onClick={() => selectTestCred('ADMIN01')}
                  className="p-1.5 rounded bg-white dark:bg-slate-900 border hover:border-teal-500/40 cursor-pointer flex justify-between items-center transition"
                >
                  <span className="font-bold text-slate-700 dark:text-slate-300">ADMIN01</span>
                  <span className="bg-indigo-500/10 text-indigo-500 px-1 rounded text-[8px] font-extrabold">CENTRALE ADMIN</span>
                </div>
                <div 
                  onClick={() => selectTestCred('MATR101')}
                  className="p-1.5 rounded bg-white dark:bg-slate-900 border hover:border-teal-500/40 cursor-pointer flex justify-between items-center transition"
                >
                  <span className="font-bold text-slate-700 dark:text-slate-300">MATR101 (M. Rossi)</span>
                  <span className="bg-teal-500/10 text-teal-500 px-1 rounded text-[8px] font-extrabold">SOCCORRITORE USR</span>
                </div>
                <div 
                  onClick={() => selectTestCred('MATR102')}
                  className="p-1.5 rounded bg-white dark:bg-slate-900 border hover:border-teal-500/40 cursor-pointer flex justify-between items-center transition"
                >
                  <span className="font-bold text-slate-700 dark:text-slate-300">MATR102 (L. Bianchi)</span>
                  <span className="bg-teal-500/10 text-teal-500 px-1 rounded text-[8px] font-extrabold">SOCCORRITORE USR</span>
                </div>
                
                {dbStatus === 'mock' && (
                  <button 
                    onClick={handleResetData}
                    className="mt-1 w-full flex items-center justify-center gap-1 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-[9px] font-extrabold rounded transition active:scale-95 shadow-sm"
                  >
                    <RefreshCw className="h-2.5 w-2.5" /> Ripristina DB locale di Prova
                  </button>
                )}
              </div>
            )}
          </div>

        </div>

      </main>

    </div>
  );
}
