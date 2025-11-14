import { useState, useEffect } from "react";
import { Loader2, Eye } from "lucide-react";
import { CollapsiblePanel } from "../../../components/shared/layout";
import ItemTypeSetRoleManager from "../../../components/ItemTypeSetRoleManager";
import api from "../../../api/api";
import alert from "../../../styles/common/Alerts.module.css";

interface ItemTypeSetProjectGrantsPanelProps {
  itemTypeSet: any;
  projectId: string;
  isTenantAdmin: boolean;
  isProjectAdmin: boolean;
  refreshTrigger: number;
  onPermissionGrantClick: (permission: any) => void;
}

export function ItemTypeSetProjectGrantsPanel({
  itemTypeSet,
  projectId,
  isTenantAdmin,
  isProjectAdmin,
  refreshTrigger,
  onPermissionGrantClick,
}: ItemTypeSetProjectGrantsPanelProps) {
  const [globalPermissions, setGlobalPermissions] = useState<any>(null);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (itemTypeSet?.id) {
      fetchGlobalPermissions();
    }
  }, [itemTypeSet?.id, isTenantAdmin, isProjectAdmin, projectId, refreshTrigger]);

  const fetchGlobalPermissions = async () => {
    if (!itemTypeSet?.id) return;

    const baseUrl = `/itemtypeset-permissions/itemtypeset/${itemTypeSet.id}`;

    try {
      setLoadingPermissions(true);

      if (isTenantAdmin) {
        let permissionsData: any = null;
        try {
          const response = await api.get(baseUrl);
          permissionsData = response.data;
        } catch (err: any) {
          console.error("Error fetching permissions:", err);
          if (err.response?.status === 500) {
            try {
              await api.post(`/itemtypeset-permissions/create-for-itemtypeset/${itemTypeSet.id}`);
              const retryResponse = await api.get(baseUrl);
              permissionsData = retryResponse.data;
            } catch (createErr) {
              console.error("Error creating permissions:", createErr);
            }
          }
        }

        if (projectId) {
          try {
            const responseWithProject = await api.get(`${baseUrl}?projectId=${projectId}`);
            permissionsData = responseWithProject.data;
          } catch (projectErr) {
            console.warn("Could not load project grant info:", projectErr);
          }
        }

        setGlobalPermissions(permissionsData);
      } else if (isProjectAdmin && projectId) {
        const response = await api.get(`${baseUrl}?projectId=${projectId}`);
        setGlobalPermissions(response.data);
      } else {
        setGlobalPermissions(null);
      }
    } catch (err: any) {
      console.error("Error fetching permissions:", err);
      setGlobalPermissions(null);
    } finally {
      setLoadingPermissions(false);
    }
  };

  return (
    <CollapsiblePanel
      title="Grant Specifiche del Progetto"
      description="Gestisci le grant aggiuntive specifiche per questo progetto. Queste grant si aggiungono alle permission globali sopra."
      isOpen={isExpanded}
      onToggle={() => setIsExpanded(!isExpanded)}
      accentColor="#047857"
      icon={<Eye size={20} color="#047857" />}
      backgroundColor="#ecfdf5"
      contentClassName="space-y-4"
    >
      {loadingPermissions ? (
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 size={16} className="animate-spin" />
          <span>Caricamento grant di progetto...</span>
        </div>
      ) : globalPermissions ? (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <ItemTypeSetRoleManager
            itemTypeSetId={itemTypeSet.id}
            refreshTrigger={refreshTrigger}
            projectId={projectId}
            showOnlyWithAssignments={false}
            showOnlyProjectGrants={true}
            onPermissionGrantClick={onPermissionGrantClick}
          />
        </div>
      ) : (
        <p className={alert.muted}>Nessuna permission disponibile.</p>
      )}
    </CollapsiblePanel>
  );
}



