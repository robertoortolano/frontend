import GenericPopupList from "./PopupList";

export default function OptionsPopup({ options }) {
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
