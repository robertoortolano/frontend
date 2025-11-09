/**
 * useWorkflowEditor Hook
 * 
 * Centralized state management and business logic for workflow editing
 * Replaces the complex state management in WorkflowEdit.tsx
 */

import { useState, useEffect, useCallback, useMemo, useRef, type Dispatch, type SetStateAction, type MutableRefObject } from 'react';
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
import { StatusRemovalImpactDto } from '../types/status-impact.types';
import { TransitionRemovalImpactDto } from '../types/transition-impact.types';
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
import { useWorkflowImpactManager } from './useWorkflowImpactManager';
import { useWorkflowDataLoader } from './useWorkflowDataLoader';

interface UseWorkflowEditorProps {
  mode: 'create' | 'edit';
  workflowId?: number;
  scope?: 'tenant' | 'project';
  projectId?: string;
  onSave?: (workflow: WorkflowState['workflow']) => void;
  onCancel?: () => void;
}

export function useWorkflowEditor({
  mode,
  workflowId,
  scope = 'tenant',
  projectId,
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
      pendingSave: false,
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

  const {
    availableStatuses,
    statusCategories,
    loading,
    error,
  } = useWorkflowDataLoader({
    mode,
    workflowId,
    scope,
    projectId,
    setState,
  });

  // Promise resolver for saveWorkflow when waiting for summary report confirmation
  const saveWorkflowResolverRef = useRef<{
    resolve: () => void;
    reject: (error: any) => void;
  } | null>(null);

  const {
    impactReport,
    enhancedImpactDto,
    setImpactReport,
    setEnhancedImpactDto,
    analyzeImpact,
    saveWorkflow,
  } = useWorkflowImpactManager({
    state,
    setState,
    mode,
    scope,
    projectId,
    onSave,
    saveWorkflowResolverRef,
  });

  // React Flow state
  const [reactFlowNodes, setReactFlowNodes, onNodesChange] = useNodesState([]);
  const [reactFlowEdges, setReactFlowEdges, onEdgesChange] = useEdgesState([]);

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
    const status = availableStatuses.find(s => s.id === statusId);
    if (!status) {
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
      
      // Update React Flow immediately with correct callbacks
      // We capture handleRemoveNode from the current closure - it will be defined later
      const reactNode = convertToReactFlowNode(
        newNode,
        handleCategoryChange,
        (nodeId: string) => {
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

  // ========================
  // IMPACT ANALYSIS (defined early to avoid reference errors)
  // ========================
  
  // The analyzeImpact, handleRemoveNode, and saveWorkflow functions are now managed by useWorkflowImpactManager
  // This hook will call them internally.

  // ========================
  // EDGE OPERATIONS
  // ========================
  
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

    // IMPORTANTE: NON analizzare l'impatto durante la rimozione
    // L'analisi verrà fatta solo al salvataggio (in saveWorkflow)
    // Rimuovi solo visivamente e traccia la rimozione in pendingChanges
    
    // Rimuovi l'edge dallo stato e traccia in pendingChanges
    setState(prev => ({
      ...prev,
      edges: prev.edges.filter(e => e !== edge),
      pendingChanges: {
        ...prev.pendingChanges,
        removedEdges: [...prev.pendingChanges.removedEdges, edge],
      },
      ui: {
        ...prev.ui,
        showImpactReport: false, // NON mostrare il report durante la rimozione
        impactReportType: null,
      },
    }));
    
    // Rimuovi da React Flow
    setReactFlowEdges(prev => prev.filter(e => e.id !== edgeId));
    
    // Assicurati che non ci sia un report aperto
    setImpactReport(null);
    setEnhancedImpactDto(null);
  }, [state.edges]);

  const handleUpdateEdgeConnection = useCallback((oldEdge: any, newConnection: any) => {
    // Find the edge in unified state by its React Flow ID
    const edgeId = oldEdge.id;
    const edge = state.edges.find(e => 
      e.transitionId === Number(edgeId) || e.transitionTempId === edgeId ||
      String(e.transitionId) === edgeId || e.transitionTempId === edgeId
    );

    if (!edge) {
      console.error('Edge not found for update:', edgeId);
      return;
    }

    // Extract new connection data
    const newSourceStatusId = Number(newConnection.source);
    const newTargetStatusId = Number(newConnection.target);
    const newSourceHandle = newConnection.sourceHandle || null;
    const newTargetHandle = newConnection.targetHandle || null;

    // Check if anything actually changed
    const sourceChanged = edge.sourceStatusId !== newSourceStatusId;
    const targetChanged = edge.targetStatusId !== newTargetStatusId;
    const sourceHandleChanged = edge.sourcePosition !== newSourceHandle;
    const targetHandleChanged = edge.targetPosition !== newTargetHandle;

    if (!sourceChanged && !targetChanged && !sourceHandleChanged && !targetHandleChanged) {
      // No changes, skip update
      return;
    }

    // Update unified state
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

    // Update React Flow edges
    setReactFlowEdges(prev => prev.map(e => 
      e.id === edgeId
        ? {
            ...e,
            source: newConnection.source,
            target: newConnection.target,
            sourceHandle: newSourceHandle || undefined,
            targetHandle: newTargetHandle || undefined,
          }
        : e
    ));
  }, [state.edges]);

  const updateReactFlow = useWorkflowReactFlowSync({
    state,
    setState,
    loading,
    statusCategories,
    reactFlowNodes,
    setReactFlowNodes,
    setReactFlowEdges,
    handleCategoryChange,
    handleRemoveNode,
    handleSetInitial,
    handleRemoveEdge,
  });

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
  
  // The saveWorkflow function is now managed by useWorkflowImpactManager
  // This hook will call it internally.

  const cancelChanges = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  // ========================
  // IMPACT CONFIRMATION
  // ========================
  
  const confirmRemoval = useCallback(async (operations: RemovalOperation[]) => {
    try {
      // Check if this is a confirmation from a summary report before saving
      const isPendingSave = state.ui.pendingSave;
      
      // If this is a confirmation from summary report before saving, 
      // the items are already removed from state and are in pendingChanges
      // Just close the modal and proceed with actual save
      if (isPendingSave) {
        // Resolve the pending saveWorkflow promise FIRST
        if (saveWorkflowResolverRef.current) {
          const resolver = saveWorkflowResolverRef.current;
          saveWorkflowResolverRef.current = null;
          
          // Close the modal and clear impact report IMMEDIATELY
          setState(prev => ({
            ...prev,
            ui: {
              ...prev.ui,
              showImpactReport: false,
              impactReportType: null,
              pendingSave: false,
            },
          }));
          
          // Clear impact report immediately to prevent it from showing again
          setImpactReport(null);
          
          // Call saveWorkflow with skipImpactAnalysis=true to skip re-analyzing impact
          // since the user has already confirmed the summary report
          setTimeout(async () => {
            try {
              await saveWorkflow(true); // Skip impact analysis - already confirmed
              resolver.resolve();
            } catch (err: any) {
              resolver.reject(err);
            }
          }, 0);
        } else {
          // Fallback if resolver is missing - try to save anyway
          setState(prev => ({
            ...prev,
            ui: {
              ...prev.ui,
              showImpactReport: false,
              impactReportType: null,
              pendingSave: false,
            },
          }));
          setImpactReport(null);
          setEnhancedImpactDto(null);
          
          setTimeout(async () => {
            await saveWorkflow(true); // Skip impact analysis
          }, 0);
        }
        return;
      }

      // Otherwise, this is a confirmation from an individual removal report
      // APPROACH 1: Remove only from frontend state, don't touch database yet
      // The removal will be persisted only when the workflow is saved
      // This allows users to cancel changes if they don't save
      
      // Check what type of operations we're handling
      const hasNodeRemovals = operations.some(op => op.type === 'node');
      const hasEdgeRemovals = operations.some(op => op.type === 'edge');
      
      // APPROACH 1: For both status and transition removal - NO backend call, only remove from state
      // The backend will handle removal when the workflow is saved
      // This allows users to cancel changes if they don't save
      
      // Remove from state (both status and transitions)
      // APPROACH 1: Keep removedEdges in pendingChanges so they can be restored if user cancels
      // They will be cleared only when workflow is saved
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
          pendingSave: false,
        },
        pendingChanges: {
          ...prev.pendingChanges,
          // Keep removedEdges and removedNodes until save - they contain the data needed for restoration
          removedNodes: hasNodeRemovals ? prev.pendingChanges.removedNodes : [],
          removedEdges: hasEdgeRemovals ? prev.pendingChanges.removedEdges : [],
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
  }, [state, mode, updateReactFlow, saveWorkflow]);

  const cancelRemoval = useCallback(() => {
    const isPendingSave = state.ui.pendingSave;
    
    setState(prev => {
      // If this is cancellation of summary report before saving, don't restore removed items
      // Just clear the report and pendingSave flag - removals stay as they are
      if (isPendingSave) {
        // Reject the pending saveWorkflow promise since user cancelled
        if (saveWorkflowResolverRef.current) {
          const resolver = saveWorkflowResolverRef.current;
          saveWorkflowResolverRef.current = null;
          resolver.reject(new Error('Save cancelled by user'));
        }
        
        return {
          ...prev,
          ui: {
            ...prev.ui,
            showImpactReport: false,
            impactReportType: null,
            pendingSave: false, // Clear pending save flag - user cancelled the save
          },
        };
      }

      // Otherwise, this is cancellation of an individual removal - restore the item
      // APPROACH 1: Restore removed edges from pendingChanges.removedEdges
      // These edges were removed from state.edges but not yet saved
      const edgesToRestore = prev.pendingChanges.removedEdges || [];
      const nodesToRestore = prev.pendingChanges.removedNodes || [];
      
      // Restore edges to state
      const restoredEdges = [...prev.edges, ...edgesToRestore];
      
      // Restore nodes to state (if any)
      const restoredNodes = [...prev.nodes, ...nodesToRestore];
      
      // Restore React Flow edges (for visual display)
      if (edgesToRestore.length > 0) {
        const reactEdgesToRestore = edgesToRestore.map(edge => 
          convertToReactFlowEdge(edge, handleRemoveEdge)
        );
        setReactFlowEdges(prev => {
          // Filter out any duplicates and add restored edges
          const existingIds = new Set(prev.map(e => e.id));
          const newEdges = reactEdgesToRestore.filter(e => !existingIds.has(e.id));
          return [...prev, ...newEdges];
        });
      }
      
      // Restore React Flow nodes (if any)
      if (nodesToRestore.length > 0) {
        const reactNodesToRestore = nodesToRestore.map(node => 
          convertToReactFlowNode(
            node,
            handleCategoryChange,
            handleRemoveNode,
            handleSetInitial,
            statusCategories
          )
        );
        setReactFlowNodes(prev => {
          const existingIds = new Set(prev.map(n => n.id));
          const newNodes = reactNodesToRestore.filter(n => !existingIds.has(n.id));
          return [...prev, ...newNodes];
        });
      }

      return {
        ...prev,
        edges: restoredEdges,
        nodes: restoredNodes,
        ui: {
          ...prev.ui,
          showImpactReport: false,
          impactReportType: null,
          pendingSave: false,
        },
        pendingChanges: {
          ...prev.pendingChanges,
          removedNodes: [],
          removedEdges: [],
        },
      };
    });
    setImpactReport(null);
  }, [state.ui.pendingSave, handleRemoveEdge, handleCategoryChange, handleRemoveNode, handleSetInitial, statusCategories]);

  // ========================
  // RETURN INTERFACE
  // ========================
  
  // Memoize updateEdge function separately to ensure stable reference
  const handleUpdateEdge = useCallback((edgeId: string, updates: Partial<WorkflowEdgeData>) => {
    setState(prev => ({
      ...prev,
      edges: prev.edges.map(edge => 
        edge.transitionId === Number(edgeId) || edge.transitionTempId === edgeId
          ? { ...edge, ...updates }
          : edge
      ),
    }));
    
    // Also update reactFlowEdges to keep them in sync
    // This ensures the label is preserved when switching between edges
    setReactFlowEdges(prev => prev.map(e => {
      const edgeIdMatch = e.id === edgeId || 
                         String(e.data?.transitionId) === edgeId || 
                         e.data?.transitionTempId === edgeId;
      
      if (edgeIdMatch && updates.transitionName !== undefined) {
        return {
          ...e,
          data: {
            ...e.data,
            label: updates.transitionName,
          },
        };
      }
      return e;
    }));
  }, [setReactFlowEdges]);

  // Memoize updateNode function separately to ensure stable reference
  const handleUpdateNode = useCallback((nodeId: string, updates: Partial<WorkflowNodeData>) => {
    setState(prev => ({
      ...prev,
      nodes: prev.nodes.map(node => 
        node.statusId === Number(nodeId) ? { ...node, ...updates } : node
      ),
    }));
  }, []);

  const actions = useMemo(() => ({
    addNode,
    removeNode: handleRemoveNode,
    updateNode: handleUpdateNode,
    addEdge,
    removeEdge: handleRemoveEdge,
    updateEdge: handleUpdateEdge,
    updateEdgeConnection: handleUpdateEdgeConnection,
    updateWorkflowName,
    saveWorkflow,
    cancelChanges,
    analyzeImpact,
    confirmRemoval,
    cancelRemoval,
  }), [
    addNode,
    handleRemoveNode,
    handleUpdateNode,
    addEdge,
    handleRemoveEdge,
    handleUpdateEdge,
    handleUpdateEdgeConnection,
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
    enhancedImpactDto, // DTO completo per i modals enhanced
    showImpactReport: state.ui.showImpactReport,
    availableStatuses,
    statusCategories,
    onNodesChange,
    onEdgesChange,
  };
}

interface WorkflowImpactManagerParams {
  state: WorkflowState;
  setState: Dispatch<SetStateAction<WorkflowState>>;
  mode: 'create' | 'edit';
  scope: 'tenant' | 'project';
  projectId?: string;
  onSave?: (workflow: WorkflowState['workflow']) => void;
  saveWorkflowResolverRef: MutableRefObject<{
    resolve: () => void;
    reject: (error: any) => void;
  } | null>;
}

function useWorkflowImpactManager({
  state,
  setState,
  mode,
  scope,
  projectId,
  onSave,
  saveWorkflowResolverRef,
}: WorkflowImpactManagerParams) {
  const [impactReport, setImpactReport] = useState<ImpactReportData | null>(null);
  const [enhancedImpactDto, setEnhancedImpactDto] = useState<StatusRemovalImpactDto | TransitionRemovalImpactDto | null>(null);

  const analyzeImpact = useCallback(async (operations: RemovalOperation[], tempState?: WorkflowState): Promise<ImpactReportData> => {
    setState(prev => ({
      ...prev,
      ui: {
        ...prev.ui,
        analyzingImpact: true,
      },
    }));

    try {
      const currentState = tempState || state;

      const hasNodeRemovals = operations.some(op => op.type === 'node');
      const hasEdgeRemovals = operations.some(op => op.type === 'edge');

      let impactType: 'status' | 'transition' | 'fieldset' = 'status';
      if (hasNodeRemovals) impactType = 'status';
      else if (hasEdgeRemovals) impactType = 'transition';

      let endpoint = '';
      let payload: any;

      const workflowIdForEndpoint = currentState.workflow?.id || state.workflow?.id;
      let baseEndpoint = `/workflows/${workflowIdForEndpoint}`;
      if (scope === 'project' && projectId) {
        baseEndpoint = `/workflows/project/${projectId}/${workflowIdForEndpoint}`;
      }

      if (impactType === 'status') {
        endpoint = `${baseEndpoint}/analyze-status-removal-impact`;
        payload = convertToWorkflowUpdateDto(currentState, mode);
      } else {
        endpoint = `${baseEndpoint}/analyze-transition-removal-impact`;
        const transitionIds = operations
          .filter(op => op.type === 'edge')
          .map(op => op.data)
          .filter(edge => edge.transitionId !== null && edge.transitionId !== undefined)
          .map(edge => Number(edge.transitionId));
        payload = transitionIds;
      }

      const response = await api.post(endpoint, payload);
      let impactData: ImpactReportData;
      let backendDto: StatusRemovalImpactDto | TransitionRemovalImpactDto;

      if (impactType === 'transition') {
        const transitionDto: TransitionRemovalImpactDto = response.data;
        backendDto = transitionDto;
        impactData = {
          type: 'transition',
          workflowId: transitionDto.workflowId,
          workflowName: transitionDto.workflowName,
          removedItems: {
            ids: transitionDto.removedTransitionIds || [],
            names: transitionDto.removedTransitionNames || [],
          },
          affectedItemTypeSets: (transitionDto.affectedItemTypeSets || []).map((its: any) => ({
            id: its.itemTypeSetId,
            name: its.itemTypeSetName,
            projectName: its.projectName || null,
          })),
          permissions: [
            {
              type: 'executor',
              items: (transitionDto.executorPermissions || []).map((perm: any) => ({
                itemTypeSetId: perm.itemTypeSetId,
                itemTypeSetName: perm.itemTypeSetName,
                itemName: perm.transitionName,
                itemCategory: '',
                assignedRoles: perm.assignedRoles || [],
                hasAssignments: perm.hasAssignments || false,
                sourceStatusName: perm.sourceStatusName || perm.sourceStatus || perm.fromStatusName,
                targetStatusName: perm.targetStatusName || perm.targetStatus || perm.toStatusName,
              })),
            },
          ],
          totals: {
            affectedItemTypeSets: transitionDto.totalAffectedItemTypeSets || 0,
            totalPermissions: transitionDto.totalExecutorPermissions || 0,
            totalRoleAssignments: transitionDto.totalRoleAssignments || 0,
          },
        };
      } else {
        const statusDto: StatusRemovalImpactDto = response.data;
        backendDto = statusDto;
        impactData = {
          type: 'status',
          workflowId: statusDto.workflowId,
          workflowName: statusDto.workflowName,
          removedItems: {
            ids: statusDto.removedStatusIds || [],
            names: statusDto.removedStatusNames || [],
          },
          affectedItemTypeSets: (statusDto.affectedItemTypeSets || []).map((its: any) => ({
            id: its.itemTypeSetId,
            name: its.itemTypeSetName,
            projectName: its.projectName || null,
          })),
          permissions: [
            {
              type: 'statusOwner',
              items: (statusDto.statusOwnerPermissions || []).map((perm: any) => ({
                itemTypeSetId: perm.itemTypeSetId,
                itemTypeSetName: perm.itemTypeSetName,
                itemName: perm.statusName || perm.workflowStatusName,
                itemCategory: perm.statusCategory || '',
                assignedRoles: perm.assignedRoles || [],
                hasAssignments: perm.hasAssignments || false,
              })),
            },
          ],
          totals: {
            affectedItemTypeSets: statusDto.totalAffectedItemTypeSets || 0,
            totalPermissions: statusDto.totalStatusOwnerPermissions || 0,
            totalRoleAssignments: statusDto.totalRoleAssignments || 0,
          },
        };
      }

      const isCombinedAnalysis = operations.some(op => op.type === 'node') &&
        operations.some(op => op.type === 'edge');

      if (!isCombinedAnalysis) {
        setImpactReport(impactData);
        setEnhancedImpactDto(backendDto);
        setState(prev => ({
          ...prev,
          ui: {
            ...prev.ui,
            showImpactReport: true,
            impactReportType: impactType,
          },
        }));
      }

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
  }, [state, mode, scope, projectId, setState]);

  const saveWorkflow = useCallback(async (skipImpactAnalysis: boolean = false) => {
    if (!state.workflow) {
      throw new Error('No workflow data to save');
    }

    const hasRemovedTransitions = state.pendingChanges.removedEdges.length > 0;
    const hasRemovedStatuses = state.pendingChanges.removedNodes.length > 0;

    const workflowIdForEndpoint = state.workflow?.id || 0;
    let baseEndpoint = `/workflows/${workflowIdForEndpoint}`;
    if (scope === 'project' && projectId) {
      baseEndpoint = `/workflows/project/${projectId}/${workflowIdForEndpoint}`;
    }

    if ((hasRemovedStatuses || hasRemovedTransitions) && mode === 'edit' && !skipImpactAnalysis) {
      let statusImpact: ImpactReportData | null = null;
      let statusDto: StatusRemovalImpactDto | null = null;

      if (hasRemovedStatuses) {
        const statusOperations: RemovalOperation[] = state.pendingChanges.removedNodes.map(node => ({
          type: 'node' as const,
          id: String(node.statusId),
          data: node,
          impactReport: null,
          confirmed: false,
        }));

        const removedStatusIds = new Set(state.pendingChanges.removedNodes.map(n => n.statusId));
        const allEdges = [...state.edges, ...state.pendingChanges.removedEdges];
        const connectedTransitions = allEdges.filter(edge => {
          const isConnectedToRemovedStatus = removedStatusIds.has(edge.sourceStatusId) ||
            removedStatusIds.has(edge.targetStatusId);
          return isConnectedToRemovedStatus;
        }).filter((edge, index, self) =>
          index === self.findIndex(e =>
            (e.transitionId && e.transitionId === edge.transitionId) ||
            (e.transitionTempId && e.transitionTempId === edge.transitionTempId) ||
            (!e.transitionId && !e.transitionTempId &&
              !edge.transitionId && !edge.transitionTempId &&
              e.sourceStatusId === edge.sourceStatusId &&
              e.targetStatusId === edge.targetStatusId)
          )
        );

        try {
          const statusDtoResponse = await api.post(`${baseEndpoint}/analyze-status-removal-impact`, convertToWorkflowUpdateDto(state, mode));
          statusDto = statusDtoResponse.data;
          setEnhancedImpactDto(statusDto);
        } catch (err) {
          console.error('Error fetching status DTO:', err);
          if (enhancedImpactDto && 'statusOwnerPermissions' in enhancedImpactDto) {
            statusDto = enhancedImpactDto as StatusRemovalImpactDto;
          }
        }

        statusImpact = await analyzeImpact(statusOperations, state);

        if (connectedTransitions.length > 0) {
          const existingConnectedTransitions = connectedTransitions.filter(e =>
            e.transitionId !== null && e.transitionId !== undefined
          );

          if (existingConnectedTransitions.length > 0) {
            const connectedTransitionOperations: RemovalOperation[] = existingConnectedTransitions.map(edge => ({
              type: 'edge' as const,
              id: String(edge.transitionId),
              data: edge,
              impactReport: null,
              confirmed: false,
            }));

            const transitionIdsToExclude = new Set(
              existingConnectedTransitions
                .map(ct => ct.transitionId)
                .filter(id => id !== null && id !== undefined)
            );
            const transitionTempIdsToExclude = new Set(
              existingConnectedTransitions
                .map(ct => ct.transitionTempId)
                .filter(id => id !== null && id !== undefined)
            );

            const stateWithoutTransitions: WorkflowState = {
              ...state,
              edges: state.edges.filter(e => {
                if (e.transitionId !== null && e.transitionId !== undefined) {
                  return !transitionIdsToExclude.has(e.transitionId);
                }
                if (e.transitionTempId) {
                  return !transitionTempIdsToExclude.has(e.transitionTempId);
                }
                return true;
              }),
            };

            const connectedTransitionImpact = await analyzeImpact(connectedTransitionOperations, stateWithoutTransitions);

            if (connectedTransitionImpact) {
              if (statusImpact) {
                statusImpact = {
                  ...statusImpact,
                  removedItems: {
                    ids: [...(statusImpact.removedItems?.ids || []), ...(connectedTransitionImpact.removedItems?.ids || [])],
                    names: [...(statusImpact.removedItems?.names || []), ...(connectedTransitionImpact.removedItems?.names || [])],
                  },
                  affectedItemTypeSets: [
                    ...(statusImpact.affectedItemTypeSets || []),
                    ...(connectedTransitionImpact.affectedItemTypeSets || []),
                  ].filter((its, index, self) =>
                    index === self.findIndex(t => t.id === its.id)
                  ),
                  permissions: [
                    ...(statusImpact.permissions || []),
                    ...(connectedTransitionImpact.permissions || []),
                  ],
                  totals: {
                    affectedItemTypeSets: new Set([
                      ...(statusImpact.affectedItemTypeSets || []).map(its => its.id),
                      ...(connectedTransitionImpact.affectedItemTypeSets || []).map(its => its.id),
                    ]).size,
                    totalPermissions: (statusImpact.totals?.totalPermissions || 0) + (connectedTransitionImpact.totals?.totalPermissions || 0),
                    totalRoleAssignments: (statusImpact.totals?.totalRoleAssignments || 0) + (connectedTransitionImpact.totals?.totalRoleAssignments || 0),
                  },
                };
              } else {
                statusImpact = connectedTransitionImpact;
              }
            }
          }
        }
      }

      let transitionImpact: ImpactReportData | null = null;
      let transitionDto: TransitionRemovalImpactDto | null = null;
      if (hasRemovedTransitions) {
        const removedStatusIds = new Set(state.pendingChanges.removedNodes.map(n => n.statusId));
        const independentRemovedEdges = state.pendingChanges.removedEdges.filter(edge => {
          const isConnectedToRemovedStatus = removedStatusIds.has(edge.sourceStatusId) ||
            removedStatusIds.has(edge.targetStatusId);
          return !isConnectedToRemovedStatus;
        });

        if (independentRemovedEdges.length > 0) {
          const transitionOperations: RemovalOperation[] = independentRemovedEdges
            .filter(edge => edge.transitionId !== null && edge.transitionId !== undefined)
            .map(edge => ({
              type: 'edge' as const,
              id: String(edge.transitionId),
              data: edge,
              impactReport: null,
              confirmed: false,
            }));
          if (transitionOperations.length > 0) {
            try {
              const transitionIds = transitionOperations.map(op => Number(op.id));
              const transitionDtoResponse = await api.post(`${baseEndpoint}/analyze-transition-removal-impact`, transitionIds);
              transitionDto = transitionDtoResponse.data;
              setEnhancedImpactDto(transitionDto);
            } catch (err) {
              console.error('Error fetching transition DTO:', err);
            }

            transitionImpact = await analyzeImpact(transitionOperations, state);
          }
        }
      }

      const allSummaryPermissions = [
        ...(statusImpact?.permissions || []),
        ...(transitionImpact?.permissions || []),
      ];

      let combinedImpact: ImpactReportData | null = null;
      if (statusImpact || transitionImpact) {
        const primaryImpact = statusImpact || transitionImpact!;
        combinedImpact = {
          type: statusImpact ? 'status' : 'transition',
          workflowId: primaryImpact.workflowId,
          workflowName: primaryImpact.workflowName,
          removedItems: {
            ids: [
              ...(statusImpact?.removedItems?.ids || []),
              ...(transitionImpact?.removedItems?.ids || []),
            ],
            names: [
              ...(statusImpact?.removedItems?.names || []),
              ...(transitionImpact?.removedItems?.names || []),
            ],
          },
          affectedItemTypeSets: [
            ...(statusImpact?.affectedItemTypeSets || []),
            ...(transitionImpact?.affectedItemTypeSets || []),
          ].filter((its, index, self) => index === self.findIndex(t => t.id === its.id)),
          permissions: allSummaryPermissions,
          totals: {
            affectedItemTypeSets: new Set([
              ...(statusImpact?.affectedItemTypeSets || []).map(its => its.id),
              ...(transitionImpact?.affectedItemTypeSets || []).map(its => its.id),
            ]).size,
            totalPermissions: (statusImpact?.totals?.totalPermissions || 0) + (transitionImpact?.totals?.totalPermissions || 0),
            totalRoleAssignments: (statusImpact?.totals?.totalRoleAssignments || 0) + (transitionImpact?.totals?.totalRoleAssignments || 0),
          },
        };
      }

      const hasRoleAssignments = combinedImpact?.permissions?.some(perm =>
        perm.items?.some(item => item.hasAssignments)
      ) || combinedImpact?.totals?.totalRoleAssignments > 0;

      let combinedDto: StatusRemovalImpactDto | TransitionRemovalImpactDto | null = null;
      if (statusDto) {
        combinedDto = statusDto;
      } else if (transitionDto) {
        combinedDto = transitionDto;
      }

      if (combinedDto) {
        setEnhancedImpactDto(combinedDto);
      }

      if (hasRoleAssignments && combinedImpact) {
        setImpactReport(combinedImpact);
        setState(prev => ({
          ...prev,
          ui: {
            ...prev.ui,
            showImpactReport: true,
            impactReportType: combinedImpact.type,
            pendingSave: true,
          },
        }));

        return new Promise<void>((resolve, reject) => {
          saveWorkflowResolverRef.current = { resolve, reject };
        });
      }

      setState(prev => ({
        ...prev,
        ui: {
          ...prev.ui,
          showImpactReport: false,
          impactReportType: null,
        },
      }));
      setImpactReport(null);
      setEnhancedImpactDto(null);
    }

    setState(prev => ({
      ...prev,
      ui: {
        ...prev.ui,
        saving: true,
        pendingSave: false,
      },
    }));

    try {
      const dto = convertToWorkflowUpdateDto(state, mode);

      let baseEndpoint = '/workflows';
      if (scope === 'project' && projectId) {
        baseEndpoint = `/workflows/project/${projectId}`;
      }

      let response;
      if (mode === 'create') {
        response = await api.post(baseEndpoint, dto);
      } else {
        const updateBaseEndpoint = scope === 'project' && projectId
          ? `/workflows/project/${projectId}/${state.workflow.id}`
          : `/workflows/${state.workflow.id}`;
        try {
          if (hasRemovedStatuses && hasRemovedTransitions) {
            response = await api.post(`${updateBaseEndpoint}/confirm-status-removal`, dto);
          } else if (hasRemovedStatuses) {
            response = await api.post(`${updateBaseEndpoint}/confirm-status-removal`, dto);
          } else if (hasRemovedTransitions) {
            response = await api.post(`${updateBaseEndpoint}/confirm-transition-removal`, dto);
          } else {
            response = await api.put(updateBaseEndpoint, dto);
          }
        } catch (err: any) {
          if (err.response?.data?.message?.includes('TRANSITION_REMOVAL_IMPACT')) {
            response = await api.post(`${updateBaseEndpoint}/confirm-transition-removal`, dto);
          } else if (err.response?.data?.message?.includes('STATUS_REMOVAL_IMPACT')) {
            response = await api.post(`${updateBaseEndpoint}/confirm-status-removal`, dto);
          } else {
            throw err;
          }
        }
      }

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
        ui: {
          ...prev.ui,
          showImpactReport: false,
          impactReportType: null,
        },
      }));

      setImpactReport(null);

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
          pendingSave: false,
        },
      }));
    }
  }, [state, mode, scope, projectId, analyzeImpact, setState, onSave, enhancedImpactDto]);

  return {
    impactReport,
    enhancedImpactDto,
    setImpactReport,
    setEnhancedImpactDto,
    analyzeImpact,
    saveWorkflow,
  };
}

