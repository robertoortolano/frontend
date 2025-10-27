/**
 * useWorkflowEditor Hook
 * 
 * Centralized state management and business logic for workflow editing
 * Replaces the complex state management in WorkflowEdit.tsx
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNodesState, useEdgesState } from 'reactflow';
import api from '../api/api';
import { 
  WorkflowState, 
  WorkflowNodeData, 
  WorkflowEdgeData, 
  ReactFlowNode, 
  ReactFlowEdge,
  UseWorkflowEditorReturn,
  RemovalOperation,
  ImpactReportData
} from '../types/workflow-unified.types';
import { 
  WorkflowViewDto, 
  StatusViewDto 
} from '../types/workflow.types';
import { StatusCategory } from '../types/common.types';
import { 
  convertToUnifiedNodes, 
  convertToUnifiedEdges,
  convertToReactFlowNode,
  convertToReactFlowEdge,
  convertToWorkflowUpdateDto,
  validateNodeData,
  validateEdgeData
} from '../utils/workflow-converters';
import { getCategoryColor } from '../pages/workflows/components/workflowUtils';

interface UseWorkflowEditorProps {
  mode: 'create' | 'edit';
  workflowId?: number;
  onSave?: (workflow: WorkflowState['workflow']) => void;
  onCancel?: () => void;
}

export function useWorkflowEditor({
  mode,
  workflowId,
  onSave,
  onCancel
}: UseWorkflowEditorProps): UseWorkflowEditorReturn {
  
  // ========================
  // STATE MANAGEMENT
  // ========================
  
  const [state, setState] = useState<WorkflowState>({
    workflow: null,
    nodes: [],
    edges: [],
    ui: {
      selectedNodeId: null,
      selectedEdgeId: null,
      showImpactReport: false,
      impactReportType: null,
      analyzingImpact: false,
      saving: false,
    },
    pendingChanges: {
      removedNodes: [],
      removedEdges: [],
      addedNodes: [],
      addedEdges: [],
      modifiedNodes: [],
      modifiedEdges: [],
    },
  });

  const [availableStatuses, setAvailableStatuses] = useState<StatusViewDto[]>([]);
  const [statusCategories, setStatusCategories] = useState<StatusCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [impactReport, setImpactReport] = useState<ImpactReportData | null>(null);

  // React Flow state
  const [reactFlowNodes, setReactFlowNodes, onNodesChange] = useNodesState([]);
  const [reactFlowEdges, setReactFlowEdges, onEdgesChange] = useEdgesState([]);

  // ========================
  // DATA LOADING
  // ========================
  
  useEffect(() => {
    loadInitialData();
  }, [mode, workflowId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statusesRes, categoriesRes] = await Promise.all([
        api.get("/statuses"),
        api.get("/statuses/categories"),
      ]);

      setAvailableStatuses(statusesRes.data);
      setStatusCategories(categoriesRes.data);

      if (mode === 'edit' && workflowId) {
        const workflowRes = await api.get(`/workflows/${workflowId}`);
        const workflowView: WorkflowViewDto = workflowRes.data;

        // Convert to unified format
        const nodes = convertToUnifiedNodes(workflowView, categoriesRes.data);
        const edges = convertToUnifiedEdges(workflowView, nodes);

        setState(prev => ({
          ...prev,
          workflow: {
            id: workflowView.id,
            name: workflowView.name,
            initialStatusId: workflowView.initialStatusId ?? null,
            scope: workflowView.scope,
            defaultWorkflow: workflowView.defaultWorkflow,
          },
          nodes,
          edges,
        }));

        // Update React Flow will be done via useEffect after updateReactFlow is defined
      }

    } catch (err: any) {
      console.error('Error loading initial data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // ========================
  // REACT FLOW SYNC
  // ========================
  
  // Placeholder - will be defined after all callbacks are created
  let updateReactFlow: ((nodes: WorkflowNodeData[], edges: WorkflowEdgeData[]) => void);

  // ========================
  // NODE OPERATIONS
  // ========================
  
  const handleCategoryChange = useCallback((nodeId: string, newCategory: StatusCategory) => {
    // Update unified state
    setState(prev => ({
      ...prev,
      nodes: prev.nodes.map(node => 
        node.statusId === Number(nodeId) 
          ? { ...node, statusCategory: newCategory }
          : node
      ),
    }));
    
    // Update React Flow node to reflect category change visually
    setReactFlowNodes(prevNodes => 
      prevNodes.map(node => 
        node.id === nodeId 
          ? {
              ...node,
              data: {
                ...node.data,
                statusCategory: newCategory,
                category: newCategory, // Update the category prop used for color
              },
              style: {
                ...node.style,
                background: getCategoryColor(newCategory),
              }
            }
          : node
      )
    );
  }, []);

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
    
    // Update React Flow node to reflect initial state visually
    setReactFlowNodes(prevNodes => 
      prevNodes.map(node => 
        node.id === nodeId 
          ? {
              ...node,
              data: {
                ...node.data,
                isInitial: true,
              }
            }
          : {
              ...node,
              data: {
                ...node.data,
                isInitial: false,
              }
            }
      )
    );
  }, []);

  const addNode = useCallback((statusId: number, position: { x: number; y: number }) => {
    console.log('addNode called with statusId:', statusId, 'position:', position);
    console.log('Available statuses:', availableStatuses.length);
    
    const status = availableStatuses.find(s => s.id === statusId);
    if (!status) {
      console.error('Status not found:', statusId);
      return;
    }

    setState(prev => {
      // Check if this is the first node (if so, make it initial)
      const isFirstNode = prev.nodes.length === 0;
      
      const newNode: WorkflowNodeData = {
        nodeId: null,
        statusId: status.id,
        positionX: position.x,
        positionY: position.y,
        workflowStatusId: 0, // Will be assigned when saved
        workflowId: prev.workflow?.id || 0,
        workflowName: prev.workflow?.name || '',
        statusName: status.name,
        statusCategory: statusCategories[0] || 'BACKLOG',
        isInitial: isFirstNode, // First node is always initial
        isNew: true,
        isExisting: false,
      };

      const newNodes = [...prev.nodes, newNode];
      console.log('Adding node to state. Is first node:', isFirstNode, 'New nodes:', newNodes);
      
      // Update React Flow immediately with correct callbacks
      // We capture handleRemoveNode from the current closure - it will be defined later
      const reactNode = convertToReactFlowNode(
        newNode,
        handleCategoryChange,
        (nodeId: string) => {
          console.log('onRemove called in addNode callback, nodeId:', nodeId);
          // This will be handled by the actual handleRemoveNode function
          // For now, just trigger state update which will handle it
          setState(prev => {
            const wasInitial = prev.nodes.find(n => n.statusId === Number(nodeId))?.isInitial;
            const filtered = prev.nodes.filter(n => n.statusId !== Number(nodeId));
            
            // If we removed the initial node and there are still nodes, make the first remaining one initial
            let updatedFiltered = filtered;
            let newInitialStatusId = prev.workflow?.initialStatusId;
            
            if (wasInitial && filtered.length > 0) {
              updatedFiltered = filtered.map((n, index) => 
                index === 0 ? { ...n, isInitial: true } : { ...n, isInitial: false }
              );
              newInitialStatusId = updatedFiltered[0].statusId;
              console.log('Made first remaining node initial:', updatedFiltered[0].statusName);
            }
            
            return {
              ...prev,
              nodes: updatedFiltered,
              workflow: prev.workflow ? {
                ...prev.workflow,
                initialStatusId: newInitialStatusId,
              } : null,
              pendingChanges: {
                ...prev.pendingChanges,
                addedNodes: prev.pendingChanges.addedNodes.filter(n => n.statusId !== Number(nodeId)),
              },
            };
          });
          
          // Also update React Flow
          setReactFlowNodes(prev => {
            const filtered = prev.filter(n => n.id !== nodeId);
            
            // If we removed the initial node, update the new initial node in React Flow
            if (filtered.length > 0) {
              return filtered.map(n => 
                n.id === String(filtered[0].statusId) 
                  ? { ...n, data: { ...n.data, isInitial: true } }
                  : { ...n, data: { ...n.data, isInitial: false } }
              );
            }
            
            return filtered;
          });
          setReactFlowEdges(prev => prev.filter(e => e.source !== nodeId && e.target !== nodeId));
        },
        handleSetInitial,
        statusCategories
      );
      setReactFlowNodes(prev => [...prev, reactNode]);
      
      return {
        ...prev,
        nodes: newNodes,
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
  }, [availableStatuses, statusCategories, handleCategoryChange, handleSetInitial, statusCategories]);

  const handleRemoveNode = useCallback(async (nodeId: string) => {
    console.log('handleRemoveNode called, nodeId:', nodeId);
    
    // Use setState with function to get the latest state
    setState(prev => {
      console.log('Current state.nodes.length:', prev.nodes.length);
      
      if (prev.nodes.length === 0) {
        console.error('Cannot remove node: no nodes in state');
        return prev; // Return unchanged state
      }

      const node = prev.nodes.find(n => n.statusId === Number(nodeId));
      if (!node) {
        console.error('Node not found:', nodeId);
        return prev; // Return unchanged state
      }

      // If it's a new node, remove directly
      if (node.isNew) {
        console.log('Removing new node. Before:', prev.nodes.length);
        const filtered = prev.nodes.filter(n => n.statusId !== Number(nodeId));
        console.log('After filtering:', filtered.length);
        
        // If we're removing the initial node and there are still nodes, make the first remaining one initial
        const wasInitial = node.isInitial;
        let updatedFiltered = filtered;
        let newInitialStatusId = prev.workflow?.initialStatusId;
        
        if (wasInitial && filtered.length > 0) {
          updatedFiltered = filtered.map((n, index) => 
            index === 0 ? { ...n, isInitial: true } : { ...n, isInitial: false }
          );
          newInitialStatusId = updatedFiltered[0].statusId;
          console.log('Made first remaining node initial:', updatedFiltered[0].statusName);
        }
        
        return {
          ...prev,
          nodes: updatedFiltered,
          workflow: prev.workflow ? {
            ...prev.workflow,
            initialStatusId: newInitialStatusId,
          } : null,
          pendingChanges: {
            ...prev.pendingChanges,
            addedNodes: prev.pendingChanges.addedNodes.filter(n => n.statusId !== Number(nodeId)),
          },
        };
      }

      // For existing nodes, analyze impact
      // TODO: Implement impact analysis for existing nodes
      console.warn('Removing existing node requires impact analysis - not yet implemented');
      return prev;
    });
    
    // Update React Flow after state update
    setReactFlowNodes(prev => {
      const filtered = prev.filter(n => n.id !== nodeId);
      
      // If we removed the initial node, update the new initial node in React Flow
      const wasInitial = state.nodes.find(n => String(n.statusId) === nodeId)?.isInitial;
      if (wasInitial && filtered.length > 0) {
        return filtered.map(n => 
          n.id === String(filtered[0].statusId) 
            ? { ...n, data: { ...n.data, isInitial: true } }
            : { ...n, data: { ...n.data, isInitial: false } }
        );
      }
      
      return filtered;
    });
    setReactFlowEdges(prev => prev.filter(e => e.source !== nodeId && e.target !== nodeId));
  }, [state.nodes]);

  // ========================
  // EDGE OPERATIONS
  // ========================
  
  const addEdge = useCallback((sourceId: string, targetId: string, transitionName: string = '', sourceHandle?: string, targetHandle?: string) => {
    console.log('addEdge called with sourceHandle:', sourceHandle, 'targetHandle:', targetHandle);
    
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

    // Update React Flow
    const reactEdge = convertToReactFlowEdge(newEdge, handleRemoveEdge);
    setReactFlowEdges(prev => [...prev, reactEdge]);
  }, []);

  const handleRemoveEdge = useCallback(async (edgeId: string) => {
    const edge = state.edges.find(e => 
      e.transitionId === Number(edgeId) || e.transitionTempId === edgeId
    );
    
    if (!edge) {
      console.error('Edge not found:', edgeId);
      return;
    }

    // If it's a new edge, remove directly
    if (edge.isNew) {
      setState(prev => ({
        ...prev,
        edges: prev.edges.filter(e => e !== edge),
        pendingChanges: {
          ...prev.pendingChanges,
          addedEdges: prev.pendingChanges.addedEdges.filter(e => e !== edge),
        },
      }));
      
      setReactFlowEdges(prev => prev.filter(e => e.id !== edgeId));
      return;
    }

    // For existing edges, analyze impact
    const operation: RemovalOperation = {
      type: 'edge',
      id: edgeId,
      data: edge,
      impactReport: null,
      confirmed: false,
    };

    await analyzeImpact([operation]);
  }, [state.edges]);

  // ========================
  // IMPACT ANALYSIS
  // ========================
  
  const analyzeImpact = useCallback(async (operations: RemovalOperation[]): Promise<ImpactReportData> => {
    setState(prev => ({
      ...prev,
      ui: {
        ...prev.ui,
        analyzingImpact: true,
      },
    }));

    try {
      // Determine impact type based on operations
      const hasNodeRemovals = operations.some(op => op.type === 'node');
      const hasEdgeRemovals = operations.some(op => op.type === 'edge');
      
      let impactType: 'status' | 'transition' | 'fieldset' = 'status';
      if (hasNodeRemovals) impactType = 'status';
      else if (hasEdgeRemovals) impactType = 'transition';

      // Build DTO for impact analysis
      const dto = convertToWorkflowUpdateDto(state, mode);
      
      // Call appropriate impact analysis endpoint
      let endpoint = '';
      if (impactType === 'status') {
        endpoint = `/workflows/${state.workflow?.id}/analyze-status-removal-impact`;
      } else if (impactType === 'transition') {
        endpoint = `/workflows/${state.workflow?.id}/analyze-transition-removal-impact`;
      }

      const response = await api.post(endpoint, dto);
      const impactData: ImpactReportData = response.data;

      setImpactReport(impactData);
      setState(prev => ({
        ...prev,
        ui: {
          ...prev.ui,
          showImpactReport: true,
          impactReportType: impactType,
        },
      }));

      return impactData;
    } catch (err: any) {
      console.error('Error analyzing impact:', err);
      throw err;
    } finally {
      setState(prev => ({
        ...prev,
        ui: {
          ...prev.ui,
          analyzingImpact: false,
        },
      }));
    }
  }, [state, mode]);

  // ========================
  // WORKFLOW OPERATIONS
  // ========================
  
  const updateWorkflowName = useCallback((name: string) => {
    setState(prev => ({
      ...prev,
      workflow: prev.workflow ? {
        ...prev.workflow,
        name,
      } : {
        id: 0,
        name,
        initialStatusId: null,
        scope: 'TENANT',
        defaultWorkflow: false,
      },
    }));
  }, []);
  
  const saveWorkflow = useCallback(async () => {
    if (!state.workflow) {
      throw new Error('No workflow data to save');
    }

    setState(prev => ({
      ...prev,
      ui: {
        ...prev.ui,
        saving: true,
      },
    }));

    try {
      const dto = convertToWorkflowUpdateDto(state, mode);
      console.log('Saving workflow with DTO:', JSON.stringify(dto, null, 2));
      
      let response;
      if (mode === 'create') {
        response = await api.post('/workflows', dto);
      } else {
        response = await api.put(`/workflows/${state.workflow.id}`, dto);
      }

      // Update state with saved data
      const savedWorkflow = response.data;
      setState(prev => ({
        ...prev,
        workflow: {
          ...prev.workflow!,
          id: savedWorkflow.id,
        },
        pendingChanges: {
          removedNodes: [],
          removedEdges: [],
          addedNodes: [],
          addedEdges: [],
          modifiedNodes: [],
          modifiedEdges: [],
        },
      }));

      onSave?.(state.workflow);
    } catch (err: any) {
      console.error('Error saving workflow:', err);
      throw err;
    } finally {
      setState(prev => ({
        ...prev,
        ui: {
          ...prev.ui,
          saving: false,
        },
      }));
    }
  }, [state, mode, onSave]);

  const cancelChanges = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  // ========================
  // IMPACT CONFIRMATION
  // ========================
  
  const confirmRemoval = useCallback(async (operations: RemovalOperation[]) => {
    try {
      // Call confirmation endpoint
      const dto = convertToWorkflowUpdateDto(state, mode);
      
      let endpoint = '';
      if (operations[0]?.type === 'node') {
        endpoint = `/workflows/${state.workflow?.id}/confirm-status-removal`;
      } else if (operations[0]?.type === 'edge') {
        endpoint = `/workflows/${state.workflow?.id}/confirm-transition-removal`;
      }

      await api.post(endpoint, dto);

      // Remove from state
      setState(prev => ({
        ...prev,
        nodes: prev.nodes.filter(node => 
          !operations.some(op => op.type === 'node' && op.data.statusId === node.statusId)
        ),
        edges: prev.edges.filter(edge => 
          !operations.some(op => op.type === 'edge' && op.data === edge)
        ),
        ui: {
          ...prev.ui,
          showImpactReport: false,
          impactReportType: null,
        },
      }));

      // Update React Flow
      const remainingNodes = state.nodes.filter(node => 
        !operations.some(op => op.type === 'node' && op.data.statusId === node.statusId)
      );
      const remainingEdges = state.edges.filter(edge => 
        !operations.some(op => op.type === 'edge' && op.data === edge)
      );
      updateReactFlow(remainingNodes, remainingEdges);

    } catch (err: any) {
      console.error('Error confirming removal:', err);
      throw err;
    }
  }, [state, mode, updateReactFlow]);

  const cancelRemoval = useCallback(() => {
    setState(prev => ({
      ...prev,
      ui: {
        ...prev.ui,
        showImpactReport: false,
        impactReportType: null,
      },
    }));
    setImpactReport(null);
  }, []);

  // ========================
  // REACT FLOW SYNC - Define with all dependencies
  // ========================
  
  updateReactFlow = useCallback((nodes: WorkflowNodeData[], edges: WorkflowEdgeData[]) => {
    const reactNodes = nodes.map(node => 
      convertToReactFlowNode(
        node,
        handleCategoryChange,
        handleRemoveNode,
        handleSetInitial,
        statusCategories
      )
    );

    const reactEdges = edges.map(edge => 
      convertToReactFlowEdge(edge, handleRemoveEdge)
    );

    setReactFlowNodes(reactNodes);
    setReactFlowEdges(reactEdges);
  }, [statusCategories, handleCategoryChange, handleRemoveNode, handleSetInitial, handleRemoveEdge]);

  // Sync React Flow with unified state ONLY on initial load
  useEffect(() => {
    // Only sync if workflow loaded, React Flow is empty
    if (state.workflow && state.nodes.length > 0 && reactFlowNodes.length === 0 && !loading) {
      console.log('Syncing React Flow with loaded data, nodes:', state.nodes.length);
      const reactNodes = state.nodes.map(node => 
        convertToReactFlowNode(
          node,
          handleCategoryChange,
          handleRemoveNode,
          handleSetInitial,
          statusCategories
        )
      );
      const reactEdges = state.edges.map(edge => 
        convertToReactFlowEdge(edge, handleRemoveEdge)
      );
      setReactFlowNodes(reactNodes);
      setReactFlowEdges(reactEdges);
    }
  }, [state.workflow?.id, loading, state.nodes.length]);

  // NOTE: After initial load, we DON'T sync React Flow automatically to preserve positions
  // Nodes are added/removed individually via setReactFlowNodes/setReactFlowEdges
  // This prevents nodes from jumping back to their original positions

  // NOTE: We don't update React Flow nodes when callbacks change to preserve positions
  // React Flow callbacks are captured when nodes are created and updated individually

  // Sync node positions from React Flow to unified state
  useEffect(() => {
    // Update positions when nodes are dragged
    reactFlowNodes.forEach(reactNode => {
      const nodeId = Number(reactNode.id);
      const unifiedNode = state.nodes.find(n => n.statusId === nodeId);
      if (unifiedNode && (
        unifiedNode.positionX !== reactNode.position.x || 
        unifiedNode.positionY !== reactNode.position.y
      )) {
        setState(prev => ({
          ...prev,
          nodes: prev.nodes.map(n => 
            n.statusId === nodeId 
              ? { ...n, positionX: reactNode.position.x, positionY: reactNode.position.y }
              : n
          ),
        }));
      }
    });
  }, [reactFlowNodes.map(n => `${n.id}-${n.position.x}-${n.position.y}`).join(',')]);

  // ========================
  // RETURN INTERFACE
  // ========================
  
  const actions = useMemo(() => ({
    addNode,
    removeNode: handleRemoveNode,
    updateNode: (nodeId: string, updates: Partial<WorkflowNodeData>) => {
      setState(prev => ({
        ...prev,
        nodes: prev.nodes.map(node => 
          node.statusId === Number(nodeId) ? { ...node, ...updates } : node
        ),
      }));
    },
    addEdge,
    removeEdge: handleRemoveEdge,
    updateEdge: (edgeId: string, updates: Partial<WorkflowEdgeData>) => {
      setState(prev => ({
        ...prev,
        edges: prev.edges.map(edge => 
          edge.transitionId === Number(edgeId) || edge.transitionTempId === edgeId
            ? { ...edge, ...updates }
            : edge
        ),
      }));
    },
    updateWorkflowName,
    saveWorkflow,
    cancelChanges,
    analyzeImpact,
    confirmRemoval,
    cancelRemoval,
  }), [
    addNode,
    handleRemoveNode,
    addEdge,
    handleRemoveEdge,
    updateWorkflowName,
    saveWorkflow,
    cancelChanges,
    analyzeImpact,
    confirmRemoval,
    cancelRemoval,
  ]);

  return {
    state,
    actions,
    reactFlowNodes,
    reactFlowEdges,
    loading,
    error,
    impactReport,
    showImpactReport: state.ui.showImpactReport,
    availableStatuses,
    statusCategories,
    onNodesChange,
    onEdgesChange,
  };
}
