import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import api from "../api/api";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";
import { ProjectDto } from "../types/project.types";
import CreateProjectModal from "../components/CreateProjectModal";

import layout from "../styles/common/Layout.module.css";
import table from "../styles/common/Tables.module.css";
import alert from "../styles/common/Alerts.module.css";
import buttons from "../styles/common/Buttons.module.css";

export default function HomeProjects() {
  const auth = useAuth() as any;
  const token = auth?.token;
  const { favoriteIds, toggleFavorite } = useFavorites();

  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/projects/by-user", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProjects(response.data);
    } catch (err: any) {
      console.error("Errore nel recupero progetti:", err);
      setError(err.response?.data?.message || "Errore nel recupero progetti.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchProjects();
  }, [token]);

  const handleProjectCreated = () => {
    fetchProjects();
  };

  const handleToggleFavorite = async (projectId: number, e: React.MouseEvent) => {
    e.preventDefault(); // Previeni navigazione del Link
    e.stopPropagation();
    
    try {
      await toggleFavorite(projectId);
    } catch (err: any) {
      console.error("Errore toggle preferito:", err);
    }
  };

  let content;

  if (loading) {
    content = <p className="list-loading">Caricamento progetti...</p>;
  } else if (error) {
    content = <p className={alert.error}>{error}</p>;
  } else if (projects.length === 0) {
    content = <p className="list-loading">Nessun progetto trovato.</p>;
  } else {
    content = (
      <table className={table.table}>
        <thead>
          <tr>
            <th style={{ width: '40px' }}></th>
            <th>Name</th>
            <th>Key</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((proj) => {
            const isFavorite = favoriteIds.has(proj.id);
            return (
              <tr key={proj.id}>
                <td style={{ textAlign: 'center' }}>
                  <button
                    onClick={(e) => handleToggleFavorite(proj.id, e)}
                    className="cursor-pointer hover:scale-110 transition-transform"
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      padding: '4px',
                      cursor: 'pointer'
                    }}
                    title={isFavorite ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
                  >
                    <Star 
                      size={20} 
                      fill={isFavorite ? "#fbbf24" : "none"}
                      stroke={isFavorite ? "#fbbf24" : "#9ca3af"}
                      strokeWidth={2}
                    />
                  </button>
                </td>
                <td>
                  <Link to={`/projects/${proj.id}`} className={layout.link}>
                    {proj.name}
                  </Link>
                </td>
                <td>
                  <Link to={`/projects/${proj.id}`} className={layout.link}>
                    {proj.key}
                  </Link>
                </td>
                <td>{proj.description}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  return (
    <div className={layout.container}>
      <h1 className={layout.title}>Projects</h1>

      <button 
        className={buttons.button}
        onClick={() => setShowCreateModal(true)}
      >
        + Crea nuovo progetto
      </button>

      {content}
      
      {showCreateModal && (
        <CreateProjectModal
          token={token}
          onClose={() => setShowCreateModal(false)}
          onProjectCreated={handleProjectCreated}
        />
      )}
    </div>
  );
}

