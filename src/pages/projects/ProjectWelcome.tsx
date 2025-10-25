import { useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useState } from "react";
import api from "../../api/api";
import { FolderOpen } from "lucide-react";

import layout from "../../styles/common/Layout.module.css";

export default function ProjectWelcome() {
  const { projectId } = useParams<{ projectId: string }>();
  const auth = useAuth() as any;
  const token = auth?.token;
  
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId && token) {
      const fetchProject = async () => {
        try {
          const response = await api.get(`/projects/${projectId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setProject(response.data);
        } catch (err) {
          console.error("Errore nel recupero del progetto:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchProject();
    }
  }, [projectId, token]);

  if (loading) {
    return (
      <div className={layout.container} style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div className={layout.headerSection}>
          <h1 className={layout.title}>Caricamento progetto...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className={layout.container} style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header Section */}
      <div className={layout.headerSection}>
        <div className="text-center">
          <FolderOpen size={80} className="mx-auto text-blue-500 mb-6" />
          <h1 className={layout.title}>
            Benvenuto in {project?.name || "Progetto"}
          </h1>
          <p className={layout.paragraphMuted}>
            Utilizza la barra di navigazione per accedere alle funzionalità del progetto.
          </p>
        </div>
      </div>
    </div>
  );
}
