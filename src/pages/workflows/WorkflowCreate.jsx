// WorkflowBoard.jsx
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
import { nanoid } from "nanoid";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";

import SelectableEdge from "./components/SelectableEdge";
import WorkflowControls from "./components/WorkflowControls";
import CustomNode from "./components/CustomNode";
import { getCategoryColor, buildWorkflowStatusesFromFlow } from "./components/workflowUtils";
import board from "../../styles/common/WorkflowBoard.module.css";
import "reactflow/dist/style.css";

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

export default function WorkflowCreate() {
  const [workflowName, setWorkflowName] = useState("");
  const [saving, setSaving] = useState(false);
  const [availableStatuses, setAvailableStatuses] = useState([]);
  const [statusCategories, setStatusCategories] = useState([]);
  const [selectedStatusId, setSelectedStatusId] = useState("");
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [initialNodeId, setInitialNodeId] = useState(null);

  const navigate = useNavigate();

  // 🔹 Aggiunta nodo stato
  const addState = () => {
    if (!selectedStatusId) return;
    if (nodes.some((n) => n.data.statusId === Number(selectedStatusId))) return;

    const selectedStatus = availableStatuses.find((s) => s.id === Number(selectedStatusId));
    if (!selectedStatus || statusCategories.length === 0) return;

    // Usiamo lo status.id reale come nodeId
    const nodeId = String(selectedStatus.id);

    const newNode = {
      id: nodeId,
      data: {
        label: selectedStatus.name,
        statusId: selectedStatus.id,
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

    // Imposta come iniziale se è il primo nodo
    if (nodes.length === 0) setInitialNode(nodeId);
  };

  // 🔹 Aggiorna categoria
  const onCategoryChange = useCallback(
    (nodeId, newCategory) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, category: newCategory }, style: { background: getCategoryColor(newCategory) } }
            : node
        )
      );
    },
    [setNodes]
  );

  // 🔹 Rimuovi nodo
  const onRemoveNode = useCallback((nodeId) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
  }, [setNodes, setEdges]);

  // 🔹 Rimuovi edge
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


  // 🔹 Connetti edge
  const onConnect = useCallback(
    (params) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            id: nanoid(),
            type: "selectableEdge",
            updatable: true,
            data: { label: "" },
            style: { stroke: "black", strokeWidth: 0.5 },
            markerEnd: { type: MarkerType.ArrowClosed, width: 30, height: 30, color: "black" },
            sourcePosition: params.sourcePosition,
            targetPosition: params.targetPosition,
          },
          eds
        )
      );
    },
    [setEdges]
  );

  // 🔹 Caricamento dati
  useEffect(() => {
    api.get("/statuses").then((res) => setAvailableStatuses(res.data)).catch(console.error);
    api.get("/statuses/categories").then((res) => setStatusCategories(res.data)).catch(console.error);
  }, []);

  // 🔹 Aggiorna flag isInitial sui nodi
  const setInitialNode = useCallback((nodeId) => {
    setInitialNodeId(Number.parseInt(nodeId));
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: { ...node.data, isInitial: Number.parseInt(node.id) === Number.parseInt(nodeId) },
      }))
    );
  }, [setNodes]);

  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          isInitial: Number.parseInt(node.id) === initialNodeId,
        },
      }))
    );
  }, [initialNodeId, setNodes]);

  // 🔹 Salvataggio workflow
  const handleSave = async () => {
    if (!workflowName.trim()) return alert("Inserisci un nome per il workflow.");
    if (!nodes.some((n) => n.type === "customNode" || n.data?.statusId)) return alert("Aggiungi almeno uno stato.");

    setSaving(true);

    const workflowNodes = nodes.map((node) => ({
      statusId: node.data.statusId,
      initial: node.data.isInitial,
      statusCategory: node.data.category,
      positionX: node.position.x,
      positionY: node.position.y,
    }));

    const workflowEdges = edges.map((e) => ({
      id: null,
      sourceId: e.source,
      targetId: e.target,
      sourcePosition: e.sourceHandle || null,
      targetPosition: e.targetHandle || null,
      name: e.data?.label || "", // ⚠ usare name, non label
      transitionId: null,        // sarà creato dal backend
    }));


    const dto = {
      name: workflowName,
      initialStatusId: initialNodeId,
      workflowStatuses: buildWorkflowStatusesFromFlow(nodes, edges),
      workflowNodes,
      workflowEdges,
    };

    try {
      await api.post("/workflows", dto, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      navigate(-1);
    } catch (err) {
      console.error("Errore salvataggio workflow", err);
    } finally {
      setSaving(false);
    }
  };

  const nodeTypes = React.useMemo(
    () => ({ customNode: createCustomNodeType(statusCategories) }),
    [statusCategories]
  );

  const edgeTypes = React.useMemo(
    () => ({ selectableEdge: createSelectableEdgeType(onDeleteEdge, setEdges) }),
    [onDeleteEdge, setEdges]
  );

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
          <button disabled={saving || !nodes.some((n) => n.type === "customNode")} className={board.button} onClick={handleSave}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </ReactFlowProvider>
  );
}
