import GenericPopupList from "./PopupList";
import { WorkflowSimpleDto } from "../../types/workflow.types";

interface WorkflowsPopupProps {
  workflows?: WorkflowSimpleDto[];
}

export default function WorkflowsPopup({ workflows = [] }: WorkflowsPopupProps) {
  return (
    <GenericPopupList
      triggerLabel={`${workflows.length} workflow${workflows.length > 1 ? 's' : ''}`}
      items={workflows}
      title="Usato in questi workflow:"
      renderItem={(wf) => <span>{wf.name}</span>}
    />
  );
}

