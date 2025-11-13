import { useState, useEffect } from "react";
import { Loader2, Check } from "lucide-react";
import { Panel } from "../../../components/shared/layout";
import { ItemTypeSetInfo } from "./ItemTypeSetInfo";
import { ItemTypeSetDto } from "../../../types/itemtypeset.types";
import api from "../../../api/api";
import buttons from "../../../styles/common/Buttons.module.css";
import form from "../../../styles/common/Forms.module.css";
import layout from "../../../styles/common/Layout.module.css";
import utilities from "../../../styles/common/Utilities.module.css";

interface ItemTypeSetChangePanelProps {
  itemTypeSet: any;
  projectId: string;
  isTenantAdmin: boolean;
  isProjectAdmin: boolean;
  canChangeItemTypeSet: boolean;
  isUpdatingItemTypeSet: boolean;
  onItemTypeSetChange: (itemTypeSetId: number) => void;
}

export function ItemTypeSetChangePanel({
  itemTypeSet,
  projectId,
  isTenantAdmin,
  isProjectAdmin,
  canChangeItemTypeSet,
  isUpdatingItemTypeSet,
  onItemTypeSetChange,
}: ItemTypeSetChangePanelProps) {
  const [isChanging, setIsChanging] = useState(false);
  const [availableItemTypeSets, setAvailableItemTypeSets] = useState<ItemTypeSetDto[]>([]);
  const [selectedItemTypeSet, setSelectedItemTypeSet] = useState<ItemTypeSetDto | null>(null);
  const [loading, setLoading] = useState(false);

  const hasOtherItemTypeSets = canChangeItemTypeSet && (
    availableItemTypeSets.length > 1 || 
    (availableItemTypeSets.length === 1 && availableItemTypeSets[0].id !== itemTypeSet.id)
  );

  useEffect(() => {
    if (canChangeItemTypeSet) {
      fetchAvailableItemTypeSets();
    }
  }, [canChangeItemTypeSet, isTenantAdmin, isProjectAdmin, projectId]);

  const filterItemTypeSetsForProject = (sets: ItemTypeSetDto[]): ItemTypeSetDto[] => {
    const currentProjectId = projectId ? Number(projectId) : null;

    return sets.filter((set) => {
      if (set.scope === 'TENANT') {
        return true;
      }

      if (!currentProjectId) {
        return false;
      }

      return set.project?.id === currentProjectId;
    });
  };

  const fetchAvailableItemTypeSets = async () => {
    if (!canChangeItemTypeSet) {
      setAvailableItemTypeSets([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      if (isTenantAdmin && projectId) {
        // Per Tenant Admin: tutti gli ITS globali + tutti quelli definiti nel progetto stesso
        try {
          const response = await api.get(`/item-type-sets/available-for-project/${projectId}`);
          const sets: ItemTypeSetDto[] = response.data || [];
          setAvailableItemTypeSets(sets);
        } catch (err: any) {
          console.error("Error fetching available ItemTypeSets for project:", err);
          // Fallback: usa il metodo precedente
          try {
            const [globalResponse, projectResponse] = await Promise.all([
              api.get('/projects/available-item-type-sets'),
              api.get('/item-type-sets/project')
            ]);
            const globalSets: ItemTypeSetDto[] = globalResponse.data || [];
            const projectSets: ItemTypeSetDto[] = projectResponse.data || [];
            const allSets = [...globalSets, ...projectSets];
            setAvailableItemTypeSets(filterItemTypeSetsForProject(allSets));
          } catch (fallbackErr: any) {
            console.error("Error in fallback fetch:", fallbackErr);
            setAvailableItemTypeSets([]);
          }
        }
      } else if (isProjectAdmin && projectId) {
        const response = await api.get(`/item-type-sets/project/${projectId}`);
        const projectSets: ItemTypeSetDto[] = response.data || [];
        setAvailableItemTypeSets(projectSets);
      }
    } catch (err: any) {
      console.error("Error fetching ItemTypeSets:", err);
      setAvailableItemTypeSets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChange = () => {
    if (!canChangeItemTypeSet) {
      return;
    }
    setIsChanging(true);
    fetchAvailableItemTypeSets();
  };

  const handleCancelChange = () => {
    setIsChanging(false);
    setSelectedItemTypeSet(null);
  };

  const handleApplyChange = () => {
    if (!canChangeItemTypeSet) {
      return;
    }
    if (selectedItemTypeSet) {
      onItemTypeSetChange(selectedItemTypeSet.id);
      setIsChanging(false);
      setSelectedItemTypeSet(null);
    }
  };

  return (
    <Panel
      title="Cambia ItemTypeSet"
      headingLevel="h3"
      bodyClassName="space-y-4"
    >
      {!canChangeItemTypeSet ? (
        <div className="text-sm text-gray-500">
          Solo un Tenant Admin può sostituire un ItemTypeSet globale applicato al progetto.
        </div>
      ) : !hasOtherItemTypeSets && !loading ? (
        <div className="text-sm text-gray-500">
          Non ci sono altri ItemTypeSet disponibili per il cambio.
        </div>
      ) : !isChanging ? (
        <button
          className={`${buttons.button} ${utilities.mt4}`}
          onClick={handleStartChange}
          disabled={isUpdatingItemTypeSet || !hasOtherItemTypeSets}
          title={
            !hasOtherItemTypeSets
              ? "Non ci sono altri ItemTypeSet disponibili"
              : "Cambia ItemTypeSet"
          }
        >
          Cambia ItemTypeSet
        </button>
      ) : (
        <div className="space-y-4">
          <div>
            <label className={form.label}>Seleziona nuovo ItemTypeSet</label>
            <select
              className={form.select}
              value={selectedItemTypeSet?.id || ""}
              onChange={(e) => {
                const selectedId = parseInt(e.target.value, 10);
                const selected = availableItemTypeSets.find(
                  (its) => its.id === selectedId
                );
                setSelectedItemTypeSet(selected || null);
              }}
              disabled={loading || isUpdatingItemTypeSet}
            >
              <option value="">-- Seleziona un ItemTypeSet --</option>
              {availableItemTypeSets
                .filter((its) => its.id !== itemTypeSet.id)
                .map((its) => (
                  <option key={its.id} value={its.id}>
                    {its.name} {its.defaultItemTypeSet ? "(Default)" : ""}
                  </option>
                ))}
            </select>
            {loading && (
              <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                <Loader2 size={14} className="animate-spin" />
                Caricamento ItemTypeSet...
              </div>
            )}
          </div>

          {selectedItemTypeSet && (
            <ItemTypeSetInfo
              itemTypeSet={selectedItemTypeSet}
              title="Anteprima nuovo ItemTypeSet"
              panelOverrides={{ className: "bg-blue-50 border border-blue-200" }}
            />
          )}

          <div className={layout.buttonRow}>
            <button
              onClick={handleCancelChange}
              className={buttons.button}
              disabled={isUpdatingItemTypeSet}
            >
              Annulla
            </button>
            <button
              onClick={handleApplyChange}
              className={`${buttons.button} flex items-center gap-2`}
              disabled={!selectedItemTypeSet || isUpdatingItemTypeSet}
            >
              {isUpdatingItemTypeSet ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Applicazione...
                </>
              ) : (
                <>
                  <Check size={16} />
                  Applica al Progetto
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </Panel>
  );
}

