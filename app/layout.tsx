import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SupaSync - Supabase DB Auto-Configurator & Vercel Bridge',
  description:
    'Inspectez, analysez et configurez automatiquement votre base de données Supabase. Génération de schémas, DDL SQL, types TypeScript, Drizzle/Prisma, audit RLS et intégration Vercel/Lovable.',
  openGraph: {
    title: 'SupaSync - Supabase DB Auto-Configurator',
    description:
      'Inspectez, analysez et configurez automatiquement votre base de données Supabase. Génération de schémas, DDL SQL, types TypeScript, Drizzle/Prisma et audit RLS.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark">
      <body className="bg-zinc-950 text-zinc-100 antialiased selection:bg-emerald-500/30 selection:text-emerald-200">
        {children}
      </body>
    </html>
  );
}
