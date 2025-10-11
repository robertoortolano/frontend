import GenericPopupList from "./PopupList";
import { FieldDetailDto } from "../../types/field.types";

interface FieldConfigurationsPopupProps {
  field: FieldDetailDto;
}

export default function FieldConfigurationsPopup({ field }: FieldConfigurationsPopupProps) {
  return (
    <GenericPopupList
      triggerLabel={`${field.fieldConfigurations.length} configuration${field.fieldConfigurations.length !== 1 ? "s" : ""}`}
      items={field.fieldConfigurations}
      title="Configurations:"
      renderItem={(fc) => fc.name}
      disabled={field.fieldConfigurations.length === 0}
    />
  );
}

