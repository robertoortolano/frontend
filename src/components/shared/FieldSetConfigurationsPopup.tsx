import CardListModal, { CardListModalItem } from "./CardListModal";
import { FieldSetViewDto, FieldSetEntryViewDto } from "../../types/field.types";

interface FieldSetConfigurationsPopupProps {
  fieldSet: FieldSetViewDto;
}

export default function FieldSetConfigurationsPopup({ fieldSet }: FieldSetConfigurationsPopupProps) {
  const entries = fieldSet.fieldSetEntries || [];

  // Ordina le entries per orderIndex
  const sortedEntries = [...entries].sort((a, b) => a.orderIndex - b.orderIndex);

  const projects = fieldSet.projects || [];

  // Ordina le opzioni per orderIndex se presente
  const getSortedOptions = (options?: any[]) => {
    if (!options || options.length === 0) return [];
    return [...options].sort((a, b) => {
      const aIndex = a.orderIndex ?? 0;
      const bIndex = b.orderIndex ?? 0;
      return aIndex - bIndex;
    });
  };

  const renderConfiguration = (entry: FieldSetEntryViewDto & CardListModalItem) => {
    const config = entry.fieldConfiguration;
    const sortedOptions = getSortedOptions(config.options);

    return (
      <div
        key={entry.id || config.id}
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
            {config.name || "Senza nome"}
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

        <div style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "0.5rem" }}>
          <span style={{ fontWeight: "500" }}>Tipo di campo: </span>
          <span>{config.fieldType?.displayName || "-"}</span>
        </div>

        {sortedOptions.length > 0 && (
          <div
            style={{
              marginTop: "0.5rem",
              paddingLeft: "0.75rem",
              borderLeft: "2px solid #e5e7eb",
            }}
          >
            <div style={{ fontSize: "0.75rem", fontWeight: "500", color: "#374151", marginBottom: "0.25rem" }}>
              Opzioni:
            </div>
            {sortedOptions.map((option, idx) => (
              <div
                key={option.id || idx}
                style={{
                  fontSize: "0.7rem",
                  color: "#6b7280",
                  marginBottom: "0.25rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <span>•</span>
                <span>{option.label || option.value || "N/A"}</span>
                {option.enabled === false && (
                  <span
                    style={{
                      fontSize: "0.625rem",
                      padding: "0.125rem 0.375rem",
                      backgroundColor: "#fee2e2",
                      color: "#991b1b",
                      borderRadius: "0.25rem",
                      fontWeight: "500",
                    }}
                  >
                    Disabilitato
                  </span>
                )}
                {option.value && option.value !== option.label && (
                  <span
                    style={{
                      fontSize: "0.65rem",
                      color: "#9ca3af",
                      fontFamily: "monospace",
                    }}
                  >
                    ({option.value})
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <CardListModal<FieldSetEntryViewDto & CardListModalItem>
      triggerLabel={`${entries.length} configurazione${entries.length !== 1 ? "i" : ""}`}
      triggerDisabled={entries.length === 0}
      triggerTitle={
        entries.length === 0
          ? "Nessuna configurazione"
          : "Visualizza dettagli configurazioni"
      }
      title={`Configurazioni del FieldSet "${fieldSet.name}"`}
      items={sortedEntries as (FieldSetEntryViewDto & CardListModalItem)[]}
      summary={{
        label: "Totale configurazioni",
        value: entries.length,
      }}
      renderCard={renderConfiguration}
      emptyMessage="Questo FieldSet non contiene configurazioni"
    />
  );
}

