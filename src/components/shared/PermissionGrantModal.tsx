import PermissionGrantManager from "../PermissionGrantManager";
import DraggableModal from "./DraggableModal";
import type { Permission } from "../permissions/grants/permissionGrantTypes";

interface PermissionGrantModalProps {
  permission: Permission | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  itemTypeSetId?: number;
  scope?: 'tenant' | 'project';
  projectId?: string;
}

export default function PermissionGrantModal({
  permission,
  isOpen,
  onClose,
  onSave,
  itemTypeSetId,
  scope,
  projectId,
}: PermissionGrantModalProps) {
  if (!isOpen || !permission) {
    return null;
  }

  return (
    <DraggableModal
      isOpen={isOpen}
      onClose={onClose}
      title="Gestione Permessi - Trascina per spostare"
      overlayId="permission-grant-modal"
      scrollableContentId="modal-scrollable-content"
    >
      <PermissionGrantManager
        permission={permission}
        onClose={onClose}
        onSave={onSave}
        itemTypeSetId={itemTypeSetId}
        scope={scope}
        projectId={projectId}
      />
    </DraggableModal>
  );
}

