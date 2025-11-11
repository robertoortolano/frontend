import { useEffect, useState } from "react";
import api from "../../api/api";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { ProjectDto } from "../../types/project.types";
import { ItemTypeSetDto } from "../../types/itemtypeset.types";
import { CheckCircle, Loader2, AlertCircle, Check, Home, Settings, Users, Shield, Eye } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import ProjectMembersPanel from "../../components/ProjectMembersPanel";
import ItemTypeSetRoleManager from "../../components/ItemTypeSetRoleManager";
import PermissionGrantManager from "../../components/PermissionGrantManager";
import { createPortal } from "react-dom";
import { PageContainer, PageHeader, Panel, Tabs, CollapsiblePanel } from "../../components/shared/layout";
import { ProjectSettingsNotificationsPanel } from "./components/ProjectSettingsNotificationsPanel";

import layout from "../../styles/common/Layout.module.css";
import buttons from "../../styles/common/Buttons.module.css";
import table from "../../styles/common/Tables.module.css";
import alert from "../../styles/common/Alerts.module.css";
import utilities from "../../styles/common/Utilities.module.css";
import form from "../../styles/common/Forms.module.css";
import { extractErrorMessage } from "../../utils/errorUtils";

function Loading() {
  return <p className={layout.loading}>Loading project...</p>;
}

const projectSettingsTabs = [
  {
    id: "home",
    label: "Home",
    description: "Dettagli progetto",
    icon: ({ size = 20, color }: { size?: number; color?: string }) => (
      <Home size={size} color={color} />
    ),
  },
  {
    id: "itemtypeset",
    label: "ItemTypeSet",
    description: "Configurazione tipi",
    icon: ({ size = 20, color }: { size?: number; color?: string }) => (
      <Settings size={size} color={color} />
    ),
  },
  {
    id: "members",
    label: "Membri",
    description: "Gestione utenti",
    icon: ({ size = 20, color }: { size?: number; color?: string }) => (
      <Users size={size} color={color} />
    ),
  },
];
const tabContentClass = "mt-8 space-y-6";

interface ErrorMessageProps {
  message: string;
}

function ErrorMessage({ message }: ErrorMessageProps) {
  return <p className={alert.error}>{message}</p>;
}

interface ProjectDetailsProps {
  project: ProjectDto;
  onEdit: () => void;
}

function ProjectDetails({ project, onEdit }: ProjectDetailsProps) {
  return (
    <Panel title="Dettagli Progetto">
      <div className={form.formGroup}>
        <label className={form.label}>Nome</label>
        <p className="text-lg font-medium">{project.name}</p>
      </div>
      <div className={form.formGroup}>
        <label className={form.label}>Chiave</label>
        <p className={utilities.monospace}>{project.key}</p>
      </div>
      <div className={form.formGroup}>
        <label className={form.label}>Descrizione</label>
        <p>{project.description || <em>Nessuna descrizione</em>}</p>
      </div>
      <div className={layout.buttonRow}>
        <button className={buttons.button} onClick={onEdit}>
          Modifica
        </button>
      </div>
    </Panel>
  );
}

interface ItemTypeSetDetailsProps {
  itemTypeSet: any;
  onItemTypeSetChange: (itemTypeSetId: number) => void;
  isUpdatingItemTypeSet: boolean;
  successMessage: string | null;
  error: string | null;
  projectId: string;
}

