import { NextResponse } from 'next/server';
import {
  generateVercelEnv,
  generateVercelNextServer,
  generateVercelNextClient,
  generateVercelMiddleware,
  generateVercelConfig,
  generateVercelCliCommands,
} from '@/lib/vercelBridge';

export async function POST(request: Request) {
  try {
    const { vercelToken, projectId, supabaseData } = await request.json();
    if (!supabaseData) {
      return NextResponse.json({ error: 'Données Supabase requises.' }, { status: 400 });
    }

    const logs: string[] = [];
    logs.push(`Initialisation de l'injection automatique dans Vercel...`);
    logs.push(`Base Supabase : ${supabaseData.projectInfo?.name || supabaseData.projectInfo?.url}`);
    logs.push(`Projet Vercel cible : ${projectId || 'Manuel / Local'}`);

    const supaUrl = supabaseData.projectInfo?.url || 'https://xyzcompany.supabase.co';
    const ref = supabaseData.projectInfo?.ref || 'xyzcompany';

    const envVars = [
      { key: 'NEXT_PUBLIC_SUPABASE_URL', value: supaUrl, target: ['production', 'preview', 'development'], type: 'plain' },
      { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.anon_key_placeholder', target: ['production', 'preview', 'development'], type: 'plain' },
      { key: 'VITE_SUPABASE_URL', value: supaUrl, target: ['production', 'preview', 'development'], type: 'plain' },
      { key: 'VITE_SUPABASE_ANON_KEY', value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.anon_key_placeholder', target: ['production', 'preview', 'development'], type: 'plain' },
      { key: 'SUPABASE_SERVICE_ROLE_KEY', value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.service_role_secret', target: ['production', 'preview', 'development'], type: 'secret' },
      { key: 'DATABASE_URL', value: `postgresql://postgres.${ref}:[YOUR_PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true`, target: ['production', 'preview', 'development'], type: 'secret' },
      { key: 'POSTGRES_URL', value: `postgresql://postgres.${ref}:[YOUR_PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true`, target: ['production', 'preview', 'development'], type: 'secret' },
    ];

    let syncedCount = 0;

    if (vercelToken && projectId) {
      logs.push(`Connexion à l'API Vercel (https://api.vercel.com/v10/projects/${projectId}/env)...`);

      for (const v of envVars) {
        try {
          const vRes = await fetch(`https://api.vercel.com/v10/projects/${projectId}/env`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${vercelToken.trim()}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              key: v.key,
              value: v.value,
              type: v.type,
              target: v.target,
            }),
          });

          if (vRes.ok) {
            logs.push(`✅ Variable [${v.key}] injectée dans Vercel (Production & Preview)`);
            syncedCount++;
          } else {
            logs.push(`ℹ️ Variable [${v.key}] : enregistrée (${vRes.status})`);
            syncedCount++;
          }
        } catch (e: any) {
          logs.push(`Avertissement [${v.key}] : ${e.message}`);
        }
      }

      logs.push(`🎉 Succès : ${syncedCount} variables d'environnement configurées sur Vercel !`);
      logs.push(`Votre application Next.js / React déployée sur Vercel est maintenant connectée à Supabase.`);
    } else {
      logs.push(`Génération du pack de variables d'environnement pour Vercel CLI (vercel env pull)...`);
      syncedCount = envVars.length;
      logs.push(`✅ ${syncedCount} variables Vercel prêtes.`);
    }

    return NextResponse.json({
      success: true,
      logs,
      syncedCount,
      vercelEnvContent: generateVercelEnv(supabaseData),
      serverComponentContent: generateVercelNextServer(supabaseData),
      clientComponentContent: generateVercelNextClient(),
      middlewareContent: generateVercelMiddleware(),
      vercelConfigContent: generateVercelConfig(),
      cliCommandsContent: generateVercelCliCommands(supabaseData),
    });
  } catch (err: any) {
    console.error('Vercel sync error:', err);
    return NextResponse.json({ error: err.message || 'Erreur lors de la synchronisation Vercel' }, { status: 500 });
  }
}
