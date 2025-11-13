import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ItemTypeConfigurationMigrationImpactDto,
  SelectablePermissionImpact,
} from '../types/item-type-configuration-migration.types';

export type ItemTypeConfigurationWizardStepId =
  | 'overview'
  | 'permissions'
  | 'review';

export interface ItemTypeConfigurationWizardStep {
  id: ItemTypeConfigurationWizardStepId;
  label: string;
  description?: string;
}

export interface ItemTypeConfigurationWizardStats {
  preservable: number;
  removable: number;
  new: number;
  withRoles: number;
  selected: number;
  selectedWithRoles: number;
  configurationsCount: number;
}

interface UseItemTypeConfigurationMigrationWizardOptions {
  isOpen?: boolean;
}

interface UseItemTypeConfigurationMigrationWizardResult {
  steps: ItemTypeConfigurationWizardStep[];
  currentStep: ItemTypeConfigurationWizardStep;
  currentStepIndex: number;
  goToStep: (index: number) => void;
  goNext: () => void;
  goPrevious: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  preservedPermissionIdsMap: Map<number, Set<number>>;
  handlePreserveAllPreservable: () => void;
  handleRemoveAll: () => void;
  togglePermission: (configId: number, permissionId: number) => void;
  preserveAllPreservableActive: boolean;
  removeAllActive: boolean;
  stats: ItemTypeConfigurationWizardStats;
  getPermissionsForImpact: (
    impact: ItemTypeConfigurationMigrationImpactDto
  ) => SelectablePermissionImpact[];
  getPermissionsWithAssignmentsForImpact: (
    impact: ItemTypeConfigurationMigrationImpactDto
  ) => SelectablePermissionImpact[];
  getPermissionsWithAssignmentsFromAllImpacts: () => Array<{
    impact: ItemTypeConfigurationMigrationImpactDto;
    permission: SelectablePermissionImpact;
  }>;
  getPermissionName: (perm: SelectablePermissionImpact) => string;
}

