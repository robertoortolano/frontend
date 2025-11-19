import CardListModal, { CardListModalItem } from "./CardListModal";
import { FieldSetViewDto, FieldSetEntryViewDto } from "../../types/field.types";
import ProjectBadges from "./ProjectBadges";
import CardItemWrapper from "./CardItemWrapper";
import DisabledBadge from "./DisabledBadge";
import { formatCountLabel } from "../../utils/formatUtils";

interface FieldSetConfigurationsPopupProps {
  fieldSet: FieldSetViewDto;
}

export default function FieldSetConfigurationsPopup({ fieldSet }: FieldSetConfigurationsPopupProps) {
  const entries = fieldSet.fieldSetEntries || [];

  // Ordina le entries per orderIndex
  const sortedEntries = [...entries].sort((a, b) => a.orderIndex - b.orderIndex);

  const projects = fieldSet.projects || [];
  const usedInItemTypeSets = fieldSet.usedInItemTypeSets || [];

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

    const badges = [<ProjectBadges key="projects" projects={projects} usedInItemTypeSets={usedInItemTypeSets} />];

    const additionalContent = (
      <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
        <span style={{ fontWeight: "500" }}>Tipo di campo: </span>
        <span>{config.fieldType?.displayName || "-"}</span>
      </div>
    );

    const children = sortedOptions.length > 0 ? (
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
            {option.enabled === false && <DisabledBadge />}
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
    ) : undefined;

    return (
      <CardItemWrapper
        key={entry.id || config.id}
        title={config.name || "Senza nome"}
        badges={badges}
        additionalContent={additionalContent}
        children={children}
      />
    );
  };

  return (
    <CardListModal<FieldSetEntryViewDto & CardListModalItem>
      triggerLabel={formatCountLabel(entries.length, 'configurazione', 'configurazioni')}
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

