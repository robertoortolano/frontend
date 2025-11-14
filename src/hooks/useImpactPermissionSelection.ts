import { useEffect, useMemo, useState } from 'react';
import { ImpactPermissionRow } from '../types/impact-permission.types';

export interface ImpactPermissionSelection {
  preservedIds: Set<number>;
  isSelected: (permissionId: number | null) => boolean;
  canToggle: (permissionId: number | null) => boolean;
  toggle: (permissionId: number | null) => void;
  preserveAll: () => void;
  removeAll: () => void;
}

/**
 * Gestisce la selezione (mantieni/rimuovi) delle permission nei report di impatto.
 * Inizializza automaticamente le permission preservabili con defaultPreserve = true.
 */
export const useImpactPermissionSelection = (
  permissions: ImpactPermissionRow[]
): ImpactPermissionSelection => {
  const [preservedIds, setPreservedIds] = useState<Set<number>>(new Set());

  const permissionById = useMemo(() => {
    const map = new Map<number, ImpactPermissionRow>();
    permissions.forEach((permission) => {
      if (permission.id != null) {
        map.set(permission.id, permission);
      }
    });
    return map;
  }, [permissions]);

  useEffect(() => {
    const defaults = new Set<number>();
    permissions.forEach((permission) => {
      if (
        permission.id != null &&
        permission.canPreserve &&
        permission.defaultPreserve
      ) {
        defaults.add(permission.id);
      }
    });
    setPreservedIds(defaults);
  }, [permissions]);

  const isSelected = (permissionId: number | null): boolean => {
    if (permissionId == null) {
      return false;
    }
    return preservedIds.has(permissionId);
  };

  const canToggle = (permissionId: number | null): boolean => {
    if (permissionId == null) {
      return false;
    }
    const permission = permissionById.get(permissionId);
    return Boolean(permission?.canPreserve);
  };

  const toggle = (permissionId: number | null) => {
    if (!canToggle(permissionId)) {
      return;
    }
    setPreservedIds((prev) => {
      const next = new Set(prev);
      if (permissionId != null) {
        if (next.has(permissionId)) {
          next.delete(permissionId);
        } else {
          next.add(permissionId);
        }
      }
      return next;
    });
  };

  const preserveAll = () => {
    const next = new Set<number>();
    permissions.forEach((permission) => {
      if (permission.id != null && permission.canPreserve) {
        next.add(permission.id);
      }
    });
    setPreservedIds(next);
  };

  const removeAll = () => {
    setPreservedIds(new Set());
  };

  return {
    preservedIds,
    isSelected,
    canToggle,
    toggle,
    preserveAll,
    removeAll
  };
};










