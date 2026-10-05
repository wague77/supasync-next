'use client';

import React, { useState } from 'react';
import {
  Table as TableIcon,
  GitFork,
  FileCode2,
  ShieldCheck,
  GitCompare,
  BookOpen,
  Heart,
  Triangle,
  Package,
  Download,
  RefreshCw,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { ConnectModal } from '@/components/ConnectModal';
import { SchemaViewer } from '@/components/SchemaViewer';
import { VisualERD } from '@/components/VisualERD';
import { CodeGeneratorView } from '@/components/CodeGeneratorView';
import { SecurityAuditView } from '@/components/SecurityAuditView';
import { DatabaseDiffSync } from '@/components/DatabaseDiffSync';
import { DocumentationGuide } from '@/components/DocumentationGuide';
import { LovableBridgeView } from '@/components/LovableBridgeView';
import { VercelBridgeView } from '@/components/VercelBridgeView';
import { AppLockGuard } from '@/components/AppLockGuard';
import { DEFAULT_MASTER_PASSWORD } from '@/lib/accessCodeService';
import { DEMO_PRESETS } from '@/lib/presets';
import { DatabaseIntrospectionResult } from '@/types/supabase';
import {
  generateEnvFile,
  generateDrizzleSchema,
  generatePrismaSchema,
  generateTypeScriptTypes,
  generateSqlDDL,
  generateSqlRLSHardening,
  generateSeedScript,
  generateClientSetup,
} from '@/lib/configGenerators';
import JSZip from 'jszip';

export default function MainPage() {
  // Load SaaS Multi-tenant demo by default so app is immediately interactive!
  const [data, setData] = useState<DatabaseIntrospectionResult>(DEMO_PRESETS[0].data);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'schema' | 'erd' | 'generator' | 'audit' | 'diff' | 'lovable' | 'vercel' | 'docs'
  >('vercel');
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [isDownloadingSource, setIsDownloadingSource] = useState(false);

  const handleDownloadFullSourceZip = async () => {
    setIsDownloadingSource(true);
    try {
      const res = await fetch('/api/download-full-source-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supabaseUrl: data.projectInfo.url,
          supabaseKey: data.projectInfo.connectedVia === 'url_key' ? data.projectInfo.url : undefined,
          masterPassword: typeof window !== 'undefined' ? localStorage.getItem('supasync_master_password') || DEFAULT_MASTER_PASSWORD : DEFAULT_MASTER_PASSWORD,
        }),
      });

      if (!res.ok) {
        throw new Error('Échec du téléchargement du code source');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'supasync-code-source-complet.zip';
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Source code ZIP error:', err);
      if (typeof window !== 'undefined') {
        window.location.href = '/api/download-full-source-zip';
      }
    } finally {
      setIsDownloadingSource(false);
    }
  };

  const handleCopyEnv = () => {
    if (!data) return;
    const env = generateEnvFile(data);
    navigator.clipboard.writeText(env);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2000);
  };

  const handleDownloadAllZip = async () => {
    if (!data) return;
    try {
      const zip = new JSZip();

      const drizzleFolder = zip.folder('drizzle');
      drizzleFolder?.file('schema.ts', generateDrizzleSchema(data));

      const prismaFolder = zip.folder('prisma');
      prismaFolder?.file('schema.prisma', generatePrismaSchema(data));

      const typesFolder = zip.folder('types');
      typesFolder?.file('database.types.ts', generateTypeScriptTypes(data));

      const migrationsFolder = zip.folder('migrations');
      migrationsFolder?.file('001_initial_schema.sql', generateSqlDDL(data));
      migrationsFolder?.file('002_rls_hardening.sql', generateSqlRLSHardening(data));
      migrationsFolder?.file('seed.sql', generateSeedScript(data, 'sql'));

      const clientFolder = zip.folder('client');
      clientFolder?.file('supabaseClient.ts', generateClientSetup(data, 'nextjs'));
      clientFolder?.file('seed.ts', generateSeedScript(data, 'typescript'));

      zip.file('.env.example', generateEnvFile(data));
      zip.file(
        'README.md',
        `# Configuration Supabase générée par SupaSync\nProjet: ${
          data.projectInfo.name || data.projectInfo.url
        }\nDate: ${new Date().toLocaleString()}\n`
      );

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `supasync-${data.projectInfo.ref || 'database'}-config.zip`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('ZIP generation error:', err);
    }
  };

  return (
    <AppLockGuard currentData={data}>
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
        {/* Top Header */}
        <Header
          data={data}
          onOpenConnectModal={() => setIsConnectModalOpen(true)}
          onDownloadAllZip={handleDownloadAllZip}
          onDownloadFullSourceZip={handleDownloadFullSourceZip}
          isDownloadingSource={isDownloadingSource}
          onCopyEnv={handleCopyEnv}
          copiedEnv={copiedEnv}
        />

        {/* Main Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Quick Source Code Download Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-zinc-900 to-teal-950/60 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Code Source Complet avec Toutes les Clés (.ZIP)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                    Prêt au déploiement
                  </span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Téléchargez l'intégralité du projet (Next.js App Router, Route Handlers, .env avec vraies clés, mots de passe et configurations) en un seul fichier ZIP.
                </p>
              </div>
            </div>

            <button
              onClick={handleDownloadFullSourceZip}
              disabled={isDownloadingSource}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-zinc-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 shrink-0"
            >
              {isDownloadingSource ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-zinc-950" />
                  <span>Archivage en cours...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-zinc-950" />
                  <span>Télécharger le Code Source (.ZIP)</span>
                </>
              )}
            </button>
          </div>

          {/* Project Summary Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-r from-zinc-900/90 via-zinc-900/60 to-zinc-950 p-6 shadow-xl">
            {/* Subtle glow effect */}
            <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {data.projectInfo.connectedVia === 'demo_preset' ? 'Mode Démo Connecté' : 'Supabase En Ligne'}
                  </span>
                  <span className="text-zinc-500 text-xs font-mono">•</span>
                  <span className="text-zinc-400 text-xs font-mono">
                    {data.projectInfo.url}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  {data.projectInfo.name || 'Projet Supabase'}
                </h1>
                <p className="text-xs text-zinc-400 max-w-2xl">
                  Base de données introspectée avec succès. Toutes les tables, colonnes, types de données, contraintes relationnelles et politiques de sécurité ont été analysées automatiquement.
                </p>
              </div>

              {/* Quick Metrics Bar */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
                <div className="px-3.5 py-2 rounded-xl bg-zinc-950/80 border border-zinc-800 text-center">
                  <span className="block text-lg font-bold font-mono text-zinc-100">
                    {data.tables.length}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">
                    Tables
                  </span>
                </div>

                <div className="px-3.5 py-2 rounded-xl bg-zinc-950/80 border border-zinc-800 text-center">
                  <span className="block text-lg font-bold font-mono text-zinc-100">
                    {data.relationships.length}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">
                    Relations
                  </span>
                </div>

                <div className="px-3.5 py-2 rounded-xl bg-zinc-950/80 border border-zinc-800 text-center">
                  <span className="block text-lg font-bold font-mono text-emerald-400">
                    {data.securityAudit.score}%
                  </span>
                  <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">
                    Score RLS
                  </span>
                </div>

                <div className="px-3.5 py-2 rounded-xl bg-zinc-950/80 border border-zinc-800 text-center">
                  <span className="block text-lg font-bold font-mono text-zinc-300">
                    {data.projectInfo.latencyMs}ms
                  </span>
                  <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">
                    Latence
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation Navigation */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-zinc-850">
            <button
              onClick={() => setActiveTab('schema')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'schema'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <TableIcon className="w-4 h-4 text-emerald-400" />
              <span>Tables & Schéma ({data.tables.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('erd')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'erd'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <GitFork className="w-4 h-4 text-emerald-400" />
              <span>Diagramme Visuel ERD</span>
            </button>

            <button
              onClick={() => setActiveTab('generator')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'generator'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <FileCode2 className="w-4 h-4 text-emerald-400" />
              <span>Générateur ORM & Config</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300">
                Drizzle • Prisma • Types
              </span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'audit'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Audit Sécurité & RLS</span>
              {data.securityAudit.issues.length > 0 && (
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300">
                  {data.securityAudit.issues.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('lovable')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'lovable'
                  ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-300 border border-pink-500/30 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Heart className="w-4 h-4 text-pink-400 fill-pink-400/40" />
              <span>Passerelle Lovable</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 font-bold">
                Synchro
              </span>
            </button>

            <button
              onClick={() => setActiveTab('vercel')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'vercel'
                  ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-white/20'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Triangle className="w-3.5 h-3.5 fill-white text-white" />
              <span>Passerelle Vercel</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-white/10 text-white font-bold border border-white/20">
                Next.js SSR
              </span>
            </button>

            <button
              onClick={() => setActiveTab('diff')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'diff'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <GitCompare className="w-4 h-4 text-emerald-400" />
              <span>Diff & Synchronisation</span>
            </button>

            <button
              onClick={() => setActiveTab('docs')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'docs'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>Guide d'Utilisation</span>
            </button>
          </div>

          {/* Tab Content Display */}
          <div className="pt-2">
            {activeTab === 'schema' && (
              <SchemaViewer tables={data.tables} views={data.views} />
            )}

            {activeTab === 'erd' && (
              <VisualERD tables={data.tables} relationships={data.relationships} />
            )}

            {activeTab === 'generator' && (
              <CodeGeneratorView data={data} />
            )}

            {activeTab === 'audit' && (
              <SecurityAuditView audit={data.securityAudit} tables={data.tables} data={data} />
            )}

            {activeTab === 'lovable' && (
              <LovableBridgeView
                currentData={data}
                onApplyLovableSchema={(newResult) => {
                  setData(newResult);
                }}
              />
            )}

            {activeTab === 'vercel' && (
              <VercelBridgeView
                currentData={data}
                onUpdateRealData={(newResult) => {
                  setData(newResult);
                }}
              />
            )}

            {activeTab === 'diff' && (
              <DatabaseDiffSync currentData={data} />
            )}

            {activeTab === 'docs' && (
              <DocumentationGuide />
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-zinc-800/80 py-6 mt-12 bg-zinc-950 text-xs text-zinc-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>SupaSync — Auto-configurateur de base de données pour Supabase</span>
            </div>
            <div className="flex items-center gap-4 text-zinc-400">
              <span>PostgreSQL & Supabase Introspection</span>
              <span>•</span>
              <button
                onClick={() => setIsConnectModalOpen(true)}
                className="text-emerald-400 hover:underline"
              >
                Changer de projet
              </button>
            </div>
          </div>
        </footer>

        {/* Connection & Configuration Modal */}
        <ConnectModal
          isOpen={isConnectModalOpen}
          onClose={() => setIsConnectModalOpen(false)}
          onConnectSuccess={(newResult) => {
            setData(newResult);
          }}
        />
      </div>
    </AppLockGuard>
  );
}
