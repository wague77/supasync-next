import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { code, masterPassword } = await request.json();
    const envMasterPassword = process.env.APP_PASSWORD || 'SupaSync-Admin-2026!#9xK$8mP';

    if (code === envMasterPassword || (masterPassword && masterPassword === envMasterPassword)) {
      return NextResponse.json({ valid: true, role: 'admin' });
    }

    if (code && typeof code === 'string' && code.startsWith('CODE-')) {
      return NextResponse.json({ valid: true, role: 'user' });
    }

    return NextResponse.json({ valid: false, error: 'Code d\'accès non reconnu' }, { status: 401 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 });
  }
}
