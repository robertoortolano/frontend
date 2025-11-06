/**
 * Workflow Data Conversion Utilities
 * 
 * These utilities handle conversion between old and new data formats
 * during the refactoring process
 */

import { 
  WorkflowNodeData, 
  WorkflowEdgeData, 
  ReactFlowNode, 
  ReactFlowEdge,
  WorkflowState 
} from '../types/workflow-unified.types';
import { 
  WorkflowViewDto, 
  TransitionViewDto
} from '../types/workflow.types';
import { StatusCategory } from '../types/common.types';
import { getCategoryColor } from '../pages/workflows/components/workflowUtils';

/**
 * Convert WorkflowViewDto to WorkflowNodeData[]
 */
export function convertToUnifiedNodes(
  workflowView: WorkflowViewDto,
  statusCategories: StatusCategory[]
): WorkflowNodeData[] {
  if (!workflowView.workflowNodes || !workflowView.statuses) {
    return [];
  }

  return workflowView.workflowNodes.map(nodeDto => {
    // Find corresponding WorkflowStatus
    const workflowStatus = workflowView.statuses?.find(
      ws => ws.status.id === nodeDto.statusId
    );

    if (!workflowStatus) {
      // Return a minimal node data - this should not happen in normal operation
      return {
        nodeId: nodeDto.id,
        statusId: nodeDto.statusId,
        positionX: nodeDto.positionX,
        positionY: nodeDto.positionY,
        workflowStatusId: 0, // This will cause issues - should be handled
        workflowId: workflowView.id,
        workflowName: workflowView.name,
        statusName: `Unknown Status ${nodeDto.statusId}`,
        statusCategory: statusCategories[0] || 'BACKLOG',
        isInitial: false,
        isNew: nodeDto.id === null,
        isExisting: false, // This node has issues
      };
    }

    return {
      nodeId: nodeDto.id,
      statusId: nodeDto.statusId,
      positionX: nodeDto.positionX,
      positionY: nodeDto.positionY,
      workflowStatusId: workflowStatus.id,
      workflowId: workflowStatus.workflowId,
      workflowName: workflowStatus.workflowName,
      statusName: workflowStatus.status.name,
      statusCategory: workflowStatus.statusCategory as StatusCategory,
      isInitial: workflowStatus.initial,
      isNew: nodeDto.id === null,
      isExisting: true,
    };
  });
}

/**
 * Convert WorkflowViewDto to WorkflowEdgeData[]
 */
export function convertToUnifiedEdges(
  workflowView: WorkflowViewDto,
  nodes: WorkflowNodeData[]
): WorkflowEdgeData[] {
  if (!workflowView.workflowEdges || !workflowView.transitions) {
    return [];
  }

  // Create lookup maps
  const nodeMap = new Map<number, WorkflowNodeData>();
  nodes.forEach(node => {
    nodeMap.set(node.statusId, node);
  });

  const transitionMap = new Map<number, TransitionViewDto>();
  workflowView.transitions.forEach(transition => {
    transitionMap.set(transition.id, transition);
  });

  return workflowView.workflowEdges.map(edgeDto => {
    const transition = edgeDto.transitionId ? transitionMap.get(edgeDto.transitionId) : null;
    
    return {
      edgeId: edgeDto.id,
      transitionId: edgeDto.transitionId,
      transitionTempId: edgeDto.transitionTempId || null,
      sourceStatusId: edgeDto.sourceId,
      targetStatusId: edgeDto.targetId,
      sourcePosition: edgeDto.sourcePosition,
      targetPosition: edgeDto.targetPosition,
      transitionName: transition?.name || '',
      isNew: edgeDto.id === null,
      isTransitionNew: edgeDto.transitionId === null,
    };
  });
}

/**
 * Convert WorkflowNodeData to ReactFlowNode
 */
export function convertToReactFlowNode(
  nodeData: WorkflowNodeData,
  onCategoryChange: (nodeId: string, newCategory: StatusCategory) => void,
  onRemove: (nodeId: string) => void,
  onSetInitial: (nodeId: string) => void,
  categories: StatusCategory[]
): ReactFlowNode {
  return {
    id: String(nodeData.statusId),
    type: 'customNode',
    position: {
      x: nodeData.positionX,
      y: nodeData.positionY,
    },
    data: {
      ...nodeData,
      label: nodeData.statusName, // IMPORTANT: This is displayed in the node
      category: nodeData.statusCategory, // Map statusCategory to category
      onCategoryChange: (newCategory: StatusCategory) => 
        onCategoryChange(String(nodeData.statusId), newCategory),
      onRemove: () => onRemove(String(nodeData.statusId)),
      onSetInitial: () => onSetInitial(String(nodeData.statusId)),
      categories,
    },
    style: {
      background: getCategoryColor(nodeData.statusCategory),
      borderRadius: 8,
      opacity: 0.9,
    },
  };
}

