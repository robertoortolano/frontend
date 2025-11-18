import CardListModal, { CardListModalItem } from "./CardListModal";
import { FieldConfigurationViewDto, SimpleFieldSetDto } from "../../types/field.types";

interface UsedInFieldSetsPopupProps {
  configs: FieldConfigurationViewDto;
}

export default function UsedInFieldSetsPopup({ configs }: UsedInFieldSetsPopupProps) {
  const fieldSets = configs.usedInFieldSets || [];

  const getScopeLabel = (fieldSet: SimpleFieldSetDto) => {
    if (fieldSet.scope === "TENANT") {
      return "Tenant";
    }
    // Se è PROJECT, usa il nome del progetto se disponibile, altrimenti "Progetto"
    return fieldSet.projectName || "Progetto";
  };

  const getScopeBadgeColor = (scope: string) => {
    return scope === "TENANT" ? "#1e3a8a" : "#059669";
  };

  const renderFieldSet = (fieldSet: SimpleFieldSetDto & CardListModalItem) => (
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
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <strong style={{ color: "#1e3a8a", fontSize: "0.875rem" }}>
          {fieldSet.name}
        </strong>
        <span
          style={{
            fontSize: "0.625rem",
            padding: "0.125rem 0.375rem",
            backgroundColor: getScopeBadgeColor(fieldSet.scope),
            color: "white",
            borderRadius: "0.25rem",
            fontWeight: "500",
            marginLeft: "auto",
          }}
        >
          {getScopeLabel(fieldSet)}
        </span>
      </div>
    </div>
  );

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

