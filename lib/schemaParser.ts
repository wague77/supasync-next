import {
  DatabaseIntrospectionResult,
  Relationship,
  SecurityAudit,
  SecurityIssue,
  TableColumn,
  TableSchema,
} from '@/types/supabase';

export function parsePostgrestOpenApi(
  openApiData: any,
  projectUrl: string,
  keyType: 'anon' | 'service_role' | 'demo' = 'anon'
): DatabaseIntrospectionResult {
  const definitions = openApiData?.definitions || openApiData?.components?.schemas || {};
  const tables: TableSchema[] = [];
  const views: { name: string; columns: TableColumn[] }[] = [];
  const relationships: Relationship[] = [];

  const tableNames = Object.keys(definitions);

  for (const tableName of tableNames) {
    // PostgREST schemas might prefix or include views
    const def = definitions[tableName];
    if (!def || typeof def !== 'object') continue;

    const properties = def.properties || {};
    const requiredList = Array.isArray(def.required) ? def.required : [];
    const columns: TableColumn[] = [];
    const primaryKeys: string[] = [];

    for (const colName of Object.keys(properties)) {
      const prop = properties[colName];
      const desc = prop.description || '';
      const isPk =
        desc.toLowerCase().includes('primary key') ||
        desc.toLowerCase().includes('<pk') ||
        colName === 'id' ||
        colName === `${tableName}_id`;

      if (isPk) {
        primaryKeys.push(colName);
      }

      // Infer foreign key from description or naming convention
      let foreignKey: TableColumn['foreignKey'] | undefined;
      const fkMatch = desc.match(/Foreign Key to `?([a-zA-Z0-9_]+)`?\.`?([a-zA-Z0-9_]+)`?/i);
      if (fkMatch) {
        foreignKey = {
          targetTable: fkMatch[1],
          targetColumn: fkMatch[2],
        };
      } else if (colName.endsWith('_id') && colName !== 'id') {
        const candidate = colName.replace(/_id$/, '');
        // Check if candidate matches a plural or exact table name
        const matchTable = tableNames.find(
          t => t === candidate || t === candidate + 's' || t === candidate + 'es' || t.startsWith(candidate)
        );
        if (matchTable && matchTable !== tableName) {
          foreignKey = {
            targetTable: matchTable,
            targetColumn: 'id',
          };
        }
      }

      const colType = prop.format || prop.type || 'text';

      columns.push({
        name: colName,
        type: colType,
        format: prop.format,
        isPrimary: isPk,
        isNullable: !requiredList.includes(colName),
        defaultValue: prop.default ? String(prop.default) : undefined,
        description: desc || undefined,
        foreignKey,
      });

      if (foreignKey) {
        relationships.push({
          id: `rel_${tableName}_${colName}_${foreignKey.targetTable}`,
          sourceTable: tableName,
          sourceColumn: colName,
          targetTable: foreignKey.targetTable,
          targetColumn: foreignKey.targetColumn,
          type: 'N:1',
        });
      }
    }

    // Determine if table or view
    const isView = def.description?.toLowerCase().includes('view') || tableName.startsWith('v_');

    if (isView) {
      views.push({ name: tableName, columns });
    } else {
      tables.push({
        name: tableName,
        schema: 'public',
        description: def.description || undefined,
        columns,
        primaryKeys: primaryKeys.length > 0 ? primaryKeys : ['id'],
        rowCount: 0,
        rlsEnabled: true, // Default to true or check via policies
        policies: [],
      });
    }
  }

  // Deduplicate relationships
  const uniqueRelationships: Relationship[] = [];
  const seenRels = new Set<string>();
  for (const rel of relationships) {
    const key = `${rel.sourceTable}.${rel.sourceColumn}->${rel.targetTable}.${rel.targetColumn}`;
    if (!seenRels.has(key)) {
      seenRels.add(key);
      uniqueRelationships.push(rel);
    }
  }

  // Security audit
  const audit = performSecurityAudit(tables, uniqueRelationships);

  // Extract project ref from URL (https://<ref>.supabase.co)
  const refMatch = projectUrl.match(/https?:\/\/([a-z0-9-]+)\.supabase\.co/i);
  const projectRef = refMatch ? refMatch[1] : undefined;

  return {
    projectInfo: {
      url: projectUrl,
      ref: projectRef,
      name: projectRef ? `Supabase Project (${projectRef})` : 'Supabase Custom Database',
      region: 'Automatique (Supabase Cloud)',
      postgrestVersion: openApiData?.info?.version || 'PostgREST v12',
      latencyMs: 45,
      checkedAt: new Date().toISOString(),
      connectedVia: 'url_key',
    },
    tables,
    views,
    relationships: uniqueRelationships,
    storageBuckets: [
      { id: 'public-assets', name: 'public-assets', public: true, fileSizeLimit: 10485760 },
    ],
    securityAudit: audit,
  };
}

