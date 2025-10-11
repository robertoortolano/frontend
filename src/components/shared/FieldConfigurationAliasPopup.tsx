import GenericPopupList from "./PopupList";
import { FieldConfigurationViewDto } from "../../types/field.types";

interface FieldConfigurationAliasPopupProps {
  config: FieldConfigurationViewDto;
}

export default function FieldConfigurationAliasPopup({ config }: FieldConfigurationAliasPopupProps) {
  const { name, alias } = config;

  if (!alias) {
    return <>{name || "-"}</>;
  }

  return (
    <GenericPopupList
      triggerLabel={name || "-"}
      title="Alias"
      items={[{ id: 1, value: alias }]}
      renderItem={(a: any) => <span>{a.value}</span>}
    />
  );
}

