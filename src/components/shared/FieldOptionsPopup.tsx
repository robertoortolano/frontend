import CardListModal, { CardListModalItem } from "./CardListModal";
import { FieldOptionViewDto } from "../../types/field.types";

interface OptionsPopupProps {
  options: FieldOptionViewDto[];
}

export default function OptionsPopup({ options }: OptionsPopupProps) {
  // Le opzioni sono già ordinate dal backend per orderIndex
  const renderOption = (option: FieldOptionViewDto & CardListModalItem) => (
    <div
      key={option.id}
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
          {option.label}
        </strong>
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
      </div>
      {option.value && (
        <div
          style={{
            fontSize: "0.75rem",
            color: "#6b7280",
            marginTop: "0.25rem",
            fontFamily: "monospace",
          }}
        >
          Valore: <span style={{ color: "#374151" }}>{option.value}</span>
        </div>
      )}
      {option.orderIndex !== undefined && (
        <div
          style={{
            fontSize: "0.7rem",
            color: "#9ca3af",
            marginTop: "0.25rem",
          }}
        >
          Ordine: {option.orderIndex + 1}
        </div>
      )}
    </div>
  );

  return (
    <CardListModal<FieldOptionViewDto & CardListModalItem>
      triggerLabel={`${options.length} option${options.length !== 1 ? "s" : ""}`}
      triggerDisabled={options.length === 0}
      triggerTitle={
        options.length === 0
          ? "Nessuna opzione"
          : "Visualizza opzioni"
      }
      title="Opzioni"
      items={options as (FieldOptionViewDto & CardListModalItem)[]}
      summary={{
        label: "Totale opzioni",
        value: options.length,
      }}
      renderCard={renderOption}
      emptyMessage="Nessuna opzione disponibile"
    />
  );
}

