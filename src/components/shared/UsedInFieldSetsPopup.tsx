import CardListModal, { CardListModalItem } from "./CardListModal";
import { FieldConfigurationViewDto, SimpleFieldSetDto } from "../../types/field.types";
import ProjectBadges from "./ProjectBadges";
import CardItemWrapper from "./CardItemWrapper";

interface UsedInFieldSetsPopupProps {
  configs: FieldConfigurationViewDto;
}

export default function UsedInFieldSetsPopup({ configs }: UsedInFieldSetsPopupProps) {
  const fieldSets = configs.usedInFieldSets || [];

  const renderFieldSet = (fieldSet: SimpleFieldSetDto & CardListModalItem) => {
    const projects = fieldSet.projects || [];
    
    return (
      <CardItemWrapper
        key={fieldSet.id}
        title={fieldSet.name}
        badges={[<ProjectBadges key="projects" projects={projects} />]}
      />
    );
  };

  return (
    <CardListModal<SimpleFieldSetDto & CardListModalItem>
      triggerLabel={`${fieldSets.length} FieldSet${fieldSets.length !== 1 ? "s" : ""}`}
      triggerDisabled={fieldSets.length === 0}
      triggerTitle={
        fieldSets.length === 0
          ? "Nessun FieldSet"
          : "Visualizza FieldSet che utilizzano questa configurazione"
      }
      title={`FieldSet che utilizzano "${configs.name || 'questa configurazione'}"`}
      items={fieldSets as (SimpleFieldSetDto & CardListModalItem)[]}
      summary={{
        label: "Totale FieldSet",
        value: fieldSets.length,
      }}
      renderCard={renderFieldSet}
      emptyMessage="Questa configurazione non è utilizzata in nessun FieldSet"
    />
  );
}

