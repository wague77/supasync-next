import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const APP_PASSWORD = process.env.APP_PASSWORD || 'admin';

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
