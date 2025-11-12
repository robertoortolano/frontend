/**
 * useWorkflowEditor Hook
 * 
 * Centralized state management and business logic for workflow editing
 * Replaces the complex state management in WorkflowEdit.tsx
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNodesState, useEdgesState } from 'reactflow';
import type { Node, Edge } from 'reactflow';
import {
  WorkflowState,
  UseWorkflowEditorReturn,
  ReactFlowNode,
  ReactFlowEdge,
  WorkflowReactFlowNodeData,
  WorkflowReactFlowEdgeData,
} from '../types/workflow-unified.types';
import { useWorkflowDataLoader } from './useWorkflowDataLoader';
import { useWorkflowReactFlowCallbacks } from './useWorkflowReactFlowCallbacks';
import { useWorkflowImpactModals } from './useWorkflowImpactModals';
import { useWorkflowSaveManager } from './useWorkflowSaveManager';

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

  // React Flow state
  const [reactFlowNodes, setReactFlowNodes, onNodesChange] = useNodesState<Node<WorkflowReactFlowNodeData>>([]);
  const [reactFlowEdges, setReactFlowEdges, onEdgesChange] = useEdgesState<Edge<WorkflowReactFlowEdgeData>>([]);

  const {
    handleCategoryChange,
    handleSetInitial,
    addNode,
    addEdge,
    handleUpdateEdgeConnection,
    handleUpdateEdge,
    handleUpdateNode,
    updateReactFlow,
    registerRemovalHandlers,
  } = useWorkflowReactFlowCallbacks({
    state,
    setState,
    availableStatuses,
    statusCategories,
    reactFlowNodes,
    setReactFlowNodes,
    setReactFlowEdges,
    loading,
  });

  const {
    impactReport,
    enhancedImpactDto,
    setImpactReport,
    setEnhancedImpactDto,
    analyzeImpact,
    handleRemoveNode,
    handleRemoveEdge,
    confirmRemoval,
    cancelRemoval,
    registerSaveWorkflow,
  } = useWorkflowImpactModals({
    state,
    setState,
    statusCategories,
    handleCategoryChange,
    handleSetInitial,
    setReactFlowNodes,
    setReactFlowEdges,
    updateReactFlow,
    mode,
    scope,
    projectId,
    saveWorkflowResolverRef,
  });

  const { saveWorkflow } = useWorkflowSaveManager({
    state,
    setState,
    mode,
    scope,
    projectId,
    onSave,
    analyzeImpact,
    setImpactReport,
    setEnhancedImpactDto,
    enhancedImpactDto,
    saveWorkflowResolverRef,
  });

  useEffect(() => {
    registerRemovalHandlers({
      removeNode: handleRemoveNode,
      removeEdge: handleRemoveEdge,
    });
  }, [handleRemoveEdge, handleRemoveNode, registerRemovalHandlers]);

  useEffect(() => {
    registerSaveWorkflow(saveWorkflow);
  }, [registerSaveWorkflow, saveWorkflow]);

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
  
  const cancelChanges = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

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