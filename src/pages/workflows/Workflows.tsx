import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";

import { useAuth } from "../../context/AuthContext";
import { WorkflowSimpleDto, WorkflowDetailDto } from "../../types/workflow.types";
import UsedInItemTypeSetsPopup from "../../components/shared/UsedInItemTypeSetsPopup";
import WorkflowViewModal from "../../components/shared/WorkflowViewModal";
import ActionsMenu from "../../components/shared/ActionsMenu";

import layout from "../../styles/common/Layout.module.css";
import buttons from "../../styles/common/Buttons.module.css";
import alert from "../../styles/common/Alerts.module.css";
import table from "../../styles/common/Tables.module.css";

export default function Workflows() {
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
        const response = await api.get("/workflows", {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // Fetch details for each workflow
        const workflowsWithDetails = await Promise.all(
          response.data.map(async (workflow: WorkflowSimpleDto) => {
            try {
              const detailResponse = await api.get(`/workflows/${workflow.id}/details`, {
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
        setError(err.response?.data?.message || "Errore nel caricamento dei workflow");
      } finally {
        setLoading(false);
      }
    };

    fetchWorkflows();
  }, [token]);

  const handleEdit = (id: number) => {
    navigate(`/tenant/workflows/${id}`);
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm("Sei sicuro di voler eliminare questo workflow?");
    if (!confirmed) return;

    try {
      await api.delete(`/workflows/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWorkflows((prev) => prev.filter((wf) => wf.id !== id));
    } catch (err: any) {
      console.error("Errore durante l'eliminazione", err);
      window.alert(err.response?.data?.message || "Errore durante l'eliminazione");
    }
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
                <th></th>
              </tr>
            </thead>
            <tbody>
              {workflows.map((wf) => (
                <tr key={wf.id}>
                  <td>{wf.name}</td>
                  <td>
                    <UsedInItemTypeSetsPopup workflow={wf} />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <ActionsMenu
                      actions={[
                        {
                          label: "👁 Visualizza",
                          onClick: () => handleView(wf.id),
                        },
                        {
                          label: "✎ Modifica",
                          onClick: () => handleEdit(wf.id),
                          disabled: wf.defaultWorkflow,
                        },
                        {
                          label: "Elimina",
                          onClick: () => handleDelete(wf.id),
                          disabled:
                            wf.defaultWorkflow ||
                            (wf.usedInItemTypeConfigurations &&
                              wf.usedInItemTypeConfigurations.length > 0),
                        },
                      ]}
                    />
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
    <div className={layout.container} style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header Section */}
      <div className={layout.headerSection}>
        <h1 className={layout.title}>Workflow</h1>
        <p className={layout.paragraphMuted}>
          Gestisci i workflow disponibili nel sistema.
        </p>
        <div className={layout.buttonRow}>
          <button
            className={buttons.button}
            onClick={() => navigate("/tenant/workflows/create")}
          >
            + Crea Nuovo Workflow
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

      <WorkflowViewModal
        workflowId={viewingWorkflowId}
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setViewingWorkflowId(null);
        }}
        scope="tenant"
        token={token}
      />
    </div>
  );
}

