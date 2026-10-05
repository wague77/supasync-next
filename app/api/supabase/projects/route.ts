import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { accessToken } = await request.json();
    if (!accessToken) {
      return NextResponse.json({ error: 'Jeton d\'accès personnel (sbp_...) requis.' }, { status: 400 });
    }

    const response = await fetch('https://api.supabase.com/v1/projects', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json(
        {
          error: `Erreur API Management Supabase (${response.status})`,
          details: errText,
        },
        { status: response.status }
      );
    }

    const projects = await response.json();
    return NextResponse.json({ projects });
  } catch (err: any) {
    console.error('Management API projects error:', err);
    return NextResponse.json(
      { error: err.message || 'Échec de récupération des projets Supabase' },
      { status: 500 }
    );
  }
}
