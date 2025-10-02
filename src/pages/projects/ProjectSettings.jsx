import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import api from "../../api/api";
import { useParams, useLocation, useNavigate } from "react-router-dom";

import layout from "../../styles/common/Layout.module.css";
import buttons from "../../styles/common/Buttons.module.css";
import table from "../../styles/common/Tables.module.css";
import alert from "../../styles/common/Alerts.module.css";
import utilities from "../../styles/common/Utilities.module.css";

function Loading() {
  return <p className={layout.loading}>Loading project...</p>;
}

function ErrorMessage({ message }) {
  return <p className={alert.error}>{message}</p>;
}
ErrorMessage.propTypes = {
  message: PropTypes.string.isRequired,
};

function ProjectDetails({ project, onEdit }) {
  return (
    <div className={layout.block}>
      <p><strong>Name:</strong> {project.name}</p>
      <p><strong>Key:</strong> <span className={utilities.monospace}>{project.key}</span></p>
      <p><strong>Description:</strong> {project.description || <em>No description</em>}</p>
      <button className={`${buttons.button} ${layout.mt4}`} onClick={onEdit}>Edit</button>
    </div>
  );
}
ProjectDetails.propTypes = {
  project: PropTypes.shape({
    name: PropTypes.string.isRequired,
    key: PropTypes.string.isRequired,
    description: PropTypes.string,
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
};

function ItemTypeSetDetails({ itemTypeSet, onEdit }) {
  const hasEntries = itemTypeSet.entries?.length > 0;

  return (
    <>
      <h1 className={layout.title}>Item Type Set</h1>
      <div className={layout.block}>
        <p><strong>Name:</strong> {itemTypeSet.name}</p>
        <p><strong>Global:</strong> {itemTypeSet.global ? "Yes" : "No"}</p>

        {hasEntries ? (
          <table className={`${table.table} ${layout.mt4}`}>
            <thead>
              <tr><th>Item Type</th><th>Category</th></tr>
            </thead>
            <tbody>
              {itemTypeSet.entries.map((entry) => (
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

ItemTypeSetDetails.propTypes = {
  itemTypeSet: PropTypes.shape({
    name: PropTypes.string.isRequired,
    global: PropTypes.bool.isRequired,
    entries: PropTypes.arrayOf(
      PropTypes.shape({
        itemTypeId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        itemTypeName: PropTypes.string.isRequired,
        category: PropTypes.string.isRequired,
      })
    ).isRequired,
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
};

export default function ProjectSettings() {
  const { projectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const token = location.state?.token || localStorage.getItem("token");

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const projectRes = await api.get(`http://localhost:8080/api/projects/${projectId}`, { headers });
        setProject(projectRes.data);
      } catch (err) {
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
    navigate(`item-type-set/${project.itemTypeSet.id}`, { state: { token } });
  };

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} />;
  if (!project) return <ErrorMessage message="Project not found or loading error." />;

  return (
    <div className={layout.container}>
      <h1 className={layout.title}>Project Details</h1>
      <ProjectDetails project={project} onEdit={handleEditDetails} />

      {project.itemTypeSet && (
        <ItemTypeSetDetails itemTypeSet={project.itemTypeSet} onEdit={handleEditItemTypeSet} />
      )}
    </div>
  );
}
