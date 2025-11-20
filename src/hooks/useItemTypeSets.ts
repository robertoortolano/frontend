import { useEffect, useState } from "react";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import { ItemTypeSetDto, ProjectSummaryDto } from "../types/itemtypeset.types";
import { ItemTypeConfigurationViewDto } from "../types/workflow.types";

/**
 * Extended ItemTypeSet with projects array for display purposes
 */
export interface ItemTypeSetWithProjects extends ItemTypeSetDto {
  projects?: ProjectSummaryDto[];
}

/**
 * Options for filtering ItemTypeSets
 */
export interface UseItemTypeSetsOptions {
  /**
   * Filter ItemTypeSets that contain this ItemType in their configurations
   */
  filterByItemTypeId?: number;
  /**
   * Filter ItemTypeSets based on workflow configurations
   * The hook will extract ItemTypeSet IDs from the configurations
   */
  filterByWorkflowConfigurations?: ItemTypeConfigurationViewDto[];
}

/**
 * Hook to fetch and filter ItemTypeSets (global and project-scoped)
 * 
 * @param options - Filtering options
 * @returns Object containing itemTypeSets array and loading state
 * 
 * @example
 * // Filter by ItemType ID
 * const { itemTypeSets, loading } = useItemTypeSets({ filterByItemTypeId: 1 });
 * 
 * @example
 * // Filter by workflow configurations
 * const { itemTypeSets, loading } = useItemTypeSets({ 
 *   filterByWorkflowConfigurations: workflow.usedInItemTypeConfigurations 
 * });
 */
export function useItemTypeSets(
  options?: UseItemTypeSetsOptions
): {
  itemTypeSets: ItemTypeSetWithProjects[];
  loading: boolean;
} {
  const auth = useAuth();
  const token = auth?.token;
  const [itemTypeSets, setItemTypeSets] = useState<ItemTypeSetWithProjects[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Early return if no token
    if (!token) {
      setItemTypeSets([]);
      setLoading(false);
      return;
    }

    // Early return for workflow configurations filter if empty
    if (
      options?.filterByWorkflowConfigurations &&
      options.filterByWorkflowConfigurations.length === 0
    ) {
      setItemTypeSets([]);
      setLoading(false);
      return;
    }

    // Early return for itemTypeId filter if not provided
    if (options?.filterByItemTypeId === undefined && !options?.filterByWorkflowConfigurations) {
      setItemTypeSets([]);
      setLoading(false);
      return;
    }

    const fetchItemTypeSets = async () => {
      try {
        setLoading(true);

        // Fetch both global and project-scoped ItemTypeSets in parallel
        const [globalResponse, projectResponse] = await Promise.all([
          api
            .get("/item-type-sets/global", {
              headers: { Authorization: `Bearer ${token}` },
            })
            .catch(() => ({ data: [] })),
          api
            .get("/item-type-sets/project", {
              headers: { Authorization: `Bearer ${token}` },
            })
            .catch(() => ({ data: [] })),
        ]);

        // Combine all ItemTypeSets
        const allItemTypeSets: ItemTypeSetDto[] = [
          ...(globalResponse.data || []),
          ...(projectResponse.data || []),
        ];

        // Apply filters based on options
        let filteredSets: ItemTypeSetDto[] = allItemTypeSets;

        // Filter by ItemType ID
        if (options?.filterByItemTypeId !== undefined) {
          filteredSets = filteredSets.filter((its) =>
            its.itemTypeConfigurations?.some(
              (config) => config.itemType?.id === options.filterByItemTypeId
            )
          );
        }

        // Filter by workflow configurations
        if (options?.filterByWorkflowConfigurations) {
          // Extract ItemTypeSet IDs from workflow configurations
          // Note: In the backend, the ItemTypeSet ID is mapped as the ItemType ID
          const itemTypeSetIds = new Set(
            options.filterByWorkflowConfigurations
              .map((config) => config.itemType?.id)
              .filter((id): id is number => id !== undefined && id !== null)
          );

          if (itemTypeSetIds.size > 0) {
            filteredSets = filteredSets.filter((its) => itemTypeSetIds.has(its.id));
          } else {
            // No valid IDs found, return empty array
            filteredSets = [];
          }
        }

        // Map to add projects array for display purposes
        const mappedSets: ItemTypeSetWithProjects[] = filteredSets.map((its) => ({
          ...its,
          projects: its.projectsAssociation || [],
        }));

        setItemTypeSets(mappedSets);
      } catch (err: any) {
        console.error("Error loading item type sets", err);
        setItemTypeSets([]);
      } finally {
        setLoading(false);
      }
    };

    fetchItemTypeSets();
  }, [
    token,
    options?.filterByItemTypeId,
    options?.filterByWorkflowConfigurations,
  ]);

  return { itemTypeSets, loading };
}




