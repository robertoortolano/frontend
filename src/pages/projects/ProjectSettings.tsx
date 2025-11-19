import { useEffect, useState } from "react";
import api from "../../api/api";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { ProjectDto } from "../../types/project.types";
import { CheckCircle, Loader2, AlertCircle, Home, Settings, Users } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import ProjectMembersPanel from "../../components/ProjectMembersPanel";
import PermissionGrantModal from "../../components/shared/PermissionGrantModal";
import { PageContainer, PageHeader, Panel, Tabs } from "../../components/shared/layout";
import { ProjectSettingsNotificationsPanel } from "./components/ProjectSettingsNotificationsPanel";
import { ItemTypeSetInfo } from "./components/ItemTypeSetInfo";
import { ItemTypeSetGlobalPermissionsPanel } from "./components/ItemTypeSetGlobalPermissionsPanel";
import { ItemTypeSetProjectGrantsPanel } from "./components/ItemTypeSetProjectGrantsPanel";
import { ItemTypeSetChangePanel } from "./components/ItemTypeSetChangePanel";
import { ProjectMembersTable } from "./components/ProjectMembersTable";

import layout from "../../styles/common/Layout.module.css";
import alert from "../../styles/common/Alerts.module.css";
import form from "../../styles/common/Forms.module.css";
import utilities from "../../styles/common/Utilities.module.css";
import buttons from "../../styles/common/Buttons.module.css";
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
  
  const [selectedPermissionForProjectGrant, setSelectedPermissionForProjectGrant] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const isGlobal = itemTypeSet.scope === 'TENANT';
  const canChangeItemTypeSet = isTenantAdmin || (isProjectAdmin && !isGlobal);

  return (
    <div className="flex flex-col gap-8">
      <h1 className={layout.title}>Item Type Set</h1>

      <ItemTypeSetInfo itemTypeSet={itemTypeSet} title="ItemTypeSet Attualmente Applicato" />

      <ItemTypeSetGlobalPermissionsPanel
        itemTypeSet={itemTypeSet}
        projectId={projectId}
        isTenantAdmin={isTenantAdmin}
        refreshTrigger={refreshTrigger}
      />

      <ItemTypeSetProjectGrantsPanel
        itemTypeSet={itemTypeSet}
        projectId={projectId}
        isTenantAdmin={isTenantAdmin}
        isProjectAdmin={isProjectAdmin}
        refreshTrigger={refreshTrigger}
        onPermissionGrantClick={(permission: any) => {
          setSelectedPermissionForProjectGrant(permission);
        }}
      />

      <ItemTypeSetChangePanel
        itemTypeSet={itemTypeSet}
        projectId={projectId}
        isTenantAdmin={isTenantAdmin}
        isProjectAdmin={isProjectAdmin}
        canChangeItemTypeSet={canChangeItemTypeSet}
        isUpdatingItemTypeSet={isUpdatingItemTypeSet}
        onItemTypeSetChange={onItemTypeSetChange}
      />

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

      <PermissionGrantModal
        permission={selectedPermissionForProjectGrant}
        isOpen={Boolean(selectedPermissionForProjectGrant)}
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
        <ProjectMembersTable members={members} />

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

