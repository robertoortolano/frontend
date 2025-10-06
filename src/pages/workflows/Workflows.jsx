import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";

import ReactFlow, { Background, Controls, MiniMap, MarkerType } from "reactflow";
import 'reactflow/dist/style.css';

import CustomNode from "./components/CustomNode";

import { useAuth } from "../../context/AuthContext";

import layout from "../../styles/common/Layout.module.css";
import buttons from "../../styles/common/Buttons.module.css";
import alert from "../../styles/common/Alerts.module.css";
import table from "../../styles/common/Tables.module.css";

function CustomNodeWrapper(props) {
  return <CustomNode {...props} />;
}

export default function Workflows() {
  const navigate = useNavigate();
  const { token, roles } = useAuth();

  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [viewingWorkflow, setViewingWorkflow] = useState(null);
  const [viewingError, setViewingError] = useState(null);
  const [showModal, setShowModal] = useState(false);


  const hasRole = (name, scope = null) => {
    return roles.some(r => r.name === name && (scope === null || r.scope === scope));
  };
  const isTenantAdmin = hasRole("ADMIN", "TENANT");
  const isProjectAdmin = hasRole("ADMIN", "PROJECT");

  const nodeTypes = {
    customNode: CustomNodeWrapper,
  };

  const handleView = async (id) => {
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
        setWorkflows(response.data);
      } catch (err) {
        console.error("Errore nel caricamento dei workflow", err);
        setError(err.response?.data?.message || "Errore nel caricamento dei workflow");
      } finally {
        setLoading(false);
      }
    };

    fetchWorkflows();
  }, [token]);

  const handleEdit = (id) => {
    navigate(`/tenant/workflows/${id}`);
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Sei sicuro di voler eliminare questo workflow?");
    if (!confirmed) return;

    try {
      await api.delete(`/workflows/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWorkflows((prev) => prev.filter((wf) => wf.id !== id));
    } catch (err) {
      console.error("Errore durante l'eliminazione", err);
      alert(err.response?.data?.message || "Errore durante l'eliminazione");
    }
  };

  let content;
  if (loading) {
    content = <p className="list-loading">Caricamento workflow...</p>;
  } else if (workflows.length === 0) {
    content = <p className="list-loading">Nessun workflow trovato.</p>;
  } else {
    content = (
      <table className={table.table}>
        <thead>
          <tr>
            <th>Nome</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {workflows.map((wf) => (
            <tr key={wf.id}>
              <td>{wf.name}</td>
              <td style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  className={buttons.button}
                  onClick={() => handleView(wf.id)}
                >
                  👁 View
                </button>
                <button
                  className={buttons.button}
                  onClick={() => handleEdit(wf.id)}
                  disabled={wf.defaultWorkflow}
                  title={wf.defaultWorkflow ? "Modifica disabilitata: workflow di default" : ""}
                >
                  ✎ Edit
                </button>
                <button
                  className={buttons.button}
                  onClick={() => handleDelete(wf.id)}
                  disabled={wf.defaultWorkflow}
                  title={wf.defaultWorkflow ? "Eliminazione disabilitata: workflow di default" : ""}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (!isTenantAdmin && !isProjectAdmin) {
    return <p className={alert.error}>Accesso negato</p>;
  }

  let modalContent;

  const CATEGORY_COLORS = {
    BACKLOG: "#6c757d",    // grigio
    PROGRESS: "#0d6efd",   // blu
    COMPLETED: "#198754",  // verde
  };

  if (viewingError) {
    modalContent = <p className={alert.error}>{viewingError}</p>;
  } else if (viewingWorkflow) {

      // Mappa statusId -> nodeId
      const statusIdToNodeId = {};
      (viewingWorkflow.workflowNodes || []).forEach((n) => {
        statusIdToNodeId[n.statusId] = n.id; // qui statusId mappa al nodeId reale
      });


      const nodes = (viewingWorkflow.workflowNodes || []).map((meta) => {
        const wfStatus = viewingWorkflow.statuses.find(
          (s) => s.status.id === meta.statusId
        );

        const label = wfStatus?.status?.name ?? `Nodo ${meta.id}`;
        const category = wfStatus?.statusCategory ?? "UNKNOWN";
        const backgroundColor = CATEGORY_COLORS[category] || "#eeeeee";
        const isInitial = Number(wfStatus?.status.id) === Number(viewingWorkflow.initialStatus?.id);

        return {
          id: String(meta.id), // id reale del nodo nel DB
          type: "customNode",
          position: { x: meta.positionX, y: meta.positionY },
          data: {
            label,
            category,
            // opzionale se vuoi mostrare label e categoria nella UI del nodo
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



/*
      const edges = (viewingWorkflow.workflowEdges || []).map((e, idx) => {
        const t = (viewingWorkflow.statuses || [])
          .flatMap(s => s.outgoingTransitions || [])
          .find(tr => tr.id === e.transitionId);

        return {
          id: String(e.id || `edge-${idx}`),
          source: String(statusIdToNodeId[e.sourceId]),
          target: String(statusIdToNodeId[e.targetId]),
          label: t?.name || e.name || "",
          sourceHandle: e.sourcePosition || null,
          targetHandle: e.targetPosition || null,
          type: "step",
          style: { stroke: "black", strokeWidth: 0.5 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 30,
            height: 30,
            color: "black",
          },
        };
      });
*/

const transitionById = {};
(viewingWorkflow.transitions || []).forEach(t => {
  if (t?.id != null) transitionById[t.id] = t;
});

const edges = (viewingWorkflow.workflowEdges || []).map((e, idx) => {
  const transition = e.transitionId != null ? transitionById[e.transitionId] : null;

  return {
    id: String(e.id || `edge-${idx}`),
    source: String(statusIdToNodeId[e.sourceId]),
    target: String(statusIdToNodeId[e.targetId]),
    type: "step", // tipo base va bene in view mode
    label: transition?.name || "", // 🔹 label corretta
    labelStyle: { fill: "#000", fontWeight: 500, fontSize: 14 }, // 🔹 serve per farla apparire
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
      <div className={layout.container}>
        <h1 className={layout.title}>Workflow</h1>

        <button
          className={buttons.button}
          onClick={() => navigate("/tenant/workflows/create")}
        >
          + Crea nuovo workflow
        </button>

        {error && <p className={alert.error}>{error}</p>}

        {content}

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
