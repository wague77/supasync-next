'use client';

import React, { useState, useMemo } from 'react';
import {
  FileCode2,
  Copy,
  Check,
  Download,
  Terminal,
  Layers,
  Shield,
  FolderArchive,
  Database,
  Code2,
} from 'lucide-react';
import { DatabaseIntrospectionResult } from '@/types/supabase';
import {
  generateDrizzleSchema,
  generatePrismaSchema,
  generateTypeScriptTypes,
  generateSqlDDL,
  generateSqlRLSHardening,
  generateSeedScript,
  generateClientSetup,
  generateEnvFile,
} from '@/lib/configGenerators';
import JSZip from 'jszip';

interface CodeGeneratorViewProps {
  data: DatabaseIntrospectionResult;
}

type GeneratorTab =
  | 'drizzle'
  | 'prisma'
  | 'types'
  | 'sql_ddl'
  | 'sql_rls'
  | 'seed'
  | 'client'
  | 'env';

export const CodeGeneratorView: React.FC<CodeGeneratorViewProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<GeneratorTab>('drizzle');
  const [clientFramework, setClientFramework] = useState<'react' | 'nextjs' | 'node' | 'python' | 'flutter'>('nextjs');
  const [seedFormat, setSeedFormat] = useState<'sql' | 'typescript'>('sql');
  const [copied, setCopied] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);

  // Memoize generated codes
  const generatedDrizzle = useMemo(() => generateDrizzleSchema(data), [data]);
  const generatedPrisma = useMemo(() => generatePrismaSchema(data), [data]);
  const generatedTypes = useMemo(() => generateTypeScriptTypes(data), [data]);
  const generatedSqlDDL = useMemo(() => generateSqlDDL(data), [data]);
  const generatedSqlRLS = useMemo(() => generateSqlRLSHardening(data), [data]);
  const generatedSeed = useMemo(() => generateSeedScript(data, seedFormat), [data, seedFormat]);
  const generatedClient = useMemo(() => generateClientSetup(data, clientFramework), [data, clientFramework]);
  const generatedEnv = useMemo(() => generateEnvFile(data), [data]);

  // Current active code and filename
  const currentConfig = useMemo(() => {
    switch (activeTab) {
      case 'drizzle':
        return { code: generatedDrizzle, filename: 'schema.ts', language: 'typescript', desc: 'Définitions de tables, colonnes et relations Drizzle ORM' };
      case 'prisma':
        return { code: generatedPrisma, filename: 'schema.prisma', language: 'prisma', desc: 'Modèles Prisma complets avec clés étrangères et directives @relation' };
      case 'types':
        return { code: generatedTypes, filename: 'database.types.ts', language: 'typescript', desc: 'Types stricts Supabase pour TypeScript avec support de Row, Insert et Update' };
      case 'sql_ddl':
        return { code: generatedSqlDDL, filename: '001_initial_schema.sql', language: 'sql', desc: 'Script SQL DDL complet pour reproduire ou migrer la base sur PostgreSQL' };
      case 'sql_rls':
        return { code: generatedSqlRLS, filename: '002_rls_security.sql', language: 'sql', desc: 'Stratégies de sécurité Row Level Security (RLS) recommandées' };
      case 'seed':
        return { code: generatedSeed, filename: seedFormat === 'sql' ? 'seed.sql' : 'seed.ts', language: seedFormat === 'sql' ? 'sql' : 'typescript', desc: 'Jeu de données de test cohérent avec les relations' };
      case 'client':
        return { code: generatedClient, filename: 'supabaseClient.ts', language: 'typescript', desc: `Initialisation et configuration client pour ${clientFramework.toUpperCase()}` };
      case 'env':
        return { code: generatedEnv, filename: '.env.local', language: 'env', desc: 'Variables d\'environnement et URLs de connexion directes / pooler' };
    }
  }, [
    activeTab,
    generatedDrizzle,
    generatedPrisma,
    generatedTypes,
    generatedSqlDDL,
    generatedSqlRLS,
    generatedSeed,
    generatedClient,
    generatedEnv,
    seedFormat,
    clientFramework,
  ]);

  const handleCopy = () => {
    navigator.clipboard.writeText(currentConfig.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSingle = () => {
    const blob = new Blob([currentConfig.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = currentConfig.filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAllZip = async () => {
    setIsExportingZip(true);
    try {
      const zip = new JSZip();

      // Folder structure
      const drizzleFolder = zip.folder('drizzle');
      drizzleFolder?.file('schema.ts', generatedDrizzle);

      const prismaFolder = zip.folder('prisma');
      prismaFolder?.file('schema.prisma', generatedPrisma);

      const typesFolder = zip.folder('types');
      typesFolder?.file('database.types.ts', generatedTypes);

      const migrationsFolder = zip.folder('migrations');
      migrationsFolder?.file('001_initial_schema.sql', generatedSqlDDL);
      migrationsFolder?.file('002_rls_hardening.sql', generatedSqlRLS);
      migrationsFolder?.file('seed.sql', generateSeedScript(data, 'sql'));

      const clientFolder = zip.folder('client');
      clientFolder?.file('supabaseClient.ts', generateClientSetup(data, 'nextjs'));
      clientFolder?.file('seed.ts', generateSeedScript(data, 'typescript'));

      zip.file('.env.example', generatedEnv);
      zip.file('README.md', `# Configuration Supabase générée par SupaSync
Projet: ${data.projectInfo.name || data.projectInfo.url}
Généré le: ${new Date().toLocaleString()}

Ce pack contient:
- /drizzle/schema.ts : Schéma Drizzle ORM complet
- /prisma/schema.prisma : Modèles Prisma ORM
- /types/database.types.ts : Types TypeScript Supabase Database
- /migrations/ : Scripts SQL DDL, RLS et seed
- /client/ : Clients d'initialisation
- .env.example : Variables de connexion
`);

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `supasync-${data.projectInfo.ref || 'database'}-config.zip`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('ZIP generation error:', e);
    } finally {
      setIsExportingZip(false);
    }
  };

  const tabs: { id: GeneratorTab; label: string; badge?: string }[] = [
    { id: 'drizzle', label: 'Drizzle ORM', badge: 'Recommandé' },
    { id: 'prisma', label: 'Prisma Schema' },
    { id: 'types', label: 'TypeScript Types' },
    { id: 'sql_ddl', label: 'SQL DDL' },
    { id: 'sql_rls', label: 'Sécurité RLS' },
    { id: 'client', label: 'Client SDK' },
    { id: 'seed', label: 'Seed Data' },
    { id: 'env', label: '.env Config' },
  ];

  return (
    <div className="space-y-4">
      {/* Top Selector Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900/60 p-2.5 rounded-2xl border border-zinc-800">
        <div className="flex flex-wrap gap-1.5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-emerald-500 text-zinc-950 font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded-full ${
                    activeTab === tab.id
                      ? 'bg-zinc-900/20 text-zinc-950 font-bold'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Global Export All ZIP button */}
        <button
          onClick={handleDownloadAllZip}
          disabled={isExportingZip}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors"
        >
          <FolderArchive className="w-3.5 h-3.5 text-emerald-400" />
          <span>{isExportingZip ? 'Génération du ZIP...' : 'Tout exporter (.ZIP)'}</span>
        </button>
      </div>

      {/* Sub-selector for Client or Seed options */}
      {activeTab === 'client' && (
        <div className="flex items-center gap-2 p-3 bg-zinc-900/40 rounded-xl border border-zinc-800/80 text-xs">
          <span className="text-zinc-400 font-medium">Framework cible :</span>
          {(['nextjs', 'react', 'node', 'python', 'flutter'] as const).map((fw) => (
            <button
              key={fw}
              onClick={() => setClientFramework(fw)}
              className={`px-2.5 py-1 rounded-lg capitalize font-mono text-[11px] transition-colors ${
                clientFramework === fw
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                  : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {fw === 'nextjs' ? 'Next.js App Router (SSR)' : fw}
            </button>
          ))}
        </div>
      )}

      {activeTab === 'seed' && (
        <div className="flex items-center gap-2 p-3 bg-zinc-900/40 rounded-xl border border-zinc-800/80 text-xs">
          <span className="text-zinc-400 font-medium">Format de génération :</span>
          <button
            onClick={() => setSeedFormat('sql')}
            className={`px-2.5 py-1 rounded-lg font-mono text-[11px] ${
              seedFormat === 'sql'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                : 'bg-zinc-950 text-zinc-400'
            }`}
          >
            SQL Script (INSERT INTO)
          </button>
          <button
            onClick={() => setSeedFormat('typescript')}
            className={`px-2.5 py-1 rounded-lg font-mono text-[11px] ${
              seedFormat === 'typescript'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                : 'bg-zinc-950 text-zinc-400'
            }`}
          >
            TypeScript SDK Script
          </button>
        </div>
      )}

      {/* Code Editor Window */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Editor Title Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/90 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
            </div>
            <span className="font-mono text-xs font-semibold text-zinc-200 flex items-center gap-1.5 ml-2">
              <FileCode2 className="w-3.5 h-3.5 text-emerald-400" />
              {currentConfig.filename}
            </span>
            <span className="text-[11px] text-zinc-500 hidden md:inline">
              — {currentConfig.desc}
            </span>
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
              title="Télécharger ce fichier"
            >
              <Download className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Télécharger</span>
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="p-4 overflow-x-auto max-h-[600px] font-mono text-xs text-zinc-300 leading-relaxed select-text">
          <pre className="tab-4">
            <code>{currentConfig.code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
