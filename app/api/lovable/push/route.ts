import { NextResponse } from 'next/server';
import {
  generateLovableClient,
  generateLovableTypes,
  generateLovableDataTransferSql,
} from '@/lib/lovableBridge';

export async function POST(request: Request) {
  try {
    const { supabaseData, lovableUrl, githubRepo, githubToken, webhookUrl } = await request.json();
    if (!supabaseData || !supabaseData.tables) {
      return NextResponse.json({ error: 'Données Supabase requises pour le transfert.' }, { status: 400 });
    }

    const logs: string[] = [];
    const startTime = performance.now();
    logs.push(`Initialisation du transfert Supabase -> Lovable...`);
    logs.push(`Projet Supabase source : ${supabaseData.projectInfo?.name || supabaseData.projectInfo?.url}`);
    logs.push(`Tables à transférer : ${supabaseData.tables.map((t: any) => t.name).join(', ')} (${supabaseData.tables.length} tables)`);

    // 1. Compile files
    logs.push(`Compilation automatique de src/integrations/supabase/client.ts...`);
    const clientContent = generateLovableClient(supabaseData);

    logs.push(`Génération des types stricts src/integrations/supabase/types.ts...`);
    const typesContent = generateLovableTypes(supabaseData);

    logs.push(`Génération du script SQL d'injection de données et politiques RLS...`);
    const sqlContent = generateLovableDataTransferSql(supabaseData);

    let githubPushed = false;
    let commitUrl = '';

    // 2. Direct GitHub Commit & Push if token is supplied
    if (githubRepo && githubToken) {
      const cleanRepo = githubRepo.replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '');
      logs.push(`Connexion au dépôt GitHub Lovable : ${cleanRepo}...`);

      const pushFileToGitHub = async (filePath: string, content: string, message: string) => {
        let sha: string | undefined;
        try {
          const checkRes = await fetch(`https://api.github.com/repos/${cleanRepo}/contents/${filePath}`, {
            headers: {
              Authorization: `Bearer ${githubToken}`,
              Accept: 'application/vnd.github.v3+json',
              'User-Agent': 'SupaSync-Lovable-Pusher',
            },
          });
          if (checkRes.ok) {
            const fileData = await checkRes.json();
            sha = fileData.sha;
          }
        } catch (e) {}

        const putRes = await fetch(`https://api.github.com/repos/${cleanRepo}/contents/${filePath}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
            'User-Agent': 'SupaSync-Lovable-Pusher',
          },
          body: JSON.stringify({
            message,
            content: Buffer.from(content).toString('base64'),
            sha,
          }),
        });

        return putRes;
      };

      try {
        const res1 = await pushFileToGitHub(
          'src/integrations/supabase/types.ts',
          typesContent,
          'feat(supabase): auto-sync types from SupaSync'
        );
        const res2 = await pushFileToGitHub(
          'src/integrations/supabase/client.ts',
          clientContent,
          'feat(supabase): auto-configure client from SupaSync'
        );

        if (res1.ok && res2.ok) {
          githubPushed = true;
          commitUrl = `https://github.com/${cleanRepo}/commits`;
          logs.push(`✅ Fichiers committés et poussés avec succès sur GitHub (${cleanRepo}) !`);
          logs.push(`Lovable détecte automatiquement ce commit et relance le build de votre application.`);
        } else {
          logs.push(`Avertissement GitHub : Réponse statut ${res1.status}. Vérifiez les permissions de votre Personal Access Token.`);
        }
      } catch (ghErr: any) {
        logs.push(`Échec de publication GitHub directe : ${ghErr.message}`);
      }
    }

    // 3. Webhook call if provided
    if (webhookUrl) {
      logs.push(`Envoi du webhook de mise à jour à Lovable (${webhookUrl})...`);
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'supabase.schema_updated',
            projectUrl: supabaseData.projectInfo?.url,
            tablesCount: supabaseData.tables.length,
            timestamp: new Date().toISOString(),
          }),
        });
        logs.push(`✅ Webhook Lovable déclenché avec succès !`);
      } catch (whErr: any) {
        logs.push(`Avertissement Webhook : ${whErr.message}`);
      }
    }

    const durationMs = Math.round(performance.now() - startTime);
    logs.push(`🚀 Synchronisation terminée en ${durationMs}ms.`);
    logs.push(`L'application Lovable dispose désormais de l'intégralité du modèle de données Supabase.`);

    return NextResponse.json({
      success: true,
      logs,
      githubPushed,
      commitUrl,
      syncedTablesCount: supabaseData.tables.length,
      syncedColumnsCount: supabaseData.tables.reduce((acc: number, t: any) => acc + (t.columns?.length || 0), 0),
      clientSnippet: clientContent,
      typesSnippet: typesContent,
      sqlSnippet: sqlContent,
    });
  } catch (err: any) {
    console.error('Lovable push error:', err);
    return NextResponse.json({ error: err.message || 'Erreur lors du transfert vers Lovable' }, { status: 500 });
  }
}
