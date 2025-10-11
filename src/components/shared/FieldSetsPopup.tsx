import GenericPopupList from "./PopupList";
import { FieldDetailDto } from "../../types/field.types";

interface FieldSetsPopupProps {
  field: FieldDetailDto;
}

export default function FieldSetsPopup({ field }: FieldSetsPopupProps) {
  return (
    <GenericPopupList
      triggerLabel={`${field.fieldSets.length} FieldSet${field.fieldSets.length !== 1 ? "s" : ""}`}
      items={field.fieldSets}
      title="FieldSet:"
      renderItem={(fs) => fs.name}
      disabled={field.fieldSets.length === 0}
    />
  );
}

