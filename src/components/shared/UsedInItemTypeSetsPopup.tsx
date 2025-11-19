import { useEffect, useState } from "react";
import api from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import { WorkflowDetailDto } from "../../types/workflow.types";
import { ItemTypeSetDto, ProjectSummaryDto } from "../../types/itemtypeset.types";
import CardListModal, { CardListModalItem } from "./CardListModal";
import ProjectBadges from "./ProjectBadges";

interface UsedInItemTypeSetsPopupProps {
  workflow: WorkflowDetailDto;
}

interface ItemTypeSetWithProjects extends Omit<CardListModalItem, 'id'>, ItemTypeSetDto {
  projects?: ProjectSummaryDto[];
}

export default function UsedInItemTypeSetsPopup({ workflow }: UsedInItemTypeSetsPopupProps) {
  const auth = useAuth() as any;
  const token = auth?.token;
  const [itemTypeSets, setItemTypeSets] = useState<ItemTypeSetWithProjects[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !workflow.usedInItemTypeConfigurations || workflow.usedInItemTypeConfigurations.length === 0) {
      setItemTypeSets([]);
      setLoading(false);
      return;
    }

    const fetchItemTypeSets = async () => {
      try {
        setLoading(true);
        // Estrai gli ID degli ItemTypeSet dalle configurazioni
        // Nota: nel backend, l'ID dell'ItemTypeSet viene mappato come ID dell'ItemType
        const itemTypeSetIds = new Set(
          workflow.usedInItemTypeConfigurations
            .map((config) => config.itemType?.id)
            .filter((id): id is number => id !== undefined && id !== null)
        );

        if (itemTypeSetIds.size === 0) {
          setItemTypeSets([]);
          return;
        }

        // Recupera tutti gli ItemTypeSet (globali e di progetto)
        const [globalResponse, projectResponse] = await Promise.all([
          api.get("/item-type-sets/global", {
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => ({ data: [] })),
          api.get("/item-type-sets/project", {
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => ({ data: [] })),
        ]);

        const allItemTypeSets: ItemTypeSetDto[] = [
          ...(globalResponse.data || []),
          ...(projectResponse.data || []),
        ];

        // Filtra gli ItemTypeSet che sono nella lista degli ID
        const filteredSets = allItemTypeSets
          .filter((its) => itemTypeSetIds.has(its.id))
          .map((its) => ({
            ...its,
            projects: its.projectsAssociation || [],
          }));

        setItemTypeSets(filteredSets);
      } catch (err: any) {
        console.error("Error loading item type sets", err);
        setItemTypeSets([]);
      } finally {
        setLoading(false);
      }
    };

    fetchItemTypeSets();
  }, [token, workflow.usedInItemTypeConfigurations]);

  const renderItemTypeSet = (its: ItemTypeSetWithProjects) => {
    // Prepara i progetti con itemTypeSetName per ProjectBadges
    const projects = (its.projects || []).map((project) => ({
      ...project,
      itemTypeSetName: its.name,
    }));

    return (
      <div
        key={its.id}
        style={{
          padding: "0.75rem",
          borderBottom: "1px solid #e5e7eb",
          backgroundColor: "#f9fafb",
          borderRadius: "0.375rem",
          marginBottom: "0.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
          <strong style={{ color: "#1e3a8a", fontSize: "0.875rem" }}>
            {its.name}
          </strong>
          {its.defaultItemTypeSet && (
            <span
              style={{
                fontSize: "0.625rem",
                padding: "0.125rem 0.375rem",
                backgroundColor: "#dbeafe",
                color: "#1e40af",
                borderRadius: "0.25rem",
                fontWeight: "500",
              }}
            >
              Default
            </span>
          )}
          <ProjectBadges projects={projects} />
        </div>
      </div>
    );
  };

  if (loading) {
    return <span style={{ color: "#6b7280", fontSize: "0.875rem" }}>Caricamento...</span>;
  }

  return (
    <CardListModal<ItemTypeSetWithProjects>
      triggerLabel={`${itemTypeSets.length} ItemTypeSet${itemTypeSets.length !== 1 ? "s" : ""}`}
      triggerDisabled={itemTypeSets.length === 0}
      triggerTitle={
        itemTypeSets.length === 0
          ? "Nessun ItemTypeSet"
          : "Visualizza dettagli ItemTypeSet"
      }
      title="ItemTypeSet che utilizzano questo workflow"
      items={itemTypeSets}
      summary={{
        label: "Totale ItemTypeSet",
        value: itemTypeSets.length,
      }}
      renderCard={renderItemTypeSet}
    />
  );
}
