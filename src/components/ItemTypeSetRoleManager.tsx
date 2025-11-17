import { useCallback, useMemo, useState, useEffect } from "react";
import { Users, Shield, Edit, Eye, Plus } from "lucide-react";
import api from "../api/api";
import PermissionFilters, { FilterValues } from "./PermissionFilters";

import layout from "../styles/common/Layout.module.css";
import alert from "../styles/common/Alerts.module.css";

import { useItemTypeSetPermissions } from "../hooks/useItemTypeSetPermissions";
import { usePermissionFiltering } from "../hooks/usePermissionFiltering";
import {
  RoleTypeSection,
  RoleTypeSectionMeta,
} from "./itemTypeSetRoleManager/RoleTypeSection";
import { RolesDetailsModal } from "./itemTypeSetRoleManager/RolesDetailsModal";
import { GrantDetailsModal } from "./itemTypeSetRoleManager/GrantDetailsModal";
import { GrantDetailsRequest } from "./itemTypeSetRoleManager/RoleAssignmentsCell";

interface ItemTypeSetRoleManagerProps {
  itemTypeSetId: number;
  onPermissionGrantClick?: (permission: any) => void;
  refreshTrigger?: number;
  projectId?: string;
  showOnlyWithAssignments?: boolean;
  showOnlyProjectGrants?: boolean;
  includeProjectAssignments?: boolean;
}

interface RolesDetailsState {
  permissionName: string;
  roles: string[];
}

interface GrantDetailsState {
  projectId: number;
  projectName: string;
  roleId: number;
  details: any;
  isProjectGrant: boolean;
}

const DEFAULT_FILTERS: FilterValues = {
  permission: "All",
  itemTypes: ["All"],
  status: "All",
  field: "All",
  workflow: "All",
  grant: "All",
};

const ROLE_ORDER = [
  "WORKERS",
  "CREATORS",
  "STATUS_OWNERS",
  "EXECUTORS",
  "FIELD_OWNERS",
  "FIELD_EDITORS",
  "FIELD_VIEWERS",
];

const ROLE_TYPES: Record<string, RoleTypeSectionMeta> = {
  WORKERS: {
    label: "Workers",
    icon: Users,
    color: "blue",
    description: "Per ogni ItemType",
  },
  STATUS_OWNERS: {
    label: "Status Owners",
    icon: Shield,
    color: "green",
    description: "Per ogni WorkflowStatus",
  },
  FIELD_OWNERS: {
    label: "Field Owners",
    icon: Edit,
    color: "purple",
    description: "Per ogni FieldConfiguration (sempre)",
  },
  CREATORS: {
    label: "Creators",
    icon: Plus,
    color: "orange",
    description: "Per ogni Workflow",
  },
  EXECUTORS: {
    label: "Executors",
    icon: Shield,
    color: "red",
    description: "Per ogni Transition",
  },
  FIELD_EDITORS: {
    label: "Editors",
    icon: Edit,
    color: "indigo",
    description: "Per coppia (Field + Status)",
  },
  FIELD_VIEWERS: {
    label: "Viewers",
    icon: Eye,
    color: "gray",
    description: "Per coppia (Field + Status)",
  },
};

const buildPermissionName = (role: any): string => {
  if (role?.name) {
    return role.name;
  }

  const parts: string[] = [];

  if (role?.itemType) {
    parts.push(`ItemType: ${role.itemType.name}`);
  }
  if (role?.workflowStatus) {
    parts.push(`Status: ${role.workflowStatus.name}`);
  }
  if (role?.transition) {
    const from = role.fromStatus?.name || "N/A";
    const to = role.toStatus?.name || "N/A";
    const transitionName =
      role.transition.name && role.transition.name !== "N/A"
        ? ` (${role.transition.name})`
        : "";
    parts.push(`Transition: ${from} → ${to}${transitionName}`);
  }
  if (role?.fieldConfiguration) {
    parts.push(`Field: ${role.fieldConfiguration.name}`);
  }

  return parts.length > 0 ? parts.join(", ") : "Permission";
};

