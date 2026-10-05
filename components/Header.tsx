'use client';

import React from 'react';
import { Database, ShieldCheck, Download, Copy, RefreshCw, KeyRound, Check, Lock, FolderArchive, Package } from 'lucide-react';
import { DatabaseIntrospectionResult } from '@/types/supabase';

interface HeaderProps {
  data: DatabaseIntrospectionResult | null;
  onOpenConnectModal: () => void;
  onDownloadAllZip: () => void;
  onDownloadFullSourceZip: () => void;
  isDownloadingSource?: boolean;
  onCopyEnv: () => void;
  copiedEnv: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  data,
  onOpenConnectModal,
  onDownloadAllZip,
  onDownloadFullSourceZip,
  isDownloadingSource = false,
  onCopyEnv,
  copiedEnv,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 text-emerald-400 shadow-sm shadow-emerald-500/10">
            <Database className="w-5 h-5" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-zinc-950"></div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-white tracking-tight">SupaSync</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                DB Auto-Config
              </span>
            </div>
            <p className="text-xs text-zinc-400 hidden sm:block">
              Inspecteur & Générateur de configuration Supabase
            </p>
          </div>
        </div>

        {/* Project Info Badge & Actions */}
        <div className="flex items-center gap-3">
          {data ? (
            <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs">
              <div className="flex items-center gap-1.5 text-zinc-300 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="truncate max-w-[140px]">{data.projectInfo.name || 'Projet Supabase'}</span>
              </div>
              <span className="text-zinc-600">|</span>
              <span className="text-zinc-400">
                {data.tables.length} table{data.tables.length > 1 ? 's' : ''}
              </span>
              <span className="text-zinc-600">|</span>
              <span className="text-emerald-400/90 font-mono">
                {data.projectInfo.latencyMs}ms
              </span>
            </div>
          ) : null}

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {data && (
              <>
                <button
                  onClick={onCopyEnv}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/60 rounded-lg transition-colors"
                  title="Copier le fichier .env complet"
                >
                  {copiedEnv ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">.env copié</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="hidden sm:inline">Copier .env</span>
                    </>
                  )}
                </button>

                <button
                  onClick={onDownloadAllZip}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-sm font-semibold transition-colors"
                  title="Télécharger tous les fichiers de configuration (Drizzle, Prisma, Types, SQL, .env) en ZIP"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Configs ZIP</span>
                </button>
              </>
            )}

            <button
              onClick={onDownloadFullSourceZip}
              disabled={isDownloadingSource}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-lg shadow-sm border border-emerald-400/30 transition-all disabled:opacity-50"
              title="Télécharger le code source complet avec toutes les clés (.env, server.ts, src) en fichier ZIP"
            >
              {isDownloadingSource ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>Archivage...</span>
                </>
              ) : (
                <>
                  <Package className="w-3.5 h-3.5 text-emerald-200" />
                  <span className="hidden sm:inline">Code Source (.ZIP)</span>
                  <span className="sm:hidden">ZIP</span>
                </>
              )}
            </button>

            <button
              onClick={onOpenConnectModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/30 rounded-lg transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
              <span>{data ? 'Changer de DB' : 'Connecter Supabase'}</span>
            </button>

            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('supasync_is_authenticated');
                  window.location.reload();
                }
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-lg transition-colors"
              title="Verrouiller l'accès à l'application par mot de passe"
            >
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Verrouiller</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
