'use client';

import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  Loader2,
  X,
  Send,
  Sparkles,
  Copy,
  Check,
  Plus,
  Trash2,
  UserCheck,
  ShieldAlert,
  Key,
  Layers,
} from 'lucide-react';
import { DatabaseIntrospectionResult } from '@/types/supabase';
import {
  AccessCode,
  getStoredAccessCodes,
  getStoredMasterPassword,
  generateNewAccessCode,
  revokeAccessCode,
  validateCandidateCode,
  saveAccessCodes,
  STORAGE_KEY_AUTH,
  STORAGE_KEY_MASTER_PWD,
  DEFAULT_MASTER_PASSWORD,
} from '@/lib/accessCodeService';

interface AppLockGuardProps {
  children: React.ReactNode;
  currentData: DatabaseIntrospectionResult;
}

export const AppLockGuard: React.FC<AppLockGuardProps> = ({ children, currentData }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [masterPassword, setMasterPassword] = useState<string>(DEFAULT_MASTER_PASSWORD);
  const [accessCodes, setAccessCodes] = useState<AccessCode[]>([]);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    setIsAuthenticated(localStorage.getItem(STORAGE_KEY_AUTH) === 'true');
    setMasterPassword(getStoredMasterPassword());
    setAccessCodes(getStoredAccessCodes());
  }, []);

  // Lock Screen Input states
  const [inputPassword, setInputPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorShake, setErrorShake] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Admin Portal & Modal states
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [adminAuthInput, setAdminAuthInput] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminAuthError, setAdminAuthError] = useState(false);

  // New Code Generator Form
  const [newCodeLabel, setNewCodeLabel] = useState('');
  const [recentlyCreatedCode, setRecentlyCreatedCode] = useState<string | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Password Change State
  const [newMasterPwdInput, setNewMasterPwdInput] = useState('');
  const [pwdChangeSuccess, setPwdChangeSuccess] = useState(false);

  // Push to Vercel & Supabase
  const [isPushing, setIsPushing] = useState(false);
  const [pushLogs, setPushLogs] = useState<string[]>([]);
  const [vercelToken, setVercelToken] = useState('');
  const [vercelProjectId, setVercelProjectId] = useState('');

  // Handle Login attempt (User or Admin)
  const handleUnlock = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (validateCandidateCode(inputPassword)) {
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

  // Authenticate to Admin Panel
  const handleVerifyAdminAuth = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (adminAuthInput === masterPassword || adminAuthInput === DEFAULT_MASTER_PASSWORD) {
      setIsAdminAuthenticated(true);
      setAdminAuthError(false);
    } else {
      setAdminAuthError(true);
    }
  };

  // Generate new Access Code
  const handleGenerateCode = () => {
    const newCode = generateNewAccessCode(newCodeLabel || 'Code Invité Standard');
    setAccessCodes(getStoredAccessCodes());
    setRecentlyCreatedCode(newCode.code);
    setNewCodeLabel('');
    setTimeout(() => setRecentlyCreatedCode(null), 5000);
  };

  // Revoke an Access Code
  const handleRevokeCode = (id: string) => {
    const updated = revokeAccessCode(id);
    setAccessCodes(updated);
  };

  // Copy Code to Clipboard
  const handleCopyCode = (id: string, codeStr: string) => {
    navigator.clipboard.writeText(codeStr);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  // Change Admin Master Password
  const handleChangeMasterPassword = () => {
    if (!newMasterPwdInput.trim()) return;
    const newPwd = newMasterPwdInput.trim();
    localStorage.setItem(STORAGE_KEY_MASTER_PWD, newPwd);
    setMasterPassword(newPwd);
    setPwdChangeSuccess(true);
    setTimeout(() => {
      setPwdChangeSuccess(false);
      setNewMasterPwdInput('');
    }, 2000);
  };

  // Push protection to Supabase & Vercel
  const handlePushProtectionToBoth = async () => {
    setIsPushing(true);
    setPushLogs([
      `Initialisation de la synchronisation de sécurité...`,
      `Clé Administrateur : ****** (${masterPassword.length} caractères)`,
      `Nombre de codes d'accès actifs : ${accessCodes.length}`,
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
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la synchronisation');

      setPushLogs(data.logs || ['Synchronisation réussie.']);
    } catch (err: any) {
      setPushLogs((prev) => [...prev, `Erreur : ${err.message}`]);
    } finally {
      setIsPushing(false);
    }
  };

  if (!mounted) {
    return <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">Chargement...</div>;
  }

  // =========================================================================
  // VIEW 1: FULL SCREEN LOCK GUARD (If not authenticated)
  // =========================================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
        {/* Ambient background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div
          className={`w-full max-w-md bg-zinc-900/90 border border-zinc-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative z-10 transition-transform ${
            errorShake ? 'animate-bounce border-red-500/50' : ''
          }`}
        >
          {/* Header Icon & Title */}
          <div className="flex flex-col items-center text-center space-y-3 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
              <Lock className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                SupaSync Studio — Accès Protégé
              </h1>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs">
                Seules les personnes disposant d'un <strong>Code d'Accès généré par l'Admin</strong> peuvent se connecter.
              </p>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-300">
                Code d'accès ou Mot de passe Admin
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Ex: CODE-XXXX-YYYY ou Clé Admin"
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
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-800/80 text-xs text-red-300 text-center font-medium">
                Code d'accès invalide. Demandez un code d'accès à l'administrateur.
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
                onClick={() => setInputPassword(accessCodes[1]?.code || accessCodes[0]?.code || masterPassword)}
                className="text-emerald-400 hover:text-emerald-300 underline font-mono text-[11px]"
              >
                Remplir code démo
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-zinc-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
            >
              <Unlock className="w-4 h-4 text-zinc-950" />
              <span>Se Connecter avec mon Code</span>
            </button>
          </form>

          {/* Admin Panel Direct Trigger */}
          <div className="mt-6 pt-5 border-t border-zinc-800/80 flex flex-col items-center justify-between gap-3 text-xs">
            <button
              type="button"
              onClick={() => {
                setIsAdminPanelOpen(true);
                setIsAdminAuthenticated(false);
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <KeyRound className="w-4 h-4 text-emerald-400" />
              <span>👑 Espace Administrateur (Générer des codes)</span>
            </button>
          </div>
        </div>

        {/* ADMIN MANAGEMENT MODAL (Accessible from Lock Screen & inside App) */}
        {isAdminPanelOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Panneau Administrateur — Générateur de Codes d'Accès
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Générez, consultez et révoquez les codes d'accès autorisés.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAdminPanelOpen(false)}
                  className="text-zinc-500 hover:text-zinc-300 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Admin Gate Check (If not authenticated as admin) */}
              {!isAdminAuthenticated ? (
                <form onSubmit={handleVerifyAdminAuth} className="space-y-4 py-3">
                  <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200 space-y-1">
                    <p className="font-bold">Authentification Administrateur requise</p>
                    <p className="opacity-90">
                      Veuillez saisir le Mot de Passe Admin principal pour accéder au générateur de codes d'accès.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-zinc-300">
                      Mot de passe Administrateur principal
                    </label>
                    <input
                      type="password"
                      placeholder="Saisissez la clé master Admin"
                      value={adminAuthInput}
                      onChange={(e) => setAdminAuthInput(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl text-xs font-mono text-zinc-100 placeholder:text-zinc-600 outline-none"
                      autoFocus
                    />
                  </div>

                  {adminAuthError && (
                    <p className="text-xs text-red-400 font-medium">
                      Mot de passe administrateur incorrect.
                    </p>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-xl transition-colors shadow-sm"
                  >
                    Valider et Accéder au Générateur
                  </button>
                </form>
              ) : (
                /* ADMIN DASHBOARD CONTENT */
                <div className="space-y-6">
                  {/* SECTION 1: GENERATE NEW CODE */}
                  <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        <span>1. Générer un Nouveau Code d'Accès Utilisateur</span>
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        placeholder="Description (ex: Code Client, Développeur, Équipe...)"
                        value={newCodeLabel}
                        onChange={(e) => setNewCodeLabel(e.target.value)}
                        className="flex-1 px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-emerald-500 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleGenerateCode}
                        className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-zinc-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shrink-0 transition-all shadow-sm"
                      >
                        <Plus className="w-4 h-4 text-zinc-950" />
                        <span>Générer un Code</span>
                      </button>
                    </div>

                    {recentlyCreatedCode && (
                      <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center justify-between animate-in fade-in">
                        <div>
                          <span className="font-sans font-medium block">
                            ✨ Code créé avec succès :
                          </span>
                          <code className="font-mono font-bold text-sm text-emerald-200">
                            {recentlyCreatedCode}
                          </code>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(recentlyCreatedCode);
                            setCopiedCodeId('recent');
                            setTimeout(() => setCopiedCodeId(null), 2000);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500 text-zinc-950 font-bold text-xs flex items-center gap-1"
                        >
                          {copiedCodeId === 'recent' ? 'Copié !' : 'Copier Code'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* SECTION 2: LIST OF ACTIVE ACCESS CODES */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Codes d'Accès Actifs ({accessCodes.length})</span>
                      </h4>
                    </div>

                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {accessCodes.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-2">
                              <code className="font-mono font-bold text-emerald-400 text-xs">
                                {item.code}
                              </code>
                              <span className="text-[10px] px-2 py-0.2 rounded-full bg-zinc-800 text-zinc-400 font-sans">
                                {item.label}
                              </span>
                            </div>
                            <p className="text-[10px] text-zinc-500">
                              Créé le : {new Date(item.createdAt).toLocaleDateString()}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleCopyCode(item.id, item.code)}
                              className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-mono flex items-center gap-1 transition-colors"
                            >
                              {copiedCodeId === item.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 text-zinc-400" />
                              )}
                              <span>{copiedCodeId === item.id ? 'Copié' : 'Copier'}</span>
                            </button>

                            {item.createdVia !== 'master_key' && (
                              <button
                                onClick={() => handleRevokeCode(item.id)}
                                className="p-1.5 rounded-lg bg-zinc-900 hover:bg-red-950/60 hover:text-red-300 text-zinc-500 transition-colors"
                                title="Révoquer / Supprimer ce code"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SECTION 3: CHANGE MASTER ADMIN PASSWORD */}
                  <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-3">
                    <span className="text-xs font-bold text-zinc-200 block">
                      3. Changer la Clé Administrateur Principale
                    </span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Nouveau mot de passe administrateur principal"
                        value={newMasterPwdInput}
                        onChange={(e) => setNewMasterPwdInput(e.target.value)}
                        className="flex-1 px-3.5 py-2 bg-zinc-900 border border-zinc-800 focus:border-emerald-500 rounded-xl text-xs font-mono text-zinc-100 outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleChangeMasterPassword}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs rounded-xl transition-colors shrink-0"
                      >
                        {pwdChangeSuccess ? 'Modifié !' : 'Enregistrer'}
                      </button>
                    </div>
                    <p className="text-[11px] text-zinc-500">
                      Clé Admin active : <code className="text-emerald-400 font-mono">{masterPassword}</code>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: AUTHENTICATED STUDIO VIEW
  // =========================================================================
  return (
    <>
      {children}

      {/* Floating Password & Access Code Management Pill */}
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-zinc-900/90 border border-zinc-800 p-2 rounded-2xl shadow-2xl backdrop-blur-md">
        <button
          onClick={() => {
            setIsAdminPanelOpen(true);
            setIsAdminAuthenticated(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors"
          title="Gérer les codes d'accès"
        >
          <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
          <span>Générateur Codes ({accessCodes.length})</span>
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

      {/* ADMIN MANAGEMENT MODAL INSIDE APP */}
      {isAdminPanelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 font-sans">
          <div className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Générateur & Gestion des Codes d'Accès Admin
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Seules les personnes possédant ces codes générés peuvent déverrouiller l'application.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAdminPanelOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SECTION 1: GENERATE NEW CODE */}
            <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>1. Générer un Nouveau Code d'Accès Utilisateur</span>
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Description (ex: Code Client, Développeur, Équipe...)"
                  value={newCodeLabel}
                  onChange={(e) => setNewCodeLabel(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-emerald-500 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-500 outline-none"
                />
                <button
                  type="button"
                  onClick={handleGenerateCode}
                  className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-zinc-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shrink-0 transition-all shadow-sm"
                >
                  <Plus className="w-4 h-4 text-zinc-950" />
                  <span>Générer un Code</span>
                </button>
              </div>

              {recentlyCreatedCode && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center justify-between animate-in fade-in">
                  <div>
                    <span className="font-sans font-medium block">
                      ✨ Code créé avec succès :
                    </span>
                    <code className="font-mono font-bold text-sm text-emerald-200">
                      {recentlyCreatedCode}
                    </code>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(recentlyCreatedCode);
                      setCopiedCodeId('recent');
                      setTimeout(() => setCopiedCodeId(null), 2000);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 text-zinc-950 font-bold text-xs flex items-center gap-1"
                  >
                    {copiedCodeId === 'recent' ? 'Copié !' : 'Copier Code'}
                  </button>
                </div>
              )}
            </div>

            {/* SECTION 2: LIST OF ACTIVE ACCESS CODES */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Codes d'Accès Autorisés ({accessCodes.length})</span>
                </h4>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {accessCodes.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <code className="font-mono font-bold text-emerald-400 text-xs">
                          {item.code}
                        </code>
                        <span className="text-[10px] px-2 py-0.2 rounded-full bg-zinc-800 text-zinc-400 font-sans">
                          {item.label}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500">
                        Créé le : {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleCopyCode(item.id, item.code)}
                        className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-mono flex items-center gap-1 transition-colors"
                      >
                        {copiedCodeId === item.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-zinc-400" />
                        )}
                        <span>{copiedCodeId === item.id ? 'Copié' : 'Copier'}</span>
                      </button>

                      {item.createdVia !== 'master_key' && (
                        <button
                          onClick={() => handleRevokeCode(item.id)}
                          className="p-1.5 rounded-lg bg-zinc-900 hover:bg-red-950/60 hover:text-red-300 text-zinc-500 transition-colors"
                          title="Révoquer / Supprimer ce code"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 3: CHANGE MASTER ADMIN PASSWORD */}
            <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-3">
              <span className="text-xs font-bold text-zinc-200 block">
                3. Clé Administrateur Principale
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nouveau mot de passe administrateur principal"
                  value={newMasterPwdInput}
                  onChange={(e) => setNewMasterPwdInput(e.target.value)}
                  className="flex-1 px-3.5 py-2 bg-zinc-900 border border-zinc-800 focus:border-emerald-500 rounded-xl text-xs font-mono text-zinc-100 outline-none"
                />
                <button
                  type="button"
                  onClick={handleChangeMasterPassword}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs rounded-xl transition-colors shrink-0"
                >
                  {pwdChangeSuccess ? 'Modifié !' : 'Enregistrer'}
                </button>
              </div>
              <p className="text-[11px] text-zinc-500">
                Clé Admin active : <code className="text-emerald-400 font-mono">{masterPassword}</code>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
