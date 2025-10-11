import GenericPopupList from "./PopupList";
import { FieldOptionViewDto } from "../../types/field.types";

interface OptionsPopupProps {
  options: FieldOptionViewDto[];
}

export default function OptionsPopup({ options }: OptionsPopupProps) {
  return (
    <GenericPopupList
      triggerLabel={`${options.length} option${options.length !== 1 ? "s" : ""}`}
      items={options}
      title="Options:"
      renderItem={(opt) => opt.label}
      disabled={options.length === 0}
    />
  );
}