interface WorkflowDataLoaderParams {
  mode: 'create' | 'edit';
  workflowId?: number;
  scope: 'tenant' | 'project';
  projectId?: string;
  setState: Dispatch<SetStateAction<WorkflowState>>;
}

function useWorkflowDataLoader({
  mode,
  workflowId,
  scope,
  projectId,
  setState,
}: WorkflowDataLoaderParams) {
  const [availableStatuses, setAvailableStatuses] = useState<StatusViewDto[]>([]);
  const [statusCategories, setStatusCategories] = useState<StatusCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [statusesRes, categoriesRes] = await Promise.all([
        api.get('/statuses'),
        api.get('/statuses/categories'),
      ]);

      setAvailableStatuses(statusesRes.data);
      setStatusCategories(categoriesRes.data);

      if (mode === 'edit' && workflowId) {
        const workflowRes = await api.get(`/workflows/${workflowId}`);
        const workflowView: WorkflowViewDto = workflowRes.data;

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
      }
    } catch (err: any) {
      console.error('Error loading initial data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [mode, workflowId, scope, projectId, setState]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  return {
    availableStatuses,
    statusCategories,
    loading,
    error,
  };
}

interface WorkflowReactFlowSyncParams {
  state: WorkflowState;
  setState: Dispatch<SetStateAction<WorkflowState>>;
  loading: boolean;
  statusCategories: StatusCategory[];
  reactFlowNodes: ReactFlowNode[];
  setReactFlowNodes: Dispatch<SetStateAction<ReactFlowNode[]>>;
  setReactFlowEdges: Dispatch<SetStateAction<ReactFlowEdge[]>>;
  handleCategoryChange: (nodeId: string, newCategory: StatusCategory) => void;
  handleRemoveNode: (nodeId: string) => Promise<void>;
  handleSetInitial: (nodeId: string) => void;
  handleRemoveEdge: (edgeId: string) => Promise<void>;
}

