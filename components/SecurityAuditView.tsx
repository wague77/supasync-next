'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Info,
  Copy,
  Check,
  Terminal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { SecurityAudit, TableSchema } from '@/types/supabase';
import { generateSqlRLSHardening } from '@/lib/configGenerators';

interface SecurityAuditViewProps {
  audit: SecurityAudit;
  tables: TableSchema[];
  data: any;
}

export const SecurityAuditView: React.FC<SecurityAuditViewProps> = ({ audit, tables, data }) => {
  const [copiedFixId, setCopiedFixId] = useState<string | null>(null);
  const [copiedFullSql, setCopiedFullSql] = useState(false);
  const [expandedIssue, setExpandedIssue] = useState<string | null>(audit.issues[0]?.id || null);

  const handleCopyFix = (id: string, sql: string) => {
    navigator.clipboard.writeText(sql);
    setCopiedFixId(id);
    setTimeout(() => setCopiedFixId(null), 2000);
  };

  const handleCopyFullFixScript = () => {
    const fullSql = generateSqlRLSHardening(data);
    navigator.clipboard.writeText(fullSql);
    setCopiedFullSql(true);
    setTimeout(() => setCopiedFullSql(false), 2000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (score >= 70) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-red-400 border-red-500/30 bg-red-500/10';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Scorecard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Score Card */}
        <div className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl flex items-center gap-4">
          <div
            className={`w-16 h-16 rounded-2xl border flex flex-col items-center justify-center font-bold font-mono text-xl ${getScoreColor(
              audit.score
            )}`}
          >
            <span>{audit.score}</span>
            <span className="text-[9px] font-sans font-normal opacity-80">/ 100</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">Score de Sécurité</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              {audit.score >= 90
                ? 'Excellente configuration'
                : audit.score >= 70
                ? 'Améliorations recommandées'
                : 'Vulnérabilités critiques'}
            </p>
          </div>
        </div>

        {/* Metric 1: RLS Protection */}
        <div className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Protection RLS</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-zinc-100">
              {audit.totalTables - audit.rlsDisabledCount} / {audit.totalTables}
            </span>
            <span className="text-xs text-zinc-500">tables protégées</span>
          </div>
          {audit.rlsDisabledCount > 0 ? (
            <p className="text-[11px] text-red-400 mt-1 font-medium">
              {audit.rlsDisabledCount} table sans Row Level Security
            </p>
          ) : (
            <p className="text-[11px] text-emerald-400 mt-1 font-medium">
              Toutes les tables ont RLS activé
            </p>
          )}
        </div>

        {/* Metric 2: Foreign Key Indexes */}
        <div className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Index de Performance</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-zinc-100">
              {audit.missingIndexesCount}
            </span>
            <span className="text-xs text-zinc-500">index recommandés</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">
            Accélère les jointures et requêtes relationnelles
          </p>
        </div>

        {/* Action: Copy complete fix script */}
        <div className="p-5 bg-gradient-to-br from-emerald-950/40 to-zinc-900 border border-emerald-500/20 rounded-2xl flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-300">
              Durcissement en 1 Clic
            </span>
            <p className="text-[11px] text-zinc-400 mt-1">
              Génère le script SQL appliquant RLS et index automatiquement.
            </p>
          </div>
          <button
            onClick={handleCopyFullFixScript}
            className="mt-3 w-full py-2 px-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm"
          >
            {copiedFullSql ? (
              <>
                <Check className="w-3.5 h-3.5 text-zinc-950" />
                <span>Script complet copié !</span>
              </>
            ) : (
              <>
                <Terminal className="w-3.5 h-3.5 text-zinc-950" />
                <span>Copier le script SQL complet</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Issues List */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-zinc-200">
          Points d'attention & Recommandations ({audit.issues.length})
        </h3>

        {audit.issues.map((issue) => {
          const isExpanded = expandedIssue === issue.id;

          return (
            <div
              key={issue.id}
              className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden transition-all"
            >
              <div
                onClick={() => setExpandedIssue(isExpanded ? null : issue.id)}
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-850/50"
              >
                <div className="flex items-center gap-3">
                  {issue.level === 'critical' ? (
                    <div className="w-7 h-7 rounded-lg bg-red-950/60 border border-red-500/30 text-red-400 flex items-center justify-center shrink-0">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                  ) : issue.level === 'warning' ? (
                    <div className="w-7 h-7 rounded-lg bg-amber-950/60 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-blue-950/60 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
                      <Info className="w-4 h-4" />
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-zinc-200">
                        {issue.title}
                      </span>
                      {issue.tableName && (
                        <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                          {issue.tableName}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">{issue.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      issue.level === 'critical'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : issue.level === 'warning'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}
                  >
                    {issue.level}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-zinc-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-zinc-500" />
                  )}
                </div>
              </div>

              {isExpanded && issue.sqlFix && (
                <div className="p-4 border-t border-zinc-800 bg-zinc-950/60 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-emerald-400 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5" />
                      Correctif SQL recommandé :
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyFix(issue.id, issue.sqlFix!);
                      }}
                      className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[11px] font-mono text-zinc-300 flex items-center gap-1 transition-colors"
                    >
                      {copiedFixId === issue.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copié</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-zinc-400" />
                          <span>Copier SQL</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="font-mono text-xs text-emerald-300/90 bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 overflow-x-auto">
                    <code>{issue.sqlFix}</code>
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
