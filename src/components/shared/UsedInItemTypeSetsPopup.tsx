import GenericPopupList from "./PopupList";
import { WorkflowDetailDto } from "../../types/workflow.types";

interface UsedInItemTypeSetsPopupProps {
  workflow: WorkflowDetailDto;
}

export default function UsedInItemTypeSetsPopup({ workflow }: UsedInItemTypeSetsPopupProps) {
  return (
    <GenericPopupList
      triggerLabel={`${workflow.usedInItemTypeConfigurations?.length || 0} ItemTypeSet${(workflow.usedInItemTypeConfigurations?.length || 0) !== 1 ? "s" : ""}`}
      items={workflow.usedInItemTypeConfigurations || []}
      title="ItemTypeSet:"
      renderItem={(config) => config.itemType?.name || 'N/A'}
      disabled={!workflow.usedInItemTypeConfigurations || workflow.usedInItemTypeConfigurations.length === 0}
    />
  );
}
