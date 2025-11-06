import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/api";

import ReactFlow, { Background, Controls, MiniMap, MarkerType, ReactFlowProvider } from "reactflow";
import 'reactflow/dist/style.css';

import CustomNode from "./components/CustomNode";
import SelectableEdge from "./components/SelectableEdge";
import { useAuth } from "../../context/AuthContext";
import { WorkflowSimpleDto, WorkflowViewDto, WorkflowDetailDto } from "../../types/workflow.types";
import { StatusCategory } from "../../types/common.types";
import UsedInItemTypeSetsPopup from "../../components/shared/UsedInItemTypeSetsPopup";
import { convertToReactFlowNode } from "../../utils/workflow-converters";
import { getCategoryColor } from "./components/workflowUtils";
import { extractErrorMessage } from "../../utils/errorUtils";

import layout from "../../styles/common/Layout.module.css";
import buttons from "../../styles/common/Buttons.module.css";
import alert from "../../styles/common/Alerts.module.css";
import table from "../../styles/common/Tables.module.css";

interface WorkflowsUniversalProps {
  scope: 'tenant' | 'project';
  projectId?: string;
}

function CustomNodeWrapper(props: any) {
  return <CustomNode {...props} />;
}

function SelectableEdgeWrapper(props: any) {
  return <SelectableEdge {...props} onDelete={() => {}} setEdges={() => {}} />;
}

const nodeTypes = {
  customNode: CustomNodeWrapper,
};

const edgeTypes = {
  selectableEdge: SelectableEdgeWrapper,
};

export default function WorkflowsUniversal({ scope, projectId }: WorkflowsUniversalProps) {
  const navigate = useNavigate();
  const auth = useAuth() as any;
  const token = auth?.token;
  const roles = auth?.roles || [];

  const [workflows, setWorkflows] = useState<WorkflowDetailDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewingWorkflow, setViewingWorkflow] = useState<WorkflowViewDto | null>(null);
  const [viewingError, setViewingError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const hasRole = (name: string, scope: string | null = null) => {
    return roles && Array.isArray(roles) && roles.some((r: any) => r.name === name && (scope === null || r.scope === scope));
  };
  const isTenantAdmin = hasRole("ADMIN", "TENANT");
  const isProjectAdmin = hasRole("ADMIN", "PROJECT");

  const handleView = async (id: number) => {
    try {
      let endpoint = `/workflows/${id}`;
      if (scope === 'project' && projectId) {
        endpoint = `/workflows/project/${projectId}/${id}`;
      }
      const res = await api.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setViewingWorkflow(res.data);
      setViewingError(null);
      setShowModal(true);
    } catch (err) {
      console.error("Errore nel caricamento workflow", err);
      setViewingError("Errore nel caricamento del workflow.");
      setShowModal(true);
    }
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

  let modalContent;

  if (viewingError) {
    modalContent = <p className={alert.error}>{viewingError}</p>;
  } else if (viewingWorkflow) {
    // Convert to ReactFlow nodes and edges using the same converters as edit/create
    const nodes = (viewingWorkflow.workflowNodes || []).map((meta) => {
      const wfStatus = viewingWorkflow.statuses.find(
        (s) => s.status.id === meta.statusId
      );

      const label = wfStatus?.status?.name ?? `Nodo ${meta.id}`;
      const category = wfStatus?.statusCategory ?? "BACKLOG";
      const backgroundColor = getCategoryColor(category);
      const isInitial = Number(wfStatus?.status.id) === Number(viewingWorkflow.initialStatus?.id);

      return {
        id: String(meta.statusId), // Use statusId as ID like in edit/create mode
        type: "customNode",
        position: { x: meta.positionX, y: meta.positionY },
        data: {
          statusId: meta.statusId,
          label,
          category,
          isInitial,
          statusCategory: category,
          statusName: label,
          categories: ["BACKLOG", "TODO", "PROGRESS", "REVIEW", "DONE", "CANCELLED"] as StatusCategory[],
          onCategoryChange: () => {}, // No-op for view mode
          onRemove: () => {}, // No-op for view mode
          onSetInitial: () => {}, // No-op for view mode
        },
        style: {
          background: backgroundColor,
          borderRadius: 8,
          opacity: 0.9,
        },
      };
    });

    const edges = (viewingWorkflow.workflowEdges || []).map((e) => {
      const transition = (viewingWorkflow.transitions || []).find(t => t.id === e.transitionId);
      const sourceNode = nodes.find(n => n.data.statusId === e.sourceId);
      const targetNode = nodes.find(n => n.data.statusId === e.targetId);

      return {
        id: String(e.transitionId || e.id || `edge-${e.sourceId}-${e.targetId}`),
        type: "selectableEdge",
        source: sourceNode?.id || String(e.sourceId),
        target: targetNode?.id || String(e.targetId),
        sourceHandle: e.sourcePosition || undefined,
        targetHandle: e.targetPosition || undefined,
        data: {
          label: transition?.name || "",
          transitionId: e.transitionId,
          transitionTempId: null,
        },
        style: {
          stroke: '#2196f3',
          strokeWidth: 2,
        },
        markerEnd: {
          type: 'arrowclosed',
          color: '#2196f3',
        },
      };
    });

    modalContent = (
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          zoomOnScroll={false}
          panOnScroll
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          style={{ width: "100%", height: "100%" }}
        >
          <MiniMap />
          <Controls />
        </ReactFlow>
      </ReactFlowProvider>
    );
  } else {
    modalContent = <p>Caricamento...</p>;
  }

  return (
    <div className={layout.container} style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header Section */}
      <div className={layout.headerSection}>
        <h1 className={layout.title}>{getTitle()}</h1>
        <p className={layout.paragraphMuted}>{getDescription()}</p>
        <div className={layout.buttonRow}>
          <button
            className={buttons.button}
            onClick={handleCreate}
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

      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <div style={{ background: 'white', padding: 20, width: '80%', height: '80%', position: 'relative' }}>
            <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: 10, right: 10 }}>
              ✕
            </button>

            {modalContent}
          </div>
        </div>
      )}
    </div>
  );
}










