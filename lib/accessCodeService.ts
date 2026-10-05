export interface AccessCode {
  id: string;
  code: string;
  label: string;
  createdAt: string;
  expiresAt?: string;
  createdVia: 'admin_generator' | 'master_key';
}

export const STORAGE_KEY_AUTH = 'supasync_is_authenticated';
export const STORAGE_KEY_MASTER_PWD = 'supasync_master_password';
export const STORAGE_KEY_ACCESS_CODES = 'supasync_access_codes';
export const DEFAULT_MASTER_PASSWORD = 'SupaSync-Admin-2026!#9xK$8mP';

export function getStoredMasterPassword(): string {
  if (typeof window === 'undefined') return DEFAULT_MASTER_PASSWORD;
  return localStorage.getItem(STORAGE_KEY_MASTER_PWD) || DEFAULT_MASTER_PASSWORD;
}

export function getStoredAccessCodes(): AccessCode[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACCESS_CODES);
    if (!raw) {
      // Default initial access codes if none exist
      const defaultCodes: AccessCode[] = [
        {
          id: 'code-master-admin',
          code: DEFAULT_MASTER_PASSWORD,
          label: 'Clé Maître Administrateur',
          createdAt: new Date().toISOString(),
          createdVia: 'master_key',
        },
      ];
      localStorage.setItem(STORAGE_KEY_ACCESS_CODES, JSON.stringify(defaultCodes));
      return defaultCodes;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveAccessCodes(codes: AccessCode[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_ACCESS_CODES, JSON.stringify(codes));
  }
}

export function generateNewAccessCode(label: string = 'Code d\'accès Invité'): AccessCode {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randomSegment1 = '';
  let randomSegment2 = '';
  
  if (typeof window !== 'undefined' && window.crypto) {
    const arr = new Uint32Array(8);
    window.crypto.getRandomValues(arr);
    for (let i = 0; i < 4; i++) randomSegment1 += chars[arr[i] % chars.length];
    for (let i = 4; i < 8; i++) randomSegment2 += chars[arr[i] % chars.length];
  } else {
    for (let i = 0; i < 4; i++) randomSegment1 += chars.charAt(Math.floor(Math.random() * chars.length));
    for (let i = 0; i < 4; i++) randomSegment2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const codeString = `CODE-${randomSegment1}-${randomSegment2}`;

  const newCode: AccessCode = {
    id: `code-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    code: codeString,
    label: label.trim() || 'Code d\'accès Invité',
    createdAt: new Date().toISOString(),
    createdVia: 'admin_generator',
  };

  const current = getStoredAccessCodes();
  const updated = [newCode, ...current];
  saveAccessCodes(updated);
  return newCode;
}

export function revokeAccessCode(id: string): AccessCode[] {
  const current = getStoredAccessCodes();
  const updated = current.filter((c) => c.id !== id);
  saveAccessCodes(updated);
  return updated;
}

export function validateCandidateCode(candidate: string): boolean {
  if (!candidate || !candidate.trim()) return false;
  const input = candidate.trim();

  // Check master password
  const master = getStoredMasterPassword();
  if (input === master || input === DEFAULT_MASTER_PASSWORD) {
    return true;
  }

  // Check generated access codes
  const codes = getStoredAccessCodes();
  return codes.some((c) => c.code === input);
}
