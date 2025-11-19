import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";

import { useAuth } from "../../context/AuthContext";
import { WorkflowSimpleDto, WorkflowDetailDto } from "../../types/workflow.types";
import UsedInItemTypeSetsPopup from "../../components/shared/UsedInItemTypeSetsPopup";
import WorkflowViewModal from "../../components/shared/WorkflowViewModal";
import UniversalPageTemplate from "../../components/shared/UniversalPageTemplate";
import { extractErrorMessage } from "../../utils/errorUtils";

import layout from "../../styles/common/Layout.module.css";
import buttons from "../../styles/common/Buttons.module.css";
import alert from "../../styles/common/Alerts.module.css";
import table from "../../styles/common/Tables.module.css";

interface WorkflowsUniversalProps {
  scope: 'tenant' | 'project';
  projectId?: string;
}

export default function WorkflowsUniversal({ scope, projectId }: WorkflowsUniversalProps) {
  const navigate = useNavigate();
  const auth = useAuth() as any;
  const token = auth?.token;
  const roles = auth?.roles || [];

  const [workflows, setWorkflows] = useState<WorkflowDetailDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewingWorkflowId, setViewingWorkflowId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);

  const hasRole = (name: string, scope: string | null = null) => {
    return roles && Array.isArray(roles) && roles.some((r: any) => r.name === name && (scope === null || r.scope === scope));
  };
  const isTenantAdmin = hasRole("ADMIN", "TENANT");
  const isProjectAdmin = hasRole("ADMIN", "PROJECT");

  const handleView = (id: number) => {
    setViewingWorkflowId(id);
    setShowModal(true);
  };

  useEffect(() => {
    if (!token) return;

    const fetchWorkflows = async () => {
      try {
        let endpoint = "/workflows";
        if (scope === 'project' && projectId) {
          endpoint = `/workflows/project/${projectId}`;
        }

        const response = await api.get(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // Fetch details for each workflow
        const workflowsWithDetails = await Promise.all(
          response.data.map(async (workflow: WorkflowSimpleDto) => {
            try {
              let detailEndpoint = `/workflows/${workflow.id}/details`;
              if (scope === 'project' && projectId) {
                detailEndpoint = `/workflows/project/${projectId}/${workflow.id}/details`;
              }
              const detailResponse = await api.get(detailEndpoint, {
                headers: { Authorization: `Bearer ${token}` },
              });
              return detailResponse.data;
            } catch (err) {
              // If details fail, return basic workflow
              return {
                ...workflow,
                usedInItemTypeConfigurations: []
              };
            }
          })
        );
        
        setWorkflows(workflowsWithDetails);
      } catch (err: any) {
        console.error("Errore nel caricamento dei workflow", err);
        setError(extractErrorMessage(err, "Errore nel caricamento dei workflow"));
      } finally {
        setLoading(false);
      }
    };

    fetchWorkflows();
  }, [token, scope, projectId]);

  const handleEdit = (id: number) => {
    if (scope === 'tenant') {
      navigate(`/tenant/workflows/${id}`);
    } else if (scope === 'project' && projectId) {
      navigate(`/projects/${projectId}/workflows/${id}`);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm("Sei sicuro di voler eliminare questo workflow?");
    if (!confirmed) return;

    try {
      let endpoint = `/workflows/${id}`;
      if (scope === 'project' && projectId) {
        endpoint = `/workflows/project/${projectId}/${id}`;
      }
      await api.delete(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWorkflows((prev) => prev.filter((wf) => wf.id !== id));
    } catch (err: any) {
      console.error("Errore durante l'eliminazione", err);
      window.alert(extractErrorMessage(err, "Errore durante l'eliminazione"));
    }
  };

  const handleCreate = () => {
    if (scope === 'tenant') {
      navigate("/tenant/workflows/create");
    } else if (scope === 'project' && projectId) {
      navigate(`/projects/${projectId}/workflows/create`);
    }
  };

  const getTitle = () => {
    return scope === 'tenant' 
      ? "Workflow" 
      : "Workflow del Progetto";
  };

  const getDescription = () => {
    return scope === 'tenant'
      ? "Gestisci i workflow disponibili nel sistema."
      : "Gestisci i workflow specifici per questo progetto.";
  };

  let content;
  if (loading) {
    content = (
      <div className={alert.infoContainer}>
        <p className={alert.info}>Caricamento workflow...</p>
      </div>
    );
  } else if (workflows.length === 0) {
    content = (
      <div className={alert.infoContainer}>
        <p className={alert.info}>Nessun workflow trovato.</p>
        <p className="mt-2 text-sm text-gray-600">Clicca su "Crea nuovo workflow" per iniziare.</p>
      </div>
    );
  } else {
    content = (
      <div className={layout.block}>
        <div className="overflow-x-auto">
          <table className={table.table}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>ItemTypeSet</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {workflows.map((wf) => (
                <tr key={wf.id}>
                  <td>{wf.name}</td>
                  <td>
                    <UsedInItemTypeSetsPopup workflow={wf} />
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        className={buttons.button}
                        onClick={() => handleView(wf.id)}
                        style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                      >
                        👁 Visualizza
                      </button>
                      <button
                        className={buttons.button}
                        onClick={() => handleEdit(wf.id)}
                        disabled={wf.defaultWorkflow}
                        title={wf.defaultWorkflow ? "Modifica disabilitata: workflow di default" : ""}
                        style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                      >
                        ✎ Modifica
                      </button>
                      <button
                        className={buttons.button}
                        onClick={() => handleDelete(wf.id)}
                        disabled={wf.defaultWorkflow || (wf.usedInItemTypeConfigurations && wf.usedInItemTypeConfigurations.length > 0)}
                        title={
                          wf.usedInItemTypeConfigurations && wf.usedInItemTypeConfigurations.length > 0
                            ? "Workflow utilizzato in ItemTypeSet: non eliminabile"
                            : wf.defaultWorkflow
                              ? "Eliminazione disabilitata: workflow di default"
                              : ""
                        }
                        style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                      >
                        Elimina
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (!isTenantAdmin && !isProjectAdmin) {
    return (
      <div className={layout.container} style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div className={alert.errorContainer}>
          <p className={alert.error}>Accesso negato</p>
        </div>
      </div>
    );
  }


  return (
    <>
      <UniversalPageTemplate
        title={getTitle()}
        description={getDescription()}
        error={error}
        headerActions={
          <button
            className={buttons.button}
            onClick={handleCreate}
          >
            + Crea Nuovo Workflow
          </button>
        }
      >
        {content}
      </UniversalPageTemplate>

      <WorkflowViewModal
        workflowId={viewingWorkflowId}
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setViewingWorkflowId(null);
        }}
        scope={scope}
        projectId={projectId}
        token={token}
      />
    </>
  );
}










