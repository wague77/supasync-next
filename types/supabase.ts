export interface TableColumn {
  name: string;
  type: string; // e.g. uuid, text, integer, bigint, boolean, timestamp, timestamptz, jsonb, vector, etc.
  format?: string;
  isPrimary: boolean;
  isNullable: boolean;
  defaultValue?: string | null;
  description?: string;
  foreignKey?: {
    targetTable: string;
    targetColumn: string;
    onDelete?: string;
    onUpdate?: string;
  };
}

export interface TablePolicy {
  name: string;
  command: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL';
  roles: string[];
  definition?: string;
  check?: string;
}

export interface TableSchema {
  name: string;
  schema: string;
  description?: string;
  columns: TableColumn[];
  primaryKeys: string[];
  rowCount?: number;
  rlsEnabled: boolean;
  sampleRows?: Record<string, any>[];
  policies?: TablePolicy[];
}

export interface Relationship {
  id: string;
  sourceTable: string;
  sourceColumn: string;
  targetTable: string;
  targetColumn: string;
  type: '1:1' | '1:N' | 'N:1' | 'N:N';
}

export interface StorageBucket {
  id: string;
  name: string;
  public: boolean;
  fileSizeLimit?: number;
  allowedMimeTypes?: string[];
}

export interface SecurityIssue {
  id: string;
  level: 'critical' | 'warning' | 'info' | 'good';
  category: 'rls' | 'index' | 'types' | 'keys';
  title: string;
  description: string;
  tableName?: string;
  sqlFix?: string;
}

export interface SecurityAudit {
  score: number; // 0-100
  rlsDisabledCount: number;
  missingIndexesCount: number;
  totalTables: number;
  issues: SecurityIssue[];
}

export interface ProjectInfo {
  url: string;
  ref?: string;
  name?: string;
  region?: string;
  postgrestVersion?: string;
  latencyMs: number;
  checkedAt: string;
  connectedVia: 'url_key' | 'management_api' | 'demo_preset';
}

export interface DatabaseIntrospectionResult {
  projectInfo: ProjectInfo;
  tables: TableSchema[];
  views: { name: string; columns: TableColumn[] }[];
  relationships: Relationship[];
  storageBuckets: StorageBucket[];
  securityAudit: SecurityAudit;
}

export interface SupabaseProjectOption {
  id: string;
  name: string;
  ref: string;
  region: string;
  status: string;
  created_at: string;
  database?: {
    host?: string;
    version?: string;
  };
}

export type ConfigLanguage = 'typescript' | 'sql' | 'prisma' | 'python' | 'flutter' | 'env';
export type ConfigOutput = 'drizzle' | 'prisma' | 'types' | 'sql_ddl' | 'sql_rls' | 'client' | 'env' | 'seed';
