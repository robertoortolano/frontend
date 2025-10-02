import GenericPopupList from "./PopupList";

export default function WorkflowsPopup({ workflows = [] }) {
  return (
    <GenericPopupList
      triggerLabel={`${workflows.length} workflow${workflows.length > 1 ? 's' : ''}`}
      items={workflows}
      title="Usato in questi workflow:"
      renderItem={(wf) => <span>{wf.name}</span>}
    />
  );
}
