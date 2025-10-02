import React, { useCallback, useEffect, useState } from "react";
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  MarkerType,
} from "reactflow";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/api";

import SelectableEdge from "./components/SelectableEdge";
import WorkflowControls from "./components/WorkflowControls";
import CustomNode from "./components/CustomNode";
import { getCategoryColor, buildWorkflowStatusesFromFlow } from "./components/workflowUtils";
import board from "../../styles/common/WorkflowBoard.module.css";
import "reactflow/dist/style.css";

// 🔹 Helper per costruire nodi
function buildNodes(onCategoryChange, onRemoveNode, setInitialNode, wfNodes = [], wfStatuses = [], categories = [], wf = {}) {  return wfNodes.map((meta) => {
    const ws = wf.statuses?.find(s => s.status.id === meta.statusId);
    const label = ws?.status?.name ?? `Nodo ${meta.statusId}`;
    const category = ws?.statusCategory ?? (categories[0] ?? "Default");
    const isInitial = ws?.initial ?? (meta.statusId === wf.initialStatus?.id);

    return {
      id: String(meta.statusId),
      data: {
        id: ws?.id ?? null,       // id del WorkflowStatus se già esistente
        label,
        statusId: meta.statusId,
        category,
        onCategoryChange: (newCat) => onCategoryChange(meta.statusId, newCat),
        categories,
        onRemove: () => onRemoveNode(meta.statusId),
        onSetInitial: () => setInitialNode(meta.statusId),
        isInitial,
      },
      position: { x: meta.positionX ?? 100, y: meta.positionY ?? 100 },
      type: "customNode",
      style: {
        background: getCategoryColor(category),
        borderRadius: 8,
        opacity: 0.9,
      },
    };
  });
}


function buildEdges(wfEdges = [], transitions = []) {
  // Mappa transizioni per id
  const transitionById = {};
  for (const t of (transitions || [])) {
    if (t?.id != null) transitionById[t.id] = t;
  }

  return (wfEdges || []).map((e, idx) => {
    const transition = e.transitionId == null ? null : transitionById[e.transitionId];

    return {
      id: e.id == null ?  `edge-${e.sourceId}-${e.targetId}-${idx}` : String(e.id),
      source: String(e.sourceId),
      target: String(e.targetId),
      sourceHandle: e.sourcePosition || null,
      targetHandle: e.targetPosition || null,
      type: "selectableEdge",
      updatable: true,
      data: {
        transitionId: e.transitionId ?? null,
        transitionTempId: e.transitionTempId ?? null,
        label: transition?.name || "",
      },
      style: { stroke: "black", strokeWidth: 0.5 },
      markerEnd: { type: MarkerType.ArrowClosed, width: 30, height: 30, color: "black" },
    };
  });
}



// 🔹 Factory nodi e edges
function createCustomNodeType(statusCategories) {
  return function CustomNodeType(props) {
    return <CustomNode {...props} statusCategories={statusCategories} />;
  };
}

function createSelectableEdgeType(onDelete, setEdges) {
  return function SelectableEdgeType(props) {
    return <SelectableEdge {...props} onDelete={onDelete} setEdges={setEdges} />;
  };
}

