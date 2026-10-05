import { DatabaseIntrospectionResult } from '@/types/supabase';

export interface PasswordProtectionConfig {
  password: string;
  rememberDays: number;
  protectVercel: boolean;
  protectSupabase: boolean;
}

/**
 * Generate Next.js Edge Middleware for Vercel with Password Protection
 */
export function generateVercelPasswordMiddleware(password: string): string {
  return `// middleware.ts
// Middleware Vercel Edge avec protection par mot de passe
import { NextResponse, type NextRequest } from 'next/server';

const APP_PASSWORD = process.env.APP_PASSWORD || "${password}";

export function middleware(request: NextRequest) {
  // Chemins publics exemptés de mot de passe
  const publicPaths = ['/login', '/api/auth/login', '/_next', '/favicon.ico'];
  const pathname = request.nextUrl.pathname;

  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Vérification du cookie de session d'accès
  const authCookie = request.cookies.get('app_auth_session')?.value;
  if (authCookie === APP_PASSWORD) {
    return NextResponse.next();
  }

  // Vérification de l'en-tête Basic Auth (optionnel pour requêtes API Vercel)
  const basicAuth = request.headers.get('authorization');
  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    if (authValue) {
      const [user, pwd] = atob(authValue).split(':');
      if (pwd === APP_PASSWORD || user === APP_PASSWORD) {
        return NextResponse.next();
      }
    }
  }

  // Redirection vers la page de verrouillage avec mot de passe
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('from', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
`;
}

/**
 * Generate Next.js Password Login Page for Vercel (app/login/page.tsx)
 */
export function generateVercelLoginPage(): string {
  return `// app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        const from = searchParams.get('from') || '/';
        router.push(from);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md p-8 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
            🔒
          </div>
          <h1 className="text-xl font-bold">Application Protégée</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Veuillez saisir le mot de passe pour accéder à l'application.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm focus:border-white outline-none"
              required
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 text-center">
              Mot de passe incorrect. Réessayez.
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-white text-black font-bold text-xs rounded-xl hover:bg-zinc-200 transition-colors"
          >
            {loading ? 'Vérification...' : 'Déverrouiller'}
          </button>
        </form>
      </div>
    </div>
  );
}
`;
}

/**
 * Generate Next.js API Route for Login Cookie (app/api/auth/login/route.ts)
 */
export function generateVercelLoginApiRoute(): string {
  return `// app/api/auth/login/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const APP_PASSWORD = process.env.APP_PASSWORD;

    if (!APP_PASSWORD || password === APP_PASSWORD) {
      const response = NextResponse.json({ success: true });
      response.cookies.set('app_auth_session', password, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 jours
        path: '/',
      });
      return response;
    }

    return NextResponse.json({ error: 'Mot de passe invalide' }, { status: 401 });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
`;
}

/**
 * Generate Supabase SQL Script for Password Protection & Vault
 */
export function generateSupabasePasswordProtectionSql(
  password: string,
  result?: DatabaseIntrospectionResult
): string {
  return `-- ========================================================
-- PROTECTION DE LA BASE SUPABASE PAR MOT DE PASSE ET RLS
-- Généré le: ${new Date().toISOString()}
-- ========================================================

-- 1. Extension cryptographique pour hashage sécurisé (bcrypt)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Création de la table de coffre-fort d'authentification
CREATE TABLE IF NOT EXISTS public.app_security_vault (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_hash text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activation de RLS sur la table de sécurité
ALTER TABLE public.app_security_vault ENABLE ROW LEVEL SECURITY;

-- Seul le service_role peut accéder directement à la table de sécurité
DROP POLICY IF EXISTS "security_vault_admin_only" ON public.app_security_vault;
CREATE POLICY "security_vault_admin_only" ON public.app_security_vault
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- 3. Insertion / Mise à jour du mot de passe maître hashé
DELETE FROM public.app_security_vault;
INSERT INTO public.app_security_vault (master_hash)
VALUES (crypt('${password.replace(/'/g, "''")}', gen_salt('bf', 10)));

-- 4. Fonction PostgreSQL sécurisée pour valider le mot de passe
CREATE OR REPLACE FUNCTION public.verify_app_master_password(candidate text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stored_hash text;
BEGIN
  SELECT master_hash INTO stored_hash FROM public.app_security_vault LIMIT 1;
  IF stored_hash IS NULL THEN
    RETURN false;
  END IF;
  RETURN stored_hash = crypt(candidate, stored_hash);
END;
$$;

-- Rendre la fonction exécutable par anon et authenticated
GRANT EXECUTE ON FUNCTION public.verify_app_master_password(text) TO anon, authenticated;

-- 5. Sécurisation des tables existantes avec RLS renforcé
${
  result?.tables
    ? result.tables
        .map(
          (t) => `ALTER TABLE IF EXISTS public.${t.name} ENABLE ROW LEVEL SECURITY;`
        )
        .join('\n')
    : ''
}

SELECT '✅ Protection par mot de passe Supabase activée avec succès !' as status;
`;
}
