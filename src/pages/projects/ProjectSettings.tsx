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
  const hasEntries = itemTypeSet.entries?.length > 0;

  return (
    <>
      <h1 className={layout.title}>Item Type Set</h1>
      <div className={layout.block}>
        <p>
          <strong>Name:</strong> {itemTypeSet.name}
        </p>
        <p>
          <strong>Global:</strong> {itemTypeSet.global ? "Yes" : "No"}
        </p>

        {hasEntries ? (
          <table className={`${table.table} ${layout.mt4}`}>
            <thead>
              <tr>
                <th>Item Type</th>
                <th>Category</th>
              </tr>
            </thead>
            <tbody>
              {itemTypeSet.entries.map((entry: any) => (
                <tr key={entry.itemTypeId}>
                  <td>{entry.itemTypeName}</td>
                  <td>{entry.category}</td>
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
          disabled={itemTypeSet.global}
          title={itemTypeSet.global ? "Global sets cannot be edited" : "Edit item type set"}
        >
          Edit
        </button>
      </div>
    </>
  );
}

export default function ProjectSettings() {
  const { projectId } = useParams<{ projectId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const token = (location.state as any)?.token || localStorage.getItem("token");

  const [project, setProject] = useState<ProjectDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const projectRes = await api.get(`http://localhost:8080/api/projects/${projectId}`, { headers });
        setProject(projectRes.data);
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

  return (
    <div className={layout.container}>
      <h1 className={layout.title}>Project Details</h1>
      <ProjectDetails project={project} onEdit={handleEditDetails} />

      {project.itemTypeSet && <ItemTypeSetDetails itemTypeSet={project.itemTypeSet} onEdit={handleEditItemTypeSet} />}
    </div>
  );
}