function useWorkflowReactFlowSync({
  state,
  setState,
  loading,
  statusCategories,
  reactFlowNodes,
  setReactFlowNodes,
  setReactFlowEdges,
  handleCategoryChange,
  handleRemoveNode,
  handleSetInitial,
  handleRemoveEdge,
}: WorkflowReactFlowSyncParams) {
  const updateReactFlow = useCallback((nodes: WorkflowNodeData[], edges: WorkflowEdgeData[]) => {
    const reactNodes = nodes.map(node =>
      convertToReactFlowNode(
        node,
        handleCategoryChange,
        handleRemoveNode,
        handleSetInitial,
        statusCategories,
      ),
    );

    const reactEdges = edges.map(edge => convertToReactFlowEdge(edge, handleRemoveEdge));

    setReactFlowNodes(reactNodes);
    setReactFlowEdges(reactEdges);
  }, [handleCategoryChange, handleRemoveEdge, handleRemoveNode, handleSetInitial, setReactFlowEdges, setReactFlowNodes, statusCategories]);

  useEffect(() => {
    if (state.workflow && state.nodes.length > 0 && reactFlowNodes.length === 0 && !loading) {
      updateReactFlow(state.nodes, state.edges);
    }
  }, [state.workflow?.id, state.nodes.length, loading, reactFlowNodes.length, updateReactFlow, state.edges]);

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

  return updateReactFlow;
}
