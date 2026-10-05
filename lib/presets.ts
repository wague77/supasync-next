import { DatabaseIntrospectionResult } from '@/types/supabase';

export interface DemoPreset {
  id: string;
  name: string;
  badge: string;
  description: string;
  data: DatabaseIntrospectionResult;
}

export const DEMO_PRESETS: DemoPreset[] = [
  {
    id: 'saas-multitenant',
    name: 'SaaS Multi-Tenant & RBAC',
    badge: 'Populaire',
    description: 'Architecture SaaS moderne avec organisations, membres, abonnements Stripe, clés API et logs d\'audit.',
    data: {
      projectInfo: {
        url: 'https://saas-demo.supabase.co',
        ref: 'saas-demo-01',
        name: 'Supabase SaaS Production',
        region: 'eu-central-1 (Frankfurt)',
        postgrestVersion: 'v12.2.0',
        latencyMs: 38,
        checkedAt: new Date().toISOString(),
        connectedVia: 'demo_preset',
      },
      tables: [
        {
          name: 'users',
          schema: 'public',
          description: 'Profils utilisateurs synchronisés avec auth.users',
          primaryKeys: ['id'],
          rlsEnabled: true,
          rowCount: 1420,
          columns: [
            { name: 'id', type: 'uuid', isPrimary: true, isNullable: false, defaultValue: 'gen_random_uuid()' },
            { name: 'email', type: 'text', isPrimary: false, isNullable: false, description: 'Adresse email unique' },
            { name: 'full_name', type: 'text', isPrimary: false, isNullable: true },
            { name: 'avatar_url', type: 'text', isPrimary: false, isNullable: true },
            { name: 'is_superadmin', type: 'boolean', isPrimary: false, isNullable: false, defaultValue: 'false' },
            { name: 'created_at', type: 'timestamptz', isPrimary: false, isNullable: false, defaultValue: 'now()' },
            { name: 'updated_at', type: 'timestamptz', isPrimary: false, isNullable: false, defaultValue: 'now()' },
          ],
          sampleRows: [
            { id: 'u111-aaa-222', email: 'alice@company.io', full_name: 'Alice Dubois', is_superadmin: true, created_at: '2026-01-12T10:00:00Z' },
            { id: 'u222-bbb-333', email: 'marc@startup.co', full_name: 'Marc Lefebvre', is_superadmin: false, created_at: '2026-02-04T14:30:00Z' },
          ],
          policies: [
            { name: 'Users can read their own profile', command: 'SELECT', roles: ['authenticated'], definition: 'auth.uid() = id' },
            { name: 'Users can update their own profile', command: 'UPDATE', roles: ['authenticated'], definition: 'auth.uid() = id' },
          ],
        },
        {
          name: 'organizations',
          schema: 'public',
          description: 'Tenants / Entreprises clientes',
          primaryKeys: ['id'],
          rlsEnabled: true,
          rowCount: 185,
          columns: [
            { name: 'id', type: 'uuid', isPrimary: true, isNullable: false, defaultValue: 'gen_random_uuid()' },
            { name: 'name', type: 'text', isPrimary: false, isNullable: false },
            { name: 'slug', type: 'text', isPrimary: false, isNullable: false, description: 'Identifiant URL unique' },
            { name: 'plan', type: 'text', isPrimary: false, isNullable: false, defaultValue: "'starter'" },
            { name: 'stripe_customer_id', type: 'text', isPrimary: false, isNullable: true },
            { name: 'max_seats', type: 'integer', isPrimary: false, isNullable: false, defaultValue: '10' },
            { name: 'created_at', type: 'timestamptz', isPrimary: false, isNullable: false, defaultValue: 'now()' },
          ],
          sampleRows: [
            { id: 'org-101', name: 'Acme Cloud', slug: 'acme-cloud', plan: 'enterprise', max_seats: 50, created_at: '2026-01-15T09:00:00Z' },
            { id: 'org-102', name: 'NextGen Labs', slug: 'nextgen-labs', plan: 'growth', max_seats: 25, created_at: '2026-02-01T11:20:00Z' },
          ],
          policies: [
            { name: 'Org members can view org', command: 'SELECT', roles: ['authenticated'], definition: 'EXISTS (SELECT 1 FROM memberships WHERE memberships.org_id = organizations.id AND memberships.user_id = auth.uid())' },
          ],
        },
        {
          name: 'memberships',
          schema: 'public',
          description: 'Rôles des utilisateurs dans les organisations',
          primaryKeys: ['id'],
          rlsEnabled: true,
          rowCount: 640,
          columns: [
            { name: 'id', type: 'uuid', isPrimary: true, isNullable: false, defaultValue: 'gen_random_uuid()' },
            { name: 'user_id', type: 'uuid', isPrimary: false, isNullable: false, foreignKey: { targetTable: 'users', targetColumn: 'id', onDelete: 'CASCADE' } },
            { name: 'org_id', type: 'uuid', isPrimary: false, isNullable: false, foreignKey: { targetTable: 'organizations', targetColumn: 'id', onDelete: 'CASCADE' } },
            { name: 'role', type: 'text', isPrimary: false, isNullable: false, defaultValue: "'member'" },
            { name: 'created_at', type: 'timestamptz', isPrimary: false, isNullable: false, defaultValue: 'now()' },
          ],
          sampleRows: [
            { id: 'm-1', user_id: 'u111-aaa-222', org_id: 'org-101', role: 'owner', created_at: '2026-01-15T09:05:00Z' },
            { id: 'm-2', user_id: 'u222-bbb-333', org_id: 'org-102', role: 'admin', created_at: '2026-02-01T11:25:00Z' },
          ],
          policies: [
            { name: 'Members can view coworkers', command: 'SELECT', roles: ['authenticated'], definition: 'org_id IN (SELECT org_id FROM memberships WHERE user_id = auth.uid())' },
          ],
        },
        {
          name: 'api_keys',
          schema: 'public',
          description: 'Jetons d\'API sécurisés pour intégrations',
          primaryKeys: ['id'],
          rlsEnabled: true,
          rowCount: 82,
          columns: [
            { name: 'id', type: 'uuid', isPrimary: true, isNullable: false, defaultValue: 'gen_random_uuid()' },
            { name: 'org_id', type: 'uuid', isPrimary: false, isNullable: false, foreignKey: { targetTable: 'organizations', targetColumn: 'id', onDelete: 'CASCADE' } },
            { name: 'name', type: 'text', isPrimary: false, isNullable: false },
            { name: 'key_hash', type: 'text', isPrimary: false, isNullable: false },
            { name: 'last_used_at', type: 'timestamptz', isPrimary: false, isNullable: true },
            { name: 'expires_at', type: 'timestamptz', isPrimary: false, isNullable: true },
            { name: 'created_at', type: 'timestamptz', isPrimary: false, isNullable: false, defaultValue: 'now()' },
          ],
          sampleRows: [
            { id: 'key-01', org_id: 'org-101', name: 'Production Webhook API', key_hash: 'sha256:8f2a9...', created_at: '2026-01-20T12:00:00Z' },
          ],
        },
        {
          name: 'audit_logs',
          schema: 'public',
          description: 'Journal immuable de traçabilité des actions',
          primaryKeys: ['id'],
          rlsEnabled: false, // Intentional issue for audit demonstration!
          rowCount: 9420,
          columns: [
            { name: 'id', type: 'bigint', isPrimary: true, isNullable: false, defaultValue: 'nextval()' },
            { name: 'org_id', type: 'uuid', isPrimary: false, isNullable: false, foreignKey: { targetTable: 'organizations', targetColumn: 'id', onDelete: 'CASCADE' } },
            { name: 'actor_id', type: 'uuid', isPrimary: false, isNullable: true, foreignKey: { targetTable: 'users', targetColumn: 'id' } },
            { name: 'action', type: 'text', isPrimary: false, isNullable: false },
            { name: 'ip_address', type: 'text', isPrimary: false, isNullable: true },
            { name: 'metadata', type: 'jsonb', isPrimary: false, isNullable: true, defaultValue: "'{}'::jsonb" },
            { name: 'created_at', type: 'timestamptz', isPrimary: false, isNullable: false, defaultValue: 'now()' },
          ],
          sampleRows: [
            { id: 1, org_id: 'org-101', actor_id: 'u111-aaa-222', action: 'user.invited', ip_address: '194.254.12.1', created_at: '2026-02-10T16:00:00Z' },
          ],
        },
      ],
      views: [
        {
          name: 'v_active_subscriptions',
          columns: [
            { name: 'org_id', type: 'uuid', isPrimary: false, isNullable: false },
            { name: 'org_name', type: 'text', isPrimary: false, isNullable: false },
            { name: 'member_count', type: 'bigint', isPrimary: false, isNullable: false },
            { name: 'plan', type: 'text', isPrimary: false, isNullable: false },
          ],
        },
      ],
      relationships: [
        { id: 'rel-1', sourceTable: 'memberships', sourceColumn: 'user_id', targetTable: 'users', targetColumn: 'id', type: 'N:1' },
        { id: 'rel-2', sourceTable: 'memberships', sourceColumn: 'org_id', targetTable: 'organizations', targetColumn: 'id', type: 'N:1' },
        { id: 'rel-3', sourceTable: 'api_keys', sourceColumn: 'org_id', targetTable: 'organizations', targetColumn: 'id', type: 'N:1' },
        { id: 'rel-4', sourceTable: 'audit_logs', sourceColumn: 'org_id', targetTable: 'organizations', targetColumn: 'id', type: 'N:1' },
        { id: 'rel-5', sourceTable: 'audit_logs', sourceColumn: 'actor_id', targetTable: 'users', targetColumn: 'id', type: 'N:1' },
      ],
      storageBuckets: [
        { id: 'avatars', name: 'avatars', public: true, fileSizeLimit: 5242880, allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'] },
        { id: 'invoices', name: 'invoices', public: false, fileSizeLimit: 10485760, allowedMimeTypes: ['application/pdf'] },
      ],
      securityAudit: {
        score: 78,
        rlsDisabledCount: 1,
        missingIndexesCount: 2,
        totalTables: 5,
        issues: [
          {
            id: 'sec-1',
            level: 'critical',
            category: 'rls',
            title: 'RLS désactivé sur la table "audit_logs"',
            description: 'La table "audit_logs" contient des données sensibles et ne possède pas la sécurité au niveau des lignes (RLS). Tout client utilisant la clé anon pourrait tenter de lire le journal.',
            tableName: 'audit_logs',
            sqlFix: 'ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;\n\nCREATE POLICY "Admins can view audit logs" ON audit_logs FOR SELECT USING (\n  EXISTS (\n    SELECT 1 FROM memberships \n    WHERE memberships.org_id = audit_logs.org_id \n    AND memberships.user_id = auth.uid() \n    AND memberships.role IN (\'owner\', \'admin\')\n  )\n);',
          },
          {
            id: 'sec-2',
            level: 'warning',
            category: 'index',
            title: 'Index manquant sur clé étrangère "audit_logs.org_id"',
            description: 'Les requêtes filtrant par org_id effectuent un scan séquentiel (Seq Scan). Un index accélérera drastiquement les jointures.',
            tableName: 'audit_logs',
            sqlFix: 'CREATE INDEX IF NOT EXISTS idx_audit_logs_org_id ON audit_logs(org_id);',
          },
          {
            id: 'sec-3',
            level: 'warning',
            category: 'index',
            title: 'Index manquant sur clé étrangère "memberships.user_id"',
            description: 'Accélérez la résolution des droits utilisateurs en indexant la colonne user_id.',
            tableName: 'memberships',
            sqlFix: 'CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON memberships(user_id);',
          },
        ],
      },
    },
  },
  {
    id: 'ecommerce-marketplace',
    name: 'E-Commerce & Catalogue',
    badge: 'Produits & Commandes',
    description: 'Boutique en ligne avec catalogue hiérarchique, paniers, commandes, stocks et évaluations clients.',
    data: {
      projectInfo: {
        url: 'https://ecommerce-store.supabase.co',
        ref: 'ecom-prod-02',
        name: 'Supabase E-Commerce DB',
        region: 'us-east-1 (N. Virginia)',
        postgrestVersion: 'v12.2.0',
        latencyMs: 44,
        checkedAt: new Date().toISOString(),
        connectedVia: 'demo_preset',
      },
      tables: [
        {
          name: 'categories',
          schema: 'public',
          description: 'Catégories de produits',
          primaryKeys: ['id'],
          rlsEnabled: true,
          rowCount: 48,
          columns: [
            { name: 'id', type: 'serial', isPrimary: true, isNullable: false },
            { name: 'name', type: 'text', isPrimary: false, isNullable: false },
            { name: 'slug', type: 'text', isPrimary: false, isNullable: false },
            { name: 'parent_id', type: 'integer', isPrimary: false, isNullable: true, foreignKey: { targetTable: 'categories', targetColumn: 'id' } },
            { name: 'created_at', type: 'timestamptz', isPrimary: false, isNullable: false, defaultValue: 'now()' },
          ],
          sampleRows: [
            { id: 1, name: 'Électronique', slug: 'electronique', parent_id: null },
            { id: 2, name: 'Smartphones', slug: 'smartphones', parent_id: 1 },
          ],
          policies: [
            { name: 'Public read categories', command: 'SELECT', roles: ['anon', 'authenticated'], definition: 'true' },
          ],
        },
        {
          name: 'products',
          schema: 'public',
          description: 'Articles et fiches produits',
          primaryKeys: ['id'],
          rlsEnabled: true,
          rowCount: 1250,
          columns: [
            { name: 'id', type: 'uuid', isPrimary: true, isNullable: false, defaultValue: 'gen_random_uuid()' },
            { name: 'category_id', type: 'integer', isPrimary: false, isNullable: false, foreignKey: { targetTable: 'categories', targetColumn: 'id' } },
            { name: 'title', type: 'text', isPrimary: false, isNullable: false },
            { name: 'slug', type: 'text', isPrimary: false, isNullable: false },
            { name: 'description', type: 'text', isPrimary: false, isNullable: true },
            { name: 'price_cents', type: 'integer', isPrimary: false, isNullable: false },
            { name: 'stock_quantity', type: 'integer', isPrimary: false, isNullable: false, defaultValue: '0' },
            { name: 'is_active', type: 'boolean', isPrimary: false, isNullable: false, defaultValue: 'true' },
            { name: 'attributes', type: 'jsonb', isPrimary: false, isNullable: true, defaultValue: "'{}'::jsonb" },
            { name: 'created_at', type: 'timestamptz', isPrimary: false, isNullable: false, defaultValue: 'now()' },
          ],
          sampleRows: [
            { id: 'p-1', category_id: 2, title: 'Titanium Pro Phone', slug: 'titanium-pro-phone', price_cents: 99900, stock_quantity: 45, is_active: true },
          ],
          policies: [
            { name: 'Public read active products', command: 'SELECT', roles: ['anon', 'authenticated'], definition: 'is_active = true' },
          ],
        },
        {
          name: 'orders',
          schema: 'public',
          description: 'Commandes passées par les clients',
          primaryKeys: ['id'],
          rlsEnabled: true,
          rowCount: 3410,
          columns: [
            { name: 'id', type: 'uuid', isPrimary: true, isNullable: false, defaultValue: 'gen_random_uuid()' },
            { name: 'user_id', type: 'uuid', isPrimary: false, isNullable: false },
            { name: 'status', type: 'text', isPrimary: false, isNullable: false, defaultValue: "'pending'" },
            { name: 'total_cents', type: 'integer', isPrimary: false, isNullable: false },
            { name: 'shipping_address', type: 'jsonb', isPrimary: false, isNullable: false },
            { name: 'created_at', type: 'timestamptz', isPrimary: false, isNullable: false, defaultValue: 'now()' },
          ],
          sampleRows: [
            { id: 'ord-901', user_id: 'usr-12', status: 'delivered', total_cents: 149900, created_at: '2026-03-01T10:15:00Z' },
          ],
          policies: [
            { name: 'Customers view their own orders', command: 'SELECT', roles: ['authenticated'], definition: 'auth.uid() = user_id' },
          ],
        },
        {
          name: 'order_items',
          schema: 'public',
          description: 'Lignes de détails des commandes',
          primaryKeys: ['id'],
          rlsEnabled: true,
          rowCount: 8200,
          columns: [
            { name: 'id', type: 'uuid', isPrimary: true, isNullable: false, defaultValue: 'gen_random_uuid()' },
            { name: 'order_id', type: 'uuid', isPrimary: false, isNullable: false, foreignKey: { targetTable: 'orders', targetColumn: 'id', onDelete: 'CASCADE' } },
            { name: 'product_id', type: 'uuid', isPrimary: false, isNullable: false, foreignKey: { targetTable: 'products', targetColumn: 'id' } },
            { name: 'quantity', type: 'integer', isPrimary: false, isNullable: false, defaultValue: '1' },
            { name: 'unit_price_cents', type: 'integer', isPrimary: false, isNullable: false },
          ],
          sampleRows: [
            { id: 'oi-1', order_id: 'ord-901', product_id: 'p-1', quantity: 1, unit_price_cents: 99900 },
          ],
        },
      ],
      views: [],
      relationships: [
        { id: 'rel-e1', sourceTable: 'products', sourceColumn: 'category_id', targetTable: 'categories', targetColumn: 'id', type: 'N:1' },
        { id: 'rel-e2', sourceTable: 'order_items', sourceColumn: 'order_id', targetTable: 'orders', targetColumn: 'id', type: 'N:1' },
        { id: 'rel-e3', sourceTable: 'order_items', sourceColumn: 'product_id', targetTable: 'products', targetColumn: 'id', type: 'N:1' },
      ],
      storageBuckets: [
        { id: 'product-images', name: 'product-images', public: true, fileSizeLimit: 8388608, allowedMimeTypes: ['image/*'] },
      ],
      securityAudit: {
        score: 92,
        rlsDisabledCount: 0,
        missingIndexesCount: 1,
        totalTables: 4,
        issues: [
          {
            id: 'sec-e1',
            level: 'warning',
            category: 'index',
            title: 'Index recommandé sur "order_items.product_id"',
            description: 'Pour accélérer le calcul des statistiques de ventes et les jointures de stock, ajoutez un index btree.',
            tableName: 'order_items',
            sqlFix: 'CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);',
          },
        ],
      },
    },
  },
  {
    id: 'ai-vector-rag',
    name: 'AI & Base Vectorielle (pgvector)',
    badge: 'Intelligence Artificielle',
    description: 'Pipeline RAG avec embeddings vector(1536), documents, chunks de texte et logs de requêtes sémantiques.',
    data: {
      projectInfo: {
        url: 'https://ai-knowledge.supabase.co',
        ref: 'ai-vector-03',
        name: 'Supabase Vector Database (pgvector)',
        region: 'eu-west-1 (Ireland)',
        postgrestVersion: 'v12.2.0',
        latencyMs: 32,
        checkedAt: new Date().toISOString(),
        connectedVia: 'demo_preset',
      },
      tables: [
        {
          name: 'documents',
          schema: 'public',
          description: 'Fichiers sources ingérés (PDF, Markdown, Web)',
          primaryKeys: ['id'],
          rlsEnabled: true,
          rowCount: 320,
          columns: [
            { name: 'id', type: 'uuid', isPrimary: true, isNullable: false, defaultValue: 'gen_random_uuid()' },
            { name: 'user_id', type: 'uuid', isPrimary: false, isNullable: false },
            { name: 'title', type: 'text', isPrimary: false, isNullable: false },
            { name: 'source_url', type: 'text', isPrimary: false, isNullable: true },
            { name: 'status', type: 'text', isPrimary: false, isNullable: false, defaultValue: "'indexed'" },
            { name: 'tokens_count', type: 'integer', isPrimary: false, isNullable: false, defaultValue: '0' },
            { name: 'created_at', type: 'timestamptz', isPrimary: false, isNullable: false, defaultValue: 'now()' },
          ],
          sampleRows: [
            { id: 'doc-1', user_id: 'usr-ai-1', title: 'Guide Architecture Cloud.pdf', status: 'indexed', tokens_count: 14500 },
          ],
        },
        {
          name: 'document_chunks',
          schema: 'public',
          description: 'Segments textuels indexés avec embeddings vectoriels',
          primaryKeys: ['id'],
          rlsEnabled: true,
          rowCount: 4500,
          columns: [
            { name: 'id', type: 'bigint', isPrimary: true, isNullable: false, defaultValue: 'nextval()' },
            { name: 'document_id', type: 'uuid', isPrimary: false, isNullable: false, foreignKey: { targetTable: 'documents', targetColumn: 'id', onDelete: 'CASCADE' } },
            { name: 'chunk_index', type: 'integer', isPrimary: false, isNullable: false },
            { name: 'content', type: 'text', isPrimary: false, isNullable: false },
            { name: 'embedding', type: 'vector(1536)', isPrimary: false, isNullable: false, description: 'Vecteur d\'embedding sémantique' },
            { name: 'metadata', type: 'jsonb', isPrimary: false, isNullable: true, defaultValue: "'{}'::jsonb" },
          ],
          sampleRows: [
            { id: 1, document_id: 'doc-1', chunk_index: 0, content: 'Introduction aux microservices managés...', embedding: '[0.012, -0.045, ...]' },
          ],
        },
        {
          name: 'conversations',
          schema: 'public',
          description: 'Sessions de discussion avec le modèle IA',
          primaryKeys: ['id'],
          rlsEnabled: true,
          rowCount: 890,
          columns: [
            { name: 'id', type: 'uuid', isPrimary: true, isNullable: false, defaultValue: 'gen_random_uuid()' },
            { name: 'user_id', type: 'uuid', isPrimary: false, isNullable: false },
            { name: 'title', type: 'text', isPrimary: false, isNullable: false, defaultValue: "'Nouvelle session'" },
            { name: 'created_at', type: 'timestamptz', isPrimary: false, isNullable: false, defaultValue: 'now()' },
          ],
          sampleRows: [
            { id: 'conv-01', user_id: 'usr-ai-1', title: 'Questions sur la scalabilité', created_at: '2026-03-02T18:00:00Z' },
          ],
        },
      ],
      views: [],
      relationships: [
        { id: 'rel-v1', sourceTable: 'document_chunks', sourceColumn: 'document_id', targetTable: 'documents', targetColumn: 'id', type: 'N:1' },
      ],
      storageBuckets: [
        { id: 'raw-documents', name: 'raw-documents', public: false, fileSizeLimit: 26214400, allowedMimeTypes: ['application/pdf', 'text/markdown'] },
      ],
      securityAudit: {
        score: 95,
        rlsDisabledCount: 0,
        missingIndexesCount: 1,
        totalTables: 3,
        issues: [
          {
            id: 'sec-v1',
            level: 'info',
            category: 'index',
            title: 'Index HNSW / IVFFLAT recommandé pour "document_chunks.embedding"',
            description: 'Pour des recherches de similarité cosinus ultra-rapides sur vector(1536), créez un index HNSW.',
            tableName: 'document_chunks',
            sqlFix: 'CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding_hnsw \nON document_chunks USING hnsw (embedding vector_cosine_ops);',
          },
        ],
      },
    },
  },
];
