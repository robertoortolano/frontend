import { useState, useEffect } from "react";
import { Loader2, Shield } from "lucide-react";
import { CollapsiblePanel } from "../../../components/shared/layout";
import ItemTypeSetRoleManager from "../../../components/ItemTypeSetRoleManager";
import api from "../../../api/api";
import alert from "../../../styles/common/Alerts.module.css";

interface ItemTypeSetGlobalPermissionsPanelProps {
  itemTypeSet: any;
  projectId: string;
  isTenantAdmin: boolean;
  refreshTrigger: number;
}

export function ItemTypeSetGlobalPermissionsPanel({
  itemTypeSet,
  projectId,
  isTenantAdmin,
  refreshTrigger,
}: ItemTypeSetGlobalPermissionsPanelProps) {
  const [globalPermissions, setGlobalPermissions] = useState<any>(null);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (itemTypeSet?.id) {
      fetchGlobalPermissions();
    }
  }, [itemTypeSet?.id, isTenantAdmin, projectId, refreshTrigger]);

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

  if (itemTypeSet.scope !== "TENANT") {
    return null;
  }

  return (
    <CollapsiblePanel
      title="Permission Globali (Sola Lettura)"
      description="Queste sono le permission configurate a livello globale per questo ItemTypeSet. Si applicano a tutti i progetti che usano questo ITS. Per modificarle, vai alla sezione ItemTypeSets globale."
      isOpen={isExpanded}
      onToggle={() => setIsExpanded(!isExpanded)}
      accentColor="#1e40af"
      icon={<Shield size={20} color="#1e40af" />}
      backgroundColor="#f0f9ff"
      contentClassName="space-y-4"
    >
      {loadingPermissions ? (
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 size={16} className="animate-spin" />
          <span>Caricamento permission globali...</span>
        </div>
      ) : globalPermissions ? (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <ItemTypeSetRoleManager
            itemTypeSetId={itemTypeSet.id}
            refreshTrigger={refreshTrigger}
            projectId={projectId}
            showOnlyWithAssignments={true}
            includeProjectAssignments={false}
          />
        </div>
      ) : (
        <p className={alert.muted}>Nessuna permission configurata.</p>
      )}
    </CollapsiblePanel>
  );
}


