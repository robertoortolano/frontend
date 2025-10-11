import GenericPopupList from "./PopupList";
import { FieldConfigurationViewDto } from "../../types/field.types";

interface UsedInFieldSetsPopupProps {
  configs: FieldConfigurationViewDto;
}

export default function UsedInFieldSetsPopup({ configs }: UsedInFieldSetsPopupProps) {
  return (
    <GenericPopupList
      triggerLabel={`${configs.usedInFieldSets?.length || 0} FieldSet${(configs.usedInFieldSets?.length || 0) !== 1 ? "s" : ""}`}
      items={configs.usedInFieldSets || []}
      title="Usato in FieldSet:"
      renderItem={(fs) => fs.name}
      disabled={!configs.usedInFieldSets || configs.usedInFieldSets.length === 0}
    />
  );
}

