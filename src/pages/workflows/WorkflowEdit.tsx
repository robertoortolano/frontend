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
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/api";

import SelectableEdge from "./components/SelectableEdge";
import WorkflowControls from "./components/WorkflowControls";
import CustomNode from "./components/CustomNode";
import { getCategoryColor, buildWorkflowStatusesFromFlow } from "./components/workflowUtils";
import { StatusCategory } from "../../types/common.types";
import {
  StatusViewDto,
  WorkflowViewDto,
  WorkflowUpdateDto,
  WorkflowNodeDto,
  WorkflowEdgeDto,
  TransitionViewDto,
  WorkflowStatusViewDto,
} from "../../types/workflow.types";

import board from "../../styles/common/WorkflowBoard.module.css";
import "reactflow/dist/style.css";

// 🔹 Helper per costruire nodi
function buildNodes(
  onCategoryChange: (nodeId: string, newCategory: StatusCategory) => void,
  onRemoveNode: (nodeId: string) => void,
  setInitialNode: (nodeId: string) => void,
  wfNodes: WorkflowNodeDto[] = [],
  _wfStatuses: WorkflowStatusViewDto[] = [],
  categories: StatusCategory[] = [],
  wf: Partial<WorkflowViewDto> = {}
): any[] {
  return wfNodes.map((meta) => {
    const ws = wf.statuses?.find((s) => s.status.id === meta.statusId);
    const label = ws?.status?.name ?? `Nodo ${meta.statusId}`;
    const category = ws?.statusCategory ?? (categories[0] ?? "BACKLOG");
    const isInitial = ws?.initial ?? (meta.statusId === wf.initialStatus?.id);

    return {
      id: String(meta.statusId),
      data: {
        id: ws?.id ?? null,
        label,
        statusId: meta.statusId,
        category,
        onCategoryChange: (newCat: StatusCategory) => onCategoryChange(String(meta.statusId), newCat),
        categories,
        onRemove: () => onRemoveNode(String(meta.statusId)),
        onSetInitial: () => setInitialNode(String(meta.statusId)),
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

function buildEdges(wfEdges: WorkflowEdgeDto[] = [], transitions: TransitionViewDto[] = []): any[] {
  const transitionById: Record<number, TransitionViewDto> = {};
  for (const t of transitions || []) {
    if (t?.id != null) transitionById[t.id] = t;
  }

  return (wfEdges || []).map((e, idx) => {
    const transition = e.transitionId == null ? null : transitionById[e.transitionId];

    return {
      id: e.id == null ? `edge-${e.sourceId}-${e.targetId}-${idx}` : String(e.id),
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

// 🔹 Componente principale
export default function WorkflowEdit() {
  const [workflowName, setWorkflowName] = useState("");
  const [saving, setSaving] = useState(false);
  const [availableStatuses, setAvailableStatuses] = useState<StatusViewDto[]>([]);
  const [statusCategories, setStatusCategories] = useState<StatusCategory[]>([]);
  const [selectedStatusId, setSelectedStatusId] = useState("");
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [_initialNodeId, setInitialNodeId] = useState<number | null>(null);

  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

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

        const wf: WorkflowViewDto = workflowRes.data || {};
        setWorkflowName(wf.name || "");
        setInitialNodeId(wf.initialStatusId || null);

        setNodes(
          buildNodes(
            onCategoryChange,
            onRemoveNode,
            setInitialNode,
            wf.workflowNodes,
            wf.statuses || [],
            categoriesRes.data,
            wf
          )
        );

        setEdges(buildEdges(wf.workflowEdges, wf.transitions));
      } catch (err) {
        console.error("Errore caricamento workflow", err);
      }
    }
    loadData();
  }, [id]);

  // 🔹 Funzioni callback
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

  const onRemoveNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    },
    [setNodes, setEdges]
  );

  const onDeleteEdge = useCallback(
    (edgeId: string) => {
      setEdges((eds) => eds.filter((e) => e.id !== edgeId));
    },
    [setEdges]
  );

  // 🔹 Aggiorna edge esistente
  const onEdgeUpdate = useCallback(
    (oldEdge: any, newConnection: Connection) => {
      (setEdges as any)((eds: any) => eds.map((e: any) => (e.id === oldEdge.id ? { ...e, ...newConnection } : e)));
    },
    [setEdges]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;
      const tempTransitionId = `temp-${crypto.randomUUID()}`;
      setEdges((eds: any) =>
        addEdge(
          {
            ...params,
            source: params.source!,
            target: params.target!,
            id: `edge-${crypto.randomUUID()}`,
            type: "selectableEdge",
            updatable: true,
            data: {
              transitionId: null,
              transitionTempId: tempTransitionId,
              label: "",
            },
            style: { stroke: "black", strokeWidth: 0.5 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 30,
              height: 30,
              color: "black",
            },
          } as any,
          eds
        ) as any
      );
    },
    [setEdges]
  );

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
        onCategoryChange: (newCat: StatusCategory) => onCategoryChange(String(nodeId), newCat),
        categories: statusCategories,
        onRemove: () => onRemoveNode(String(nodeId)),
        onSetInitial: () => setInitialNode(String(nodeId)),
        isInitial: false,
      },
      position: { x: 100, y: 100 },
      type: "customNode",
      style: { background: getCategoryColor(statusCategories[0]), borderRadius: 6 },
    };

    setNodes((nds) => [...nds, newNode]);
    setSelectedStatusId("");
    if (nodes.length === 0) setInitialNode(String(nodeId));
  };

  const handleSave = async () => {
    if (!workflowName.trim()) return alert("Inserisci un nome per il workflow.");
    if (!nodes.length) return alert("Aggiungi almeno uno stato.");

    setSaving(true);

    const workflowNodes = nodes.map((n: any) => ({
      id: n.data.id ?? null,
      statusId: n.data.statusId,
      positionX: n.position.x,
      positionY: n.position.y,
    }));

    const workflowEdges = edges.map((e: any) => ({
      id: e.id?.startsWith("edge-") ? null : parseInt(e.id),
      transitionId: e.data?.transitionId ?? null,
      transitionTempId: e.data?.transitionTempId ?? null,
      sourceId: (nodes as any[]).find((n: any) => n.id === e.source)?.data.statusId || parseInt(e.source),
      targetId: (nodes as any[]).find((n: any) => n.id === e.target)?.data.statusId || parseInt(e.target),
      sourcePosition: e.sourceHandle || null,
      targetPosition: e.targetHandle || null,
    }));

    const transitionMap = new Map<string, any>();
    for (const e of edges as any[]) {
      const key =
        e.data?.transitionId ?? e.data?.transitionTempId ?? `${e.source}-${e.target}-${e.data?.label || ""}`;
      if (!transitionMap.has(key)) {
        transitionMap.set(key, {
          id: e.data?.transitionId ?? null,
          tempId: e.data?.transitionTempId ?? null,
          name: e.data?.label || "",
          fromStatusId: (nodes as any[]).find((n: any) => n.id === e.source)?.data.statusId || parseInt(e.source),
          toStatusId: (nodes as any[]).find((n: any) => n.id === e.target)?.data.statusId || parseInt(e.target),
        });
      }
    }
    const transitions = Array.from(transitionMap.values());

    const workflowStatuses = buildWorkflowStatusesFromFlow(nodes, edges);

    const initial = (nodes as any[]).find((n: any) => n.data.isInitial);
    const dto: WorkflowUpdateDto = {
      id: parseInt(id!),
      name: workflowName,
      initialStatusId: initial ? initial.data.statusId : null,
      workflowNodes,
      workflowEdges,
      workflowStatuses,
      transitions,
    };

    try {
      await api.put(`/workflows/${id}`, dto, {
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
          <button className={`${board.button} ${board.cancelButton}`} onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button disabled={saving || !nodes.length} className={board.button} onClick={handleSave}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </ReactFlowProvider>
  );
}

