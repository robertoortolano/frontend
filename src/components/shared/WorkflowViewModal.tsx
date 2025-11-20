import { useEffect, useState } from "react";
import ReactFlow, { Controls, MiniMap, ReactFlowProvider } from "reactflow";
import type { Node, Edge } from "reactflow";
import 'reactflow/dist/style.css';

import api from "../../api/api";
import SimpleModal from "./SimpleModal";
import CustomNode from "../../pages/workflows/components/CustomNode";
import SelectableEdge from "../../pages/workflows/components/SelectableEdge";
import { getCategoryColor } from "../../pages/workflows/components/workflowUtils";
import { WorkflowViewDto } from "../../types/workflow.types";
import { StatusCategory } from "../../types/common.types";
import type { WorkflowReactFlowNodeData, WorkflowReactFlowEdgeData } from "../../types/workflow-unified.types";
import alert from "../../styles/common/Alerts.module.css";

interface WorkflowViewModalProps {
  workflowId: number | null;
  isOpen: boolean;
  onClose: () => void;
  scope?: 'tenant' | 'project';
  projectId?: string;
  token: string;
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

export default function WorkflowViewModal({
  workflowId,
  isOpen,
  onClose,
  scope = 'tenant',
  projectId,
  token,
}: WorkflowViewModalProps) {
  const [workflow, setWorkflow] = useState<WorkflowViewDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !workflowId || !token) {
      return;
    }

    const fetchWorkflow = async () => {
      setLoading(true);
      setError(null);
      try {
        let endpoint = `/workflows/${workflowId}`;
        if (scope === 'project' && projectId) {
          endpoint = `/workflows/project/${projectId}/${workflowId}`;
        }
        const res = await api.get(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setWorkflow(res.data);
      } catch (err) {
        console.error("Errore nel caricamento workflow", err);
        setError("Errore nel caricamento del workflow.");
      } finally {
        setLoading(false);
      }
    };

    fetchWorkflow();
  }, [isOpen, workflowId, scope, projectId, token]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setWorkflow(null);
      setError(null);
      setLoading(false);
    }
  }, [isOpen]);

  let content: React.ReactNode;

  if (loading) {
    content = <p>Caricamento...</p>;
  } else if (error) {
    content = <p className={alert.error}>{error}</p>;
  } else if (workflow) {
    // Convert to ReactFlow nodes and edges using the same converters as edit/create
    const nodes: Node<WorkflowReactFlowNodeData>[] = (workflow.workflowNodes || []).map((meta) => {
      const wfStatus = workflow.statuses.find(
        (s) => s.status.id === meta.statusId
      );

      const label = wfStatus?.status?.name ?? `Nodo ${meta.id}`;
      const category = wfStatus?.statusCategory ?? "BACKLOG";
      const backgroundColor = getCategoryColor(category);
      const isInitial = Number(wfStatus?.status.id) === Number(workflow.initialStatus?.id);

      return {
        id: String(meta.statusId), // Use statusId as ID like in edit/create mode
        type: "customNode",
        position: { x: meta.positionX, y: meta.positionY },
        data: {
          nodeId: meta.id,
          statusId: meta.statusId,
          positionX: meta.positionX,
          positionY: meta.positionY,
          workflowStatusId: wfStatus?.id || 0,
          workflowId: workflow.id,
          workflowName: workflow.name,
          statusName: label,
          statusCategory: category,
          isInitial,
          isNew: false,
          isExisting: true,
          label,
          category,
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
      } as Node<WorkflowReactFlowNodeData>;
    });

    const edges: Edge<WorkflowReactFlowEdgeData>[] = (workflow.workflowEdges || []).map((e) => {
      const transition = (workflow.transitions || []).find(t => t.id === e.transitionId);
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
          edgeId: e.id,
          transitionId: e.transitionId,
          transitionTempId: null,
          sourceStatusId: e.sourceId,
          targetStatusId: e.targetId,
          sourcePosition: e.sourcePosition,
          targetPosition: e.targetPosition,
          transitionName: transition?.name || "",
          isNew: false,
          isTransitionNew: false,
          label: transition?.name || "",
          onDelete: () => {},
        },
        style: {
          stroke: '#2196f3',
          strokeWidth: 2,
        },
        markerEnd: {
          type: 'arrowclosed',
          color: '#2196f3',
        },
      } as Edge<WorkflowReactFlowEdgeData>;
    });

    content = (
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
    content = <p>Nessun workflow selezionato.</p>;
  }

  return (
    <SimpleModal
      isOpen={isOpen}
      onClose={onClose}
      title={workflow ? `Workflow: ${workflow.name}` : "Visualizza Workflow"}
      width="80%"
      height="80%"
      padding="20px"
      useCSSModules={false}
    >
      {content}
    </SimpleModal>
  );
}




