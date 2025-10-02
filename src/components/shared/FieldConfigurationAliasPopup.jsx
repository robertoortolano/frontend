import React from "react";
import GenericPopupList from "../../components/shared/PopupList";

export default function FieldConfigurationAliasPopup({ config }) {
  const { name, alias } = config;

  if (!alias) {
    return <>{name || "-"}</>;
  }

  return (
    <GenericPopupList
      triggerLabel={name || "-"}
      title="Alias"
      items={[alias]}
      renderItem={(a) => <span>{a}</span>}
    />
  );
}