function ItemTypeSetDetails({ 
  itemTypeSet, 
  onItemTypeSetChange, 
  isUpdatingItemTypeSet,
  successMessage,
  error,
  projectId
}: ItemTypeSetDetailsProps) {
  const auth = useAuth() as any;
  const roles = auth?.roles || [];
  
  // Verifica se l'utente è tenant admin
  const isTenantAdmin = roles.some((role: any) => 
    role.name === "ADMIN" && role.scope === "TENANT"
  );
  
  // Verifica se l'utente è project admin del progetto specifico
  const isProjectAdmin = projectId && roles.some((role: any) => 
    role.name === "ADMIN" && 
    role.scope === "PROJECT" && 
    role.projectId === Number(projectId)
  );
  
  const [isChanging, setIsChanging] = useState(false);
  const [availableItemTypeSets, setAvailableItemTypeSets] = useState<any[]>([]);
  const [selectedItemTypeSet, setSelectedItemTypeSet] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [globalPermissions, setGlobalPermissions] = useState<any>(null);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [selectedPermissionForProjectGrant, setSelectedPermissionForProjectGrant] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isGlobalPermissionsExpanded, setIsGlobalPermissionsExpanded] = useState(false);
  const [isProjectGrantsExpanded, setIsProjectGrantsExpanded] = useState(false);

  const hasEntries = itemTypeSet.itemTypeConfigurations?.length > 0;
  const isGlobal = itemTypeSet.scope === 'TENANT';
  const canChangeItemTypeSet = isTenantAdmin || (isProjectAdmin && !isGlobal);
  
  // Controlla se ci sono altri ItemTypeSet disponibili oltre a quello attuale
  const hasOtherItemTypeSets = canChangeItemTypeSet && (
    availableItemTypeSets.length > 1 || 
    (availableItemTypeSets.length === 1 && availableItemTypeSets[0].id !== itemTypeSet.id)
  );

  // Carica gli ItemTypeSet disponibili e le permission globali al mount del componente
  useEffect(() => {
    fetchAvailableItemTypeSets();
    if (itemTypeSet?.id) {
      fetchGlobalPermissions();
    }
  }, [itemTypeSet?.id, isTenantAdmin, isProjectAdmin, projectId]);

  // Ricarica le permission quando cambia il trigger
  useEffect(() => {
    if (itemTypeSet?.id) {
      fetchGlobalPermissions();
    }
  }, [refreshTrigger]);

  const filterItemTypeSetsForProject = (sets: ItemTypeSetDto[]): ItemTypeSetDto[] => {
    const currentProjectId = projectId ? Number(projectId) : null;

    return sets.filter((set) => {
      if (set.scope === 'TENANT') {
        return true;
      }

      if (!currentProjectId) {
        return false;
      }

      return set.project?.id === currentProjectId;
    });
  };

  const fetchAvailableItemTypeSets = async () => {
    if (!canChangeItemTypeSet) {
      setAvailableItemTypeSets([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      if (isTenantAdmin) {
        try {
          const [globalResponse, projectResponse] = await Promise.all([
            api.get('/projects/available-item-type-sets'),
            api.get('/item-type-sets/project')
          ]);
          const globalSets: ItemTypeSetDto[] = globalResponse.data || [];
          const projectSets: ItemTypeSetDto[] = projectResponse.data || [];
          const allSets = [...globalSets, ...projectSets];
          setAvailableItemTypeSets(filterItemTypeSetsForProject(allSets));
        } catch (err: any) {
          console.warn("Error fetching global ItemTypeSets, trying project only:", err);
          try {
            const projectResponse = await api.get('/item-type-sets/project');
            const projectSets: ItemTypeSetDto[] = projectResponse.data || [];
            setAvailableItemTypeSets(filterItemTypeSetsForProject(projectSets));
          } catch (projectErr: any) {
            console.error("Error fetching project ItemTypeSets:", projectErr);
            setAvailableItemTypeSets([]);
          }
        }
      } else if (isProjectAdmin && projectId) {
          const response = await api.get(`/item-type-sets/project/${projectId}`);
          const projectSets: ItemTypeSetDto[] = response.data || [];
          setAvailableItemTypeSets(projectSets);
      }
    } catch (err: any) {
      console.error("Error fetching ItemTypeSets:", err);
      setAvailableItemTypeSets([]);
    } finally {
      setLoading(false);
    }
  };

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


  const handleStartChange = () => {
    if (!canChangeItemTypeSet) {
      return;
    }
    setIsChanging(true);
    fetchAvailableItemTypeSets();
  };

  const handleCancelChange = () => {
    setIsChanging(false);
    setSelectedItemTypeSet(null);
  };

  const handleItemTypeSetSelect = (itemTypeSet: any) => {
    setSelectedItemTypeSet(itemTypeSet);
  };

  const handleApplyChange = () => {
    if (!canChangeItemTypeSet) {
      return;
    }
    if (selectedItemTypeSet) {
      onItemTypeSetChange(selectedItemTypeSet.id);
      setIsChanging(false);
      setSelectedItemTypeSet(null);
    }
  };

  const renderItemTypeSetInfo = (
    itemTypeSet: any,
    title: string,
    panelOverrides?: { className?: string; headingLevel?: "h2" | "h3" | "h4" }
  ) => (
    <Panel
      title={title}
      headingLevel={panelOverrides?.headingLevel ?? "h3"}
      className={panelOverrides?.className}
      bodyClassName="space-y-3"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <p>
            <strong>Name:</strong> {itemTypeSet.name}
          </p>
          <p>
            <strong>Global:</strong> {itemTypeSet.scope === "TENANT" ? "Yes" : "No"}
          </p>
        </div>
        <div>
          <p>
            <strong>Configurazioni:</strong>{" "}
            {itemTypeSet.itemTypeConfigurations?.length || 0}
          </p>
          {itemTypeSet.defaultItemTypeSet && (
            <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">
              Default
            </span>
          )}
        </div>
      </div>

      {hasEntries ? (
        <table className={`${table.table} ${layout.mt4}`}>
          <thead>
            <tr>
              <th>Item Type</th>
              <th>Categoria</th>
              <th>Workflow</th>
              <th>Field Set</th>
            </tr>
          </thead>
          <tbody>
            {itemTypeSet.itemTypeConfigurations.map((config: any) => (
              <tr key={config.id}>
                <td>{config.itemType?.name || "N/A"}</td>
                <td>{config.category}</td>
                <td>{config.workflow?.name || "-"}</td>
                <td>{config.fieldSet?.name || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className={alert.muted}>No entries in this set.</p>
      )}
    </Panel>
  );

  return (
    <div className="flex flex-col gap-8">
      <h1 className={layout.title}>Item Type Set</h1>

      {renderItemTypeSetInfo(itemTypeSet, "ItemTypeSet Attualmente Applicato")}

      {itemTypeSet.scope === "TENANT" && (
        <CollapsiblePanel
          title="Permission Globali (Sola Lettura)"
          description="Queste sono le permission configurate a livello globale per questo ItemTypeSet. Si applicano a tutti i progetti che usano questo ITS. Per modificarle, vai alla sezione ItemTypeSets globale."
          isOpen={isGlobalPermissionsExpanded}
          onToggle={() =>
            setIsGlobalPermissionsExpanded(!isGlobalPermissionsExpanded)
          }
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
      )}

      <CollapsiblePanel
        title="Grant Specifiche del Progetto"
        description="Gestisci le grant aggiuntive specifiche per questo progetto. Queste grant si aggiungono alle permission globali sopra."
        isOpen={isProjectGrantsExpanded}
        onToggle={() =>
          setIsProjectGrantsExpanded(!isProjectGrantsExpanded)
        }
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
              onPermissionGrantClick={(permission: any) => {
                setSelectedPermissionForProjectGrant(permission);
              }}
            />
          </div>
        ) : (
          <p className={alert.muted}>Nessuna permission disponibile.</p>
        )}
      </CollapsiblePanel>

      <Panel
        title="Cambia ItemTypeSet"
        headingLevel="h3"
        bodyClassName="space-y-4"
      >
        {!canChangeItemTypeSet ? (
          <div className="text-sm text-gray-500">
            Solo un Tenant Admin può sostituire un ItemTypeSet globale applicato al progetto.
          </div>
        ) : !hasOtherItemTypeSets && !loading ? (
          <div className="text-sm text-gray-500">
            Non ci sono altri ItemTypeSet disponibili per il cambio.
          </div>
        ) : !isChanging ? (
          <button
            className={`${buttons.button} ${utilities.mt4}`}
            onClick={handleStartChange}
            disabled={isUpdatingItemTypeSet || !hasOtherItemTypeSets}
            title={
              !hasOtherItemTypeSets
                ? "Non ci sono altri ItemTypeSet disponibili"
                : "Cambia ItemTypeSet"
            }
          >
            Cambia ItemTypeSet
          </button>
        ) : (
          <div className="space-y-4">
            <div>
              <label className={form.label}>Seleziona nuovo ItemTypeSet</label>
              <select
                className={form.select}
                value={selectedItemTypeSet?.id || ""}
                onChange={(e) => {
                  const selectedId = parseInt(e.target.value, 10);
                  const selected = availableItemTypeSets.find(
                    (its) => its.id === selectedId
                  );
                  setSelectedItemTypeSet(selected || null);
                }}
                disabled={loading || isUpdatingItemTypeSet}
              >
                <option value="">-- Seleziona un ItemTypeSet --</option>
                {availableItemTypeSets
                  .filter((its) => its.id !== itemTypeSet.id)
                  .map((its) => (
                    <option key={its.id} value={its.id}>
                      {its.name} {its.defaultItemTypeSet ? "(Default)" : ""}
                    </option>
                  ))}
              </select>
              {loading && (
                <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 size={14} className="animate-spin" />
                  Caricamento ItemTypeSet...
                </div>
              )}
            </div>

            {selectedItemTypeSet &&
              renderItemTypeSetInfo(
                selectedItemTypeSet,
                "Anteprima nuovo ItemTypeSet",
                { className: "bg-blue-50 border border-blue-200" }
              )}

            <div className={layout.buttonRow}>
              <button
                onClick={handleCancelChange}
                className={buttons.button}
                disabled={isUpdatingItemTypeSet}
              >
                Annulla
              </button>
              <button
                onClick={handleApplyChange}
                className={`${buttons.button} flex items-center gap-2`}
                disabled={!selectedItemTypeSet || isUpdatingItemTypeSet}
              >
                {isUpdatingItemTypeSet ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Applicazione...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    Applica al Progetto
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Panel>

      {isUpdatingItemTypeSet && (
        <div className={alert.infoContainer}>
          <p className={alert.info}>
            <Loader2 size={16} className="animate-spin" />
            Aggiornamento ItemTypeSet in corso...
          </p>
        </div>
      )}

      {successMessage && (
        <div className={alert.successContainer}>
          <p className={alert.success}>
            <CheckCircle size={16} />
            {successMessage}
          </p>
        </div>
      )}

      {error && (
        <div className={alert.errorContainer}>
          <p className={alert.error}>
            <AlertCircle size={16} />
            {error}
          </p>
        </div>
      )}

      {selectedPermissionForProjectGrant &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                setSelectedPermissionForProjectGrant(null);
              }
            }}
          >
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "0.5rem",
                padding: "2rem",
                maxWidth: "90vw",
                maxHeight: "90vh",
                overflowY: "auto",
                width: "900px",
              }}
              onClick={(event) => event.stopPropagation()}
            >
              <PermissionGrantManager
                permission={selectedPermissionForProjectGrant}
                onClose={() => setSelectedPermissionForProjectGrant(null)}
                onSave={() => {
                  setSelectedPermissionForProjectGrant(null);
                  setRefreshTrigger((prev) => prev + 1);
                }}
                itemTypeSetId={itemTypeSet.id}
                scope="project"
                projectId={projectId}
              />
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

interface ProjectMember {
  userId: number;
  username: string;
  fullName: string | null;
  roleName: string;
  isTenantAdmin: boolean;
}

export default function ProjectSettings() {
  const { projectId } = useParams<{ projectId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const token = (location.state as any)?.token || localStorage.getItem("token");

  const [project, setProject] = useState<ProjectDto | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingItemTypeSet, setIsUpdatingItemTypeSet] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [projectRes, membersRes] = await Promise.all([
          api.get(`/projects/${projectId}`, { headers }),
          api.get(`/projects/${projectId}/members`, { headers })
        ]);
        setProject(projectRes.data);
        setMembers(membersRes.data);
      } catch (err: any) {
        console.error("Errore nel caricamento del progetto:", err);
        setError(extractErrorMessage(err, "Error loading project. Please try again."));
      } finally {
        setLoading(false);
      }
    };

    if (token && projectId) {
      fetchData();
    }
  }, [projectId, token]);

  const handleEditDetails = () => {
    navigate("details", { state: { token, from: location.pathname } });
  };

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} />;
  if (!project) return <ErrorMessage message="Project not found or loading error." />;


  const handleItemTypeSetChange = async (itemTypeSetId: number) => {
    if (!project) return;
    
    try {
      setIsUpdatingItemTypeSet(true);
      const headers = { Authorization: `Bearer ${token}` };
      
      await api.put(`/projects/${project.id}/item-type-set?itemTypeSetId=${itemTypeSetId}`, {}, { headers });
      
      // Ricarica i dati del progetto per aggiornare l'ItemTypeSet
      const projectRes = await api.get(`/projects/${project.id}`, { headers });
      setProject(projectRes.data);
      
      setSuccessMessage("ItemTypeSet aggiornato con successo!");
      setError(null);
      
      // Rimuovi il messaggio di successo dopo 3 secondi
      setTimeout(() => setSuccessMessage(null), 3000);
      
    } catch (err: any) {
      console.error("Errore nell'aggiornamento dell'ItemTypeSet:", err);
      setError(extractErrorMessage(err, "Errore nell'aggiornamento dell'ItemTypeSet"));
      setSuccessMessage(null);
    } finally {
      setIsUpdatingItemTypeSet(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Impostazioni Progetto"
        description="Gestisci le configurazioni e le impostazioni del tuo progetto."
      />

      <Tabs
        tabs={projectSettingsTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className={tabContentClass}>
        {activeTab === "home" && (
          <ProjectSettingsHomeTab
            project={project}
            onEditDetails={handleEditDetails}
            onConfigureNotifications={() => navigate("notifications")}
          />
        )}

        {activeTab === "itemtypeset" && (
          <ProjectSettingsItemTypeSetTab
            project={project}
            onItemTypeSetChange={handleItemTypeSetChange}
            isUpdatingItemTypeSet={isUpdatingItemTypeSet}
            successMessage={successMessage}
            error={error}
            projectId={projectId ?? ""}
          />
        )}

        {activeTab === "members" && (
          <ProjectSettingsMembersTab
            members={members}
            projectId={projectId ?? ""}
            token={token}
            onMembersUpdate={setMembers}
          />
        )}
      </div>
    </PageContainer>
  );
}

interface ProjectSettingsHomeTabProps {
  project: ProjectDto;
  onEditDetails: () => void;
  onConfigureNotifications?: () => void;
}

function ProjectSettingsHomeTab({
  project,
  onEditDetails,
  onConfigureNotifications,
}: ProjectSettingsHomeTabProps) {
  return (
    <div className="space-y-6">
      <ProjectDetails project={project} onEdit={onEditDetails} />
      <ProjectSettingsNotificationsPanel onConfigure={onConfigureNotifications} />
    </div>
  );
}

interface ProjectSettingsItemTypeSetTabProps {
  project: ProjectDto;
  onItemTypeSetChange: (itemTypeSetId: number) => void;
  isUpdatingItemTypeSet: boolean;
  successMessage: string | null;
  error: string | null;
  projectId: string;
}

function ProjectSettingsItemTypeSetTab({
  project,
  onItemTypeSetChange,
  isUpdatingItemTypeSet,
  successMessage,
  error,
  projectId,
}: ProjectSettingsItemTypeSetTabProps) {
  if (!project.itemTypeSet) {
    return (
      <div className={layout.block}>
        <h1 className={layout.title}>ItemTypeSet</h1>
        <p className={alert.muted}>Nessun ItemTypeSet assegnato a questo progetto.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ItemTypeSetDetails
        itemTypeSet={project.itemTypeSet}
        onItemTypeSetChange={onItemTypeSetChange}
        isUpdatingItemTypeSet={isUpdatingItemTypeSet}
        successMessage={successMessage}
        error={error}
        projectId={projectId}
      />
    </div>
  );
}

interface ProjectSettingsMembersTabProps {
  members: any[];
  projectId: string;
  token: string | null;
  onMembersUpdate: (members: any[]) => void;
}

function ProjectSettingsMembersTab({
  members,
  projectId,
  token,
  onMembersUpdate,
}: ProjectSettingsMembersTabProps) {
  return (
    <div className="space-y-6">
      <Panel
        title="Membri del Progetto"
        description={
          <>
            Gestisci gli utenti che possono accedere a questo progetto e i loro ruoli.
            <br />
            <em className="text-sm">
              Nota: Gli utenti con ruolo Tenant Admin hanno accesso automatico a tutti i progetti.
            </em>
          </>
        }
        bodyClassName="space-y-4"
      >
        {members.length > 0 ? (
          <>
            <table className={`${table.table} ${utilities.mt4}`}>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Nome Completo</th>
                  <th>Ruolo</th>
                </tr>
              </thead>
              <tbody>
                {members.slice(0, 5).map((member) => (
                  <tr key={member.userId} className={member.isTenantAdmin ? "bg-gray-50" : ""}>
                    <td>
                      {member.username}
                      {member.isTenantAdmin && (
                        <span className="ml-2 text-xs text-gray-500">(Tenant Admin)</span>
                      )}
                    </td>
                    <td>
                      {member.fullName || <span className="italic text-gray-400">-</span>}
                    </td>
                    <td>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          member.roleName === "ADMIN"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {member.roleName === "ADMIN" ? "Admin" : "User"}
                        {member.isTenantAdmin && " (fisso)"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {members.length > 5 && (
              <p className="mt-2 text-sm text-gray-500">... e altri {members.length - 5} membri</p>
            )}
          </>
        ) : (
          <p className={`${alert.muted} ${utilities.mt4}`}>
            Nessun membro assegnato a questo progetto.
          </p>
        )}

        <ProjectMembersPanel
          projectId={projectId}
          token={token}
          members={members}
          onMembersUpdate={onMembersUpdate}
        />
      </Panel>
    </div>
  );
}

