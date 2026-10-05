'use client';

import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  Terminal,
  Loader2,
  X,
  Send,
  Sparkles,
  Copy,
  Check,
} from 'lucide-react';
import { DatabaseIntrospectionResult } from '@/types/supabase';

interface AppLockGuardProps {
  children: React.ReactNode;
  currentData: DatabaseIntrospectionResult;
}

const STORAGE_KEY_AUTH = 'supasync_is_authenticated';
const STORAGE_KEY_PWD = 'supasync_master_password';
export const DEFAULT_PASSWORD = 'SupaSync-Admin-2026!#9xK$8mP';

export function generateRandomSecurePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=';
  const length = 20;
  let result = 'SupaSync-';
  const array = new Uint32Array(length);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  return result;
}

export const AppLockGuard: React.FC<AppLockGuardProps> = ({ children, currentData }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [masterPassword, setMasterPassword] = useState<string>(DEFAULT_PASSWORD);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    setIsAuthenticated(localStorage.getItem(STORAGE_KEY_AUTH) === 'true');
    setMasterPassword(localStorage.getItem(STORAGE_KEY_PWD) || DEFAULT_PASSWORD);
  }, []);

  const [inputPassword, setInputPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorShake, setErrorShake] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Password Management & Push Modal state
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [changeSuccess, setChangeSuccess] = useState(false);
  const [copiedPwd, setCopiedPwd] = useState(false);

  // Push to Vercel & Supabase states
  const [isPushing, setIsPushing] = useState(false);
  const [pushLogs, setPushLogs] = useState<string[]>([]);
  const [vercelToken, setVercelToken] = useState('');
  const [vercelProjectId, setVercelProjectId] = useState('');

  const handleUnlock = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (inputPassword === masterPassword || (!masterPassword && inputPassword === DEFAULT_PASSWORD)) {
      if (rememberMe) {
        localStorage.setItem(STORAGE_KEY_AUTH, 'true');
      }
      setIsAuthenticated(true);
      setErrorShake(false);
    } else {
      setErrorShake(true);
      setTimeout(() => setErrorShake(false), 800);
    }
  };

  const handleLock = () => {
    localStorage.removeItem(STORAGE_KEY_AUTH);
    setIsAuthenticated(false);
    setInputPassword('');
  };

  const handleGenerateSecurePassword = () => {
    const generated = generateRandomSecurePassword();
    setNewPasswordInput(generated);
  };

  const handleChangePassword = () => {
    if (!newPasswordInput.trim()) return;
    const newPwd = newPasswordInput.trim();
    localStorage.setItem(STORAGE_KEY_PWD, newPwd);
    setMasterPassword(newPwd);
    setChangeSuccess(true);
    setTimeout(() => {
      setChangeSuccess(false);
      setIsSettingsModalOpen(false);
      setNewPasswordInput('');
    }, 1500);
  };

  const handleCopyCurrentPassword = () => {
    navigator.clipboard.writeText(masterPassword);
    setCopiedPwd(true);
    setTimeout(() => setCopiedPwd(false), 2000);
  };

  // Push to Supabase and Vercel automatically
  const handlePushProtectionToBoth = async () => {
    setIsPushing(true);
    setPushLogs([
      `Initialisation du déploiement de la protection par mot de passe...`,
      `Mot de passe sélectionné : ****** (${masterPassword.length} caractères)`,
    ]);

    try {
      const res = await fetch('/api/security/push-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: masterPassword,
          vercelToken: vercelToken.trim() || undefined,
          vercelProjectId: vercelProjectId.trim() || undefined,
          supabaseData: currentData,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors du déploiement de la sécurité');

      setPushLogs(data.logs || ['Protection déployée avec succès.']);
    } catch (err: any) {
      setPushLogs((prev) => [...prev, `Erreur : ${err.message}`]);
    } finally {
      setIsPushing(false);
    }
  };

  if (!mounted) {
    return <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">Chargement...</div>;
  }

  // If locked, render Full Screen Lock Guard
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background glow ambient effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div
          className={`w-full max-w-md bg-zinc-900/90 border border-zinc-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative z-10 transition-transform ${
            errorShake ? 'animate-bounce border-red-500/50' : ''
          }`}
        >
          {/* Header Icon */}
          <div className="flex flex-col items-center text-center space-y-3 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
              <Lock className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                SupaSync Studio — Accès Sécurisé Admin
              </h1>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs">
                Cette application et l'accès à la base Supabase sont protégés par mot de passe administrateur.
              </p>
            </div>
          </div>

          {/* Password Form */}
          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-300">
                Mot de passe maître Administrateur
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Saisissez le mot de passe admin"
                  value={inputPassword}
                  onChange={(e) => setInputPassword(e.target.value)}
                  className="w-full pl-4 pr-11 py-3 bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl text-sm font-mono text-zinc-100 placeholder:text-zinc-600 outline-none transition-colors"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorShake && (
              <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-800/80 text-xs text-red-300 text-center font-medium">
                Mot de passe incorrect. Réessayez.
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-zinc-400">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-zinc-700 text-emerald-500 focus:ring-emerald-500 bg-zinc-950"
                />
                <span>Mémoriser la session</span>
              </label>

              <button
                type="button"
                onClick={() => setInputPassword(masterPassword)}
                className="text-emerald-400 hover:text-emerald-300 underline font-mono text-[11px]"
              >
                Remplir code admin
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-zinc-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
            >
              <Unlock className="w-4 h-4 text-zinc-950" />
              <span>Déverrouiller l'Application</span>
            </button>
          </form>

          {/* Footer Info */}
          <div className="mt-6 pt-5 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Protection Sécurisée Admin
            </span>
            <span className="font-mono text-zinc-400 truncate max-w-[180px]">
              Clé : <code className="text-emerald-400 bg-zinc-950 px-1 py-0.5 rounded">{masterPassword}</code>
            </span>
          </div>
        </div>
      </div>
    );
  }

  // If authenticated, render children + Security Control Floating Pill / Modal
  return (
    <>
      {children}

      {/* Floating Password Protection Pill */}
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-zinc-900/90 border border-zinc-800 p-2 rounded-2xl shadow-2xl backdrop-blur-md">
        <button
          onClick={() => setIsSettingsModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors"
          title="Gérer le mot de passe maître"
        >
          <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
          <span>Sécurité Admin</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
        </button>

        <button
          onClick={handleLock}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-red-950/40 hover:text-red-300 text-xs font-medium text-zinc-400 transition-colors"
          title="Verrouiller l'accès immédiatement"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Verrouiller</span>
        </button>
      </div>

      {/* Password Management & Push Modal */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Générateur & Gestion du Code d'Accès Admin
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Définissez ou générez des codes d'accès sécurisés côté administrateur et synchronisez-les.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Active Password Card */}
            <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 flex items-center justify-between gap-3">
              <div>
                <span className="text-[11px] text-zinc-400 font-medium block">
                  Mot de passe Admin actuellement actif :
                </span>
                <code className="text-sm font-bold font-mono text-emerald-400 break-all select-all">
                  {masterPassword}
                </code>
              </div>
              <button
                onClick={handleCopyCurrentPassword}
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-200 flex items-center gap-1 shrink-0 transition-colors"
              >
                {copiedPwd ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copié</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Copier</span>
                  </>
                )}
              </button>
            </div>

            {/* Generator & Change Password Input */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-200">
                  Définir ou Générer un nouveau mot de passe admin :
                </label>
                <button
                  type="button"
                  onClick={handleGenerateSecurePassword}
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Générer code fort</span>
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Saisissez ou générez un code sécurisé"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl text-xs font-mono text-zinc-100 placeholder:text-zinc-600 outline-none"
                />
                <button
                  type="button"
                  onClick={handleChangePassword}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-xl transition-colors shrink-0"
                >
                  {changeSuccess ? 'Enregistré !' : 'Sauvegarder'}
                </button>
              </div>
            </div>

            {/* Push to Supabase & Vercel */}
            <div className="p-4 bg-zinc-950/80 rounded-2xl border border-zinc-850 space-y-3">
              <span className="text-xs font-bold text-zinc-200 block">
                Pousser cette protection par mot de passe vers vos environnements :
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Vercel Target */}
                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-400">Projet Vercel (optionnel)</label>
                  <input
                    type="text"
                    placeholder="mon-projet-vercel"
                    value={vercelProjectId}
                    onChange={(e) => setVercelProjectId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-200 outline-none"
                  />
                </div>

                {/* Vercel Token */}
                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-400">Jeton Vercel (optionnel)</label>
                  <input
                    type="password"
                    placeholder="vercel_xxxxxxx"
                    value={vercelToken}
                    onChange={(e) => setVercelToken(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-200 outline-none"
                  />
                </div>
              </div>

              <button
                onClick={handlePushProtectionToBoth}
                disabled={isPushing}
                className="w-full py-2.5 bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {isPushing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Déploiement en cours...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Pousser la protection sur Supabase & Vercel</span>
                  </>
                )}
              </button>
            </div>

            {/* Push Terminal Logs */}
            {pushLogs.length > 0 && (
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden p-3 font-mono text-[11px] text-zinc-300 space-y-1 max-h-36 overflow-y-auto">
                {pushLogs.map((l, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <span className="text-zinc-600">&gt;</span>
                    <span className={l.includes('✅') ? 'text-emerald-400 font-semibold' : 'text-zinc-300'}>
                      {l}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
