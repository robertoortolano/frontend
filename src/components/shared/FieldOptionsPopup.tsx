import CardListModal, { CardListModalItem } from "./CardListModal";
import { FieldOptionViewDto } from "../../types/field.types";
import CardItemWrapper from "./CardItemWrapper";
import DisabledBadge from "./DisabledBadge";
import { formatCountLabel } from "../../utils/formatUtils";

interface OptionsPopupProps {
  options: FieldOptionViewDto[];
}

export default function OptionsPopup({ options }: OptionsPopupProps) {
  // Le opzioni sono già ordinate dal backend per orderIndex
  const renderOption = (option: FieldOptionViewDto & CardListModalItem) => {
    const badges = [];
    if (option.enabled === false) {
      badges.push(<DisabledBadge key="disabled" />);
    }
    
    const additionalContent = option.value ? (
      <div
        style={{
          fontSize: "0.75rem",
          color: "#6b7280",
          fontFamily: "monospace",
        }}
      >
        Valore: <span style={{ color: "#374151" }}>{option.value}</span>
      </div>
    ) : undefined;
    
    return (
      <CardItemWrapper
        key={option.id}
        title={option.label}
        badges={badges.length > 0 ? badges : undefined}
        additionalContent={additionalContent}
      />
    );
  };

  return (
    <CardListModal<FieldOptionViewDto & CardListModalItem>
      triggerLabel={formatCountLabel(options.length, 'option')}
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

