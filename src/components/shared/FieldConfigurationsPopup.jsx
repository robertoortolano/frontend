// FieldConfigurationsPopup.jsx
import GenericPopupList from "./PopupList";

export default function FieldConfigurationsPopup({ field }) {
  return (
    <GenericPopupList
      triggerLabel={`${field.fieldConfigurations.length} configurartion${field.fieldConfigurations.length !== 1 ? "s" : ""}`}
      items={field.fieldConfigurations}
      title="Configurations:"
      renderItem={(fc) => fc.name}
      disabled={field.fieldConfigurations.length === 0}
    />
  );
}
