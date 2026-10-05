'use client';

import React from 'react';
import {
  BookOpen,
  Key,
  Shield,
  Layers,
  Terminal,
  Zap,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';

export const DocumentationGuide: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Intro */}
      <div className="p-6 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-2">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-semibold text-zinc-100">
            Guide d'Intégration & Configuration Automatique Supabase
          </h3>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          SupaSync se connecte directement à votre projet Supabase pour introspecter l'intégralité de vos tables, relations, clés primaires, contraintes de clés étrangères et politiques RLS, puis génère automatiquement les schémas d'ORM et scripts de déploiement prêts pour la production.
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {/* Step 1 */}
        <div className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold text-xs border border-emerald-500/30">
              1
            </span>
            <h4 className="text-sm font-semibold text-zinc-200">
              Récupérer vos identifiants dans Supabase
            </h4>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed pl-10">
            Connectez-vous à votre tableau de bord <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-emerald-400 underline inline-flex items-center gap-0.5">Supabase Dashboard <ExternalLink className="w-3 h-3" /></a>, sélectionnez votre projet, puis allez dans :
          </p>
          <ul className="text-xs text-zinc-400 space-y-1.5 pl-14 list-disc">
            <li>
              <strong className="text-zinc-200">Project Settings &gt; API :</strong> Copiez votre <code className="text-emerald-300">Project URL</code> (<code className="text-zinc-400 font-mono">https://xyz.supabase.co</code>) et la clé <code className="text-emerald-300">anon public</code>.
            </li>
            <li>
              <strong className="text-zinc-200">Project Settings &gt; Database :</strong> Retrouvez les URLs de connexion PostgreSQL (Direct sur le port 5432 ou Pooler Transaction sur le port 6543).
            </li>
            <li>
              <strong className="text-zinc-200">Account &gt; Access Tokens :</strong> Créez un jeton personnel <code className="text-emerald-300">sbp_...</code> si vous souhaitez que SupaSync liste et configure vos projets en 1 seul clic.
            </li>
          </ul>
        </div>

        {/* Step 2 */}
        <div className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold text-xs border border-emerald-500/30">
              2
            </span>
            <h4 className="text-sm font-semibold text-zinc-200">
              Utiliser le schéma généré avec Drizzle ORM
            </h4>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed pl-10">
            Drizzle est un ORM TypeScript ultra-rapide et léger. Installez les packages suivants dans votre projet :
          </p>
          <pre className="ml-10 p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-300 overflow-x-auto">
            npm install drizzle-orm postgres dotenv{'\n'}npm install -D drizzle-kit @types/node
          </pre>
          <p className="text-xs text-zinc-400 pl-10">
            Copiez le code de l'onglet <strong className="text-zinc-200">Drizzle ORM</strong> dans <code className="text-emerald-300">src/db/schema.ts</code>. Vous bénéficiez immédiatement de requêtes typées, d'autocomplétion complète et de jointures relationnelles sans faille.
          </p>
        </div>

        {/* Step 3 */}
        <div className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold text-xs border border-emerald-500/30">
              3
            </span>
            <h4 className="text-sm font-semibold text-zinc-200">
              Sécuriser vos tables avec Row Level Security (RLS)
            </h4>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed pl-10">
            Par défaut sur Supabase, les requêtes envoyées depuis le navigateur via la clé anon sont filtrées par les politiques RLS. Consultez l'onglet <strong className="text-zinc-200">Audit Sécurité & RLS</strong> pour vérifier les tables exposées sans politique et appliquez les règles recommandées via le script SQL généré.
          </p>
        </div>

        {/* Step 4 */}
        <div className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold text-xs border border-emerald-500/30">
              4
            </span>
            <h4 className="text-sm font-semibold text-zinc-200">
              Export Global en Pack ZIP
            </h4>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed pl-10">
            Cliquez sur <strong className="text-emerald-400">"Exporter ZIP"</strong> dans la barre supérieure pour télécharger l'ensemble de votre configuration prête à être glissée dans votre projet (fichiers de schéma Drizzle, Prisma, types TypeScript, migrations SQL et fichier .env).
          </p>
        </div>
      </div>
    </div>
  );
};
