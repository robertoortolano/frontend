import { useCallback, useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import type { Node, Edge } from 'reactflow';
import { WorkflowState, WorkflowNodeData, WorkflowEdgeData, WorkflowReactFlowNodeData, WorkflowReactFlowEdgeData } from '../types/workflow-unified.types';
import { StatusViewDto } from '../types/workflow.types';
import { StatusCategory } from '../types/common.types';
import { convertToReactFlowNode, convertToReactFlowEdge } from '../utils/workflow-converters';
import { getCategoryColor } from '../pages/workflows/components/workflowUtils';

interface UseWorkflowReactFlowCallbacksParams {
  state: WorkflowState;
  setState: Dispatch<SetStateAction<WorkflowState>>;
  availableStatuses: StatusViewDto[];
  statusCategories: StatusCategory[];
  reactFlowNodes: Node<WorkflowReactFlowNodeData>[];
  setReactFlowNodes: Dispatch<SetStateAction<Node<WorkflowReactFlowNodeData>[]>>;
  setReactFlowEdges: Dispatch<SetStateAction<Edge<WorkflowReactFlowEdgeData>[]>>;
  loading: boolean;
}

interface RemovalHandlers {
  removeNode: (nodeId: string) => Promise<void>;
  removeEdge: (edgeId: string) => Promise<void>;
}

interface UseWorkflowReactFlowCallbacksReturn {
  handleCategoryChange: (nodeId: string, newCategory: StatusCategory) => void;
  handleSetInitial: (nodeId: string) => void;
  addNode: (statusId: number, position: { x: number; y: number }) => void;
  addEdge: (sourceId: string, targetId: string, transitionName?: string, sourceHandle?: string, targetHandle?: string) => void;
  handleUpdateEdgeConnection: (oldEdge: any, newConnection: any) => void;
  handleUpdateEdge: (edgeId: string, updates: Partial<WorkflowEdgeData>) => void;
  handleUpdateNode: (nodeId: string, updates: Partial<WorkflowNodeData>) => void;
  updateReactFlow: (nodes: WorkflowNodeData[], edges: WorkflowEdgeData[]) => void;
  registerRemovalHandlers: (handlers: RemovalHandlers) => void;
}

export function useWorkflowReactFlowCallbacks({
  state,
  setState,
  availableStatuses,
  statusCategories,
  reactFlowNodes,
  setReactFlowNodes,
  setReactFlowEdges,
  loading,
}: UseWorkflowReactFlowCallbacksParams): UseWorkflowReactFlowCallbacksReturn {
  const removalHandlersRef = useRef<RemovalHandlers>({
    removeNode: async () => {
      throw new Error('removeNode handler not registered');
    },
    removeEdge: async () => {
      throw new Error('removeEdge handler not registered');
    },
  });

  const handleCategoryChange = useCallback((nodeId: string, newCategory: StatusCategory) => {
    setState(prev => ({
      ...prev,
      nodes: prev.nodes.map(node =>
        node.statusId === Number(nodeId)
          ? { ...node, statusCategory: newCategory }
          : node
      ),
    }));

    setReactFlowNodes(prevNodes =>
      prevNodes.map(node =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                statusCategory: newCategory,
                category: newCategory,
              },
              style: {
                ...node.style,
                background: getCategoryColor(newCategory),
              },
            }
          : node
      ),
    );
  }, [setReactFlowNodes, setState]);

  const handleSetInitial = useCallback((nodeId: string) => {
    setState(prev => ({
      ...prev,
      nodes: prev.nodes.map(node => ({
        ...node,
        isInitial: node.statusId === Number(nodeId),
      })),
      workflow: prev.workflow ? {
        ...prev.workflow,
        initialStatusId: Number(nodeId),
      } : null,
    }));

    setReactFlowNodes(prevNodes =>
      prevNodes.map(node =>
        node.id === nodeId
          ? {
              ...node,
              data: { ...node.data, isInitial: true },
            }
          : {
              ...node,
              data: { ...node.data, isInitial: false },
            }
      ),
    );
  }, [setReactFlowNodes, setState]);

  const addNode = useCallback((statusId: number, position: { x: number; y: number }) => {
    const status = availableStatuses.find(s => s.id === statusId);
    if (!status) {
      return;
    }

    setState(prev => {
      const isFirstNode = prev.nodes.length === 0;

      const newNode: WorkflowNodeData = {
        nodeId: null,
        statusId: status.id,
        positionX: position.x,
        positionY: position.y,
        workflowStatusId: 0,
        workflowId: prev.workflow?.id || 0,
        workflowName: prev.workflow?.name || '',
        statusName: status.name,
        statusCategory: statusCategories[0] || 'BACKLOG',
        isInitial: isFirstNode,
        isNew: true,
        isExisting: false,
      };

      const updatedNodes = [...prev.nodes, newNode];

      const reactNode = convertToReactFlowNode(
        newNode,
        handleCategoryChange,
        (node) => removalHandlersRef.current.removeNode(node),
        handleSetInitial,
        statusCategories,
      );

      setReactFlowNodes(prevNodes => [...prevNodes, reactNode]);

      return {
        ...prev,
        nodes: updatedNodes,
        workflow: prev.workflow ? {
          ...prev.workflow,
          initialStatusId: isFirstNode ? status.id : (prev.workflow.initialStatusId ?? null),
        } : null,
        pendingChanges: {
          ...prev.pendingChanges,
          addedNodes: [...prev.pendingChanges.addedNodes, newNode],
        },
      };
    });
  }, [availableStatuses, handleCategoryChange, handleSetInitial, setReactFlowNodes, setState, statusCategories]);

  const addEdge = useCallback((sourceId: string, targetId: string, transitionName: string = '', sourceHandle?: string, targetHandle?: string) => {
    const newEdge: WorkflowEdgeData = {
      edgeId: null,
      transitionId: null,
      transitionTempId: `temp-${Date.now()}`,
      sourceStatusId: Number(sourceId),
      targetStatusId: Number(targetId),
      sourcePosition: sourceHandle || null,
      targetPosition: targetHandle || null,
      transitionName,
      isNew: true,
      isTransitionNew: true,
    };

    setState(prev => ({
      ...prev,
      edges: [...prev.edges, newEdge],
      pendingChanges: {
        ...prev.pendingChanges,
        addedEdges: [...prev.pendingChanges.addedEdges, newEdge],
      },
    }));

    const reactEdge = convertToReactFlowEdge(newEdge, (edgeId) => removalHandlersRef.current.removeEdge(edgeId));
    setReactFlowEdges(prev => [...prev, reactEdge as Edge<WorkflowReactFlowEdgeData>]);
  }, [setReactFlowEdges, setState]);

  const handleUpdateEdgeConnection = useCallback((oldEdge: Edge<WorkflowReactFlowEdgeData>, newConnection: { source: string; target: string; sourceHandle?: string; targetHandle?: string }) => {
    const edgeId = oldEdge.id;
    const edge = state.edges.find(e =>
      e.transitionId === Number(edgeId) || e.transitionTempId === edgeId ||
      String(e.transitionId) === edgeId || e.transitionTempId === edgeId
    );

    if (!edge) {
      console.error('Edge not found for update:', edgeId);
      return;
    }

    const newSourceStatusId = Number(newConnection.source);
    const newTargetStatusId = Number(newConnection.target);
    const newSourceHandle = newConnection.sourceHandle || null;
    const newTargetHandle = newConnection.targetHandle || null;

    const sourceChanged = edge.sourceStatusId !== newSourceStatusId;
    const targetChanged = edge.targetStatusId !== newTargetStatusId;
    const sourceHandleChanged = edge.sourcePosition !== newSourceHandle;
    const targetHandleChanged = edge.targetPosition !== newTargetHandle;

    if (!sourceChanged && !targetChanged && !sourceHandleChanged && !targetHandleChanged) {
      return;
    }

    setState(prev => ({
      ...prev,
      edges: prev.edges.map(e =>
        (e.transitionId === edge.transitionId && e.transitionTempId === edge.transitionTempId) ||
        (e.transitionId === Number(edgeId) || e.transitionTempId === edgeId)
          ? {
              ...e,
              sourceStatusId: newSourceStatusId,
              targetStatusId: newTargetStatusId,
              sourcePosition: newSourceHandle,
              targetPosition: newTargetHandle,
            }
          : e
      ),
      pendingChanges: {
        ...prev.pendingChanges,
        modifiedEdges: prev.pendingChanges.modifiedEdges.some(e =>
          (e.transitionId === edge.transitionId && e.transitionTempId === edge.transitionTempId) ||
          (e.transitionId === Number(edgeId) || e.transitionTempId === edgeId)
        )
          ? prev.pendingChanges.modifiedEdges.map(e =>
              (e.transitionId === edge.transitionId && e.transitionTempId === edge.transitionTempId) ||
              (e.transitionId === Number(edgeId) || e.transitionTempId === edgeId)
                ? {
                    ...e,
                    sourceStatusId: newSourceStatusId,
                    targetStatusId: newTargetStatusId,
                    sourcePosition: newSourceHandle,
                    targetPosition: newTargetHandle,
                  }
                : e
            )
          : [...prev.pendingChanges.modifiedEdges, {
              ...edge,
              sourceStatusId: newSourceStatusId,
              targetStatusId: newTargetStatusId,
              sourcePosition: newSourceHandle,
              targetPosition: newTargetHandle,
            }],
      },
    }));

    setReactFlowEdges(prev => prev.map(e =>
      e.id === edgeId
        ? {
            ...e,
            source: newConnection.source,
            target: newConnection.target,
            sourceHandle: newSourceHandle || undefined,
            targetHandle: newTargetHandle || undefined,
            data: {
              ...e.data,
              sourceStatusId: newSourceStatusId,
              targetStatusId: newTargetStatusId,
              sourcePosition: newSourceHandle,
              targetPosition: newTargetHandle,
              transitionTempId: e.data?.transitionTempId || null,
            },
          } as Edge<WorkflowReactFlowEdgeData>
        : e
    ));
  }, [setReactFlowEdges, setState, state.edges]);

  const handleUpdateEdge = useCallback((edgeId: string, updates: Partial<WorkflowEdgeData>) => {
    setState(prev => ({
      ...prev,
      edges: prev.edges.map(edge =>
        edge.transitionId === Number(edgeId) || edge.transitionTempId === edgeId
          ? { ...edge, ...updates }
          : edge
      ),
    }));

    setReactFlowEdges(prev => prev.map(e => {
      const edgeIdMatch = e.id === edgeId ||
        String(e.data?.transitionId) === edgeId ||
        e.data?.transitionTempId === edgeId;

      if (edgeIdMatch) {
        return {
          ...e,
          data: {
            ...e.data,
            ...updates,
            label: updates.transitionName !== undefined ? updates.transitionName : e.data?.label,
            sourceStatusId: updates.sourceStatusId !== undefined ? updates.sourceStatusId : e.data?.sourceStatusId,
            targetStatusId: updates.targetStatusId !== undefined ? updates.targetStatusId : e.data?.targetStatusId,
            sourcePosition: updates.sourcePosition !== undefined ? updates.sourcePosition : e.data?.sourcePosition,
            targetPosition: updates.targetPosition !== undefined ? updates.targetPosition : e.data?.targetPosition,
            transitionTempId: updates.transitionTempId !== undefined ? updates.transitionTempId : e.data?.transitionTempId,
          },
        } as Edge<WorkflowReactFlowEdgeData>;
      }
      return e;
    }));
  }, [setReactFlowEdges, setState]);

  const handleUpdateNode = useCallback((nodeId: string, updates: Partial<WorkflowNodeData>) => {
    setState(prev => ({
      ...prev,
      nodes: prev.nodes.map(node =>
        node.statusId === Number(nodeId) ? { ...node, ...updates } : node
      ),
    }));
  }, [setState]);

  const updateReactFlow = useCallback((nodes: WorkflowNodeData[], edges: WorkflowEdgeData[]) => {
    const reactNodes = nodes.map(node =>
      convertToReactFlowNode(
        node,
        handleCategoryChange,
        (id) => removalHandlersRef.current.removeNode(id),
        handleSetInitial,
        statusCategories,
      ),
    );

    const reactEdges = edges.map(edge =>
      convertToReactFlowEdge(edge, (id) => removalHandlersRef.current.removeEdge(id)),
    );

    setReactFlowNodes(reactNodes);
    setReactFlowEdges(reactEdges);
  }, [handleCategoryChange, handleSetInitial, setReactFlowEdges, setReactFlowNodes, statusCategories]);

  useEffect(() => {
    if (state.workflow && state.nodes.length > 0 && reactFlowNodes.length === 0 && !loading) {
      updateReactFlow(state.nodes, state.edges);
    }
  }, [loading, reactFlowNodes.length, state.edges, state.nodes, state.workflow, updateReactFlow]);

  useEffect(() => {
    reactFlowNodes.forEach(reactNode => {
      const nodeId = Number(reactNode.id);
      const unifiedNode = state.nodes.find(n => n.statusId === nodeId);
      if (unifiedNode && (unifiedNode.positionX !== reactNode.position.x || unifiedNode.positionY !== reactNode.position.y)) {
        setState(prev => ({
          ...prev,
          nodes: prev.nodes.map(n =>
            n.statusId === nodeId
              ? { ...n, positionX: reactNode.position.x, positionY: reactNode.position.y }
              : n,
          ),
        }));
      }
    });
  }, [reactFlowNodes, setState, state.nodes]);

  const registerRemovalHandlers = useCallback((handlers: RemovalHandlers) => {
    removalHandlersRef.current = handlers;
  }, []);

  return {
    handleCategoryChange,
    handleSetInitial,
    addNode,
    addEdge,
    handleUpdateEdgeConnection,
    handleUpdateEdge,
    handleUpdateNode,
    updateReactFlow,
    registerRemovalHandlers,
  };
}


