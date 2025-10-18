import { useEffect, useState } from "react";
import api from "../../api/api";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { ProjectDto } from "../../types/project.types";

import layout from "../../styles/common/Layout.module.css";
import buttons from "../../styles/common/Buttons.module.css";
import table from "../../styles/common/Tables.module.css";
import alert from "../../styles/common/Alerts.module.css";
import utilities from "../../styles/common/Utilities.module.css";

function Loading() {
  return <p className={layout.loading}>Loading project...</p>;
}

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
    <div className={layout.block}>
      <p>
        <strong>Name:</strong> {project.name}
      </p>
      <p>
        <strong>Key:</strong> <span className={utilities.monospace}>{project.key}</span>
      </p>
      <p>
        <strong>Description:</strong> {project.description || <em>No description</em>}
      </p>
      <button className={`${buttons.button} ${layout.mt4}`} onClick={onEdit}>
        Edit
      </button>
    </div>
  );
}

interface ItemTypeSetDetailsProps {
  itemTypeSet: any;
  onEdit: () => void;
}

function ItemTypeSetDetails({ itemTypeSet, onEdit }: ItemTypeSetDetailsProps) {
  const hasEntries = itemTypeSet.itemTypeConfigurations?.length > 0;
  const isGlobal = itemTypeSet.scope === 'TENANT';

  return (
    <>
      <h1 className={layout.title}>Item Type Set</h1>
      <div className={layout.block}>
        <p>
          <strong>Name:</strong> {itemTypeSet.name}
        </p>
        <p>
          <strong>Global:</strong> {isGlobal ? "Yes" : "No"}
        </p>

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
                  <td>{config.itemType?.name || 'N/A'}</td>
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

        <button
          className={`${buttons.button} ${utilities.mt6}`}
          onClick={onEdit}
          disabled={isGlobal}
          title={isGlobal ? "Global sets cannot be edited" : "Edit item type set"}
        >
          Edit
        </button>
      </div>
    </>
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
        setError(err.response?.data?.message || "Error loading project. Please try again.");
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

  const handleEditItemTypeSet = () => {
    if (project?.itemTypeSet) {
      navigate(`item-type-set/${project.itemTypeSet.id}`, { state: { token } });
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} />;
  if (!project) return <ErrorMessage message="Project not found or loading error." />;

  const handleManageMembers = () => {
    navigate("members", { state: { token } });
  };

  return (
    <div className={layout.container}>
      <h1 className={layout.title}>Project Details</h1>
      <ProjectDetails project={project} onEdit={handleEditDetails} />

      {project.itemTypeSet && <ItemTypeSetDetails itemTypeSet={project.itemTypeSet} onEdit={handleEditItemTypeSet} />}

      {/* Project Members Section */}
      <div className={layout.block}>
        <h1 className={layout.title}>Membri del Progetto</h1>
        <p className={layout.paragraphMuted}>
          Gestisci gli utenti che possono accedere a questo progetto e i loro ruoli.
          <br />
          <em className="text-sm">Nota: Gli utenti con ruolo Tenant Admin hanno accesso automatico a tutti i progetti.</em>
        </p>
        
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
                    <td>{member.fullName || <span className="text-gray-400 italic">-</span>}</td>
                    <td>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        member.roleName === 'ADMIN' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {member.roleName === 'ADMIN' ? 'Admin' : 'User'}
                        {member.isTenantAdmin && ' (fisso)'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {members.length > 5 && (
              <p className="text-sm text-gray-500 mt-2">
                ... e altri {members.length - 5} membri
              </p>
            )}
          </>
        ) : (
          <p className={`${alert.muted} ${utilities.mt4}`}>
            Nessun membro assegnato a questo progetto.
          </p>
        )}
        
        <button
          className={`${buttons.button} ${utilities.mt4}`}
          onClick={handleManageMembers}
        >
          Gestisci Membri
        </button>
      </div>
    </div>
  );
}

