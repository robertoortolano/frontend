import { PERMISSION_TYPES, ALL_PERMISSION_TYPES } from '../constants/permissionTypes';

// Lightweight self-check (can be run ad-hoc or imported in a dev-only diagnostics page)
export function runPermissionTypesSelfCheck(): { ok: boolean; issues: string[] } {
  const issues: string[] = [];

  // 1) Canonical set should be uppercase plural
  for (const t of ALL_PERMISSION_TYPES) {
    if (t !== t.toUpperCase()) {
      issues.push(`Type '${t}' is not uppercase.`);
    }
    // naive plural check: ensure an 'S' at the end (except STATUS_OWNERS which ends with 'S' anyway)
    if (!t.endsWith('S')) {
      issues.push(`Type '${t}' does not end with 'S' (expected plural).`);
    }
  }

  // 2) No duplicates
  const dupCheck = new Set<string>();
  for (const t of ALL_PERMISSION_TYPES) {
    if (dupCheck.has(t)) {
      issues.push(`Duplicate type '${t}' detected.`);
    } else {
      dupCheck.add(t);
    }
  }

  // 3) Presence of required types
  const required = [
    PERMISSION_TYPES.WORKERS,
    PERMISSION_TYPES.CREATORS,
    PERMISSION_TYPES.STATUS_OWNERS,
    PERMISSION_TYPES.EXECUTORS,
    PERMISSION_TYPES.FIELD_OWNERS,
    PERMISSION_TYPES.FIELD_EDITORS,
    PERMISSION_TYPES.FIELD_VIEWERS,
  ];
  for (const r of required) {
    if (!ALL_PERMISSION_TYPES.includes(r)) {
      issues.push(`Missing required permission type '${r}'.`);
    }
  }

  return { ok: issues.length === 0, issues };
}



