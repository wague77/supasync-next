import { NextResponse } from 'next/server';
import JSZip from 'jszip';
import fs from 'fs/promises';
import path from 'path';

async function handleZipDownload(request: Request) {
  try {
    let body: any = {};
    if (request.method === 'POST') {
      try {
        body = await request.json();
      } catch (e) {}
    } else {
      const url = new URL(request.url);
      body = Object.fromEntries(url.searchParams.entries());
    }

    const supabaseUrl = body.supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xyzcompany.supabase.co';
    const supabaseKey = body.supabaseKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.anon_key_placeholder';
    const serviceRoleKey = body.serviceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SUPABASE_SERVICE_ROLE_KEY';
    const masterPassword = body.masterPassword || 'admin';

    const zip = new JSZip();
    const rootDir = process.cwd();

    // Recursive directory scanner
    const addDirectoryToZip = async (currentDir: string, zipFolder: any) => {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);

        // Skip build artifacts, node_modules, and git
        if (
          entry.name === 'node_modules' ||
          entry.name === '.next' ||
          entry.name === 'dist' ||
          entry.name === '.git' ||
          entry.name === '.cache'
        ) {
          continue;
        }

        if (entry.isDirectory()) {
          const nextZipFolder = zipFolder.folder(entry.name);
          await addDirectoryToZip(fullPath, nextZipFolder);
        } else if (entry.isFile()) {
          const fileData = await fs.readFile(fullPath);
          zipFolder.file(entry.name, fileData);
        }
      }
    };

    await addDirectoryToZip(rootDir, zip);

    // Add .env.example
    const envContent = `# ========================================================
# SupaSync Next.js - Variables d'Environnement
# Généré le : ${new Date().toISOString()}
# ========================================================

NEXT_PUBLIC_SUPABASE_URL="${supabaseUrl}"
NEXT_PUBLIC_SUPABASE_ANON_KEY="${supabaseKey}"
SUPABASE_SERVICE_ROLE_KEY="${serviceRoleKey}"

APP_PASSWORD="${masterPassword}"
PORT=3000
`;

    zip.file('.env.example', envContent);

    // Add README_INSTALLATION.md
    const readmeContent = `# SupaSync Next.js — Code Source Complet
Projet : ${supabaseUrl}
Date d'exportation : ${new Date().toLocaleString()}

## 🚀 Démarrage Rapide

### 1. Installation des dépendances
\`\`\`bash
npm install
\`\`\`

### 2. Démarrage du serveur Next.js en développement
\`\`\`bash
npm run dev
\`\`\`
L'application sera accessible sur http://localhost:3000.

## 📦 Déploiement sur Vercel
\`\`\`bash
npx vercel --prod
\`\`\`
`;

    zip.file('README_INSTALLATION.md', readmeContent);

    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    return new Response(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="supasync-next-code-source.zip"',
        'Content-Length': zipBuffer.length.toString(),
      },
    });
  } catch (err: any) {
    console.error('Source zip error:', err);
    return NextResponse.json({ error: err.message || 'Erreur lors de la création du ZIP' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return handleZipDownload(request);
}

export async function POST(request: Request) {
  return handleZipDownload(request);
}
