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
    content = (
      <div className={alert.infoContainer}>
        <p className={alert.info}>Caricamento progetti...</p>
      </div>
    );
  } else if (projects.length === 0) {
    content = (
      <div className={alert.infoContainer}>
        <p className={alert.info}>Nessun progetto trovato.</p>
        <p className="mt-2 text-sm text-gray-600">Clicca su "Crea Nuovo Progetto" per iniziare.</p>
      </div>
    );
  } else {
    content = (
      <div className={layout.block}>
        <div className="overflow-x-auto">
          <table className={table.table}>
            <thead>
              <tr>
                <th style={{ width: '40px' }}></th>
                <th>Nome</th>
                <th>Chiave</th>
                <th>Descrizione</th>
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
                    <td>{proj.description || <span className="text-gray-400 italic">Nessuna descrizione</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className={layout.container} style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header Section */}
      <div className={layout.headerSection}>
        <h1 className={layout.title}>Progetti</h1>
        <p className={layout.paragraphMuted}>
          Gestisci i tuoi progetti e accedi alle loro configurazioni.
        </p>
        <div className={layout.buttonRow}>
          <button 
            className={buttons.button}
            onClick={() => setShowCreateModal(true)}
          >
            + Crea Nuovo Progetto
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className={alert.errorContainer}>
          <p className={alert.error}>{error}</p>
        </div>
      )}

      {/* Content Section */}
      <div className={layout.section}>
        {content}
      </div>
      
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

