/**
 * ItemTypeSetRoleManager - Complex permission management component
 * Using pragmatic typing with 'any' for complex nested structures
 */
import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Users, Shield, Edit, Eye, Plus } from "lucide-react";
import api from "../api/api";

import layout from "../styles/common/Layout.module.css";
import buttons from "../styles/common/Buttons.module.css";
import alert from "../styles/common/Alerts.module.css";
import utilities from "../styles/common/Utilities.module.css";
import table from "../styles/common/Tables.module.css";

const ROLE_TYPES: any = {
  WORKER: { label: "Worker", icon: Users, color: "blue", description: "Per ogni ItemType" },
  STATUS_OWNER: { label: "StatusOwner", icon: Shield, color: "green", description: "Per ogni WorkflowStatus" },
  FIELD_EDITOR: { label: "Field Editor", icon: Edit, color: "purple", description: "Per ogni FieldConfiguration (sempre)" },
  CREATOR: { label: "Creator", icon: Plus, color: "orange", description: "Per ogni Workflow" },
  EXECUTOR: { label: "Executor", icon: Shield, color: "red", description: "Per ogni Transition" },
  EDITOR: { label: "Editor", icon: Edit, color: "indigo", description: "Per coppia (Field + Status)" },
  VIEWER: { label: "Viewer", icon: Eye, color: "gray", description: "Per coppia (Field + Status)" },
};

interface ItemTypeSetRoleManagerProps {
  itemTypeSetId: number;
  onPermissionGrantClick?: (permission: any) => void;
  refreshTrigger?: number;
}

export default function ItemTypeSetRoleManager({
  itemTypeSetId,
  onPermissionGrantClick,
  refreshTrigger,
}: ItemTypeSetRoleManagerProps) {
  const [roles, setRoles] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRoles, setExpandedRoles] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (itemTypeSetId) {
      fetchRoles();
    }
  }, [itemTypeSetId, refreshTrigger]);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/itemtypeset-permissions/itemtypeset/${itemTypeSetId}`);
      setRoles(response.data);
    } catch (err: any) {
      if (err.response?.status === 500) {
        try {
          await api.post(`/itemtypeset-permissions/create-for-itemtypeset/${itemTypeSetId}`);
          const retryResponse = await api.get(`/itemtypeset-permissions/itemtypeset/${itemTypeSetId}`);
          setRoles(retryResponse.data);
        } catch (createErr) {
          setError("Errore nella creazione delle permissions");
          console.error("Error creating permissions:", createErr);
        }
      } else {
        setError("Errore nel caricamento delle permissions");
        console.error("Error fetching permissions:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleRoleExpansion = (roleId: number) => {
    setExpandedRoles((prev) => ({
      ...prev,
      [roleId]: !prev[roleId],
    }));
  };

  const getRoleIcon = (roleType: string) => {
    const IconComponent = ROLE_TYPES[roleType]?.icon || Users;
    return <IconComponent size={16} />;
  };

  const getRoleColor = (roleType: string) => {
    return ROLE_TYPES[roleType]?.color || "gray";
  };

  const groupRolesByType = () => {
    return roles || {};
  };

  if (loading) {
    return <div className={layout.loading}>Caricamento permissions...</div>;
  }

  if (error) {
    return <div className={alert.error}>{error}</div>;
  }

  const groupedRoles = groupRolesByType();

  return (
    <div className="w-full">
      <div className="mb-4">
        <p className={layout.paragraphMuted}>
          Le permissions sono create automaticamente per ogni ItemTypeSet. Ogni permission ha un ambito specifico e può
          essere associata a ruoli personalizzati o grants.
        </p>
      </div>

      {Object.keys(groupedRoles).length === 0 ? (
        <div className={alert.info}>
          <p>Nessuna permission configurata per questo ItemTypeSet.</p>
          <p className="mt-2">Le permissions vengono create automaticamente quando si crea o modifica un ItemTypeSet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedRoles).map(([roleType, roleList]: [string, any]) => (
            <div key={roleType} className={layout.block}>
              <div className={layout.blockHeader}>
                <div className="flex items-center gap-3">
                  {getRoleIcon(roleType)}
                  <h3 className={layout.blockTitleBlue}>{ROLE_TYPES[roleType]?.label || roleType}</h3>
                  <span
                    className={`px-2 py-1 rounded-full text-xs bg-${getRoleColor(roleType)}-100 text-${getRoleColor(
                      roleType
                    )}-800`}
                  >
                    {roleList.length}
                  </span>
                </div>
                <p className={layout.paragraphMuted}>{ROLE_TYPES[roleType]?.description || ""}</p>
              </div>

              <div className={utilities.mt4}>
                <table className={table.table}>
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Dettagli</th>
                      <th>Grants</th>
                      <th>Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roleList.map((role: any) => (
                      <tr key={role.id}>
                        <td>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleRoleExpansion(role.id)}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              {expandedRoles[role.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </button>
                            <span className="font-medium">{role.name}</span>
                          </div>
                        </td>
                        <td>
                          <div className="text-sm text-gray-600">
                            {role.itemType && <div><strong>ItemType:</strong> {role.itemType.name}</div>}
                            {role.workflowStatus && <div><strong>Stato:</strong> {role.workflowStatus.name}</div>}
                            {role.workflow && <div><strong>Workflow:</strong> {role.workflow.name}</div>}
                            {role.fieldConfiguration && <div><strong>Field:</strong> {role.fieldConfiguration.name}</div>}
                          </div>
                        </td>
                        <td>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            role.hasAssignments 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {role.hasAssignments ? 'Y' : 'N'}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => {
                              onPermissionGrantClick?.(role);
                            }}
                            className={`${buttons.button} ${buttons.buttonSmall} ${buttons.buttonSecondary}`}
                            title="Gestisci Grants"
                          >
                            <Shield size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

