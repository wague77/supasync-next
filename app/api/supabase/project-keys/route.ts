import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { projectRef, accessToken } = await request.json();
    if (!projectRef || !accessToken) {
      return NextResponse.json({ error: 'projectRef et accessToken requis.' }, { status: 400 });
    }

    const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/api-keys`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json(
        { error: 'Impossible de récupérer les clés du projet', details: err },
        { status: response.status }
      );
    }

    const keys = await response.json();
    return NextResponse.json({ keys });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
