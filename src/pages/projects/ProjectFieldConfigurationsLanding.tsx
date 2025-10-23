import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useFavorites } from "../../context/FavoritesContext";
import { FolderOpen, ArrowRight } from "lucide-react";

import layout from "../../styles/common/Layout.module.css";
import buttons from "../../styles/common/Buttons.module.css";
import alert from "../../styles/common/Alerts.module.css";

export default function ProjectFieldConfigurationsLanding() {
  const navigate = useNavigate();
  const auth = useAuth() as any;
  const { favoriteProjects } = useFavorites();

  const handleProjectSelect = (projectId: number) => {
    navigate(`/projects/${projectId}/field-configurations`);
  };

  const handleGoToProjects = () => {
    navigate("/projects");
  };

  return (
    <div className={layout.container}>
      <div className="text-center mb-8">
        <FolderOpen size={64} className="mx-auto text-blue-500 mb-4" />
        <h1 className={layout.title}>Field Configurations del Progetto</h1>
        <p className={layout.paragraphMuted}>
          Seleziona un progetto per gestire le sue Field Configurations specifiche.
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        {favoriteProjects.length > 0 ? (
          <div className={layout.block}>
            <h2 className="text-lg font-semibold mb-4">Progetti Preferiti</h2>
            <div className="space-y-3">
              {favoriteProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleProjectSelect(project.id)}
                >
                  <div className="flex items-center gap-3">
                    <FolderOpen size={20} className="text-blue-500" />
                    <div>
                      <div className="font-medium">{project.name}</div>
                      <div className="text-sm text-gray-500">ID: {project.id}</div>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-gray-400" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={alert.info}>
            <p>Non hai progetti preferiti configurati.</p>
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={handleGoToProjects}
            className={`${buttons.button} ${buttons.buttonSecondary} flex items-center gap-2 mx-auto`}
          >
            <FolderOpen size={16} />
            Vai alla Lista Progetti
          </button>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Come funziona?</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Le Field Configurations del progetto sono specifiche per ogni progetto</li>
            <li>• Sono separate dalle Field Configurations del tenant</li>
            <li>• Solo gli Admin del progetto possono gestirle</li>
            <li>• Seleziona un progetto per iniziare</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
