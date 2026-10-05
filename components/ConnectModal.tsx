'use client';

import React, { useState } from 'react';
import {
  X,
  Database,
  Key,
  Layers,
  Sparkles,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Info,
  Server,
  Zap,
} from 'lucide-react';
import { DEMO_PRESETS, DemoPreset } from '@/lib/presets';
import { DatabaseIntrospectionResult, SupabaseProjectOption } from '@/types/supabase';

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectSuccess: (data: DatabaseIntrospectionResult) => void;
}

export const ConnectModal: React.FC<ConnectModalProps> = ({
  isOpen,
  onClose,
  onConnectSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'url_key' | 'management_token' | 'presets'>('url_key');

  // Direct URL + Key
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Management Token
  const [managementToken, setManagementToken] = useState('');
  const [fetchingProjects, setFetchingProjects] = useState(false);
  const [projectsList, setProjectsList] = useState<SupabaseProjectOption[]>([]);
  const [selectedProjectRef, setSelectedProjectRef] = useState<string>('');

  if (!isOpen) return null;

  // Handler: Direct URL & Key
  const handleConnectDirect = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      let cleanUrl = supabaseUrl.trim();
      if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
        cleanUrl = 'https://' + cleanUrl;
      }

      const res = await fetch('/api/supabase/inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supabaseUrl: cleanUrl,
          supabaseKey: supabaseKey.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Échec de connexion au projet Supabase');
      }

      onConnectSuccess(data);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Impossible d\'inspecter le projet Supabase.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handler: Fetch projects via Management API
  const handleFetchProjects = async () => {
    if (!managementToken.trim()) return;
    setFetchingProjects(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/supabase/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: managementToken.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la récupération des projets');
      }

      setProjectsList(data.projects || []);
      if (data.projects && data.projects.length > 0) {
        setSelectedProjectRef(data.projects[0].ref || data.projects[0].id);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setFetchingProjects(false);
    }
  };

  // Handler: Select a project from Management API and inspect
  const handleSelectManagementProject = async () => {
    if (!selectedProjectRef) return;
    setIsLoading(true);
    setErrorMsg(null);

    try {
      // 1. Fetch keys
      const keysRes = await fetch('/api/supabase/project-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectRef: selectedProjectRef,
          accessToken: managementToken.trim(),
        }),
      });
      const keysData = await keysRes.json();
      if (!keysRes.ok) throw new Error(keysData.error || 'Impossible de récupérer les clés API');

      const anonKeyObj = keysData.keys?.find((k: any) => k.name === 'anon') || keysData.keys?.[0];
      const anonKey = anonKeyObj?.api_key;
      const targetUrl = `https://${selectedProjectRef}.supabase.co`;

      if (!anonKey) {
        throw new Error('Clé API introuvable pour ce projet.');
      }

      // 2. Inspect
      const inspectRes = await fetch('/api/supabase/inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supabaseUrl: targetUrl,
          supabaseKey: anonKey,
        }),
      });

      const inspectData = await inspectRes.json();
      if (!inspectRes.ok) throw new Error(inspectData.error || 'Échec de l\'inspection');

      onConnectSuccess(inspectData);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler: Select Demo Preset
  const handleSelectPreset = (preset: DemoPreset) => {
    onConnectSuccess(preset.data);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                Connecter & Configurer votre Base Supabase
              </h2>
              <p className="text-xs text-zinc-400">
                Extraction automatique des schémas, tables, relations et politiques RLS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/30 px-6 pt-2">
          <button
            onClick={() => setActiveTab('url_key')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'url_key'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>URL & Clé API</span>
          </button>

          <button
            onClick={() => setActiveTab('management_token')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'management_token'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Jeton Supabase (sbp_...)</span>
          </button>

          <button
            onClick={() => setActiveTab('presets')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'presets'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Démos Prêtes à l'Emploi</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {errorMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Erreur de connexion</p>
                <p className="mt-0.5 text-red-300/90">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* TAB 1: Direct URL + Key */}
          {activeTab === 'url_key' && (
            <form onSubmit={handleConnectDirect} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Supabase Project URL
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="https://xyzcompany.supabase.co"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 outline-none font-mono"
                  />
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Trouvable dans Supabase Dashboard &gt; Project Settings &gt; API
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Supabase Anon Key ou Service Role Key
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={supabaseKey}
                    onChange={(e) => setSupabaseKey(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 outline-none font-mono"
                  />
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  La clé anonyme <code className="text-zinc-400">anon public</code> suffit pour inspecter le schéma public via PostgREST OpenAPI.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setSupabaseUrl('https://demo-shop.supabase.co');
                    setSupabaseKey('demo-key-public-123');
                    handleSelectPreset(DEMO_PRESETS[0]);
                  }}
                  className="text-xs text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
                >
                  Charger un exemple de test rapide
                </button>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Inspection en cours...</span>
                    </>
                  ) : (
                    <>
                      <span>Inspecter & Configurer</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Supabase Management Token */}
          {activeTab === 'management_token' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Supabase Personal Access Token
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder="sbp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    value={managementToken}
                    onChange={(e) => setManagementToken(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleFetchProjects}
                    disabled={fetchingProjects || !managementToken.trim()}
                    className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {fetchingProjects ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Lister les projets'}
                  </button>
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Créez un jeton dans <a href="https://supabase.com/dashboard/account/tokens" target="_blank" rel="noreferrer" className="text-emerald-400 underline">supabase.com/dashboard/account/tokens</a>
                </p>
              </div>

              {projectsList.length > 0 && (
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-medium text-zinc-300">
                    Sélectionnez votre projet ({projectsList.length} détectés) :
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {projectsList.map((proj) => (
                      <div
                        key={proj.ref || proj.id}
                        onClick={() => setSelectedProjectRef(proj.ref || proj.id)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                          selectedProjectRef === (proj.ref || proj.id)
                            ? 'bg-emerald-950/40 border-emerald-500/50 text-white'
                            : 'bg-zinc-950 border-zinc-800/80 text-zinc-300 hover:border-zinc-700'
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-zinc-100">{proj.name}</p>
                          <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                            {proj.ref}.supabase.co • {proj.region}
                          </p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium">
                          {proj.status || 'ACTIVE'}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleSelectManagementProject}
                    disabled={isLoading || !selectedProjectRef}
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Récupération des clés et schéma...</span>
                      </>
                    ) : (
                      <>
                        <span>Configurer ce projet automatiquement</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Instant Presets */}
          {activeTab === 'presets' && (
            <div className="space-y-3">
              <p className="text-xs text-zinc-400 mb-2">
                Sélectionnez une architecture pré-configurée pour tester immédiatement l'extracteur et le générateur :
              </p>
              <div className="grid gap-3">
                {DEMO_PRESETS.map((preset) => (
                  <div
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-emerald-500/50 hover:bg-emerald-950/10 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Server className="w-4 h-4 text-emerald-400" />
                        <h4 className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors">
                          {preset.name}
                        </h4>
                      </div>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                        {preset.badge}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                      {preset.description}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-2 border-t border-zinc-800/60">
                      <span className="font-mono text-zinc-400">
                        {preset.data.tables.length} tables • {preset.data.relationships.length} relations
                      </span>
                      <span className="text-emerald-400 font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                        Charger instantanément &rarr;
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer info note */}
        <div className="px-6 py-3 bg-zinc-950 border-t border-zinc-800 flex items-center gap-2 text-[11px] text-zinc-500">
          <Info className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span>
            Vos clés d'accès sont uniquement traitées en mémoire pour générer vos schémas et ne sont jamais stockées sur des serveurs tiers.
          </span>
        </div>
      </div>
    </div>
  );
};