// 🔹 Componente principale
export default function WorkflowEdit() {
  const [workflowName, setWorkflowName] = useState("");
  const [saving, setSaving] = useState(false);
  const [availableStatuses, setAvailableStatuses] = useState([]);
  const [statusCategories, setStatusCategories] = useState([]);
  const [selectedStatusId, setSelectedStatusId] = useState("");
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [initialNodeId, setInitialNodeId] = useState(null);

  const navigate = useNavigate();
  const { id } = useParams();

  // 🔹 Caricamento workflow esistente
  useEffect(() => {
    async function loadData() {
      try {
        const [statusesRes, categoriesRes, workflowRes] = await Promise.all([
          api.get("/statuses"),
          api.get("/statuses/categories"),
          api.get(`/workflows/${id}`),
        ]);

        setAvailableStatuses(statusesRes.data);
        setStatusCategories(categoriesRes.data);

        const wf = workflowRes.data || {};
        setWorkflowName(wf.name || "");
        setInitialNodeId(wf.initialStatusId || null);

        setNodes(buildNodes(
          onCategoryChange,
          onRemoveNode,
          setInitialNode,
          wf.workflowNodes,
          wf.workflowStatuses,
          categoriesRes.data,
          wf
        ));

        setEdges(buildEdges(
          wf.workflowEdges,
          wf.transitions
        ));
      } catch (err) {
        console.error("Errore caricamento workflow", err);
      }
    }
    loadData();
  }, [id]);

  // 🔹 Funzioni callback
  const setInitialNode = useCallback((nodeId) => {
    setInitialNodeId(Number.parseInt(nodeId));
    setNodes((nds) =>
      nds.map((node) => ({ ...node, data: { ...node.data, isInitial: Number.parseInt(node.id) === Number.parseInt(nodeId) } }))
    );
  }, [setNodes]);

  const onCategoryChange = useCallback((nodeId, newCategory) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === String(nodeId)
          ? { ...node, data: { ...node.data, category: newCategory }, style: { background: getCategoryColor(newCategory) } }
          : node
      )
    );
  }, [setNodes]);

  const onRemoveNode = useCallback((nodeId) => {
    setNodes((nds) => nds.filter((n) => n.id !== String(nodeId)));
    setEdges((eds) => eds.filter((e) => e.source !== String(nodeId) && e.target !== String(nodeId)));
  }, [setNodes, setEdges]);

  const onDeleteEdge = useCallback((edgeId) => {
    setEdges((eds) => eds.filter((e) => e.id !== edgeId));
  }, [setEdges]);

  // 🔹 Aggiorna edge esistente
  const onEdgeUpdate = useCallback(
    (oldEdge, newConnection) => {
      setEdges((eds) =>
        eds.map((e) => (e.id === oldEdge.id ? { ...e, ...newConnection } : e))
      );
    },
    [setEdges]
  );


  const onConnect = useCallback((params) => {
      const tempTransitionId = `temp-${crypto.randomUUID()}`;
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            id: `edge-${crypto.randomUUID()}`, // 👈 id sempre unico lato frontend
            type: "selectableEdge",
            updatable: true,
            data: {
              transitionId: null,           // ancora non esiste sul backend
              transitionTempId: tempTransitionId, // usato per matchare in dto
              label: "",
            },
            style: { stroke: "black", strokeWidth: 0.5 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 30,
              height: 30,
              color: "black",
            },
          },
          eds
        )
      );
    }, [setEdges]);

  const addState = () => {
    if (!selectedStatusId) return;
    if (nodes.some((n) => n.data.statusId === Number(selectedStatusId))) return;
    const selectedStatus = availableStatuses.find((s) => s.id === Number(selectedStatusId));
    if (!selectedStatus || statusCategories.length === 0) return;

    const nodeId = selectedStatus.id;
    const newNode = {
      id: String(nodeId),
      data: {
        label: selectedStatus.name,
        statusId: nodeId,
        category: statusCategories[0],
        onCategoryChange: (newCat) => onCategoryChange(nodeId, newCat),
        categories: statusCategories,
        onRemove: () => onRemoveNode(nodeId),
        onSetInitial: () => setInitialNode(nodeId),
        isInitial: false,
      },
      position: { x: 100, y: 100 },
      type: "customNode",
      style: { background: getCategoryColor(statusCategories[0]), borderRadius: 6 },
    };

    setNodes((nds) => [...nds, newNode]);
    setSelectedStatusId("");
    if (nodes.length === 0) setInitialNode(nodeId);
  };

  const handleSave = async () => {
    if (!workflowName.trim()) return alert("Inserisci un nome per il workflow.");
    if (!nodes.length) return alert("Aggiungi almeno uno stato.");

    setSaving(true);

    // 🔹 WorkflowNodes DTO aggiornati
    const workflowNodes = nodes.map((n) => ({
      id: n.data.id ?? null,  // id esistente se c'è, null se nuovo
      statusId: n.data.statusId,
      positionX: n.position.x,
      positionY: n.position.y
    }));

    // 🔹 WorkflowEdges DTO aggiornati
    const workflowEdges = edges.map((e) => ({
      id: e.id?.startsWith("edge-") ? null : e.id,  // edge nuovo → null
      transitionId: e.data?.transitionId ?? null,
      transitionTempId: e.data?.transitionTempId ?? null,
      sourceId: nodes.find(n => n.id === e.source)?.data.statusId || e.source,
      targetId: nodes.find(n => n.id === e.target)?.data.statusId || e.target,
      sourcePosition: e.sourceHandle || null,
      targetPosition: e.targetHandle || null,
    }));

    const transitionMap = new Map();
    for (const e of edges) {
      const key = e.data?.transitionId ?? e.data?.transitionTempId ?? `${e.source}-${e.target}-${e.data?.label || ""}`;
      if (!transitionMap.has(key)) {
        transitionMap.set(key, {
          id: e.data?.transitionId ?? null,
          tempId: e.data?.transitionTempId ?? null,
          name: e.data?.label || "",
          sourceStatusId: nodes.find((n) => n.id === e.source)?.data.statusId || e.source,
          targetStatusId: nodes.find((n) => n.id === e.target)?.data.statusId || e.target,
        });
      }
    }
    const transitions = Array.from(transitionMap.values());

    // 🔹 WorkflowStatuses DTO aggiornati
    const workflowStatuses = buildWorkflowStatusesFromFlow(nodes, edges);

    const initial = nodes.find((n) => n.data.isInitial);
    const dto = {
      id,
      name: workflowName,
      initialStatusId: initial ? initial.data.statusId : null,
      workflowNodes,
      workflowEdges,
      workflowStatuses,
      transitions,
    };

    try {
      await api.put(`/workflows/${id}`, dto, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
      navigate(-1);
    } catch (err) {
      console.error("Errore salvataggio workflow", err);
    } finally {
      setSaving(false);
    }
  };


  const nodeTypes = React.useMemo(() => ({ customNode: createCustomNodeType(statusCategories) }), [statusCategories]);
  const edgeTypes = React.useMemo(() => ({ selectableEdge: createSelectableEdgeType(onDeleteEdge, setEdges) }), [onDeleteEdge, setEdges]);

  return (
    <ReactFlowProvider>
      <div className={board.wrapper}>
        <WorkflowControls
          workflowName={workflowName}
          setWorkflowName={setWorkflowName}
          selectedStatusId={selectedStatusId}
          setSelectedStatusId={setSelectedStatusId}
          availableStatuses={availableStatuses}
          nodes={nodes}
          statusCategories={statusCategories}
          addState={addState}
        />

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgeUpdate={onEdgeUpdate}
          fitView
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          style={{ width: "100%", height: "600px" }}
        >
          <MiniMap />
          <Controls />
          <Background />
        </ReactFlow>

        <div className={board.buttonBar}>
          <button className={`${board.button} ${board.cancelButton}`} onClick={() => navigate(-1)}>Cancel</button>
          <button disabled={saving || !nodes.length} className={board.button} onClick={handleSave}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </ReactFlowProvider>
  );
}
