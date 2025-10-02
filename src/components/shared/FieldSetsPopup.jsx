import GenericPopupList from "./PopupList";

export default function FieldSetsPopup({ field }) {
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
