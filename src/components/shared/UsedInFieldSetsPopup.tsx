import CardListModal, { CardListModalItem } from "./CardListModal";
import { FieldConfigurationViewDto, SimpleFieldSetDto } from "../../types/field.types";

interface UsedInFieldSetsPopupProps {
  configs: FieldConfigurationViewDto;
}

export default function UsedInFieldSetsPopup({ configs }: UsedInFieldSetsPopupProps) {
  const fieldSets = configs.usedInFieldSets || [];

  const renderFieldSet = (fieldSet: SimpleFieldSetDto & CardListModalItem) => {
    const projects = fieldSet.projects || [];
    
    return (
      <div
        key={fieldSet.id}
        style={{
          padding: "0.75rem",
          borderBottom: "1px solid #e5e7eb",
          backgroundColor: "#f9fafb",
          borderRadius: "0.375rem",
          marginBottom: "0.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          <strong style={{ color: "#1e3a8a", fontSize: "0.875rem" }}>
            {fieldSet.name}
          </strong>
          {projects.length > 0 && (
            <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap", marginLeft: "auto" }}>
              {projects.map((project) => (
                <span
                  key={project.id}
                  style={{
                    fontSize: "0.625rem",
                    padding: "0.125rem 0.375rem",
                    backgroundColor: "#059669",
                    color: "white",
                    borderRadius: "0.25rem",
                    fontWeight: "500",
                  }}
                >
                  {project.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
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