export const useItemTypeConfigurationMigrationWizard = (
  impacts: ItemTypeConfigurationMigrationImpactDto[],
  options: UseItemTypeConfigurationMigrationWizardOptions = {}
): UseItemTypeConfigurationMigrationWizardResult => {
  const steps = useMemo<ItemTypeConfigurationWizardStep[]>(
    () => [
      {
        id: 'overview',
        label: 'Panoramica',
        description: 'Riepilogo modifiche e azioni rapide',
      },
      {
        id: 'permissions',
        label: 'Permessi',
        description: 'Configura le permission interessate',
      },
      {
        id: 'review',
        label: 'Conferma',
        description: 'Verifica finale e avvertenze',
      },
    ],
    []
  );

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [preservedPermissionIdsMap, setPreservedPermissionIdsMap] = useState<
    Map<number, Set<number>>
  >(new Map());
  const [preserveAllPreservableActive, setPreserveAllPreservableActive] =
    useState(false);
  const [removeAllActive, setRemoveAllActive] = useState(false);

  const getPermissionsForImpact = useCallback(
    (impact: ItemTypeConfigurationMigrationImpactDto) => [
      ...impact.fieldOwnerPermissions,
      ...impact.statusOwnerPermissions,
      ...impact.fieldStatusPermissions,
      ...impact.executorPermissions,
    ],
    []
  );

  const getPermissionsWithAssignmentsForImpact = useCallback(
    (impact: ItemTypeConfigurationMigrationImpactDto) =>
      getPermissionsForImpact(impact).filter((permission) => permission.hasAssignments),
    [getPermissionsForImpact]
  );

  const getPermissionsWithAssignmentsFromAllImpacts = useCallback(
    () =>
      impacts.flatMap((impact) =>
        getPermissionsWithAssignmentsForImpact(impact).map((permission) => ({
          impact,
          permission,
        }))
      ),
    [impacts, getPermissionsWithAssignmentsForImpact]
  );

  useEffect(() => {
    if (!options.isOpen) {
      return;
    }
    setCurrentStepIndex(0);
  }, [options.isOpen]);

  useEffect(() => {
    if (impacts.length === 0) {
      setPreservedPermissionIdsMap(new Map());
      setPreserveAllPreservableActive(false);
      setRemoveAllActive(false);
      return;
    }

    const nextMap = new Map<number, Set<number>>();

    impacts.forEach((impact) => {
      const defaults = getPermissionsForImpact(impact)
        .filter((permission) => permission.hasAssignments && permission.defaultPreserve)
        .map((permission) => permission.permissionId);

      if (defaults.length > 0) {
        nextMap.set(impact.itemTypeConfigurationId, new Set(defaults));
      }
    });

    setPreservedPermissionIdsMap(nextMap);
    setPreserveAllPreservableActive(false);
    setRemoveAllActive(false);
  }, [impacts, getPermissionsForImpact]);

  const handlePreserveAllPreservable = useCallback(() => {
    const nextMap = new Map<number, Set<number>>();

    impacts.forEach((impact) => {
      const preservable = getPermissionsForImpact(impact)
        .filter((permission) => permission.hasAssignments && permission.canBePreserved)
        .map((permission) => permission.permissionId);

      if (preservable.length > 0) {
        nextMap.set(impact.itemTypeConfigurationId, new Set(preservable));
      }
    });

    setPreservedPermissionIdsMap(nextMap);
    setPreserveAllPreservableActive(true);
    setRemoveAllActive(false);
  }, [impacts, getPermissionsForImpact]);

  const handleRemoveAll = useCallback(() => {
    setPreservedPermissionIdsMap(new Map());
    setRemoveAllActive(true);
    setPreserveAllPreservableActive(false);
  }, []);

  const togglePermission = useCallback((configId: number, permissionId: number) => {
    setPreservedPermissionIdsMap((prev) => {
      const next = new Map(prev);
      const currentSet = next.get(configId) ?? new Set<number>();
      const updatedSet = new Set(currentSet);

      if (updatedSet.has(permissionId)) {
        updatedSet.delete(permissionId);
      } else {
        updatedSet.add(permissionId);
      }

      if (updatedSet.size > 0) {
        next.set(configId, updatedSet);
      } else {
        next.delete(configId);
      }

      return next;
    });

    setPreserveAllPreservableActive(false);
    setRemoveAllActive(false);
  }, []);

  const stats = useMemo<ItemTypeConfigurationWizardStats>(() => {
    if (impacts.length === 0) {
      return {
        preservable: 0,
        removable: 0,
        new: 0,
        withRoles: 0,
        selected: 0,
        selectedWithRoles: 0,
        configurationsCount: 0,
      };
    }

    const permissionsWithRoles = getPermissionsWithAssignmentsFromAllImpacts();
    const preservable = permissionsWithRoles.filter(
      ({ permission }) => permission.canBePreserved
    ).length;
    const removable = permissionsWithRoles.filter(
      ({ permission }) => !permission.canBePreserved
    ).length;
    const withRoles = permissionsWithRoles.length;

    let selected = 0;
    let selectedWithRoles = 0;

    permissionsWithRoles.forEach(({ impact, permission }) => {
      const preservedSet = preservedPermissionIdsMap.get(
        impact.itemTypeConfigurationId
      );
      if (preservedSet?.has(permission.permissionId)) {
        selected += 1;
        selectedWithRoles += 1;
      }
    });

    const totalNew = impacts.reduce(
      (sum, impact) => sum + impact.totalNewPermissions,
      0
    );

    return {
      preservable,
      removable,
      new: totalNew,
      withRoles,
      selected,
      selectedWithRoles,
      configurationsCount: impacts.length,
    };
  }, [
    impacts,
    getPermissionsWithAssignmentsFromAllImpacts,
    preservedPermissionIdsMap,
  ]);

  const getPermissionName = useCallback((perm: SelectablePermissionImpact): string => {
    switch (perm.permissionType) {
      case 'FIELD_OWNERS':
        return `Field Owner - ${perm.fieldName || perm.entityName || 'N/A'}`;
      case 'STATUS_OWNERS':
        return `Status Owner - ${perm.entityName || 'N/A'}`;
      case 'FIELD_EDITORS':
      case 'EDITORS':
        return `Editor - ${perm.fieldName || 'N/A'} @ ${perm.workflowStatusName || 'N/A'}`;
      case 'FIELD_VIEWERS':
      case 'VIEWERS':
        return `Viewer - ${perm.fieldName || 'N/A'} @ ${perm.workflowStatusName || 'N/A'}`;
      case 'EXECUTORS': {
        const fromStatus = perm.fromStatusName || 'N/A';
        const toStatus = perm.toStatusName || 'N/A';
        const transitionName = perm.transitionName;
        const transitionPart = transitionName ? ` (${transitionName})` : '';
        return `Executor - ${fromStatus} -> ${toStatus}${transitionPart}`;
      }
      default:
        return `${perm.permissionType} - ${perm.itemTypeSetName || 'N/A'}`;
    }
  }, []);

  const goToStep = useCallback(
    (index: number) => {
      if (index < 0 || index >= steps.length) {
        return;
      }
      setCurrentStepIndex(index);
    },
    [steps.length]
  );

  const goNext = useCallback(() => {
    setCurrentStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
  }, [steps.length]);

  const goPrevious = useCallback(() => {
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  return {
    steps,
    currentStep,
    currentStepIndex,
    goToStep,
    goNext,
    goPrevious,
    isFirstStep,
    isLastStep,
    preservedPermissionIdsMap,
    handlePreserveAllPreservable,
    handleRemoveAll,
    togglePermission,
    preserveAllPreservableActive,
    removeAllActive,
    stats,
    getPermissionsForImpact,
    getPermissionsWithAssignmentsForImpact,
    getPermissionsWithAssignmentsFromAllImpacts,
    getPermissionName,
  };
};