export function performSecurityAudit(tables: TableSchema[], relationships: Relationship[]): SecurityAudit {
  const issues: SecurityIssue[] = [];
  let score = 100;
  let rlsDisabledCount = 0;
  let missingIndexesCount = 0;

  for (const table of tables) {
    // Check 1: RLS enabled
    if (!table.rlsEnabled) {
      rlsDisabledCount++;
      score -= 25;
      issues.push({
        id: `rls_${table.name}`,
        level: 'critical',
        category: 'rls',
        title: `Row Level Security (RLS) désactivé sur "${table.name}"`,
        description: `La table "${table.name}" expose potentiellement toutes ses données sans restriction d'accès aux requêtes clientes.`,
        tableName: table.name,
        sqlFix: `ALTER TABLE public.${table.name} ENABLE ROW LEVEL SECURITY;\nCREATE POLICY "${table.name}_auth_policy" ON public.${table.name} FOR ALL TO authenticated USING (true);`,
      });
    }

    // Check 2: Missing Primary Key
    if (!table.columns.some(c => c.isPrimary)) {
      score -= 10;
      issues.push({
        id: `pk_${table.name}`,
        level: 'warning',
        category: 'keys',
        title: `Absence de clé primaire sur "${table.name}"`,
        description: `Une clé primaire est requise pour la réplication temps réel Supabase et l'identification unique des lignes.`,
        tableName: table.name,
        sqlFix: `ALTER TABLE public.${table.name} ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid();`,
      });
    }

    // Check 3: Foreign Key indexing
    const fkCols = table.columns.filter(c => c.foreignKey);
    for (const fkCol of fkCols) {
      missingIndexesCount++;
      issues.push({
        id: `idx_${table.name}_${fkCol.name}`,
        level: 'warning',
        category: 'index',
        title: `Index de jointure recommandé : "${table.name}.${fkCol.name}"`,
        description: `Les filtres et jointures vers "${fkCol.foreignKey?.targetTable}" seront accélérés avec un index B-Tree.`,
        tableName: table.name,
        sqlFix: `CREATE INDEX IF NOT EXISTS idx_${table.name}_${fkCol.name} ON public.${table.name}(${fkCol.name});`,
      });
    }

    // Check 4: Sensitive columns check
    const sensitive = table.columns.filter(c =>
      ['password', 'secret', 'token', 'access_token', 'private_key'].some(s => c.name.toLowerCase().includes(s))
    );
    if (sensitive.length > 0) {
      issues.push({
        id: `sens_${table.name}`,
        level: 'info',
        category: 'types',
        title: `Colonnes sensibles détectées dans "${table.name}"`,
        description: `Les colonnes [${sensitive.map(s => s.name).join(', ')}] devraient être hachées (pgcrypto) ou protégées par des politiques RLS strictes.`,
        tableName: table.name,
      });
    }
  }

  // Adjust score minimum
  score = Math.max(20, Math.min(100, score - missingIndexesCount * 2));

  return {
    score,
    rlsDisabledCount,
    missingIndexesCount,
    totalTables: tables.length,
    issues,
  };
}
