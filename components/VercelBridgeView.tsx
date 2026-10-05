'use client';

import React, { useState } from 'react';
import {
  Triangle,
  Database,
  Copy,
  Check,
  Download,
  Terminal,
  FileCode2,
  FolderArchive,
  Loader2,
  Zap,
  Globe,
  Key,
  Rows,
  Table as TableIcon,
  AlertTriangle,
} from 'lucide-react';
import { DatabaseIntrospectionResult } from '@/types/supabase';
import {
  generateVercelEnv,
  generateVercelNextServer,
  generateVercelNextClient,
  generateVercelMiddleware,
  generateVercelApiRoute,
  generateVercelConfig,
  generateVercelCliCommands,
  generateVercelRealDataJson,
  generateVercelRealDataSql,
  generateVercelNextRealPage,
} from '@/lib/vercelBridge';
import {
  generateVercelPasswordMiddleware,
  generateSupabasePasswordProtectionSql,
} from '@/lib/passwordProtectionService';
import JSZip from 'jszip';

interface VercelBridgeViewProps {
  currentData: DatabaseIntrospectionResult;
  onUpdateRealData?: (newResult: DatabaseIntrospectionResult) => void;
}

type VercelTab =
  | 'real_json'
  | 'real_sql'
  | 'real_page'
  | 'env'
  | 'pwd_middleware'
  | 'supabase_vault'
  | 'next_server'
  | 'next_client'
  | 'middleware'
  | 'api_route'
  | 'config'
  | 'cli';

