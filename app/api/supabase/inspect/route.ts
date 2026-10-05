import { NextResponse } from 'next/server';
import { parsePostgrestOpenApi } from '@/lib/schemaParser';

export async function POST(request: Request) {
  try {
    const { supabaseUrl, supabaseKey } = await request.json();
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'supabaseUrl et supabaseKey sont obligatoires.' }, { status: 400 });
    }

    const cleanUrl = supabaseUrl.replace(/\/+$/, '');
    const startTime = performance.now();

    // Fetch PostgREST OpenAPI spec
    const openApiResponse = await fetch(`${cleanUrl}/rest/v1/?apikey=${encodeURIComponent(supabaseKey)}`, {
      method: 'GET',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Accept: 'application/openapi+json, application/json',
      },
    });

    const latencyMs = Math.round(performance.now() - startTime);

    if (!openApiResponse.ok) {
      const errText = await openApiResponse.text();
      return NextResponse.json(
        {
          error: `Supabase REST a renvoyé une erreur ${openApiResponse.status}`,
          details: errText,
        },
        { status: openApiResponse.status }
      );
    }

    const openApiJson = await openApiResponse.json();
    const result = parsePostgrestOpenApi(openApiJson, cleanUrl);
    result.projectInfo.latencyMs = latencyMs;

    // Try fetching sample rows for top tables (non-blocking)
    for (let i = 0; i < Math.min(result.tables.length, 6); i++) {
      const table = result.tables[i];
      try {
        const sampleRes = await fetch(`${cleanUrl}/rest/v1/${table.name}?select=*&limit=3`, {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            Prefer: 'count=exact',
          },
        });
        if (sampleRes.ok) {
          const contentRange = sampleRes.headers.get('content-range');
          if (contentRange) {
            const totalMatch = contentRange.match(/\/(\d+|\*)/);
            if (totalMatch && totalMatch[1] !== '*') {
              table.rowCount = parseInt(totalMatch[1], 10);
            }
          }
          const rows = await sampleRes.json();
          if (Array.isArray(rows)) {
            table.sampleRows = rows;
            if (table.rowCount === undefined || table.rowCount === 0) {
              table.rowCount = rows.length;
            }
          }
        }
      } catch (e) {
        // Ignore table sample fetch errors
      }
    }

    // Try fetching storage buckets
    try {
      const bucketRes = await fetch(`${cleanUrl}/storage/v1/bucket`, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      });
      if (bucketRes.ok) {
        const buckets = await bucketRes.json();
        if (Array.isArray(buckets) && buckets.length > 0) {
          result.storageBuckets = buckets.map((b: any) => ({
            id: b.id,
            name: b.name,
            public: !!b.public,
            fileSizeLimit: b.file_size_limit,
            allowedMimeTypes: b.allowed_mime_types,
          }));
        }
      }
    } catch (e) {
      // Storage buckets might not be exposed on anon key
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Supabase inspect error:', err);
    return NextResponse.json(
      { error: err.message || 'Erreur lors de l\'inspection de la base Supabase' },
      { status: 500 }
    );
  }
}
