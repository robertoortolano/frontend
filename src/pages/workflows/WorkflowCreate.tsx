import { useCallback, useEffect, useState, useMemo } from "react";
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  MarkerType,
  Connection,
  NodeTypes,
  EdgeTypes,
} from "reactflow";
import { nanoid } from "nanoid";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";

import SelectableEdge from "./components/SelectableEdge";
import WorkflowControls from "./components/WorkflowControls";
import CustomNode from "./components/CustomNode";
import { getCategoryColor, buildWorkflowStatusesFromFlow } from "./components/workflowUtils";
import { StatusCategory } from "../../types/common.types";
import { StatusViewDto, WorkflowCreateDto } from "../../types/workflow.types";

import board from "../../styles/common/WorkflowBoard.module.css";
import "reactflow/dist/style.css";

function createCustomNodeType(statusCategories: StatusCategory[]) {
  return function CustomNodeType(props: any) {
    return <CustomNode {...props} statusCategories={statusCategories} />;
  };
}

function createSelectableEdgeType(
  onDelete: (edgeId: string) => void,
  setEdges: React.Dispatch<React.SetStateAction<any[]>>
) {
  return function SelectableEdgeType(props: any) {
    return <SelectableEdge {...props} onDelete={onDelete} setEdges={setEdges} />;
  };
}

export default function WorkflowCreate() {
  const [workflowName, setWorkflowName] = useState("");
  const [saving, setSaving] = useState(false);
  const [availableStatuses, setAvailableStatuses] = useState<StatusViewDto[]>([]);
  const [statusCategories, setStatusCategories] = useState<StatusCategory[]>([]);
  const [selectedStatusId, setSelectedStatusId] = useState("");
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [initialNodeId, setInitialNodeId] = useState<number | null>(null);

  const navigate = useNavigate();

  // 🔹 Aggiunta nodo stato
  const addState = () => {
    if (!selectedStatusId) return;
    if (nodes.some((n) => n.data.statusId === Number(selectedStatusId))) return;

    const selectedStatus = availableStatuses.find((s) => s.id === Number(selectedStatusId));
    if (!selectedStatus || statusCategories.length === 0) return;

    const nodeId = String(selectedStatus.id);

    const newNode = {
      id: nodeId,
      data: {
        label: selectedStatus.name,
        statusId: selectedStatus.id,
        category: statusCategories[0],
        onCategoryChange: (newCat: StatusCategory) => onCategoryChange(nodeId, newCat),
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

  // 🔹 Aggiorna categoria
  const onCategoryChange = useCallback(
    (nodeId: string, newCategory: StatusCategory) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data: { ...node.data, category: newCategory },
                style: { background: getCategoryColor(newCategory) },
              }
            : node
        )
      );
    },
    [setNodes]
  );

  // 🔹 Rimuovi nodo
  const onRemoveNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    },
    [setNodes, setEdges]
  );

  // 🔹 Rimuovi edge
  const onDeleteEdge = useCallback(
    (edgeId: string) => {
      setEdges((eds) => eds.filter((e) => e.id !== edgeId));
    },
    [setEdges]
  );

  // 🔹 Aggiorna edge esistente
  const onEdgeUpdate = useCallback(
    (oldEdge: any, newConnection: Connection) => {
      (setEdges as any)((eds: any) =>
        eds.map((e: any) => (e.id === oldEdge.id ? { ...e, ...newConnection } : e))
      );
    },
    [setEdges]
  );

  // 🔹 Connetti edge
  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;
      setEdges((eds: any) =>
        addEdge(
          {
            ...params,
            source: params.source!,
            target: params.target!,
            id: nanoid(),
            type: "selectableEdge",
            updatable: true,
            data: { label: "" },
            style: { stroke: "black", strokeWidth: 0.5 },
            markerEnd: { type: MarkerType.ArrowClosed, width: 30, height: 30, color: "black" },
          } as any,
          eds
        ) as any
      );
    },
    [setEdges]
  );

  // 🔹 Caricamento dati
  useEffect(() => {
    api
      .get("/statuses")
      .then((res) => setAvailableStatuses(res.data))
      .catch(console.error);
    api
      .get("/statuses/categories")
      .then((res) => setStatusCategories(res.data))
      .catch(console.error);
  }, []);

  // 🔹 Aggiorna flag isInitial sui nodi
  const setInitialNode = useCallback(
    (nodeId: string) => {
      setInitialNodeId(Number.parseInt(nodeId));
      setNodes((nds) =>
        nds.map((node) => ({
          ...node,
          data: {
            ...node.data,
            isInitial: Number.parseInt(node.id) === Number.parseInt(nodeId),
          },
        }))
      );
    },
    [setNodes]
  );

  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          isInitial: Number.parseInt(node.id) === initialNodeId!,
        },
      }))
    );
  }, [initialNodeId, setNodes]);

  // 🔹 Salvataggio workflow
  const handleSave = async () => {
    if (!workflowName.trim()) return alert("Inserisci un nome per il workflow.");
    if (!nodes.some((n) => n.type === "customNode" || n.data?.statusId))
      return alert("Aggiungi almeno uno stato.");

    setSaving(true);

    const workflowNodes = nodes.map((node: any) => ({
      id: null,
      statusId: node.data.statusId,
      positionX: node.position.x,
      positionY: node.position.y,
    }));

    const workflowEdges = edges.map((e: any) => ({
      id: null,
      transitionId: null,
      sourceId: parseInt(e.source),
      targetId: parseInt(e.target),
      sourcePosition: e.sourceHandle || null,
      targetPosition: e.targetHandle || null,
    }));

    const transitions = edges.map((e: any) => ({
      tempId: null,
      name: e.data?.label || "",
      fromStatusId: parseInt(e.source),
      toStatusId: parseInt(e.target),
    }));

    const dto: WorkflowCreateDto = {
      name: workflowName,
      initialStatusId: initialNodeId,
      workflowStatuses: buildWorkflowStatusesFromFlow(nodes, edges),
      workflowNodes,
      workflowEdges,
      transitions,
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

  const nodeTypes: NodeTypes = useMemo(
    () => ({ customNode: createCustomNodeType(statusCategories) }),
    [statusCategories]
  );

  const edgeTypes: EdgeTypes = useMemo(
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
          className="w-full"
          style={{ height: "600px" }}
        >
          <MiniMap />
          <Controls />
          <Background />
        </ReactFlow>

        <div className={board.buttonBar}>
          <button
            className={`${board.button} ${board.cancelButton}`}
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>
          <button
            disabled={saving || !nodes.some((n) => n.type === "customNode")}
            className={board.button}
            onClick={handleSave}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </ReactFlowProvider>
  );
}

