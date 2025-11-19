import { useEffect, useState } from "react";
import api from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import { ItemTypeSetDto, ProjectSummaryDto } from "../../types/itemtypeset.types";
import CardListModal, { CardListModalItem } from "./CardListModal";
import ProjectBadges from "./ProjectBadges";
import CardItemWrapper from "./CardItemWrapper";
import DefaultBadge from "./DefaultBadge";

interface ItemTypeSetsPopupProps {
  itemTypeId: number;
}

interface ItemTypeSetWithProjects extends Omit<CardListModalItem, 'id'>, ItemTypeSetDto {
  projects?: ProjectSummaryDto[];
}

export default function ItemTypeSetsPopup({ itemTypeId }: ItemTypeSetsPopupProps) {
  const auth = useAuth() as any;
  const token = auth?.token;
  const [itemTypeSets, setItemTypeSets] = useState<ItemTypeSetWithProjects[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !itemTypeId) return;

    const fetchItemTypeSets = async () => {
      try {
        setLoading(true);
        // Ottieni tutti gli ItemTypeSet (globali e di progetto)
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

        // Filtra gli ItemTypeSet che contengono questo ItemType nelle loro configurazioni
        const filteredSets = allItemTypeSets
          .filter((its) =>
            its.itemTypeConfigurations?.some(
              (config) => config.itemType?.id === itemTypeId
            )
          )
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
  }, [token, itemTypeId]);

  const renderItemTypeSet = (its: ItemTypeSetWithProjects) => {
    // Prepara i progetti con itemTypeSetName per ProjectBadges
    const projects = (its.projects || []).map((project) => ({
      ...project,
      itemTypeSetName: its.name,
    }));
    
    const badges = [];
    if (its.defaultItemTypeSet) {
      badges.push(<DefaultBadge key="default" />);
    }
    badges.push(<ProjectBadges key="projects" projects={projects} />);
    
    return (
      <CardItemWrapper
        key={its.id}
        title={its.name}
        badges={badges}
      />
    );
  };

  if (loading) {
    return <span style={{ color: "#6b7280", fontSize: "0.875rem" }}>Caricamento...</span>;
  }

  return (
    <CardListModal<ItemTypeSetWithProjects>
      triggerLabel={`${itemTypeSets.length} ITS${itemTypeSets.length !== 1 ? '' : ''}`}
      triggerDisabled={itemTypeSets.length === 0}
      triggerTitle={
        itemTypeSets.length === 0
          ? "Nessun ItemTypeSet"
          : "Visualizza dettagli ItemTypeSet"
      }
      title="ItemTypeSet associati"
      items={itemTypeSets}
      summary={{
        label: "Totale ItemTypeSet",
        value: itemTypeSets.length,
      }}
      renderCard={renderItemTypeSet}
    />
  );
}