/**
 * Convert WorkflowEdgeData to ReactFlowEdge
 */
export function convertToReactFlowEdge(
  edgeData: WorkflowEdgeData,
  onDelete: (edgeId: string) => void
): ReactFlowEdge {
  return {
    id: edgeData.transitionId ? String(edgeData.transitionId) : 
        edgeData.transitionTempId || `edge-${edgeData.sourceStatusId}-${edgeData.targetStatusId}`,
    type: 'selectableEdge', // Add the type for SelectableEdge component
    source: String(edgeData.sourceStatusId),
    target: String(edgeData.targetStatusId),
    sourceHandle: edgeData.sourcePosition || undefined,
    targetHandle: edgeData.targetPosition || undefined,
    updatable: true, // Enable edge updates (moving between handles - both source and target)
    data: {
      ...edgeData,
      label: edgeData.transitionName || '', // Add label for display
      onDelete: () => onDelete(String(edgeData.transitionId || edgeData.transitionTempId)),
    },
    style: {
      stroke: '#2196f3',
      strokeWidth: 2,
    },
    markerEnd: {
      type: 'arrowclosed',
      color: '#2196f3',
    },
  };
}

/**
 * Convert WorkflowState back to WorkflowUpdateDto format
 */
export function convertToWorkflowUpdateDto(
  state: WorkflowState,
  mode: 'create' | 'edit'
): any {
  if (!state.workflow) {
    throw new Error('Workflow data is required');
  }

  // Convert nodes to WorkflowNodeDto format
  const workflowNodes = state.nodes.map(node => ({
    id: node.nodeId,
    statusId: node.statusId,
    positionX: node.positionX,
    positionY: node.positionY,
  }));

  // Convert edges to WorkflowEdgeDto format
  const workflowEdges = state.edges.map(edge => ({
    id: edge.edgeId,
    transitionId: edge.transitionId,
    transitionTempId: edge.transitionTempId,
    sourceId: edge.sourceStatusId,
    targetId: edge.targetStatusId,
    sourcePosition: edge.sourcePosition,
    targetPosition: edge.targetPosition,
  }));

  // Convert to transitions format
  const transitions = state.edges.map(edge => ({
    id: edge.transitionId,
    tempId: edge.transitionTempId,
    name: edge.transitionName,
    fromStatusId: edge.sourceStatusId,
    toStatusId: edge.targetStatusId,
  }));

  // Convert to workflowStatuses format
  const workflowStatuses = state.nodes.map(node => ({
    id: node.workflowStatusId,
    statusId: node.statusId,
    isInitial: node.isInitial,
    statusCategory: node.statusCategory,
    outgoingTransitions: state.edges
      .filter(edge => edge.sourceStatusId === node.statusId)
      .map(edge => ({
        id: edge.transitionId,
        tempId: edge.transitionTempId,
        name: edge.transitionName,
        fromStatusId: edge.sourceStatusId,
        toStatusId: edge.targetStatusId,
      })),
  }));

  // Find the initial status ID from the nodes
  const initialStatus = state.nodes.find(node => node.isInitial);
  const computedInitialStatusId = initialStatus?.statusId ?? state.workflow.initialStatusId;

  if (mode === 'create') {
    return {
      name: state.workflow.name,
      initialStatusId: computedInitialStatusId,
      workflowStatuses,
      workflowNodes,
      transitions,
      workflowEdges,
    };
  } else {
    return {
      id: state.workflow.id,
      name: state.workflow.name,
      initialStatusId: computedInitialStatusId,
      workflowStatuses,
      workflowNodes,
      transitions,
      workflowEdges,
    };
  }
}


/**
 * Validate WorkflowNodeData
 */
export function validateNodeData(nodeData: WorkflowNodeData): string[] {
  const errors: string[] = [];

  if (!nodeData.statusId) {
    errors.push('statusId is required');
  }

  if (!nodeData.workflowStatusId && !nodeData.isNew) {
    errors.push('workflowStatusId is required for existing nodes');
  }

  if (!nodeData.statusName) {
    errors.push('statusName is required');
  }

  if (!nodeData.statusCategory) {
    errors.push('statusCategory is required');
  }

  if (typeof nodeData.positionX !== 'number' || typeof nodeData.positionY !== 'number') {
    errors.push('positionX and positionY must be numbers');
  }

  return errors;
}

/**
 * Validate WorkflowEdgeData
 */
export function validateEdgeData(edgeData: WorkflowEdgeData): string[] {
  const errors: string[] = [];

  if (!edgeData.sourceStatusId || !edgeData.targetStatusId) {
    errors.push('sourceStatusId and targetStatusId are required');
  }

  if (edgeData.sourceStatusId === edgeData.targetStatusId) {
    errors.push('source and target cannot be the same');
  }

  if (!edgeData.transitionName && !edgeData.isTransitionNew) {
    errors.push('transitionName is required for existing transitions');
  }

  return errors;
}

