import { FieldDetailDto, FieldSetViewDto } from "../../types/field.types";
import CardListModal, { CardListModalItem } from "./CardListModal";

interface FieldSetsPopupProps {
  field: FieldDetailDto;
}

export default function FieldSetsPopup({ field }: FieldSetsPopupProps) {

  const getScopeLabel = (fieldSet: FieldSetViewDto) => {
    if (fieldSet.scope === "TENANT") {
      return "Tenant";
    }
    // Se è PROJECT, usa il nome del progetto se disponibile, altrimenti "Progetto"
    return fieldSet.projectName || "Progetto";
  };

  const getScopeBadgeColor = (scope: string) => {
    return scope === "TENANT" ? "#1e3a8a" : "#059669";
  };

  const renderFieldSet = (fieldSet: FieldSetViewDto & CardListModalItem) => (
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
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
        <strong style={{ color: "#1e3a8a", fontSize: "0.875rem" }}>
          {fieldSet.name}
        </strong>
        {fieldSet.defaultFieldSet && (
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
      
      {fieldSet.description && (
        <p
          style={{
            fontSize: "0.75rem",
            color: "#6b7280",
            marginBottom: "0.5rem",
            fontStyle: "italic",
          }}
        >
          {fieldSet.description}
        </p>
      )}

      <div style={{ fontSize: "0.75rem", color: "#374151" }}>
        <span style={{ fontWeight: "500" }}>Configurazioni: </span>
        <span>{fieldSet.fieldSetEntries?.length || 0}</span>
        {fieldSet.fieldSetEntries && fieldSet.fieldSetEntries.length > 0 && (
          <div
            style={{
              marginTop: "0.5rem",
              paddingLeft: "0.75rem",
              borderLeft: "2px solid #e5e7eb",
            }}
          >
            {fieldSet.fieldSetEntries.slice(0, 5).map((entry, idx) => (
              <div
                key={entry.id || idx}
                style={{
                  fontSize: "0.7rem",
                  color: "#6b7280",
                  marginBottom: "0.25rem",
                }}
              >
                • {entry.fieldConfiguration?.name || entry.fieldConfigurationName || "N/A"}
              </div>
            ))}
            {fieldSet.fieldSetEntries.length > 5 && (
              <div
                style={{
                  fontSize: "0.7rem",
                  color: "#9ca3af",
                  fontStyle: "italic",
                }}
              >
                ... e altre {fieldSet.fieldSetEntries.length - 5} configurazioni
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <CardListModal<FieldSetViewDto & CardListModalItem>
      triggerLabel={`${field.fieldSets.length} FieldSet${field.fieldSets.length !== 1 ? "s" : ""}`}
      triggerDisabled={field.fieldSets.length === 0}
      triggerTitle={
        field.fieldSets.length === 0
          ? "Nessun FieldSet"
          : "Visualizza dettagli FieldSet"
      }
      title={`FieldSet associati al campo "${field.name}"`}
      items={field.fieldSets as (FieldSetViewDto & CardListModalItem)[]}
      summary={{
        label: "Totale FieldSet",
        value: field.fieldSets.length,
      }}
      renderCard={renderFieldSet}
    />
  );
}
