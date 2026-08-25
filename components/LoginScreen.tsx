import React, { useState, useEffect } from 'react';
import { LogIn, Mail, Lock, ShieldAlert, Loader2, CheckCircle2, WifiOff, ShieldCheck } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (user: string, pass: string) => void;
  onGoogleLogin?: () => Promise<void>;
  isAuthenticating: boolean;
  loginSuccess: boolean;
  error: string;
  isReady: boolean;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ 
  onLogin, 
  isAuthenticating, 
  loginSuccess, 
  error 
}) => {
  const [form, setForm] = useState({ user: '', pass: '' });
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAuthenticating || loginSuccess) return;
    onLogin(form.user, form.pass);
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4 font-sans antialiased selection:bg-indigo-500 selection:text-white">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/90 shadow-2xl p-7 sm:p-8 space-y-6">
        
        {/* BRANDING HEADER */}
        <div className="flex items-center space-x-3.5 pb-5 border-b border-slate-100">
          <div className="w-11 h-11 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xl shadow-sm ring-1 ring-slate-800/10">
            S
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none">
              Startech Hub
            </h1>
          </div>
          {isOffline && (
            <div className="ml-auto flex items-center space-x-1 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full text-[10px] font-bold border border-amber-200 shadow-xs">
              <WifiOff size={12} />
              <span>Offline Mode</span>
            </div>
          )}
        </div>

        {/* CREDENTIALS FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
              Username
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                required 
                disabled={isAuthenticating || loginSuccess}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all disabled:opacity-60"
                placeholder="Enter username"
                value={form.user}
                onChange={e => setForm({...form, user: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="password" 
                required 
                disabled={isAuthenticating || loginSuccess}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all disabled:opacity-60"
                placeholder="••••••••"
                value={form.pass}
                onChange={e => setForm({...form, pass: e.target.value})}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200 rounded-xl flex items-center space-x-2.5 animate-in fade-in">
              <ShieldAlert size={16} className="text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button 
            type="submit" 
            disabled={isAuthenticating || loginSuccess}
            className={`w-full py-3 rounded-xl font-black uppercase tracking-wider text-xs transition-all duration-300 flex items-center justify-center space-x-2 shadow-xs cursor-pointer ${
              loginSuccess
                ? 'bg-emerald-600 text-white scale-[0.99] ring-2 ring-emerald-400/40'
                : isAuthenticating 
                  ? 'bg-slate-800 text-white cursor-wait'
                  : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.99]'
            }`}
          >
            {loginSuccess ? (
              <div className="flex items-center space-x-2 animate-in fade-in zoom-in-95 duration-200">
                <CheckCircle2 size={16} className="text-emerald-200" />
                <span>Authorized · Signed In</span>
              </div>
            ) : isAuthenticating ? (
              <div className="flex items-center space-x-2 animate-in fade-in duration-200">
                <Loader2 size={16} className="animate-spin text-slate-300" />
                <span>Verifying Credentials...</span>
              </div>
            ) : (
              <>
                <LogIn size={16} />
                <span>Sign in</span>
              </>
            )}
          </button>

          <div className="pt-2 flex items-center justify-center space-x-1.5 text-slate-400 text-[10px]">
            <ShieldCheck size={12} className="text-slate-400" />
            <span className="font-medium">Secure Session Authentication</span>
          </div>
        </form>

      </div>
    </div>
  );
};

export default LoginScreen;