// Funzione helper per ottenere la chiave localStorage univoca per i filtri
const getFiltersStorageKey = (itemTypeSetId: number, projectId?: string): string => {
  const baseKey = `permission-filters-${itemTypeSetId}`;
  return projectId ? `${baseKey}-project-${projectId}` : baseKey;
};

// Funzione helper per caricare i filtri da localStorage
const loadFiltersFromStorage = (
  itemTypeSetId: number,
  projectId: string | undefined,
  showOnlyWithAssignments: boolean
): FilterValues => {
  try {
    const storageKey = getFiltersStorageKey(itemTypeSetId, projectId);
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Assicuriamoci che i filtri caricati abbiano la struttura corretta
      return {
        permission: parsed.permission || DEFAULT_FILTERS.permission,
        itemTypes: Array.isArray(parsed.itemTypes) ? parsed.itemTypes : DEFAULT_FILTERS.itemTypes,
        status: parsed.status || DEFAULT_FILTERS.status,
        field: parsed.field || DEFAULT_FILTERS.field,
        workflow: parsed.workflow || DEFAULT_FILTERS.workflow,
        grant: showOnlyWithAssignments ? "Y" : (parsed.grant || DEFAULT_FILTERS.grant),
      };
    }
  } catch (error) {
    console.warn("Errore nel caricamento dei filtri da localStorage:", error);
  }
  return {
    ...DEFAULT_FILTERS,
    grant: showOnlyWithAssignments ? "Y" : "All",
  };
};

// Funzione helper per salvare i filtri in localStorage
const saveFiltersToStorage = (
  filters: FilterValues,
  itemTypeSetId: number,
  projectId: string | undefined
): void => {
  try {
    const storageKey = getFiltersStorageKey(itemTypeSetId, projectId);
    localStorage.setItem(storageKey, JSON.stringify(filters));
  } catch (error) {
    console.warn("Errore nel salvataggio dei filtri in localStorage:", error);
  }
};