export const VercelBridgeView: React.FC<VercelBridgeViewProps> = ({
  currentData,
  onUpdateRealData,
}) => {
  // Real Supabase Connection inputs
  const [realSupabaseUrl, setRealSupabaseUrl] = useState(
    currentData.projectInfo.connectedVia === 'url_key' ? currentData.projectInfo.url : ''
  );
  const [realSupabaseKey, setRealSupabaseKey] = useState('');
  const [isExtractingReal, setIsExtractingReal] = useState(false);
  const [realExtractLogs, setRealExtractLogs] = useState<string[]>([]);
  const [realDataMap, setRealDataMap] = useState<Record<string, any[]>>({});
  const [totalRealRows, setTotalRealRows] = useState<number>(0);
  const [realExtractError, setRealExtractError] = useState<string | null>(null);
  const [realExtractSuccess, setRealExtractSuccess] = useState(false);

  // Vercel API states
  const [vercelToken, setVercelToken] = useState('');
  const [vercelProjects, setVercelProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [isFetchingProjects, setIsFetchingProjects] = useState(false);
  const [isSyncingEnv, setIsSyncingEnv] = useState(false);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [syncError, setSyncError] = useState<string | null>(null);

  // File preview states
  const [activeTab, setActiveTab] = useState<VercelTab>('real_json');
  const [copied, setCopied] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [selectedTableForView, setSelectedTableForView] = useState(currentData.tables[0]?.name || 'users');

  const isDemo = currentData.projectInfo.connectedVia === 'demo_preset' && !realExtractSuccess;

  // Generated code contents with REAL keys and REAL data
  const envContent = React.useMemo(
    () => generateVercelEnv(currentData, realSupabaseKey, realSupabaseKey),
    [currentData, realSupabaseKey]
  );
  const realJsonContent = React.useMemo(
    () => generateVercelRealDataJson(currentData, realDataMap),
    [currentData, realDataMap]
  );
  const realSqlContent = React.useMemo(
    () => generateVercelRealDataSql(currentData, realDataMap),
    [currentData, realDataMap]
  );
  const realPageContent = React.useMemo(
    () => generateVercelNextRealPage(currentData, selectedTableForView),
    [currentData, selectedTableForView]
  );
  const serverContent = React.useMemo(() => generateVercelNextServer(currentData), [currentData]);
  const clientContent = React.useMemo(() => generateVercelNextClient(), []);
  const middlewareContent = React.useMemo(() => generateVercelMiddleware(), []);
  const apiRouteContent = React.useMemo(
    () => generateVercelApiRoute(currentData, selectedTableForView),
    [currentData, selectedTableForView]
  );
  const configContent = React.useMemo(() => generateVercelConfig(), []);
  const cliCommandsContent = React.useMemo(() => generateVercelCliCommands(currentData), [currentData]);

  const activeSnippet = React.useMemo(() => {
    switch (activeTab) {
      case 'real_json':
        return {
          code: realJsonContent,
          filename: 'data/supabase_real_data.json',
          language: 'json',
          desc: 'Toutes les données réelles extraites de votre base Supabase au format JSON pour Vercel',
        };
      case 'real_sql':
        return {
          code: realSqlContent,
          filename: 'data/seed_real_data.sql',
          language: 'sql',
          desc: 'Script SQL INSERT INTO contenant l\'intégralité des enregistrements réels',
        };
      case 'real_page':
        return {
          code: realPageContent,
          filename: `app/${selectedTableForView}/page.tsx`,
          language: 'typescript',
          desc: `Page Next.js Server Component affichant les données réelles de "${selectedTableForView}"`,
        };
      case 'env':
        return {
          code: envContent,
          filename: '.env.production',
          language: 'env',
          desc: 'Variables d\'environnement Vercel réelles avec clés authentifiées',
        };
      case 'pwd_middleware':
        return {
          code: generateVercelPasswordMiddleware('admin'),
          filename: 'middleware.password.ts',
          language: 'typescript',
          desc: 'Middleware Edge protégeant l\'ensemble de votre application Vercel par mot de passe',
        };
      case 'supabase_vault':
        return {
          code: generateSupabasePasswordProtectionSql('admin', currentData),
          filename: 'supabase_password_vault.sql',
          language: 'sql',
          desc: 'Coffre-fort PostgreSQL avec hachage bcrypt (Blowfish) et RLS pour sécuriser la base Supabase',
        };
      case 'next_server':
        return {
          code: serverContent,
          filename: 'utils/supabase/server.ts',
          language: 'typescript',
          desc: 'Client Supabase SSR pour Server Components & Server Actions Next.js sur Vercel',
        };
      case 'next_client':
        return {
          code: clientContent,
          filename: 'utils/supabase/client.ts',
          language: 'typescript',
          desc: 'Client Supabase navigateur pour Client Components (\'use client\')',
        };
      case 'middleware':
        return {
          code: middlewareContent,
          filename: 'middleware.ts',
          language: 'typescript',
          desc: 'Middleware Vercel Edge pour rafraîchir automatiquement les cookies de session',
        };
      case 'api_route':
        return {
          code: apiRouteContent,
          filename: `app/api/${selectedTableForView}/route.ts`,
          language: 'typescript',
          desc: `Handler Vercel Serverless Function pour manipuler la table ${selectedTableForView}`,
        };
      case 'config':
        return {
          code: configContent,
          filename: 'vercel.json',
          language: 'json',
          desc: 'Configuration de build et déploiement Vercel',
        };
      case 'cli':
        return {
          code: cliCommandsContent,
          filename: 'setup-vercel-env.sh',
          language: 'bash',
          desc: 'Script d\'injection en ligne de commande via Vercel CLI',
        };
    }
  }, [
    activeTab,
    realJsonContent,
    realSqlContent,
    realPageContent,
    envContent,
    serverContent,
    clientContent,
    middlewareContent,
    apiRouteContent,
    configContent,
    cliCommandsContent,
    selectedTableForView,
    currentData,
  ]);

  // Handler: Extract REAL Data from Supabase
  const handleExtractRealSupabaseData = async () => {
    if (!realSupabaseUrl.trim() || !realSupabaseKey.trim()) {
      setRealExtractError('Veuillez renseigner votre URL Supabase et votre clé API réelle.');
      return;
    }

    setIsExtractingReal(true);
    setRealExtractError(null);
    setRealExtractSuccess(false);
    setRealExtractLogs([
      `Connexion à la base Supabase réelle...`,
      `URL : ${realSupabaseUrl}`,
      `Authentification de la clé API...`,
    ]);

    try {
      const res = await fetch('/api/supabase/fetch-real-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supabaseUrl: realSupabaseUrl.trim(),
          supabaseKey: realSupabaseKey.trim(),
          maxRowsPerTable: 1000,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Échec de connexion à la base Supabase réelle.');
      }

      setRealExtractLogs(data.logs || ['Données réelles extraites avec succès.']);
      setRealDataMap(data.realDataMap || {});
      setTotalRealRows(data.totalRowsExtracted || 0);
      setRealExtractSuccess(true);

      // Update global app state with real project data!
      if (onUpdateRealData && data.result) {
        onUpdateRealData(data.result);
      }
    } catch (err: any) {
      setRealExtractError(err.message || 'Impossible d\'extraire les données réelles.');
      setRealExtractLogs((prev) => [...prev, `Erreur : ${err.message}`]);
    } finally {
      setIsExtractingReal(false);
    }
  };

  // Handler: Fetch Vercel projects via API
  const handleFetchVercelProjects = async () => {
    if (!vercelToken.trim()) return;
    setIsFetchingProjects(true);
    setSyncError(null);

    try {
      const res = await fetch('/api/vercel/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vercelToken: vercelToken.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Échec de récupération des projets Vercel');

      setVercelProjects(data.projects || []);
      if (data.projects && data.projects.length > 0) {
        setSelectedProjectId(data.projects[0].id || data.projects[0].name);
      }
    } catch (e: any) {
      setSyncError(e.message);
    } finally {
      setIsFetchingProjects(false);
    }
  };

  // Handler: Automated Sync into Vercel Project
  const handleSyncVercelEnv = async () => {
    setIsSyncingEnv(true);
    setSyncError(null);
    setSyncLogs([
      `Initialisation du transfert des vraies variables vers Vercel...`,
      `Base Supabase réelle : ${realSupabaseUrl || currentData.projectInfo.url}`,
      `Projet Vercel : ${selectedProjectId || 'Configuration globale'}`,
    ]);

    try {
      const res = await fetch('/api/vercel/sync-env', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vercelToken: vercelToken.trim() || undefined,
          projectId: selectedProjectId || undefined,
          supabaseData: currentData,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la synchronisation Vercel');

      setSyncLogs(data.logs || []);
    } catch (e: any) {
      setSyncError(e.message);
      setSyncLogs((prev) => [...prev, `Erreur : ${e.message}`]);
    } fontally: {
      setIsSyncingEnv(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(activeSnippet.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSingle = () => {
    const blob = new Blob([activeSnippet.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = activeSnippet.filename.split('/').pop() || 'config';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadVercelPackZip = async () => {
    setIsExportingZip(true);
    try {
      const zip = new JSZip();

      // utils/supabase
      const utilsFolder = zip.folder('utils')?.folder('supabase');
      utilsFolder?.file('server.ts', serverContent);
      utilsFolder?.file('client.ts', clientContent);

      // data/ folder with REAL extracted records
      const dataFolder = zip.folder('data');
      dataFolder?.file('supabase_real_data.json', realJsonContent);
      dataFolder?.file('seed_real_data.sql', realSqlContent);

      // Root files
      zip.file('middleware.ts', middlewareContent);
      zip.file('.env.production', envContent);
      zip.file('vercel.json', configContent);
      zip.file('setup-vercel-env.sh', cliCommandsContent);

      // App Router real page
      const appPageFolder = zip.folder('app')?.folder(selectedTableForView);
      appPageFolder?.file('page.tsx', realPageContent);

      zip.file(
        'README_VERCEL.md',
        `# Pack Vercel + Vraies Données Supabase
Base de données : ${realSupabaseUrl || currentData.projectInfo.url}
Total des lignes réelles extraites : ${totalRealRows} enregistrements
Généré le : ${new Date().toLocaleString()}

Contenu du pack :
- data/supabase_real_data.json : Toutes les données réelles en JSON
- data/seed_real_data.sql : Script d'injection des vraies données
- .env.production : Variables d'environnement réelles pour Vercel
- utils/supabase/server.ts : Client SSR pour Next.js App Router
- utils/supabase/client.ts : Client navigateur
- middleware.ts : Middleware Edge Vercel
- app/${selectedTableForView}/page.tsx : Composant Next.js affichant les données réelles
`
      );

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `vercel-real-supabase-data-pack.zip`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExportingZip(false);
    }
  };

  const tabs: { id: VercelTab; label: string; badge?: string }[] = [
    { id: 'real_json', label: 'data/supabase_real_data.json', badge: 'Données Réelles' },
    { id: 'real_sql', label: 'data/seed_real_data.sql', badge: 'Vrai SQL' },
    { id: 'real_page', label: 'app/[table]/page.tsx', badge: 'Page Next.js' },
    { id: 'env', label: '.env.production', badge: 'Vercel Env' },
    { id: 'pwd_middleware', label: 'middleware.password.ts', badge: '🔒 Vercel Lock' },
    { id: 'supabase_vault', label: 'supabase_vault.sql', badge: '🔒 Supabase Hash' },
    { id: 'next_server', label: 'utils/supabase/server.ts', badge: 'SSR Server' },
    { id: 'next_client', label: 'utils/supabase/client.ts', badge: 'Client' },
    { id: 'middleware', label: 'middleware.ts', badge: 'Edge' },
    { id: 'api_route', label: 'app/api/route.ts', badge: 'Serverless' },
    { id: 'config', label: 'vercel.json' },
    { id: 'cli', label: 'Vercel CLI Script' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 p-6 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white border border-white/20 flex items-center gap-1.5">
                <Triangle className="w-3 h-3 fill-white text-white" />
                <span>Extraction Vraies Données pour Vercel</span>
              </span>
              <span className="text-zinc-500 text-xs">•</span>
              <span
                className={`text-xs font-mono font-medium px-2 py-0.5 rounded-full ${
                  realExtractSuccess || !isDemo
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                }`}
              >
                {realExtractSuccess || !isDemo ? '🟢 Base Réelle Connectée' : '🟡 Mode Démo Actif'}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Extraire les Vraies Données de Supabase pour Vercel (Sans Démo)
            </h2>
            <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
              Connectez votre base de production Supabase pour extraire l'intégralité des vraies lignes de vos tables, générer le dataset réel pour Vercel (JSON, SQL et Server Components) et configurer votre déploiement sans aucune donnée fictive.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDownloadVercelPackZip}
              disabled={isExportingZip}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-zinc-950 font-bold text-xs hover:bg-zinc-200 transition-colors shadow-sm"
            >
              <FolderArchive className="w-4 h-4 text-zinc-950" />
              <span>{isExportingZip ? 'Génération...' : 'Télécharger le Pack Réel (.ZIP)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Warning banner if still in demo mode */}
      {isDemo && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-amber-100">
              Vous visualisez actuellement des données de démonstration.
            </p>
            <p className="text-amber-200/90 leading-relaxed">
              Pour extraire vos <strong>vraies tables</strong> et vos <strong>vrais enregistrements de production</strong> pour Vercel, renseignez l'URL et la clé de votre projet Supabase ci-dessous et lancez l'extraction réelle.
            </p>
          </div>
        </div>
      )}

      {/* SECTION 1: REAL SUPABASE EXTRACTION ENGINE */}
      <div className="p-6 bg-zinc-900/90 border border-zinc-800 rounded-3xl space-y-5 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>1. Connexion & Extraction des Vraies Données de votre Projet Supabase</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Renseignez l'URL et la clé d'API de votre base Supabase pour interroger directement le schéma et récupérer chaque enregistrement réel.
            </p>
          </div>

          {totalRealRows > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-bold font-mono">
              <Rows className="w-3.5 h-3.5 text-emerald-400" />
              {totalRealRows} enregistrements réels
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Real Project URL */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-zinc-300">
              URL réelle de votre projet Supabase
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="https://xyzcompany.supabase.co"
                value={realSupabaseUrl}
                onChange={(e) => setRealSupabaseUrl(e.target.value)}
                className="w-full pl-3.5 pr-10 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl text-xs font-mono text-zinc-100 placeholder:text-zinc-600 outline-none"
              />
              <Globe className="w-4 h-4 text-zinc-600 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
            <p className="text-[11px] text-zinc-500">
              Dans Supabase : Project Settings &gt; API &gt; Project URL
            </p>
          </div>

          {/* Real Anon Key or Service Role Key */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-zinc-300">
              Clé réelle Supabase (anon key ou service_role key)
            </label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={realSupabaseKey}
                onChange={(e) => setRealSupabaseKey(e.target.value)}
                className="w-full pl-3.5 pr-10 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl text-xs font-mono text-zinc-100 placeholder:text-zinc-600 outline-none"
              />
              <Key className="w-4 h-4 text-zinc-600 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
            <p className="text-[11px] text-zinc-500">
              Utilisez la clé <code className="text-zinc-400">service_role</code> pour extraire l'intégralité des tables protégées par RLS.
            </p>
          </div>
        </div>

        {realExtractError && (
          <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-xs text-red-300 font-medium">
            {realExtractError}
          </div>
        )}

        {/* Action Button: Extract REAL Data */}
        <button
          onClick={handleExtractRealSupabaseData}
          disabled={isExtractingReal || !realSupabaseUrl.trim() || !realSupabaseKey.trim()}
          className="w-full py-3.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-zinc-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          {isExtractingReal ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
              <span>Interrogation de votre base Supabase et extraction des données réelles...</span>
            </>
          ) : (
            <>
              <Database className="w-4 h-4 text-zinc-950" />
              <span>🚀 Extraire les VRAIES données de Supabase pour Vercel</span>
            </>
          )}
        </button>
      </div>

      {/* Terminal of Live Extraction from Real Supabase */}
      {realExtractLogs.length > 0 && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl animate-in fade-in duration-200">
          <div className="px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-xs font-mono text-zinc-400">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold text-zinc-200">
                Journal d'extraction des données réelles
              </span>
            </div>
            <span className="text-[11px] text-zinc-500">
              {isExtractingReal ? 'Extraction en cours...' : 'Terminé'}
            </span>
          </div>
          <div className="p-4 font-mono text-xs text-zinc-300 space-y-1.5 max-h-52 overflow-y-auto">
            {realExtractLogs.map((log, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-zinc-600 select-none">&gt;</span>
                <span
                  className={
                    log.includes('Erreur')
                      ? 'text-red-400'
                      : log.includes('✅') || log.includes('✓') || log.includes('Succès')
                      ? 'text-emerald-400 font-semibold'
                      : log.includes('⚠️')
                      ? 'text-amber-400'
                      : 'text-zinc-300'
                  }
                >
                  {log}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table Data Preview of REAL Extracted Tables */}
      <div className="p-6 bg-zinc-900/90 border border-zinc-800 rounded-3xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
          <div>
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <TableIcon className="w-4 h-4 text-white" />
              <span>Aperçu des Données Réelles par Table pour Vercel</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Sélectionnez une table pour voir les enregistrements réels extraits et prêts à être consommés par vos Server Components Next.js.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {currentData.tables.map((t) => (
              <button
                key={t.name}
                onClick={() => setSelectedTableForView(t.name)}
                className={`px-3 py-1.5 rounded-xl font-mono text-xs font-semibold transition-all ${
                  selectedTableForView === t.name
                    ? 'bg-white text-zinc-950 shadow-sm'
                    : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                <span>{t.name}</span>
                <span className="text-[10px] opacity-75 ml-1.5">
                  ({realDataMap[t.name]?.length ?? t.sampleRows?.length ?? 0})
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Table Rows Explorer */}
        {(() => {
          const currentTable = currentData.tables.find((t) => t.name === selectedTableForView);
          const rows = realDataMap[selectedTableForView] || currentTable?.sampleRows || [];

          if (rows.length === 0) {
            return (
              <div className="p-8 text-center bg-zinc-950 rounded-2xl border border-zinc-850 text-xs text-zinc-500">
                Aucun enregistrement extrait pour la table "{selectedTableForView}". La table est peut-être vide ou protégée par une politique RLS interdisant la lecture.
              </div>
            );
          }

          return (
            <div className="overflow-x-auto border border-zinc-800 rounded-2xl bg-zinc-950">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-zinc-900/80 text-zinc-400 border-b border-zinc-800">
                  <tr>
                    {Object.keys(rows[0] || {}).map((col) => (
                      <th key={col} className="p-3 font-semibold text-zinc-200 whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850/60 text-zinc-300">
                  {rows.slice(0, 10).map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-zinc-900/40">
                      {Object.values(row).map((val: any, cIdx) => (
                        <td key={cIdx} className="p-3 max-w-[280px] truncate text-[11px]">
                          {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 10 && (
                <div className="p-2.5 text-center bg-zinc-900/50 text-[11px] text-zinc-400 border-t border-zinc-850">
                  Affichage des 10 premières lignes sur {rows.length} enregistrements réels extraits.
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* SECTION 2: AUTOMATED VERCEL API INJECTION */}
      <div className="p-6 bg-zinc-900/90 border border-zinc-800 rounded-3xl space-y-5 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <Zap className="w-4 h-4 text-white" />
              <span>2. Injection Directe dans votre Projet Vercel (API Vercel)</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Injecte automatiquement vos variables réelles Supabase dans votre projet Vercel sans copier-coller manuel.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Vercel Token */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-zinc-300">
              Jeton personnel Vercel (Personal Access Token)
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="vercel_xxxxxxxxxxxxxxxxxxxx"
                value={vercelToken}
                onChange={(e) => setVercelToken(e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-white rounded-xl text-xs font-mono text-zinc-100 placeholder:text-zinc-600 outline-none"
              />
              <button
                type="button"
                onClick={handleFetchVercelProjects}
                disabled={isFetchingProjects || !vercelToken.trim()}
                className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-xl transition-colors disabled:opacity-50 shrink-0"
              >
                {isFetchingProjects ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Lister Projets'}
              </button>
            </div>
            <p className="text-[11px] text-zinc-500">
              Générez un token sur <a href="https://vercel.com/account/tokens" target="_blank" rel="noreferrer" className="text-white underline">vercel.com/account/tokens</a>
            </p>
          </div>

          {/* Vercel Project Selector or manual project name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-zinc-300">
              Nom ou ID du Projet Vercel Cible
            </label>
            {vercelProjects.length > 0 ? (
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-white rounded-xl text-xs font-mono text-zinc-100 outline-none"
              >
                {vercelProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.framework || 'Next.js'})
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder="mon-projet-vercel (ou ID Vercel)"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-white rounded-xl text-xs font-mono text-zinc-100 placeholder:text-zinc-600 outline-none"
              />
            )}
          </div>
        </div>

        {syncError && (
          <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-xs text-red-300 font-medium">
            {syncError}
          </div>
        )}

        <button
          onClick={handleSyncVercelEnv}
          disabled={isSyncingEnv}
          className="w-full py-3 bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          {isSyncingEnv ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
              <span>Injection des variables réelles dans Vercel...</span>
            </>
          ) : (
            <>
              <Triangle className="w-3.5 h-3.5 fill-zinc-950 text-zinc-950" />
              <span>Injecter automatiquement les variables réelles dans Vercel</span>
            </>
          )}
        </button>
      </div>

      {/* Terminal of Live Injection */}
      {syncLogs.length > 0 && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl animate-in fade-in duration-200">
          <div className="px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-xs font-mono text-zinc-400">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-white" />
              <span className="font-semibold text-zinc-200">Terminal d'injection Vercel</span>
            </div>
            <span className="text-[11px] text-zinc-500">
              {isSyncingEnv ? 'Exécution en cours...' : 'Opération terminée'}
            </span>
          </div>
          <div className="p-4 font-mono text-xs text-zinc-300 space-y-1.5 max-h-52 overflow-y-auto">
            {syncLogs.map((log, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-zinc-600 select-none">&gt;</span>
                <span
                  className={
                    log.includes('Erreur')
                      ? 'text-red-400'
                      : log.includes('✅') || log.includes('Succès')
                      ? 'text-emerald-400 font-semibold'
                      : 'text-zinc-300'
                  }
                >
                  {log}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: CODE & ARTIFACTS VIEWER */}
      <div className="space-y-4">
        {/* Selector Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900/80 p-2.5 rounded-2xl border border-zinc-800">
          <div className="flex flex-wrap gap-1.5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-white text-zinc-950 font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-full ${
                      activeTab === tab.id
                        ? 'bg-zinc-900/20 text-zinc-950 font-bold'
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copié !</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Copier</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadSingle}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Télécharger</span>
            </button>
          </div>
        </div>

        {/* Code Box */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="px-4 py-2.5 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between text-xs font-mono text-zinc-400">
            <span className="flex items-center gap-2 text-zinc-200">
              <FileCode2 className="w-3.5 h-3.5 text-white" />
              {activeSnippet.filename}
            </span>
            <span className="text-[11px] text-zinc-500 hidden sm:inline">
              {activeSnippet.desc}
            </span>
          </div>

          <div className="p-4 overflow-x-auto max-h-[520px] font-mono text-xs text-zinc-300 leading-relaxed select-text">
            <pre>
              <code>{activeSnippet.code}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
