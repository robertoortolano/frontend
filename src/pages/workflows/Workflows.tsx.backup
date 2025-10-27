import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";

import ReactFlow, { Background, Controls, MiniMap, MarkerType } from "reactflow";
import 'reactflow/dist/style.css';

import CustomNode from "./components/CustomNode";
import { useAuth } from "../../context/AuthContext";
import { WorkflowSimpleDto, WorkflowViewDto, WorkflowDetailDto } from "../../types/workflow.types";
import { StatusCategory } from "../../types/common.types";
import UsedInItemTypeSetsPopup from "../../components/shared/UsedInItemTypeSetsPopup";

import layout from "../../styles/common/Layout.module.css";
import buttons from "../../styles/common/Buttons.module.css";
import alert from "../../styles/common/Alerts.module.css";
import table from "../../styles/common/Tables.module.css";

function CustomNodeWrapper(props: any) {
  return <CustomNode {...props} />;
}

export default function Workflows() {
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

  const nodeTypes = {
    customNode: CustomNodeWrapper,
  };

  const handleView = async (id: number) => {
    try {
      const res = await api.get(`/workflows/${id}`, {
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

  const CATEGORY_COLORS: Record<StatusCategory, string> = {
    BACKLOG: "#6c757d",
    TODO: "#6c757d",
    PROGRESS: "#0d6efd",
    COMPLETED: "#198754",
  };

  if (viewingError) {
    modalContent = <p className={alert.error}>{viewingError}</p>;
  } else if (viewingWorkflow) {
    const statusIdToNodeId: Record<number, number> = {};
    (viewingWorkflow.workflowNodes || []).forEach((n) => {
      statusIdToNodeId[n.statusId] = n.id!;
    });

    const nodes = (viewingWorkflow.workflowNodes || []).map((meta) => {
      const wfStatus = viewingWorkflow.statuses.find(
        (s) => s.status.id === meta.statusId
      );

      const label = wfStatus?.status?.name ?? `Nodo ${meta.id}`;
      const category = wfStatus?.statusCategory ?? "BACKLOG";
      const backgroundColor = CATEGORY_COLORS[category] || "#eeeeee";
      const isInitial = Number(wfStatus?.status.id) === Number(viewingWorkflow.initialStatus?.id);

      return {
        id: String(meta.id),
        type: "customNode",
        position: { x: meta.positionX, y: meta.positionY },
        data: {
          label,
          category,
          displayLabel: label,
          displayCategory: category,
        },
        style: {
          background: backgroundColor,
          borderRadius: isInitial ? 50 : 8,
          opacity: 0.9,
          color: "#fff",
          padding: 10,
          fontWeight: 500,
          boxShadow: isInitial ? "0 0 15px 3px rgba(255,215,0,0.7)" : "none",
          border: "2px solid #444",
        },
      };
    });

    const transitionById: Record<number, any> = {};
    (viewingWorkflow.transitions || []).forEach((t) => {
      if (t?.id != null) transitionById[t.id] = t;
    });

    const edges = (viewingWorkflow.workflowEdges || []).map((e, idx) => {
      const transition = e.transitionId != null ? transitionById[e.transitionId] : null;

      return {
        id: String(e.id || `edge-${idx}`),
        source: String(statusIdToNodeId[e.sourceId]),
        target: String(statusIdToNodeId[e.targetId]),
        type: "step",
        label: transition?.name || "",
        labelStyle: { fill: "#000", fontWeight: 500, fontSize: 14 },
        sourceHandle: e.sourcePosition || null,
        targetHandle: e.targetPosition || null,
        style: { stroke: "black", strokeWidth: 1 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 30,
          height: 30,
          color: "black",
        },
      };
    });

    modalContent = (
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
        style={{ width: "100%", height: "100%" }}
      >
        <MiniMap />
        <Controls />
        <Background />
      </ReactFlow>
    );
  } else {
    modalContent = <p>Caricamento...</p>;
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