export default function ItemTypeSetRoleManager({
  itemTypeSetId,
  onPermissionGrantClick,
  refreshTrigger,
  projectId,
  showOnlyWithAssignments = false,
  showOnlyProjectGrants = false,
  includeProjectAssignments = true,
}: ItemTypeSetRoleManagerProps) {
  // Carica i filtri da localStorage all'inizializzazione
  const [filters, setFilters] = useState<FilterValues>(() =>
    loadFiltersFromStorage(itemTypeSetId, projectId, showOnlyWithAssignments)
  );

  // Ricarica i filtri quando cambiano itemTypeSetId o projectId
  useEffect(() => {
    const loadedFilters = loadFiltersFromStorage(itemTypeSetId, projectId, showOnlyWithAssignments);
    setFilters(loadedFilters);
  }, [itemTypeSetId, projectId, showOnlyWithAssignments]);

  // Salva i filtri in localStorage quando cambiano
  useEffect(() => {
    saveFiltersToStorage(filters, itemTypeSetId, projectId);
  }, [filters, itemTypeSetId, projectId]);

  const [selectedRolesDetails, setSelectedRolesDetails] =
    useState<RolesDetailsState | null>(null);
  const [selectedGrantDetails, setSelectedGrantDetails] =
    useState<GrantDetailsState | null>(null);
  const [loadingGrantPopup, setLoadingGrantPopup] = useState(false);

  const { roles, loading, error, grantDetailsMap } = useItemTypeSetPermissions({
    itemTypeSetId,
    refreshTrigger,
    projectId,
    showOnlyProjectGrants,
    includeProjectAssignments,
  });

  const { groupedRoles, filteredRoles, allPermissions, totalCount, filteredCount } =
    usePermissionFiltering({
      roles,
      filters,
      showOnlyWithAssignments,
      showOnlyProjectGrants,
      includeProjectAssignments,
    });

  const getPermissionName = useCallback(buildPermissionName, []);

  const visibleRoleTypes = useMemo(
    () => ROLE_ORDER.filter((roleType) => filteredRoles[roleType]?.length),
    [filteredRoles]
  );

  const hasRolesConfigured = useMemo(
    () => Object.keys(groupedRoles).length > 0,
    [groupedRoles]
  );

  const handleShowRoles = useCallback(
    (permissionName: string, rolesList: string[]) => {
      if (!rolesList || rolesList.length === 0) {
        return;
      }
      setSelectedRolesDetails({
        permissionName,
        roles: rolesList,
      });
    },
    []
  );

  const handleFetchGrantDetails = useCallback(
    async ({
      permissionId,
      permissionType,
      variant,
      projectId: targetProjectId,
      projectName,
    }: GrantDetailsRequest) => {
      if (!permissionId || !permissionType) {
        return;
      }

      if (variant === "project" && (targetProjectId == null || Number.isNaN(Number(targetProjectId)))) {
        return;
      }

      setLoadingGrantPopup(true);

      try {
        const url =
          variant === "project" && targetProjectId != null
            ? `/project-permission-assignments/${permissionType}/${permissionId}/project/${targetProjectId}`
            : `/permission-assignments/${permissionType}/${permissionId}`;

        const response = await api.get(url);
        const assignment = response.data;

        setSelectedGrantDetails({
          projectId:
            variant === "project" && targetProjectId != null
              ? Number(targetProjectId)
              : 0,
          projectName:
            projectName || (variant === "project" ? "Progetto" : "Globale"),
          roleId: permissionId,
          details: assignment?.grant || {},
          isProjectGrant: variant === "project",
        });
      } catch (err) {
        const message =
          variant === "project"
            ? "Errore nel recupero dei dettagli della grant di progetto"
            : "Errore nel recupero dei dettagli della grant globale";
        window.alert(message);
      } finally {
        setLoadingGrantPopup(false);
      }
    },
    []
  );

  const handleCloseRolesModal = useCallback(() => {
    setSelectedRolesDetails(null);
  }, []);

  const handleCloseGrantModal = useCallback(() => {
    setSelectedGrantDetails(null);
  }, []);

  if (loading) {
    return <div className={layout.loading}>Caricamento permissions...</div>;
  }

  if (error) {
    return <div className={alert.error}>{error}</div>;
  }

  return (
    <div className="w-full">
      {!hasRolesConfigured ? (
        <div className={alert.info}>
          <p>Nessuna permission configurata per questo ItemTypeSet.</p>
          <p className="mt-2">
            Le permissions vengono create automaticamente quando si crea o
            modifica un ItemTypeSet.
          </p>
        </div>
      ) : (
        <>
          <PermissionFilters
            permissions={allPermissions}
            onFilterChange={(newFilters) => {
              setFilters(newFilters);
            }}
            totalCount={totalCount}
            filteredCount={filteredCount}
            hideGrantFilter={showOnlyWithAssignments}
            initialFilters={filters}
          />

          {visibleRoleTypes.length === 0 ? (
            <div className={alert.info}>
              <p>Nessuna permission corrisponde ai filtri selezionati.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {visibleRoleTypes.map((roleType) => (
                <RoleTypeSection
                  key={roleType}
                  roleType={roleType}
                  roles={filteredRoles[roleType]}
                  meta={
                    ROLE_TYPES[roleType] || {
                      label: roleType,
                      icon: Users,
                      color: "gray",
                      description: "",
                    }
                  }
                  grantDetailsMap={grantDetailsMap}
                  projectId={projectId}
                  showOnlyProjectGrants={showOnlyProjectGrants}
                  includeProjectAssignments={includeProjectAssignments}
                  onPermissionGrantClick={onPermissionGrantClick}
                  onShowRoles={handleShowRoles}
                  onShowGrant={handleFetchGrantDetails}
                  getPermissionName={getPermissionName}
                />
              ))}
            </div>
          )}
        </>
      )}

      <RolesDetailsModal details={selectedRolesDetails} onClose={handleCloseRolesModal} />
      <GrantDetailsModal
        details={selectedGrantDetails}
        loading={loadingGrantPopup}
        onClose={handleCloseGrantModal}
      />
    </div>
  );
}

