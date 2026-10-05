'use client';

import React, { useState } from 'react';
import {
  GitFork,
  Key,
  Link as LinkIcon,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { Relationship, TableSchema } from '@/types/supabase';

interface VisualERDProps {
  tables: TableSchema[];
  relationships: Relationship[];
}

export const VisualERD: React.FC<VisualERDProps> = ({ tables, relationships }) => {
  const [selectedTable, setSelectedTable] = useState<string | null>(tables[0]?.name || null);
  const [zoom, setZoom] = useState<number>(1);

  return (
    <div className="space-y-4">
      {/* Control bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800 text-xs">
        <div className="flex items-center gap-2">
          <GitFork className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-zinc-200">
            Diagramme Entités-Relations (ERD)
          </span>
          <span className="text-zinc-500">
            ({tables.length} tables • {relationships.length} relations)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedTable(null)}
            className={`px-3 py-1 rounded-lg transition-colors ${
              selectedTable === null
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Vue d'ensemble
          </button>

          <div className="flex items-center bg-zinc-950 rounded-lg border border-zinc-800 p-0.5">
            <button
              onClick={() => setZoom(Math.max(0.7, zoom - 0.1))}
              className="p-1 text-zinc-400 hover:text-white rounded"
              title="Dézoomer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono text-[11px] text-zinc-400">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(Math.min(1.3, zoom + 0.1))}
              className="p-1 text-zinc-400 hover:text-white rounded"
              title="Zoomer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Relationships Overview Pill Bar */}
      {relationships.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-zinc-950/60 rounded-xl border border-zinc-850 text-[11px] font-mono">
          <span className="text-zinc-400 font-sans font-medium self-center mr-1">
            Jointures actives :
          </span>
          {relationships.map((rel) => {
            const isHighlighted = selectedTable && (rel.sourceTable === selectedTable || rel.targetTable === selectedTable);
            return (
              <div
                key={rel.id}
                onClick={() => setSelectedTable(rel.sourceTable)}
                className={`px-2.5 py-1 rounded-lg border cursor-pointer transition-all flex items-center gap-1.5 ${
                  isHighlighted
                    ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <LinkIcon className="w-3 h-3 text-emerald-400" />
                <span className="font-semibold text-zinc-200">{rel.sourceTable}</span>
                <span className="text-zinc-500">.{rel.sourceColumn} &rarr;</span>
                <span className="font-semibold text-emerald-400">{rel.targetTable}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Interactive Visual Canvas */}
      <div className="relative overflow-auto p-6 bg-zinc-950/90 border border-zinc-800 rounded-2xl min-h-[460px] shadow-inner">
        {/* Subtle grid pattern background */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, #34d399 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        <div
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-transform duration-150"
        >
          {tables.map((table) => {
            const isSelected = selectedTable === table.name;
            const outbound = relationships.filter((r) => r.sourceTable === table.name);
            const inbound = relationships.filter((r) => r.targetTable === table.name);
            const isConnected = isSelected || outbound.some(r => r.targetTable === selectedTable) || inbound.some(r => r.sourceTable === selectedTable);

            return (
              <div
                key={table.name}
                onClick={() => setSelectedTable(table.name)}
                className={`rounded-2xl border transition-all cursor-pointer backdrop-blur-sm overflow-hidden flex flex-col ${
                  isSelected
                    ? 'bg-zinc-900 border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/10'
                    : isConnected && selectedTable !== null
                    ? 'bg-zinc-900/90 border-teal-500/40'
                    : 'bg-zinc-900/70 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {/* Node Title */}
                <div
                  className={`px-4 py-3 flex items-center justify-between border-b ${
                    isSelected
                      ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs">{table.name}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-mono">
                    {table.columns.length} cols
                  </span>
                </div>

                {/* Node Columns */}
                <div className="p-3 divide-y divide-zinc-800/40 text-xs font-mono space-y-1">
                  {table.columns.map((col) => (
                    <div
                      key={col.name}
                      className="pt-1 first:pt-0 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        {col.isPrimary ? (
                          <Key className="w-3 h-3 text-amber-400 shrink-0" />
                        ) : col.foreignKey ? (
                          <LinkIcon className="w-3 h-3 text-teal-400 shrink-0" />
                        ) : (
                          <span className="w-3 h-3 text-zinc-600 shrink-0 text-center">•</span>
                        )}
                        <span
                          className={`truncate ${
                            col.isPrimary
                              ? 'font-bold text-amber-200'
                              : col.foreignKey
                              ? 'text-teal-200'
                              : 'text-zinc-300'
                          }`}
                        >
                          {col.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[10px] text-zinc-500">{col.type}</span>
                        {col.foreignKey && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-teal-950 text-teal-300 border border-teal-800/50">
                            FK
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Node Footer with Relations */}
                {(outbound.length > 0 || inbound.length > 0) && (
                  <div className="mt-auto px-3 py-2 bg-zinc-950/50 border-t border-zinc-800/50 text-[10px] text-zinc-400 flex items-center justify-between">
                    <span>
                      {outbound.length > 0 && `Dépend de: ${outbound.map(o => o.targetTable).join(', ')}`}
                    </span>
                    <span>
                      {inbound.length > 0 && `Lié par: ${inbound.length}`}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
