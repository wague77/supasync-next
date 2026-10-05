import { NextResponse } from 'next/server';
import {
  generateSupabasePasswordProtectionSql,
  generateVercelPasswordMiddleware,
  generateVercelLoginPage,
  generateVercelLoginApiRoute,
} from '@/lib/passwordProtectionService';

export async function POST(request: Request) {
  try {
    const { password, vercelToken, vercelProjectId, supabaseData } = await request.json();
    if (!password) {
      return NextResponse.json({ error: 'Mot de passe requis pour sécuriser l\'application.' }, { status: 400 });
    }

    const logs: string[] = [];
    logs.push(`Initialisation de la protection par mot de passe...`);

    // 1. Supabase Vault & Password Hashing SQL
    logs.push(`Génération du coffre-fort de sécurité et script bcrypt pour Supabase...`);
    const supabaseSql = generateSupabasePasswordProtectionSql(password, supabaseData);
    logs.push(`✅ Script Supabase généré avec hachage bcrypt (Blowfish) et fonction verify_app_master_password().`);

    // 2. Vercel Password Injection
    let vercelPushed = false;
    if (vercelToken && vercelProjectId) {
      logs.push(`Injection du mot de passe dans les variables d'environnement Vercel (${vercelProjectId})...`);
      try {
        const vRes = await fetch(`https://api.vercel.com/v10/projects/${vercelProjectId}/env`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${vercelToken.trim()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            key: 'APP_PASSWORD',
            value: password,
            type: 'secret',
            target: ['production', 'preview', 'development'],
          }),
        });

        if (vRes.ok || vRes.status === 409) {
          vercelPushed = true;
          logs.push(`✅ Variable [APP_PASSWORD] injectée avec succès dans Vercel !`);
        } else {
          logs.push(`ℹ️ Vercel : statut ${vRes.status}.`);
        }
      } catch (vErr: any) {
        logs.push(`Avertissement Vercel API : ${vErr.message}`);
      }
    }

    logs.push(`Génération du middleware Edge et page de connexion pour Vercel...`);
    const vercelMiddleware = generateVercelPasswordMiddleware(password);
    const vercelLoginPage = generateVercelLoginPage();
    const vercelLoginApi = generateVercelLoginApiRoute();
    logs.push(`✅ Fichiers de protection Vercel générés (middleware.ts, app/login/page.tsx).`);

    logs.push(`🎉 Protection par mot de passe configurée et prête pour Supabase & Vercel !`);

    return NextResponse.json({
      success: true,
      logs,
      vercelPushed,
      supabaseSql,
      vercelMiddleware,
      vercelLoginPage,
      vercelLoginApi,
    });
  } catch (err: any) {
    console.error('Password push error:', err);
    return NextResponse.json({ error: err.message || 'Erreur lors de la protection par mot de passe' }, { status: 500 });
  }
}
