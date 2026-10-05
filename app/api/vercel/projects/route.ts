import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { vercelToken } = await request.json();
    if (!vercelToken) {
      return NextResponse.json({ error: 'Jeton personnel Vercel requis.' }, { status: 400 });
    }

    const response = await fetch('https://api.vercel.com/v9/projects', {
      headers: {
        Authorization: `Bearer ${vercelToken.trim()}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json(
        {
          error: `Erreur API Vercel (${response.status})`,
          details: errText,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ projects: data.projects || [] });
  } catch (err: any) {
    console.error('Vercel projects error:', err);
    return NextResponse.json({ error: err.message || 'Impossible de joindre l\'API Vercel' }, { status: 500 });
  }
}
