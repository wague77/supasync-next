import { NextResponse } from 'next/server';
import { parsePostgrestOpenApi } from '@/lib/schemaParser';

export async function POST(request: Request) {
  try {
    const { supabaseUrl, supabaseKey, maxRowsPerTable = 1000 } = await request.json();
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'supabaseUrl et supabaseKey sont obligatoires pour extraire les vraies données.' },
        { status: 400 }
      );
    }

    const cleanUrl = supabaseUrl.replace(/\/+$/, '');
    const startTime = performance.now();

    // 1. Fetch OpenAPI schema to get all real tables
    const openApiResponse = await fetch(`${cleanUrl}/rest/v1/?apikey=${encodeURIComponent(supabaseKey)}`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Accept: 'application/openapi+json, application/json',
      },
    });

    if (!openApiResponse.ok) {
      const errText = await openApiResponse.text();
      return NextResponse.json(
        { error: `Échec d'accès à Supabase (${openApiResponse.status}) : ${errText}` },
        { status: openApiResponse.status }
      );
    }

    const openApiJson = await openApiResponse.json();
    const result = parsePostgrestOpenApi(openApiJson, cleanUrl);
    result.projectInfo.connectedVia = 'url_key';
    result.projectInfo.latencyMs = Math.round(performance.now() - startTime);

    const refMatch = cleanUrl.match(/https?:\/\/([a-z0-9-]+)\.supabase\.co/i);
    if (refMatch) {
      result.projectInfo.ref = refMatch[1];
      result.projectInfo.name = `Supabase Réel (${refMatch[1]})`;
    }

    const realDataMap: Record<string, any[]> = {};
    let totalRowsExtracted = 0;
    const logs: string[] = [];

    logs.push(`Connexion réussie à la base Supabase réelle : ${cleanUrl}`);
    logs.push(`${result.tables.length} tables détectées dans le schéma public.`);

    // 2. Fetch all real records for every table
    for (const table of result.tables) {
      try {
        const tableRes = await fetch(`${cleanUrl}/rest/v1/${table.name}?select=*&limit=${maxRowsPerTable}`, {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            Prefer: 'count=exact',
          },
        });

        if (tableRes.ok) {
          const contentRange = tableRes.headers.get('content-range');
          let exactCount = 0;
          if (contentRange) {
            const totalMatch = contentRange.match(/\/(\d+|\*)/);
            if (totalMatch && totalMatch[1] !== '*') {
              exactCount = parseInt(totalMatch[1], 10);
            }
          }

          const rows = await tableRes.json();
          if (Array.isArray(rows)) {
            realDataMap[table.name] = rows;
            table.sampleRows = rows;
            table.rowCount = exactCount || rows.length;
            totalRowsExtracted += rows.length;
            logs.push(`✓ Table "${table.name}" : ${rows.length} lignes réelles extraites (total en base: ${table.rowCount}).`);
          } else {
            realDataMap[table.name] = [];
          }
        } else {
          logs.push(`⚠️ Avertissement "${table.name}" : code ${tableRes.status} (accès restreint par RLS).`);
          realDataMap[table.name] = [];
        }
      } catch (tableErr: any) {
        logs.push(`Erreur sur "${table.name}" : ${tableErr.message}`);
        realDataMap[table.name] = [];
      }
    }

    logs.push(`✅ Extraction terminée : ${totalRowsExtracted} enregistrements réels extraits sur ${result.tables.length} tables.`);

    return NextResponse.json({
      success: true,
      result,
      realDataMap,
      totalRowsExtracted,
      tablesCount: result.tables.length,
      logs,
    });
  } catch (err: any) {
    console.error('Fetch real data error:', err);
    return NextResponse.json(
      { error: err.message || 'Erreur lors de l\'extraction des données réelles Supabase' },
      { status: 500 }
    );
  }
}
