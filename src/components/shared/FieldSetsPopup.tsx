import { FieldDetailDto, FieldSetViewDto } from "../../types/field.types";
import CardListModal, { CardListModalItem } from "./CardListModal";
import ProjectBadges from "./ProjectBadges";
import CardItemWrapper from "./CardItemWrapper";
import DefaultBadge from "./DefaultBadge";

interface FieldSetsPopupProps {
  field: FieldDetailDto;
}

export default function FieldSetsPopup({ field }: FieldSetsPopupProps) {
  const renderFieldSet = (fieldSet: FieldSetViewDto & CardListModalItem) => {
    const projects = fieldSet.projects || [];
    const usedInItemTypeSets = fieldSet.usedInItemTypeSets || [];
    
    const badges = [];
    if (fieldSet.defaultFieldSet) {
      badges.push(<DefaultBadge key="default" />);
    }
    badges.push(<ProjectBadges key="projects" projects={projects} usedInItemTypeSets={usedInItemTypeSets} />);

    const additionalContent = (
      <>
        {fieldSet.description && (
          <p
            style={{
              fontSize: "0.75rem",
              color: "#6b7280",
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
      </>
    );
    
    return (
      <CardItemWrapper
        key={fieldSet.id}
        title={fieldSet.name}
        badges={badges}
        additionalContent={additionalContent}
      />
    );
  };

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
