'use client';

import React, { useState } from 'react';
import {
  Table as TableIcon,
  Key,
  Link,
  Shield,
  ShieldAlert,
  ChevronDown,
  ChevronRight,
  Search,
  Rows,
  Layers,
} from 'lucide-react';
import { TableColumn, TableSchema } from '@/types/supabase';

interface SchemaViewerProps {
  tables: TableSchema[];
  views: { name: string; columns: TableColumn[] }[];
  onSelectTableForConfig?: (tableName: string) => void;
}

export const SchemaViewer: React.FC<SchemaViewerProps> = ({
  tables,
  views,
}) => {
  const [search, setSearch] = useState('');
  const [filterRls, setFilterRls] = useState<'all' | 'rls_on' | 'rls_off'>('all');
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>(() => {
    // Expand the first 2 tables by default
    const init: Record<string, boolean> = {};
    if (tables[0]) init[tables[0].name] = true;
    if (tables[1]) init[tables[1].name] = true;
    return init;
  });
  const [previewDataTab, setPreviewDataTab] = useState<Record<string, 'columns' | 'sample' | 'policies'>>({});

  const toggleExpand = (tableName: string) => {
    setExpandedTables(prev => ({ ...prev, [tableName]: !prev[tableName] }));
  };

  const filteredTables = tables.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.columns.some(c => c.name.toLowerCase().includes(search.toLowerCase()));
    if (!matchesSearch) return false;

    if (filterRls === 'rls_on') return t.rlsEnabled;
    if (filterRls === 'rls_off') return !t.rlsEnabled;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher une table, colonne ou relation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl text-xs text-zinc-200 placeholder:text-zinc-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400 hidden sm:inline">RLS :</span>
          <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
            <button
              onClick={() => setFilterRls('all')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                filterRls === 'all'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Toutes ({tables.length})
            </button>
            <button
              onClick={() => setFilterRls('rls_on')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                filterRls === 'rls_on'
                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/20'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              RLS Activé
            </button>
            <button
              onClick={() => setFilterRls('rls_off')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                filterRls === 'rls_off'
                  ? 'bg-red-950/60 text-red-400 border border-red-500/20'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              RLS Non Protégé
            </button>
          </div>
        </div>
      </div>

      {/* Tables Grid / List */}
      <div className="space-y-4">
        {filteredTables.map((table) => {
          const isExpanded = !!expandedTables[table.name];
          const subTab = previewDataTab[table.name] || 'columns';

          return (
            <div
              key={table.name}
              className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden transition-all shadow-sm"
            >
              {/* Table Header Bar */}
              <div
                onClick={() => toggleExpand(table.name)}
                className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-zinc-850/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <button className="text-zinc-400 hover:text-white">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-zinc-500" />
                    )}
                  </button>

                  <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-emerald-400">
                    <TableIcon className="w-4 h-4" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-zinc-100 font-mono">
                        {table.name}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        public.{table.name}
                      </span>
                    </div>
                    {table.description && (
                      <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">
                        {table.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Columns & rows count */}
                  <span className="hidden sm:inline-flex items-center gap-1 text-xs text-zinc-400 bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800">
                    <Rows className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{table.columns.length} colonnes</span>
                    {table.rowCount !== undefined && (
                      <>
                        <span className="text-zinc-600">•</span>
                        <span>{table.rowCount} lignes</span>
                      </>
                    )}
                  </span>

                  {/* RLS Status Badge */}
                  {table.rlsEnabled ? (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 text-xs font-medium">
                      <Shield className="w-3 h-3 text-emerald-400" />
                      <span>RLS Actif</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-950/40 text-amber-400 border border-amber-500/20 text-xs font-medium">
                      <ShieldAlert className="w-3 h-3 text-amber-400" />
                      <span>RLS Inactif</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Table Expanded Body */}
              {isExpanded && (
                <div className="border-t border-zinc-800/80 bg-zinc-950/40">
                  {/* Subtabs for Table (Columns / Sample data / Policies) */}
                  <div className="flex border-b border-zinc-800/60 px-5 pt-2 text-xs gap-4">
                    <button
                      onClick={() => setPreviewDataTab(prev => ({ ...prev, [table.name]: 'columns' }))}
                      className={`pb-2.5 font-medium border-b-2 transition-colors ${
                        subTab === 'columns'
                          ? 'border-emerald-400 text-emerald-400'
                          : 'border-transparent text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Structure des colonnes ({table.columns.length})
                    </button>

                    {table.sampleRows && table.sampleRows.length > 0 && (
                      <button
                        onClick={() => setPreviewDataTab(prev => ({ ...prev, [table.name]: 'sample' }))}
                        className={`pb-2.5 font-medium border-b-2 transition-colors ${
                          subTab === 'sample'
                            ? 'border-emerald-400 text-emerald-400'
                            : 'border-transparent text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        Données en direct ({table.sampleRows.length} aperçus)
                      </button>
                    )}

                    {table.policies && table.policies.length > 0 && (
                      <button
                        onClick={() => setPreviewDataTab(prev => ({ ...prev, [table.name]: 'policies' }))}
                        className={`pb-2.5 font-medium border-b-2 transition-colors ${
                          subTab === 'policies'
                            ? 'border-emerald-400 text-emerald-400'
                            : 'border-transparent text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        Politiques RLS ({table.policies.length})
                      </button>
                    )}
                  </div>

                  {/* SUBTAB 1: Columns list */}
                  {subTab === 'columns' && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-zinc-800 text-zinc-400 bg-zinc-950/70">
                            <th className="py-2.5 px-5 font-medium">Nom de colonne</th>
                            <th className="py-2.5 px-4 font-medium">Type PostgreSQL</th>
                            <th className="py-2.5 px-4 font-medium">Nullabilité</th>
                            <th className="py-2.5 px-4 font-medium">Valeur par défaut</th>
                            <th className="py-2.5 px-4 font-medium">Relation (FK)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60 font-mono">
                          {table.columns.map((col) => (
                            <tr key={col.name} className="hover:bg-zinc-850/40">
                              <td className="py-2.5 px-5 flex items-center gap-2 text-zinc-200">
                                {col.isPrimary && (
                                  <span title="Clé primaire (Primary Key)">
                                    <Key className="w-3.5 h-3.5 text-amber-400" />
                                  </span>
                                )}
                                <span className={col.isPrimary ? 'font-bold text-amber-200' : ''}>
                                  {col.name}
                                </span>
                              </td>

                              <td className="py-2.5 px-4">
                                <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${getTypeColor(col.type)}`}>
                                  {col.type}
                                </span>
                              </td>

                              <td className="py-2.5 px-4">
                                {col.isNullable ? (
                                  <span className="text-zinc-500">NULL</span>
                                ) : (
                                  <span className="text-emerald-400 font-semibold">NOT NULL</span>
                                )}
                              </td>

                              <td className="py-2.5 px-4 text-zinc-400 truncate max-w-[200px]">
                                {col.defaultValue || <span className="text-zinc-600">—</span>}
                              </td>

                              <td className="py-2.5 px-4">
                                {col.foreignKey ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 text-teal-300 border border-teal-500/20 text-[11px]">
                                    <Link className="w-3 h-3 text-teal-400" />
                                    <span>&rarr; {col.foreignKey.targetTable}.{col.foreignKey.targetColumn}</span>
                                  </span>
                                ) : (
                                  <span className="text-zinc-600">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* SUBTAB 2: Sample Rows */}
                  {subTab === 'sample' && table.sampleRows && (
                    <div className="p-4 overflow-x-auto">
                      <table className="w-full text-left text-xs border border-zinc-800 rounded-lg overflow-hidden">
                        <thead className="bg-zinc-900 text-zinc-400 font-mono">
                          <tr>
                            {Object.keys(table.sampleRows[0] || {}).map((k) => (
                              <th key={k} className="p-2 border-b border-zinc-800">{k}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/80 font-mono text-[11px] text-zinc-300">
                          {table.sampleRows.map((row, idx) => (
                            <tr key={idx} className="hover:bg-zinc-800/40">
                              {Object.values(row).map((val: any, vIdx) => (
                                <td key={vIdx} className="p-2 max-w-[240px] truncate">
                                  {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* SUBTAB 3: Policies */}
                  {subTab === 'policies' && table.policies && (
                    <div className="p-4 space-y-3">
                      {table.policies.map((p, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-zinc-200">{p.name}</span>
                            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono text-[10px]">
                              {p.command}
                            </span>
                          </div>
                          {p.definition && (
                            <pre className="font-mono text-[11px] text-zinc-400 bg-zinc-950 p-2 rounded mt-1.5 overflow-x-auto">
                              USING: {p.definition}
                            </pre>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filteredTables.length === 0 && (
          <div className="text-center py-12 bg-zinc-900/40 border border-zinc-800/60 rounded-2xl">
            <p className="text-zinc-400 text-sm">Aucune table ne correspond à vos filtres.</p>
          </div>
        )}
      </div>

      {/* Views section if present */}
      {views.length > 0 && (
        <div className="pt-6">
          <h3 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Vues SQL Détectées ({views.length})</span>
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {views.map((v) => (
              <div key={v.name} className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
                <span className="font-mono font-semibold text-zinc-200">{v.name}</span>
                <p className="text-zinc-400 text-[11px] mt-1">
                  {v.columns.length} colonnes projetées
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

function getTypeColor(type: string): string {
  const t = type.toLowerCase();
  if (t === 'uuid') return 'bg-purple-950/60 text-purple-300 border border-purple-800/40';
  if (t.includes('int') || t === 'serial' || t === 'bigint') return 'bg-blue-950/60 text-blue-300 border border-blue-800/40';
  if (t === 'boolean' || t === 'bool') return 'bg-amber-950/60 text-amber-300 border border-amber-800/40';
  if (t.includes('timestamp') || t.includes('date')) return 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40';
  if (t.includes('json')) return 'bg-orange-950/60 text-orange-300 border border-orange-800/40';
  if (t.includes('vector')) return 'bg-pink-950/60 text-pink-300 border border-pink-800/40';
  return 'bg-zinc-800 text-zinc-300';
}
