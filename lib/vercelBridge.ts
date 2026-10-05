import { DatabaseIntrospectionResult } from '@/types/supabase';

function capitalizeName(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

/**
 * Generate complete Vercel Environment Variables formatted for Vercel Project Settings & .env.production
 */
export function generateVercelEnv(
  result: DatabaseIntrospectionResult,
  realAnonKey?: string,
  realServiceKey?: string
): string {
  const url = result.projectInfo.url || 'https://xyzcompany.supabase.co';
  const ref = result.projectInfo.ref || 'xyzcompany';
  const anonKey = realAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.anon_key_placeholder';
  const serviceKey = realServiceKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.service_role_secret';

  return `# ========================================================
# Variables d'Environnement Vercel + Supabase (RÉELLES)
# Auto-généré par SupaSync pour déploiement sur Vercel
# Compatible Vercel CLI (vercel env pull / vercel env add)
# ========================================================

# Identifiants Supabase publics réels (exposés au navigateur côté client Vercel)
NEXT_PUBLIC_SUPABASE_URL="${url}"
NEXT_PUBLIC_SUPABASE_ANON_KEY="${anonKey}"

# Identifiant Vercel pour Vite / Create-React-App si déployé sur Vercel
VITE_SUPABASE_URL="${url}"
VITE_SUPABASE_ANON_KEY="${anonKey}"

# Clé secrète d'administration réelle (Vercel Serverless / Edge Functions uniquement - JAMAIS côté client)
SUPABASE_SERVICE_ROLE_KEY="${serviceKey}"

# Connexions PostgreSQL standard Vercel Storage / Postgres Integration
# Port 6543 (Pooler transactionnel PgBouncer pour Vercel Serverless Functions)
POSTGRES_URL="postgresql://postgres.${ref}:[VOTRE_MOT_DE_PASSE]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
POSTGRES_PRISMA_URL="postgresql://postgres.${ref}:[VOTRE_MOT_DE_PASSE]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connect_timeout=15"

# Port 5432 (Session directe non poolée pour migrations DDL)
POSTGRES_URL_NON_POOLING="postgresql://postgres.${ref}:[VOTRE_MOT_DE_PASSE]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"

# Variables standard ORM
DATABASE_URL="postgresql://postgres.${ref}:[VOTRE_MOT_DE_PASSE]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.${ref}:[VOTRE_MOT_DE_PASSE]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"
`;
}

/**
 * Generate Real Data JSON dump extracted from Supabase for Vercel
 */
export function generateVercelRealDataJson(
  result: DatabaseIntrospectionResult,
  realDataMap?: Record<string, any[]>
): string {
  const exportPayload: Record<string, any> = {
    metadata: {
      source: 'Supabase Real Database Extraction',
      projectUrl: result.projectInfo.url,
      extractedAt: new Date().toISOString(),
      totalTables: result.tables.length,
      tables: result.tables.map((t) => ({
        name: t.name,
        rowCount: realDataMap?.[t.name]?.length ?? t.sampleRows?.length ?? 0,
      })),
    },
    tables: {},
  };

  result.tables.forEach((table) => {
    exportPayload.tables[table.name] = realDataMap?.[table.name] || table.sampleRows || [];
  });

  return JSON.stringify(exportPayload, null, 2);
}

/**
 * Generate Real SQL Data Dump (INSERT INTO ...) with actual extracted rows
 */
export function generateVercelRealDataSql(
  result: DatabaseIntrospectionResult,
  realDataMap?: Record<string, any[]>
): string {
  let sql = `-- ========================================================\n`;
  sql += `-- VRAIES DONNÉES SUPABASE POUR VERCEL\n`;
  sql += `-- Projet: ${result.projectInfo.url}\n`;
  sql += `-- Extraction du: ${new Date().toISOString()}\n`;
  sql += `-- ========================================================\n\n`;

  result.tables.forEach((table) => {
    const rows = realDataMap?.[table.name] || table.sampleRows || [];
    if (rows.length > 0) {
      sql += `-- Données réelles pour la table "${table.name}" (${rows.length} lignes)\n`;
      rows.forEach((row) => {
        const keys = Object.keys(row);
        const values = keys.map((k) => {
          const v = row[k];
          if (v === null || v === undefined) return 'NULL';
          if (typeof v === 'boolean') return v ? 'true' : 'false';
          if (typeof v === 'number') return v;
          if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
          return `'${String(v).replace(/'/g, "''")}'`;
        });
        sql += `INSERT INTO public.${table.name} (${keys.join(', ')}) VALUES (${values.join(', ')}) ON CONFLICT DO NOTHING;\n`;
      });
      sql += `\n`;
    }
  });

  return sql;
}

/**
 * Generate Next.js Server Page that displays real extracted data
 */
export function generateVercelNextRealPage(result: DatabaseIntrospectionResult, tableName?: string): string {
  const table = tableName || result.tables[0]?.name || 'items';

  return `// app/${table}/page.tsx
// Page Next.js Server Component affichant les données réelles Supabase sur Vercel
import { createClient } from '@/utils/supabase/server';
import { Suspense } from 'react';

export const revalidate = 60; // Revalidation ISR toutes les 60 secondes sur Vercel

export default async function ${capitalizeName(table)}Page() {
  const supabase = await createClient();
  const { data: rows, error, count } = await supabase
    .from('${table}')
    .select('*', { count: 'exact' })
    .limit(50);

  if (error) {
    return (
      <div className="p-8 text-red-500">
        Erreur de chargement des données : {error.message}
      </div>
    );
  }

  return (
    <main className="max-w-6xl mx-auto p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-mono">${table}</h1>
          <p className="text-sm text-gray-500">
            {count ?? rows?.length} enregistrements réels extraits de Supabase
          </p>
        </div>
      </div>

      <div className="overflow-x-auto border rounded-xl shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {rows && rows[0] && Object.keys(rows[0]).map((key) => (
                <th key={key} className="px-4 py-3 text-left font-medium text-gray-700">
                  {key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rows && rows.map((row: any, i: number) => (
              <tr key={i} className="hover:bg-gray-50">
                {Object.values(row).map((val: any, j: number) => (
                  <td key={j} className="px-4 py-3 text-gray-900 truncate max-w-xs">
                    {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
`;
}

/**
 * Generate Next.js Server Components Supabase client for Vercel
 */
export function generateVercelNextServer(result: DatabaseIntrospectionResult): string {
  return `// utils/supabase/server.ts
// Client Supabase pour Next.js App Router (Server Components & Server Actions sur Vercel)
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database.types';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Le cookie ne peut pas être modifié depuis un Server Component pur (uniquement Server Actions)
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {}
        },
      },
    }
  );
}
`;
}

/**
 * Generate Next.js Client Components Supabase client for Vercel
 */
export function generateVercelNextClient(): string {
  return `// utils/supabase/client.ts
// Client Supabase pour Next.js App Router (Client Components 'use client' sur Vercel)
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database.types';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
`;
}

/**
 * Generate Vercel Edge Middleware for Next.js authentication & session refresh
 */
export function generateVercelMiddleware(): string {
  return `// middleware.ts
// Middleware Vercel Edge pour rafraîchir automatiquement les sessions Supabase
import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Rafraîchir la session sans bloquer
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
`;
}

/**
 * Generate a Vercel Serverless API Route (App Router) for an extracted table
 */
export function generateVercelApiRoute(result: DatabaseIntrospectionResult, tableName?: string): string {
  const targetTable = tableName || result.tables[0]?.name || 'items';

  return `// app/api/${targetTable}/route.ts
// Vercel Serverless Route Handler optimisé pour Supabase
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const runtime = 'nodejs'; // ou 'edge' pour exécution Vercel Edge

// GET /api/${targetTable}
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 100);

    const { data, error, count } = await supabase
      .from('${targetTable}')
      .select('*', { count: 'exact' })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      data,
      count,
      status: 'success',
      extractedFrom: 'Supabase via Vercel Serverless',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

// POST /api/${targetTable}
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { data, error } = await supabase
      .from('${targetTable}')
      .insert(body)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data, status: 'created' }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
`;
}

/**
 * Generate vercel.json configuration file
 */
export function generateVercelConfig(): string {
  return `{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs",
  "buildCommand": "next build",
  "regions": ["cdg1", "fra1"],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Credentials", "value": "true" },
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
        { "key": "Access-Control-Allow-Headers", "value": "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization" }
      ]
    }
  ]
}
`;
}

/**
 * Generate Vercel CLI Commands to add environment variables
 */
export function generateVercelCliCommands(result: DatabaseIntrospectionResult): string {
  const url = result.projectInfo.url || 'https://xyzcompany.supabase.co';

  return `#!/bin/bash
# ========================================================
# Script d'injection automatique Vercel CLI
# Exécutez ce script pour configurer toutes les variables
# ========================================================

echo "⚡ Injection des variables Supabase dans Vercel..."

vercel env add NEXT_PUBLIC_SUPABASE_URL production <<< "${url}"
vercel env add NEXT_PUBLIC_SUPABASE_URL preview <<< "${url}"
vercel env add NEXT_PUBLIC_SUPABASE_URL development <<< "${url}"

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production <<< "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.anon_key_placeholder"
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview <<< "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.anon_key_placeholder"
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY development <<< "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.anon_key_placeholder"

echo "✅ Variables Supabase injectées dans le projet Vercel !"
echo "🚀 Déployez avec : vercel --prod"
`;
}
