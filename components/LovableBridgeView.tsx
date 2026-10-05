'use client';

import React, { useState } from 'react';
import {
  Heart,
  Database,
  ArrowRight,
  Copy,
  Check,
  Download,
  Terminal,
  FileCode2,
  Upload,
  Sparkles,
  Zap,
  CheckCircle2,
  ExternalLink,
  Layers,
  Table as TableIcon,
  RefreshCw,
  FolderArchive,
  Loader2,
  AlertCircle,
  Globe,
  GitBranch,
  Key,
  Send,
  CloudLightning,
} from 'lucide-react';
import { DatabaseIntrospectionResult } from '@/types/supabase';
import {
  generateLovableClient,
  generateLovableTypes,
  generateLovableDataTransferSql,
  parseLovableTypesCode,
  LOVABLE_PRESETS,
} from '@/lib/lovableBridge';
import JSZip from 'jszip';

interface LovableBridgeViewProps {
  currentData: DatabaseIntrospectionResult;
  onApplyLovableSchema: (newResult: DatabaseIntrospectionResult) => void;
}

export const LovableBridgeView: React.FC<LovableBridgeViewProps> = ({
  currentData,
  onApplyLovableSchema,
}) => {
  const [direction, setDirection] = useState<'supa_to_lovable' | 'extract_lovable' | 'manual_types'>('supa_to_lovable');

  // Automated Extractor States (Lovable -> Supa)
  const [lovableUrl, setLovableUrl] = useState('https://crm-leads-pipeline.lovable.app');
  const [githubRepo, setGithubRepo] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractLogs, setExtractLogs] = useState<string[]>([]);
  const [extractedData, setExtractedData] = useState<DatabaseIntrospectionResult | null>(null);
  const [extractError, setExtractError] = useState<string | null>(null);

  // Automated Pusher States (Supa -> Lovable)
  const [pushLovableUrl, setPushLovableUrl] = useState('https://mon-app.lovable.app');
  const [pushGithubRepo, setPushGithubRepo] = useState('');
  const [pushGithubToken, setPushGithubToken] = useState('');
  const [pushWebhookUrl, setPushWebhookUrl] = useState('');
  const [isPushing, setIsPushing] = useState(false);
  const [pushLogs, setPushLogs] = useState<string[]>([]);
  const [pushResult, setPushResult] = useState<any>(null);
  const [pushError, setPushError] = useState<string | null>(null);

  // Supa -> Lovable file inspection states
  const [activeCodeTab, setActiveCodeTab] = useState<'sql_data' | 'types' | 'client'>('sql_data');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isExportingLovableZip, setIsExportingLovableZip] = useState(false);

  // Manual Lovable -> Supa states
  const [lovableTypesInput, setLovableTypesInput] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Codes generated for Lovable
  const lovableClientCode = React.useMemo(() => generateLovableClient(currentData), [currentData]);
  const lovableTypesCode = React.useMemo(() => generateLovableTypes(currentData), [currentData]);
  const lovableSqlData = React.useMemo(() => generateLovableDataTransferSql(currentData), [currentData]);

  const activeSnippet = React.useMemo(() => {
    switch (activeCodeTab) {
      case 'client':
        return {
          code: lovableClientCode,
          filename: 'src/integrations/supabase/client.ts',
          desc: 'Client Supabase officiel configuré pour votre projet Lovable.dev',
        };
      case 'types':
        return {
          code: lovableTypesCode,
          filename: 'src/integrations/supabase/types.ts',
          desc: 'Types TypeScript stricts générés depuis votre schéma Supabase actuel',
        };
      case 'sql_data':
        return {
          code: lovableSqlData,
          filename: 'lovable_data_transfer.sql',
          desc: 'Script SQL complet : création des tables, politiques RLS et injection des données pour Lovable',
        };
    }
  }, [activeCodeTab, lovableClientCode, lovableTypesCode, lovableSqlData]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Handler: Automated Extraction from Lovable (Lovable -> Supa)
  const handleExtractAllLovable = async (overrideUrl?: string) => {
    const targetUrl = overrideUrl || lovableUrl;
    setIsExtracting(true);
    setExtractError(null);
    setExtractLogs([
      `Initialisation du connecteur Lovable...`,
      `Cible : ${targetUrl || githubRepo}`,
    ]);

    try {
      const res = await fetch('/api/lovable/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: targetUrl.trim(),
          githubRepo: githubRepo.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Échec de la connexion à Lovable');
      }

      setExtractLogs(data.logs || [`Extraction terminée avec succès.`]);
      setExtractedData(data.result);
    } catch (err: any) {
      setExtractError(err.message || 'Impossible d\'extraire les données Lovable.');
      setExtractLogs((prev) => [...prev, `Erreur : ${err.message}`]);
    } finally {
      setIsExtracting(false);
    }
  };

  // Handler: Automated Push & Transfer (Supa -> Lovable)
  const handleAutomatedPushToLovable = async () => {
    setIsPushing(true);
    setPushError(null);
    setPushResult(null);
    setPushLogs([
      `Initialisation du transfert automatique vers Lovable...`,
      `Base source : ${currentData.projectInfo.name || currentData.projectInfo.url}`,
      `Cible Lovable : ${pushLovableUrl}`,
    ]);

    try {
      const res = await fetch('/api/lovable/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supabaseData: currentData,
          lovableUrl: pushLovableUrl.trim(),
          githubRepo: pushGithubRepo.trim() || undefined,
          githubToken: pushGithubToken.trim() || undefined,
          webhookUrl: pushWebhookUrl.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors du transfert automatique vers Lovable');
      }

      setPushLogs(data.logs || ['Synchronisation Lovable terminée avec succès.']);
      setPushResult(data);
    } catch (err: any) {
      setPushError(err.message || 'Échec de la synchronisation.');
      setPushLogs((prev) => [...prev, `Erreur : ${err.message}`]);
    } finally {
      setIsPushing(false);
    }
  };

  const handleApplyExtractedToSupabase = () => {
    if (!extractedData) return;
    onApplyLovableSchema(extractedData);
    setDirection('supa_to_lovable');
  };

  const handleDownloadLovablePackZip = async () => {
    setIsExportingLovableZip(true);
    try {
      const zip = new JSZip();

      const supabaseFolder = zip.folder('src')?.folder('integrations')?.folder('supabase');
      supabaseFolder?.file('client.ts', lovableClientCode);
      supabaseFolder?.file('types.ts', lovableTypesCode);

      zip.file('lovable_data_transfer.sql', lovableSqlData);
      zip.file(
        'README_LOVABLE.md',
        `# Pack d'intégration Supabase pour Lovable.dev
Projet: ${currentData.projectInfo.name || currentData.projectInfo.url}

1. Dans Lovable, ouvrez votre projet et rendez-vous dans "Integrations > Supabase".
2. Renseignez l'URL : ${currentData.projectInfo.url}
3. Copiez le contenu de "lovable_data_transfer.sql" dans l'éditeur SQL de votre tableau de bord Supabase pour initialiser les tables et données.
4. Glissez les fichiers client.ts et types.ts dans votre projet Lovable !
`
      );

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `lovable-supabase-integration-pack.zip`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExportingLovableZip(false);
    }
  };

  const handleParseLovableTypes = () => {
    if (!lovableTypesInput.trim()) return;
    try {
      const parsed = parseLovableTypesCode(lovableTypesInput);
      if (parsed.tables.length === 0) {
        setImportStatus('Aucune table détectée. Assurez-vous de coller le contenu de "src/integrations/supabase/types.ts".');
        return;
      }
      onApplyLovableSchema(parsed);
      setImportStatus(`Succès ! ${parsed.tables.length} tables extraites de Lovable et prêtes à configurer Supabase.`);
    } catch (e: any) {
      setImportStatus(`Erreur de lecture du code Lovable: ${e.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-r from-emerald-950/40 via-zinc-900/90 to-pink-950/40 p-6 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-emerald-500/20 to-pink-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-pink-400 fill-pink-400/40" />
                <span>Passerelle Bi-directionnelle Automatique</span>
              </span>
              <span className="text-zinc-500 text-xs">•</span>
              <span className="text-emerald-400 text-xs font-mono font-medium">
                Supabase &harr; Lovable.dev
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Transfert & Synchronisation Automatique Supabase &harr; Lovable
            </h2>
            <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
              Transférez automatiquement toutes les données et schémas de Supabase vers votre application Lovable, ou extrayez tout depuis Lovable pour configurer et activer immédiatement votre base Supabase.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800 shrink-0">
            <button
              onClick={() => setDirection('supa_to_lovable')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                direction === 'supa_to_lovable'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-zinc-950 shadow-sm font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Send className="w-4 h-4 text-zinc-950" />
              <span>Supabase &rarr; Lovable (Auto-Push)</span>
            </button>

            <button
              onClick={() => setDirection('extract_lovable')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                direction === 'extract_lovable'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-sm font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Sparkles className="w-4 h-4 text-pink-200" />
              <span>Lovable &rarr; Supabase (Auto-Pull)</span>
            </button>

            <button
              onClick={() => setDirection('manual_types')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                direction === 'manual_types'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <FileCode2 className="w-4 h-4" />
              <span>types.ts</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODE 1: AUTOMATED SUPABASE -> LOVABLE (TRANSFERT & ACTIVATION) */}
      {/* ============================================================== */}
      {direction === 'supa_to_lovable' && (
        <div className="space-y-6">
          {/* Main Push & Auto-Deploy Card */}
          <div className="p-6 bg-zinc-900/90 border border-zinc-800 rounded-3xl space-y-5 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                  <CloudLightning className="w-4 h-4 text-emerald-400" />
                  <span>Transférer et Activer automatiquement votre base Supabase dans Lovable</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Envoie automatiquement les types TypeScript stricts, le client Lovable et les données de votre base Supabase vers Lovable.
                </p>
              </div>

              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-medium">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                {currentData.tables.length} tables prêtes
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Target Lovable URL */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-300">
                  URL ou Identifiant de votre projet Lovable
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="https://mon-crm.lovable.app ou https://lovable.dev/projects/..."
                    value={pushLovableUrl}
                    onChange={(e) => setPushLovableUrl(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl text-xs font-mono text-zinc-100 placeholder:text-zinc-600 outline-none"
                  />
                  <Globe className="w-4 h-4 text-zinc-600 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Lovable GitHub Sync Repo (Optional for 100% automated commit) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-300">
                  Dépôt GitHub lié à Lovable (optionnel pour auto-commit & deploy)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="github.com/mon-compte/mon-app-lovable"
                    value={pushGithubRepo}
                    onChange={(e) => setPushGithubRepo(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl text-xs font-mono text-zinc-100 placeholder:text-zinc-600 outline-none"
                  />
                  <GitBranch className="w-4 h-4 text-zinc-600 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            {/* Optional GitHub Token & Webhook for instant direct commit */}
            {pushGithubRepo && (
              <div className="p-4 bg-zinc-950/60 rounded-2xl border border-zinc-850 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-200">
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-zinc-300">
                    GitHub Token (avec scope repo pour commit automatique)
                  </label>
                  <input
                    type="password"
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    value={pushGithubToken}
                    onChange={(e) => setPushGithubToken(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-100 placeholder:text-zinc-600 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-zinc-300">
                    URL Webhook Lovable (déclenche le rebuild instantané)
                  </label>
                  <input
                    type="text"
                    placeholder="https://api.lovable.dev/webhooks/deploy/..."
                    value={pushWebhookUrl}
                    onChange={(e) => setPushWebhookUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-100 placeholder:text-zinc-600 outline-none"
                  />
                </div>
              </div>
            )}

            {/* Magic Action Button */}
            <button
              onClick={handleAutomatedPushToLovable}
              disabled={isPushing}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-zinc-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isPushing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                  <span>Transfert et synchronisation vers Lovable en cours...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-zinc-950" />
                  <span>Transférer automatiquement vers Lovable & Activer</span>
                </>
              )}
            </button>
          </div>

          {/* Real-time Terminal for Automated Push */}
          {pushLogs.length > 0 && (
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl animate-in fade-in duration-200">
              <div className="px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-xs font-mono text-zinc-400">
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-semibold text-zinc-200">Terminal de transfert Supabase &rarr; Lovable</span>
                </div>
                <span className="text-[11px] text-zinc-500">
                  {isPushing ? 'Envoi en cours...' : 'Synchronisé'}
                </span>
              </div>
              <div className="p-4 font-mono text-xs text-zinc-300 space-y-1.5 max-h-52 overflow-y-auto">
                {pushLogs.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-zinc-600 select-none">&gt;</span>
                    <span className={log.includes('Erreur') ? 'text-red-400' : log.includes('✅') || log.includes('succès') ? 'text-emerald-400 font-semibold' : 'text-zinc-300'}>
                      {log}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Success Banner if pushed */}
          {pushResult && (
            <div className="p-5 bg-gradient-to-r from-emerald-950/40 to-zinc-900 border border-emerald-500/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Transfert Supabase vers Lovable réussi !
                  </h4>
                  <p className="text-xs text-zinc-300 mt-0.5">
                    {pushResult.syncedTablesCount} tables et {pushResult.syncedColumnsCount} colonnes typées ont été compilées pour Lovable.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {pushResult.commitUrl && (
                  <a
                    href={pushResult.commitUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 transition-colors"
                  >
                    <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Voir sur GitHub</span>
                    <ExternalLink className="w-3 h-3 text-zinc-500" />
                  </a>
                )}
                <a
                  href={pushLovableUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-xs font-bold text-zinc-950 flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <span>Ouvrir dans Lovable</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* Quick Setup Cards for Lovable */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Step 1: Project URL */}
            <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                1. URL Supabase pour Lovable
              </span>
              <p className="font-mono text-xs text-zinc-200 truncate bg-zinc-950 p-2 rounded-lg border border-zinc-850">
                {currentData.projectInfo.url}
              </p>
              <button
                onClick={() => handleCopy(currentData.projectInfo.url, 'url')}
                className="w-full py-1.5 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center justify-center gap-1.5 transition-colors"
              >
                {copiedKey === 'url' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copié !</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Copier l'URL</span>
                  </>
                )}
              </button>
            </div>

            {/* Step 2: Anon Key */}
            <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                2. Clé Anon Publishable
              </span>
              <p className="font-mono text-xs text-zinc-400 truncate bg-zinc-950 p-2 rounded-lg border border-zinc-850">
                eyJhbGciOiJIUzI1NiIsInR5cCI...
              </p>
              <button
                onClick={() => handleCopy('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.anon_key_placeholder', 'anon')}
                className="w-full py-1.5 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center justify-center gap-1.5 transition-colors"
              >
                {copiedKey === 'anon' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copié !</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Copier la clé Anon</span>
                  </>
                )}
              </button>
            </div>

            {/* Step 3: Complete Lovable ZIP Pack */}
            <div className="p-4 bg-gradient-to-br from-emerald-950/40 to-zinc-900 border border-emerald-500/30 rounded-2xl flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                  3. Pack Intégration Lovable
                </span>
                <p className="text-xs text-zinc-400 mt-1">
                  Tous les fichiers Lovable (types.ts, client.ts, SQL) réunis en un ZIP.
                </p>
              </div>
              <button
                onClick={handleDownloadLovablePackZip}
                disabled={isExportingLovableZip}
                className="mt-3 w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-colors"
              >
                <FolderArchive className="w-3.5 h-3.5" />
                <span>{isExportingLovableZip ? 'Génération...' : 'Télécharger le pack (.ZIP)'}</span>
              </button>
            </div>
          </div>

          {/* Generated Lovable Code Viewer */}
          <div className="space-y-3">
            {/* Tabs */}
            <div className="flex items-center justify-between bg-zinc-900/80 p-2.5 rounded-2xl border border-zinc-800">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveCodeTab('sql_data')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    activeCodeTab === 'sql_data'
                      ? 'bg-emerald-500 text-zinc-950 font-bold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  lovable_data_transfer.sql (Structure & Données)
                </button>
                <button
                  onClick={() => setActiveCodeTab('types')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    activeCodeTab === 'types'
                      ? 'bg-emerald-500 text-zinc-950 font-bold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  src/integrations/supabase/types.ts
                </button>
                <button
                  onClick={() => setActiveCodeTab('client')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    activeCodeTab === 'client'
                      ? 'bg-emerald-500 text-zinc-950 font-bold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  src/integrations/supabase/client.ts
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(activeSnippet.code);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 font-medium transition-colors"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copié !</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Copier ce fichier</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Code Box */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
              <div className="px-4 py-2.5 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between text-xs font-mono text-zinc-400">
                <span className="flex items-center gap-2 text-zinc-200">
                  <FileCode2 className="w-3.5 h-3.5 text-emerald-400" />
                  {activeSnippet.filename}
                </span>
                <span className="text-[11px] text-zinc-500 hidden sm:inline">
                  {activeSnippet.desc}
                </span>
              </div>
              <div className="p-4 overflow-x-auto max-h-[500px] font-mono text-xs text-zinc-300 leading-relaxed select-text">
                <pre>
                  <code>{activeSnippet.code}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODE 2: AUTOMATED EXTRACTION FROM LOVABLE (PULL) */}
      {/* ============================================================== */}
      {direction === 'extract_lovable' && (
        <div className="space-y-6">
          {/* Main Extraction Form Card */}
          <div className="p-6 bg-zinc-900/90 border border-zinc-800 rounded-3xl space-y-5 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-pink-400" />
                  <span>Saisissez l'URL de votre application Lovable ou son dépôt GitHub</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  L'extracteur interroge Lovable, inspecte le code, détecte les modèles de données et prépare la base Supabase.
                </p>
              </div>

              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 text-pink-300 border border-pink-500/20 text-xs font-medium">
                <Zap className="w-3.5 h-3.5 text-pink-400" />
                Introspection live
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option A: Lovable App URL */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-300">
                  URL Lovable (ex: https://mon-app.lovable.app ou https://lovable.dev/projects/...)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="https://crm-leads-pipeline.lovable.app"
                    value={lovableUrl}
                    onChange={(e) => setLovableUrl(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-pink-500 rounded-xl text-xs font-mono text-zinc-100 placeholder:text-zinc-600 outline-none"
                  />
                  <Globe className="w-4 h-4 text-zinc-600 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Option B: GitHub Repo */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-300">
                  Ou Dépôt GitHub synchronisé par Lovable (optionnel)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="github.com/mon-compte/mon-app-lovable"
                    value={githubRepo}
                    onChange={(e) => setGithubRepo(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-pink-500 rounded-xl text-xs font-mono text-zinc-100 placeholder:text-zinc-600 outline-none"
                  />
                  <GitBranch className="w-4 h-4 text-zinc-600 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            {/* Quick Demo Previews Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="text-zinc-500 text-[11px]">Tester l'extraction immédiate sur :</span>
              <button
                type="button"
                onClick={() => {
                  setLovableUrl('https://crm-leads-pipeline.lovable.app');
                  handleExtractAllLovable('https://crm-leads-pipeline.lovable.app');
                }}
                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-[11px] transition-colors"
              >
                CRM Leads Pipeline Lovable
              </button>
              <button
                type="button"
                onClick={() => {
                  setLovableUrl('https://appointment-booking.lovable.app');
                  handleExtractAllLovable('https://appointment-booking.lovable.app');
                }}
                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-[11px] transition-colors"
              >
                Système de Réservation Lovable
              </button>
            </div>

            {/* Action Button */}
            <button
              onClick={() => handleExtractAllLovable()}
              disabled={isExtracting || (!lovableUrl.trim() && !githubRepo.trim())}
              className="w-full py-3 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-400 hover:to-purple-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-pink-500/10 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connexion à Lovable et extraction en cours...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Se connecter automatiquement à Lovable & Extraire tout</span>
                </>
              )}
            </button>
          </div>

          {/* Terminal Logs Window */}
          {extractLogs.length > 0 && (
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-xs font-mono text-zinc-400">
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-pink-400" />
                  <span className="font-semibold text-zinc-200">Terminal d'extraction Lovable</span>
                </div>
                <span className="text-[11px] text-zinc-500">
                  {isExtracting ? 'En cours d\'analyse...' : 'Terminé'}
                </span>
              </div>
              <div className="p-4 font-mono text-xs text-zinc-300 space-y-1.5 max-h-48 overflow-y-auto">
                {extractLogs.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-zinc-600 select-none">&gt;</span>
                    <span className={log.includes('Erreur') ? 'text-red-400' : log.includes('Succès') || log.includes('trouvé') ? 'text-emerald-400 font-semibold' : 'text-zinc-300'}>
                      {log}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Extracted Result Review Card */}
          {extractedData && (
            <div className="p-6 bg-gradient-to-br from-emerald-950/30 via-zinc-900/90 to-zinc-950 border border-emerald-500/40 rounded-3xl space-y-5 shadow-2xl animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-base font-bold text-white">
                      Données Lovable extraites avec succès !
                    </h3>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    {extractedData.tables.length} tables, {extractedData.relationships.length} relations et tous les enregistrements ont été récupérés de Lovable.
                  </p>
                </div>

                <button
                  onClick={handleApplyExtractedToSupabase}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0"
                >
                  <Database className="w-4 h-4" />
                  <span>Configurer & Activer Supabase avec ces données &rarr;</span>
                </button>
              </div>

              {/* Extracted Tables Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {extractedData.tables.map((table) => (
                  <div key={table.name} className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-emerald-300">
                        {table.name}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-mono">
                        {table.columns.length} colonnes
                      </span>
                    </div>

                    <div className="text-[11px] font-mono text-zinc-400 space-y-0.5">
                      {table.columns.slice(0, 4).map((col) => (
                        <div key={col.name} className="truncate flex items-center justify-between">
                          <span>{col.isPrimary ? '🔑 ' : ''}{col.name}</span>
                          <span className="text-zinc-600 text-[10px]">{col.type}</span>
                        </div>
                      ))}
                      {table.columns.length > 4 && (
                        <div className="text-zinc-600 text-[10px]">
                          + {table.columns.length - 4} autres colonnes...
                        </div>
                      )}
                    </div>

                    {table.sampleRows && table.sampleRows.length > 0 && (
                      <div className="text-[10px] text-emerald-400/90 pt-1 border-t border-zinc-850">
                        ✓ {table.sampleRows.length} enregistrements prêts à être injectés
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* MODE 3: MANUAL TYPES.TS PASTE */}
      {/* ============================================================== */}
      {direction === 'manual_types' && (
        <div className="space-y-6">
          <div className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-2">
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <Upload className="w-4 h-4 text-pink-400" />
              <span>Coller le fichier types.ts de Lovable</span>
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Copiez le code de <code className="text-pink-300 font-mono">src/integrations/supabase/types.ts</code> depuis votre projet Lovable pour extraire instantanément le schéma et générer les tables Supabase.
            </p>
          </div>

          <div className="p-5 bg-zinc-900/90 border border-zinc-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-200">
                Code TypeScript Lovable :
              </label>
              <button
                type="button"
                onClick={() => {
                  setLovableTypesInput(`export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          avatar_url: string | null;
          created_at: string;
        };
      };
      posts: {
        Row: {
          id: string;
          author_id: string;
          title: string;
          content: string;
          created_at: string;
        };
      };
    };
    Views: {};
  };
};`);
                }}
                className="text-[11px] text-pink-400 hover:text-pink-300 underline"
              >
                Insérer un exemple
              </button>
            </div>

            <textarea
              rows={8}
              placeholder={`export type Database = {\n  public: {\n    Tables: {\n      tasks: {\n        Row: {\n          id: string;\n          title: string;\n          is_completed: boolean;\n        };\n      };\n    };\n  };\n};`}
              value={lovableTypesInput}
              onChange={(e) => setLovableTypesInput(e.target.value)}
              className="w-full p-3.5 bg-zinc-950 border border-zinc-800 focus:border-pink-500 rounded-xl text-xs font-mono text-zinc-100 placeholder:text-zinc-600 outline-none leading-relaxed"
            />

            {importStatus && (
              <div
                className={`p-3 rounded-xl text-xs font-medium ${
                  importStatus.startsWith('Succès')
                    ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-950/60 text-amber-300 border border-amber-500/30'
                }`}
              >
                {importStatus}
              </div>
            )}

            <button
              onClick={handleParseLovableTypes}
              disabled={!lovableTypesInput.trim()}
              className="w-full py-2.5 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white font-semibold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Extraire les tables et configurer Supabase</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
