import CardListModal, { CardListModalItem } from "./CardListModal";
import ProjectBadges from "./ProjectBadges";
import CardItemWrapper from "./CardItemWrapper";
import DefaultBadge from "./DefaultBadge";
import { useItemTypeSets, ItemTypeSetWithProjects } from "../../hooks/useItemTypeSets";

interface ItemTypeSetsPopupProps {
  itemTypeId: number;
}

export default function ItemTypeSetsPopup({ itemTypeId }: ItemTypeSetsPopupProps) {
  const { itemTypeSets, loading } = useItemTypeSets({
    filterByItemTypeId: itemTypeId,
  });

  const renderItemTypeSet = (its: ItemTypeSetWithProjects & CardListModalItem) => {
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

