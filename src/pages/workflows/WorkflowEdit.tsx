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
import { TransitionRemovalImpactDto } from "../../types/transition-impact.types";
import { TransitionImpactReportModal } from "../../components/TransitionImpactReportModal";
import { StatusRemovalImpactDto } from "../../types/status-impact.types";
import { StatusImpactReportModal } from "../../components/StatusImpactReportModal";

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
  
  // Impact report states
  const [showImpactReport, setShowImpactReport] = useState(false);
  const [impactReport, setImpactReport] = useState<TransitionRemovalImpactDto | null>(null);
  const [analyzingImpact, setAnalyzingImpact] = useState(false);
  const [pendingSave, setPendingSave] = useState<(() => Promise<void>) | null>(null);
  const [removedTransitionIds, setRemovedTransitionIds] = useState<number[]>([]);
  const [removedEdgesForTransitions, setRemovedEdgesForTransitions] = useState<any[]>([]);

  // Stati per gestione rimozione Status
  const [showStatusImpactReport, setShowStatusImpactReport] = useState(false);
  const [statusImpactReport, setStatusImpactReport] = useState<StatusRemovalImpactDto | null>(null);
  const [analyzingStatusImpact, setAnalyzingStatusImpact] = useState(false);
  const [pendingStatusSave, setPendingStatusSave] = useState<(() => Promise<void>) | null>(null);
  const [removedStatusIds, setRemovedStatusIds] = useState<number[]>([]);
  const [removedNodes, setRemovedNodes] = useState<any[]>([]);
  const [removedEdges, setRemovedEdges] = useState<any[]>([]);

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
      console.log("🗑️ onRemoveNode chiamato per nodeId:", nodeId);
      console.log("🔍 Tutti i nodi attuali:", nodes);
      
      // Se il nodo ha un workflowStatusId (è uno Status esistente), marcalo per rimozione
      const node = nodes.find(n => n.id === nodeId);
      console.log("🔍 Nodo trovato:", node);
      console.log("🔍 node.data:", node?.data);
      console.log("🔍 node.data?.workflowStatusId:", node?.data?.workflowStatusId);
      
      if (node?.data?.workflowStatusId) {
        console.log("🔄 Rimuovendo status esistente con workflowStatusId:", node.data.workflowStatusId);
        
        setRemovedStatusIds(prev => {
          const newIds = [...prev, node.data.workflowStatusId];
          console.log("🔍 Nuovi removedStatusIds:", newIds);
          return newIds;
        });
        
        // Salva il nodo e gli edge rimossi per poterli ripristinare se necessario
        const edgesToRemove = edges.filter(e => e.source === nodeId || e.target === nodeId);
        console.log("🔍 Edge da rimuovere:", edgesToRemove.length);
        console.log("🔍 Edge da rimuovere:", edgesToRemove);
        
        setRemovedNodes(prev => {
          const newRemoved = [...prev, node];
          console.log("🔍 Nodi rimossi salvati:", newRemoved.length);
          console.log("🔍 Nodi rimossi salvati:", newRemoved);
          return newRemoved;
        });
        setRemovedEdges(prev => {
          const newRemoved = [...prev, ...edgesToRemove];
          console.log("🔍 Edge rimossi salvati:", newRemoved.length);
          console.log("🔍 Edge rimossi salvati:", newRemoved);
          return newRemoved;
        });
        
        // Rimuovi il nodo dall'interfaccia (solo visivamente)
        setNodes((nds) => {
          const filtered = nds.filter((n) => n.id !== nodeId);
          console.log("🔍 Nodi dopo rimozione:", filtered.length);
          return filtered;
        });
        setEdges((eds) => {
          const filtered = eds.filter((e) => e.source !== nodeId && e.target !== nodeId);
          console.log("🔍 Edge dopo rimozione:", filtered.length);
          return filtered;
        });
        
        console.log("✅ Nodo rimosso dall'interfaccia");
      } else {
        console.log("🔄 Rimuovendo nodo temporaneo (nessun workflowStatusId)");
        // Se è un nodo temporaneo, rimuovi direttamente
        setNodes((nds) => nds.filter((n) => n.id !== nodeId));
        setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
      }
    },
    [setNodes, setEdges, nodes, edges]
  );

  const onDeleteEdge = useCallback(
    (edgeId: string) => {
      const edge = edges.find(e => e.id === edgeId);
      if (!edge) return;
      
      // Se l'edge ha un transitionId (è una transition esistente), marcala per rimozione
      if (edge.data?.transitionId) {
        setRemovedTransitionIds(prev => [...prev, edge.data.transitionId]);
        
        // Salva l'edge rimosso per poterlo ripristinare se necessario
        setRemovedEdgesForTransitions(prev => [...prev, edge]);
        
        // Rimuovi l'edge dall'interfaccia (solo visivamente)
        setEdges((eds) => eds.filter((e) => e.id !== edgeId));
      } else {
        // Se è una transition temporanea, rimuovi direttamente
        setEdges((eds) => eds.filter((e) => e.id !== edgeId));
      }
    },
    [edges, setEdges]
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

  const handleExportReport = async () => {
    if (!impactReport) return;

    try {
      const response = await api.post(`/workflows/${id}/export-transition-removal-impact-csv`, 
        impactReport.removedTransitionIds, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transition_removal_impact_${id}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Errore durante l'export", err);
    }
  };

  const handleExportStatusReport = async () => {
    if (!statusImpactReport) return;

    try {
      const response = await api.post(`/workflows/${id}/export-status-removal-impact-csv`, 
        statusImpactReport.removedStatusIds, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `status_removal_impact_${id}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Errore durante l'export status", err);
    }
  };

  const handleSave = async () => {
    if (!workflowName.trim()) return alert("Inserisci un nome per il workflow.");
    if (!nodes.length) return alert("Aggiungi almeno uno stato.");

    // Se ci sono Transition rimosse, analizza gli impatti prima di salvare
    if (removedTransitionIds.length > 0) {
      await analyzeTransitionRemovalImpact(removedTransitionIds);
    } else if (removedStatusIds.length > 0) {
      // Se ci sono Status rimossi, analizza gli impatti prima di salvare
      await analyzeStatusRemovalImpact(removedStatusIds);
    } else {
      // Nessuna Transition o Status rimossa, procedi con il salvataggio normale
      await performSave();
    }
  };

  const performSave = async () => {
    setSaving(true);

    const workflowNodes = nodes.map((n: any) => ({
      id: n.data.id ?? null,
      statusId: n.data.statusId,
      positionX: n.position.x,
      positionY: n.position.y,
    }));

    const workflowEdges = edges.map((e: any) => ({
      id: e.id?.startsWith("edge-") ? null : Number.parseInt(e.id),
      transitionId: e.data?.transitionId ?? null,
      transitionTempId: e.data?.transitionTempId ?? null,
      sourceId: (nodes as any[]).find((n: any) => n.id === e.source)?.data.statusId || Number.parseInt(e.source),
      targetId: (nodes as any[]).find((n: any) => n.id === e.target)?.data.statusId || Number.parseInt(e.target),
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
          fromStatusId: (nodes as any[]).find((n: any) => n.id === e.source)?.data.statusId || Number.parseInt(e.source),
          toStatusId: (nodes as any[]).find((n: any) => n.id === e.target)?.data.statusId || Number.parseInt(e.target),
        });
      }
    }
    const transitions = Array.from(transitionMap.values());

    const workflowStatuses = buildWorkflowStatusesFromFlow(nodes, edges);

    const initial = (nodes as any[]).find((n: any) => n.data.isInitial);
    const dto: WorkflowUpdateDto = {
      id: Number.parseInt(id!),
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
        } catch (err: any) {
          console.error("Errore salvataggio workflow", err);
          console.log("🔍 Errore completo:", err.response?.data);
          console.log("🔍 Messaggio errore:", err.response?.data?.message);
          
          // Se l'errore è TRANSITION_REMOVAL_IMPACT, analizza gli impatti
          if (err.response?.data?.message?.includes("TRANSITION_REMOVAL_IMPACT")) {
            console.log("🔄 Gestendo TRANSITION_REMOVAL_IMPACT");
            await analyzeTransitionRemovalImpact(removedTransitionIds);
          } else if (err.response?.data?.message?.includes("STATUS_REMOVAL_IMPACT")) {
            console.log("🔄 Gestendo STATUS_REMOVAL_IMPACT");
            // Se l'errore è STATUS_REMOVAL_IMPACT, analizza gli impatti
            // Usa removedStatusIds se disponibile, altrimenti usa array vuoto
            const statusIdsToAnalyze = removedStatusIds.length > 0 ? removedStatusIds : [];
            console.log("🔍 Status IDs da analizzare:", statusIdsToAnalyze);
            await analyzeStatusRemovalImpact(statusIdsToAnalyze);
          } else {
            console.log("❌ Errore non gestito:", err.response?.data?.message);
          }
        } finally {
      setSaving(false);
    }
  };

  const performConfirmSave = async () => {
    setSaving(true);

    const workflowNodes = nodes.map((n: any) => ({
      id: n.data.id ?? null,
      statusId: n.data.statusId,
      positionX: n.position.x,
      positionY: n.position.y,
    }));

    const workflowEdges = edges.map((e: any) => ({
      id: e.id?.startsWith("edge-") ? null : Number.parseInt(e.id),
      transitionId: e.data?.transitionId ?? null,
      transitionTempId: e.data?.transitionTempId ?? null,
      sourceId: (nodes as any[]).find((n: any) => n.id === e.source)?.data.statusId || Number.parseInt(e.source),
      targetId: (nodes as any[]).find((n: any) => n.id === e.target)?.data.statusId || Number.parseInt(e.target),
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
          fromStatusId: (nodes as any[]).find((n: any) => n.id === e.source)?.data.statusId || Number.parseInt(e.source),
          toStatusId: (nodes as any[]).find((n: any) => n.id === e.target)?.data.statusId || Number.parseInt(e.target),
        });
      }
    }
    const transitions = Array.from(transitionMap.values());

    const workflowStatuses = buildWorkflowStatusesFromFlow(nodes, edges);

    const initial = (nodes as any[]).find((n: any) => n.data.isInitial);
    const dto: WorkflowUpdateDto = {
      id: Number.parseInt(id!),
      name: workflowName,
      initialStatusId: initial ? initial.data.statusId : null,
      workflowNodes,
      workflowEdges,
      workflowStatuses,
      transitions,
    };

    try {
      await api.post(`/workflows/${id}/confirm-transition-removal`, dto, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      navigate(-1);
    } catch (err) {
      console.error("Errore conferma rimozione workflow", err);
    } finally {
      setSaving(false);
    }
  };

  const performConfirmStatusSave = async () => {
    setSaving(true);

    const workflowNodes = nodes.map((n: any) => ({
      id: n.data.id ?? null,
      statusId: n.data.statusId,
      positionX: n.position.x,
      positionY: n.position.y,
    }));

    const workflowEdges = edges.map((e: any) => ({
      id: e.id?.startsWith("edge-") ? null : Number.parseInt(e.id),
      transitionId: e.data?.transitionId ?? null,
      transitionTempId: e.data?.transitionTempId ?? null,
      sourceId: (nodes as any[]).find((n: any) => n.id === e.source)?.data.statusId || Number.parseInt(e.source),
      targetId: (nodes as any[]).find((n: any) => n.id === e.target)?.data.statusId || Number.parseInt(e.target),
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
          fromStatusId: (nodes as any[]).find((n: any) => n.id === e.source)?.data.statusId || Number.parseInt(e.source),
          toStatusId: (nodes as any[]).find((n: any) => n.id === e.target)?.data.statusId || Number.parseInt(e.target),
        });
      }
    }
    const transitions = Array.from(transitionMap.values());

    // Per la conferma della rimozione Status, costruiamo i workflowStatuses
    // basandoci sui nodi attualmente visibili (che escludono quelli rimossi)
    const workflowStatuses = buildWorkflowStatusesFromFlow(nodes, edges);

    const initial = (nodes as any[]).find((n: any) => n.data.isInitial);
    const dto: WorkflowUpdateDto = {
      id: Number.parseInt(id!),
      name: workflowName,
      initialStatusId: initial ? initial.data.statusId : null,
      workflowNodes,
      workflowEdges,
      workflowStatuses,
      transitions,
    };

    try {
      await api.post(`/workflows/${id}/confirm-status-removal`, dto, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      navigate(-1);
    } catch (err) {
      console.error("Errore conferma rimozione status workflow", err);
    } finally {
      setSaving(false);
    }
  };

  const analyzeTransitionRemovalImpact = async (transitionIds: number[]) => {
    setAnalyzingImpact(true);
    
    try {
      // Prima analizza gli impatti con POST
      const response = await api.post(`/workflows/${id}/analyze-transition-removal-impact`, transitionIds, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      
      setImpactReport(response.data);
      setShowImpactReport(true);
      
      // Store the save function to be called after confirmation
      setPendingSave(() => () => performConfirmSave());
    } catch (err: any) {
      console.error("Errore durante l'analisi degli impatti", err);
      // Se non ci sono impatti, procedi direttamente con la rimozione
      await performSave();
    } finally {
      setAnalyzingImpact(false);
    }
  };

  const analyzeStatusRemovalImpact = async (statusIds: number[]) => {
    console.log("🔍 analyzeStatusRemovalImpact chiamato con:", statusIds);
    setAnalyzingStatusImpact(true);
    
    try {
      // Costruisci il DTO per l'analisi degli impatti
      const workflowNodes = nodes.map((n: any) => ({
        id: n.data.id ?? null,
        statusId: n.data.statusId,
        positionX: n.position.x,
        positionY: n.position.y,
      }));

      const workflowEdges = edges.map((e: any) => ({
        id: e.id?.startsWith("edge-") ? null : Number.parseInt(e.id),
        transitionId: e.data?.transitionId ?? null,
        transitionTempId: e.data?.transitionTempId ?? null,
        sourceId: (nodes as any[]).find((n: any) => n.id === e.source)?.data.statusId || Number.parseInt(e.source),
        targetId: (nodes as any[]).find((n: any) => n.id === e.target)?.data.statusId || Number.parseInt(e.target),
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
            fromStatusId: (nodes as any[]).find((n: any) => n.id === e.source)?.data.statusId || Number.parseInt(e.source),
            toStatusId: (nodes as any[]).find((n: any) => n.id === e.target)?.data.statusId || Number.parseInt(e.target),
          });
        }
      }
      const transitions = Array.from(transitionMap.values());

      // Per l'analisi degli impatti Status, costruiamo i workflowStatuses
      // basandoci sui nodi attualmente visibili (che escludono quelli rimossi)
      const workflowStatuses = buildWorkflowStatusesFromFlow(nodes, edges);

      const initial = (nodes as any[]).find((n: any) => n.data.isInitial);
      const dto: WorkflowUpdateDto = {
        id: Number.parseInt(id!),
        name: workflowName,
        initialStatusId: initial ? initial.data.statusId : null,
        workflowNodes,
        workflowEdges,
        workflowStatuses,
        transitions,
      };

      console.log("🔍 DTO inviato:", dto);

      // Prima analizza gli impatti con POST
      const response = await api.post(`/workflows/${id}/analyze-status-removal-impact`, dto, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      
      console.log("✅ Risposta analyze-status-removal-impact:", response.data);
      setStatusImpactReport(response.data);
      setShowStatusImpactReport(true);
      console.log("🎯 showStatusImpactReport impostato a true");
      console.log("🎯 statusImpactReport impostato a:", response.data);
      
      // Store the save function to be called after confirmation
      setPendingStatusSave(() => () => performConfirmStatusSave());
    } catch (err: any) {
      console.error("❌ Errore durante l'analisi degli impatti status", err);
      // Se non ci sono impatti, procedi direttamente con la rimozione
      await performSave();
    } finally {
      setAnalyzingStatusImpact(false);
    }
  };

  const handleConfirmSave = async () => {
    setShowImpactReport(false);
    setImpactReport(null);
    
    if (pendingSave) {
      await pendingSave();
      setPendingSave(null);
    }
    
    // Reset delle Transition rimosse
    setRemovedTransitionIds([]);
  };

  const handleCancelSave = () => {
    setShowImpactReport(false);
    setImpactReport(null);
    setPendingSave(null);
    
    // Ripristina le Transition rimosse
    setEdges(prev => [...prev, ...removedEdgesForTransitions]);
    setRemovedTransitionIds([]);
    setRemovedEdgesForTransitions([]);
  };

  const handleConfirmStatusSave = async () => {
    setShowStatusImpactReport(false);
    setStatusImpactReport(null);
    
    if (pendingStatusSave) {
      await pendingStatusSave();
      setPendingStatusSave(null);
    }
    
    // Reset degli Status rimossi
    setRemovedStatusIds([]);
  };

  const handleCancelStatusSave = () => {
    console.log("🔄 handleCancelStatusSave chiamato");
    console.log("🔍 removedNodes:", removedNodes);
    console.log("🔍 removedEdges:", removedEdges);
    
    setShowStatusImpactReport(false);
    setStatusImpactReport(null);
    setPendingStatusSave(null);

    // Ripristina i nodi e gli edge rimossi
    if (removedNodes.length > 0) {
      console.log("🔄 Ripristinando", removedNodes.length, "nodi");
      setNodes(prev => {
        const newNodes = [...prev, ...removedNodes];
        console.log("🔍 Nuovi nodi:", newNodes.length);
        return newNodes;
      });
    }
    
    if (removedEdges.length > 0) {
      console.log("🔄 Ripristinando", removedEdges.length, "edge");
      setEdges(prev => {
        const newEdges = [...prev, ...removedEdges];
        console.log("🔍 Nuovi edge:", newEdges.length);
        return newEdges;
      });
    }
    
    // Reset degli Status rimossi
    setRemovedStatusIds([]);
    setRemovedNodes([]);
    setRemovedEdges([]);
    
    console.log("✅ handleCancelStatusSave completato");
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
    <>
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

      {/* Impact Report Modal */}
      <TransitionImpactReportModal
        isOpen={showImpactReport}
        onClose={handleCancelSave}
        onConfirm={handleConfirmSave}
        onExport={handleExportReport}
        impact={impactReport}
        loading={analyzingImpact || saving}
      />

    </ReactFlowProvider>
    
    {/* Status Impact Report Modal - Fuori dal ReactFlowProvider */}
    {console.log("🔍 Rendering StatusImpactReportModal:", {
      showStatusImpactReport,
      statusImpactReport: statusImpactReport ? "presente" : "null",
      analyzingStatusImpact,
      saving
    })}
    <StatusImpactReportModal
      isOpen={showStatusImpactReport}
      onClose={handleCancelStatusSave}
      onConfirm={handleConfirmStatusSave}
      onExport={handleExportStatusReport}
      impact={statusImpactReport}
      loading={analyzingStatusImpact || saving}
    />
    </>
  );
}

