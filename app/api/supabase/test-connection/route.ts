import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { supabaseUrl, supabaseKey } = await request.json();
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Supabase URL et Clé API requises.' }, { status: 400 });
    }

    const cleanUrl = supabaseUrl.replace(/\/+$/, '');
    const startTime = performance.now();

    const response = await fetch(`${cleanUrl}/rest/v1/?apikey=${encodeURIComponent(supabaseKey)}`, {
      method: 'GET',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Accept: 'application/openapi+json, application/json',
      },
    });

    const latencyMs = Math.round(performance.now() - startTime);

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          error: `Échec de connexion (${response.status}): ${response.statusText}`,
          details: errorText,
          latencyMs,
        },
        { status: response.status }
      );
    }

    const postgrestVersion = response.headers.get('content-profile') || 'PostgREST v12';

    return NextResponse.json({
      success: true,
      latencyMs,
      postgrestVersion,
      url: cleanUrl,
    });
  } catch (err: any) {
    console.error('Test connection error:', err);
    return NextResponse.json(
      { error: err.message || 'Impossible de joindre le serveur Supabase' },
      { status: 500 }
    );
  }
}
