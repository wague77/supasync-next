'use client';

import React, { useState } from 'react';
import {
  GitCompare,
  Plus,
  ArrowRight,
  Terminal,
  Check,
  Copy,
  Layers,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { DatabaseIntrospectionResult, TableSchema } from '@/types/supabase';

interface DatabaseDiffSyncProps {
  currentData: DatabaseIntrospectionResult;
}

export const DatabaseDiffSync: React.FC<DatabaseDiffSyncProps> = ({ currentData }) => {
  const [newTableName, setNewTableName] = useState('');
  const [newTableColumns, setNewTableColumns] = useState('title text, description text, status text default \'draft\'');
  const [enableRls, setEnableRls] = useState(true);
  const [copiedDiff, setCopiedDiff] = useState(false);

  // Generate migration SQL diff
  const generatedMigrationSql = React.useMemo(() => {
    if (!newTableName.trim()) {
      return `-- Saisissez un nom de table pour générer le script différentiel de migration.
-- Exemple : ALTER TABLE public.users ADD COLUMN phone_number TEXT;`;
    }

    const cleanName = newTableName.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    let sql = `-- ========================================================\n`;
    sql += `-- Migration générée pour synchronisation Supabase\n`;
    sql += `-- Date: ${new Date().toISOString()}\n`;
    sql += `-- ========================================================\n\n`;

    sql += `CREATE TABLE IF NOT EXISTS public.${cleanName} (\n`;
    sql += `  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n`;

    const cols = newTableColumns.split(',').map((c) => c.trim()).filter(Boolean);
    cols.forEach((col) => {
      sql += `  ${col},\n`;
    });

    sql += `  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),\n`;
    sql += `  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()\n`;
    sql += `);\n\n`;

    if (enableRls) {
      sql += `ALTER TABLE public.${cleanName} ENABLE ROW LEVEL SECURITY;\n\n`;
      sql += `CREATE POLICY "${cleanName}_authenticated_access"\n`;
      sql += `  ON public.${cleanName} FOR ALL TO authenticated USING (true);\n`;
    }

    return sql;
  }, [newTableName, newTableColumns, enableRls]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedMigrationSql);
    setCopiedDiff(true);
    setTimeout(() => setCopiedDiff(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Intro banner */}
      <div className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-semibold text-zinc-100">
              Synchronisateur & Générateur de Différences (Diff & Migrations)
            </h3>
          </div>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
            Configurez de nouvelles tables ou colonnes et générez immédiatement les scripts SQL de migration compatibles avec Supabase et Drizzle/Prisma.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-500/20">
            {currentData.tables.length} tables synchronisées
          </span>
        </div>
      </div>

      {/* Interactive Builder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Form: Config */}
        <div className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-emerald-400" />
            Ajouter une nouvelle entité à synchroniser
          </h4>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Nom de la table (ex: notifications, comments, invoices)
            </label>
            <input
              type="text"
              placeholder="ex: notifications"
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl text-xs text-zinc-100 outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Colonnes additionnelles (nom type [contraintes])
            </label>
            <textarea
              rows={3}
              value={newTableColumns}
              onChange={(e) => setNewTableColumns(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl text-xs text-zinc-100 outline-none font-mono leading-relaxed"
            />
            <p className="text-[11px] text-zinc-500 mt-1">
              Les colonnes <code className="text-zinc-400">id UUID</code>, <code className="text-zinc-400">created_at</code> et <code className="text-zinc-400">updated_at</code> sont ajoutées automatiquement.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="rls-check"
              checked={enableRls}
              onChange={(e) => setEnableRls(e.target.checked)}
              className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
            />
            <label htmlFor="rls-check" className="text-xs text-zinc-300 cursor-pointer select-none">
              Activer automatiquement Row Level Security (RLS) et politique d'accès
            </label>
          </div>

          {/* Quick preset buttons */}
          <div className="pt-2 border-t border-zinc-800">
            <span className="text-[11px] text-zinc-500 block mb-2">Générer rapidement :</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setNewTableName('notifications');
                  setNewTableColumns('user_id UUID NOT NULL, title TEXT NOT NULL, message TEXT, is_read BOOLEAN DEFAULT false');
                }}
                className="px-2.5 py-1 text-[11px] font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
              >
                + Notifications
              </button>
              <button
                type="button"
                onClick={() => {
                  setNewTableName('comments');
                  setNewTableColumns('post_id UUID NOT NULL, author_id UUID NOT NULL, content TEXT NOT NULL');
                }}
                className="px-2.5 py-1 text-[11px] font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
              >
                + Commentaires
              </button>
              <button
                type="button"
                onClick={() => {
                  setNewTableName('subscriptions');
                  setNewTableColumns('user_id UUID NOT NULL, stripe_sub_id TEXT, status TEXT DEFAULT \'active\', current_period_end TIMESTAMPTZ');
                }}
                className="px-2.5 py-1 text-[11px] font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
              >
                + Abonnements Stripe
              </button>
            </div>
          </div>
        </div>

        {/* Right Output: SQL migration preview */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col justify-between">
          <div className="p-4 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="font-mono text-xs font-semibold text-zinc-200">
                migration_diff.sql
              </span>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors"
            >
              {copiedDiff ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copié !</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Copier SQL</span>
                </>
              )}
            </button>
          </div>

          <div className="p-4 font-mono text-xs text-emerald-300/90 overflow-y-auto max-h-[340px]">
            <pre className="whitespace-pre-wrap">{generatedMigrationSql}</pre>
          </div>

          <div className="p-3 bg-zinc-900/80 border-t border-zinc-800 text-[11px] text-zinc-500">
            Copiez ce script dans l'éditeur SQL de votre tableau de bord Supabase (SQL Editor) pour appliquer la modification.
          </div>
        </div>
      </div>
    </div>
  );
};
