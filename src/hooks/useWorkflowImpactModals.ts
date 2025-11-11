import { useState, useCallback, useRef, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import api from '../api/api';
import {
  WorkflowState,
  WorkflowNodeData,
  WorkflowEdgeData,
  ImpactReportData,
  RemovalOperation,
  ReactFlowNode,
  ReactFlowEdge
} from '../types/workflow-unified.types';
import { StatusCategory } from '../types/common.types';
import { StatusRemovalImpactDto } from '../types/status-impact.types';
import { TransitionRemovalImpactDto } from '../types/transition-impact.types';
import {
  convertToWorkflowUpdateDto,
  convertToReactFlowEdge,
  convertToReactFlowNode,
  validateNodeData,
} from '../utils/workflow-converters';

interface UseWorkflowImpactModalsParams {
  state: WorkflowState;
  setState: Dispatch<SetStateAction<WorkflowState>>;
  statusCategories: StatusCategory[];
  handleCategoryChange: (nodeId: string, newCategory: StatusCategory) => void;
  handleSetInitial: (nodeId: string) => void;
  setReactFlowNodes: Dispatch<SetStateAction<ReactFlowNode[]>>;
  setReactFlowEdges: Dispatch<SetStateAction<ReactFlowEdge[]>>;
  updateReactFlow: (nodes: WorkflowNodeData[], edges: WorkflowEdgeData[]) => void;
  mode: 'create' | 'edit';
  scope: 'tenant' | 'project';
  projectId?: string;
  saveWorkflowResolverRef: MutableRefObject<{
    resolve: () => void;
    reject: (error: any) => void;
  } | null>;
}

interface UseWorkflowImpactModalsReturn {
  impactReport: ImpactReportData | null;
  enhancedImpactDto: StatusRemovalImpactDto | TransitionRemovalImpactDto | null;
  setImpactReport: Dispatch<SetStateAction<ImpactReportData | null>>;
  setEnhancedImpactDto: Dispatch<SetStateAction<StatusRemovalImpactDto | TransitionRemovalImpactDto | null>>;
  analyzeImpact: (operations: RemovalOperation[], tempState?: WorkflowState) => Promise<ImpactReportData>;
  handleRemoveNode: (nodeId: string) => Promise<void>;
  handleRemoveEdge: (edgeId: string) => Promise<void>;
  confirmRemoval: (operations: RemovalOperation[]) => Promise<void>;
  cancelRemoval: () => void;
  registerSaveWorkflow: (saveWorkflow: (skipImpactAnalysis?: boolean) => Promise<void>) => void;
}

export function useWorkflowImpactModals({
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
}: UseWorkflowImpactModalsParams): UseWorkflowImpactModalsReturn {
  const [impactReport, setImpactReport] = useState<ImpactReportData | null>(null);
  const [enhancedImpactDto, setEnhancedImpactDto] = useState<StatusRemovalImpactDto | TransitionRemovalImpactDto | null>(null);
  const saveWorkflowRef = useRef<((skipImpactAnalysis?: boolean) => Promise<void>) | null>(null);

  const isNodeOperation = (
    operation: RemovalOperation
  ): operation is RemovalOperation & { data: WorkflowNodeData } => operation.type === 'node';

  const isEdgeOperation = (
    operation: RemovalOperation
  ): operation is RemovalOperation & { data: WorkflowEdgeData } => operation.type === 'edge';

  const registerSaveWorkflow = useCallback((saveWorkflow: (skipImpactAnalysis?: boolean) => Promise<void>) => {
    saveWorkflowRef.current = saveWorkflow;
  }, []);

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

      const hasNodeRemovals = operations.some(isNodeOperation);
      const hasEdgeRemovals = operations.some(isEdgeOperation);

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
          .filter(isEdgeOperation)
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
  }, [mode, projectId, scope, setState, state]);

  const handleRemoveEdge = useCallback(async (edgeId: string) => {
    const edge = state.edges.find(e =>
      e.transitionId === Number(edgeId) || e.transitionTempId === edgeId
    );

    if (!edge) {
      console.error('Edge not found:', edgeId);
      return;
    }

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

    setState(prev => ({
      ...prev,
      edges: prev.edges.filter(e => e !== edge),
      pendingChanges: {
        ...prev.pendingChanges,
        removedEdges: [...prev.pendingChanges.removedEdges, edge],
      },
      ui: {
        ...prev.ui,
        showImpactReport: false,
        impactReportType: null,
      },
    }));

    setReactFlowEdges(prev => prev.filter(e => e.id !== edgeId));
    setImpactReport(null);
    setEnhancedImpactDto(null);
  }, [setReactFlowEdges, setState, state.edges]);

  const handleRemoveNode = useCallback(async (nodeId: string) => {
    const targetStatusId = Number(nodeId);
    const node = state.nodes.find(n => n.statusId === targetStatusId);

    if (!node) {
      console.error('Node not found:', nodeId);
      return;
    }

    const validationErrors = validateNodeData(node);
    if (validationErrors.length > 0) {
      console.warn('Node validation errors:', validationErrors);
    }

    const connectedEdges = state.edges.filter(edge =>
      edge.sourceStatusId === targetStatusId || edge.targetStatusId === targetStatusId
    );

    const isInitialNode = node.isInitial;

    let snapshot: WorkflowState | null = null;

    setState(prev => {
      const filteredNodes = prev.nodes.filter(n => n.statusId !== targetStatusId);
      const filteredEdges = prev.edges.filter(edge =>
        edge.sourceStatusId !== targetStatusId && edge.targetStatusId !== targetStatusId
      );

      const normalizedNodes = isInitialNode && filteredNodes.length > 0
        ? filteredNodes.map((n, index) => ({
            ...n,
            isInitial: index === 0,
          }))
        : filteredNodes;

      const newInitialStatusId = isInitialNode
        ? (normalizedNodes[0]?.statusId ?? null)
        : prev.workflow?.initialStatusId ?? null;

      const removedEdges = connectedEdges.filter(edge => !edge.isNew);
      const addedEdgesToKeep = prev.pendingChanges.addedEdges.filter(edge =>
        edge.sourceStatusId !== targetStatusId && edge.targetStatusId !== targetStatusId
      );

      const removedNodes = node.isNew
        ? prev.pendingChanges.removedNodes
        : [...prev.pendingChanges.removedNodes.filter(n => n.statusId !== targetStatusId), node];

      const updatedPendingChanges = {
        ...prev.pendingChanges,
        removedNodes,
        removedEdges: [
          ...prev.pendingChanges.removedEdges.filter(edge =>
            edge.sourceStatusId !== targetStatusId && edge.targetStatusId !== targetStatusId
          ),
          ...removedEdges,
        ],
        addedNodes: prev.pendingChanges.addedNodes.filter(n => n.statusId !== targetStatusId),
        addedEdges: addedEdgesToKeep,
      };

      const nextState: WorkflowState = {
        ...prev,
        nodes: normalizedNodes,
        edges: filteredEdges,
        workflow: prev.workflow ? {
          ...prev.workflow,
          initialStatusId: newInitialStatusId,
        } : null,
        pendingChanges: updatedPendingChanges,
        ui: {
          ...prev.ui,
          showImpactReport: false,
          impactReportType: null,
        },
      };

      snapshot = nextState;
      return nextState;
    });

    setReactFlowNodes(prev => prev.filter(n => n.id !== nodeId));
    setReactFlowEdges(prev => prev.filter(edge =>
      edge.source !== nodeId && edge.target !== nodeId
    ));

    if (node.isNew) {
      return;
    }

    const operations: RemovalOperation[] = [
      {
        type: 'node',
        id: nodeId,
        data: node,
        impactReport: null,
        confirmed: false,
      },
      ...connectedEdges
        .filter(edge => !edge.isNew && edge.transitionId !== null && edge.transitionId !== undefined)
        .map(edge => ({
          type: 'edge' as const,
          id: String(edge.transitionId),
          data: edge,
          impactReport: null,
          confirmed: false,
        })),
    ];

    try {
      await analyzeImpact(operations, snapshot || undefined);
    } catch (err) {
      console.error('Error analyzing impact after node removal:', err);
      throw err;
    }
  }, [analyzeImpact, setReactFlowEdges, setReactFlowNodes, setState, state.edges, state.nodes]);

  const confirmRemoval = useCallback(async (operations: RemovalOperation[]) => {
    try {
      const isPendingSave = state.ui.pendingSave;

      if (isPendingSave) {
        if (saveWorkflowResolverRef.current) {
          const resolver = saveWorkflowResolverRef.current;
          saveWorkflowResolverRef.current = null;

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

          setTimeout(async () => {
            try {
              await saveWorkflowRef.current?.(true);
              resolver.resolve();
            } catch (err: any) {
              resolver.reject(err);
            }
          }, 0);
        } else {
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
            await saveWorkflowRef.current?.(true);
          }, 0);
        }
        return;
      }

      const nodeRemovalOperations = operations.filter(isNodeOperation);
      const edgeRemovalOperations = operations.filter(isEdgeOperation);
      const hasNodeRemovals = nodeRemovalOperations.length > 0;
      const hasEdgeRemovals = edgeRemovalOperations.length > 0;

      setState(prev => ({
        ...prev,
        nodes: prev.nodes.filter(node =>
          !nodeRemovalOperations.some(op => op.data.statusId === node.statusId)
        ),
        edges: prev.edges.filter(edge =>
          !edgeRemovalOperations.some(op => op.data === edge)
        ),
        ui: {
          ...prev.ui,
          showImpactReport: false,
          impactReportType: null,
          pendingSave: false,
        },
        pendingChanges: {
          ...prev.pendingChanges,
          removedNodes: hasNodeRemovals ? prev.pendingChanges.removedNodes : [],
          removedEdges: hasEdgeRemovals ? prev.pendingChanges.removedEdges : [],
        },
      }));

      const remainingNodes = state.nodes.filter(node =>
        !nodeRemovalOperations.some(op => op.data.statusId === node.statusId)
      );
      const remainingEdges = state.edges.filter(edge =>
        !edgeRemovalOperations.some(op => op.data === edge)
      );
      updateReactFlow(remainingNodes, remainingEdges);
    } catch (err: any) {
      console.error('Error confirming removal:', err);
      throw err;
    }
  }, [saveWorkflowResolverRef, setState, state.edges, state.nodes, state.ui.pendingSave, updateReactFlow]);

  const cancelRemoval = useCallback(() => {
    const isPendingSave = state.ui.pendingSave;

    setState(prev => {
      if (isPendingSave) {
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
            pendingSave: false,
          },
        };
      }

      const edgesToRestore = prev.pendingChanges.removedEdges || [];
      const nodesToRestore = prev.pendingChanges.removedNodes || [];

      if (edgesToRestore.length > 0) {
        const reactEdgesToRestore = edgesToRestore.map(edge =>
          convertToReactFlowEdge(edge, (edgeId) => handleRemoveEdge(edgeId))
        );
        setReactFlowEdges(prevEdges => {
          const existingIds = new Set(prevEdges.map(e => e.id));
          const newEdges = reactEdgesToRestore.filter(e => !existingIds.has(e.id));
          return [...prevEdges, ...newEdges];
        });
      }

      if (nodesToRestore.length > 0) {
        const reactNodesToRestore = nodesToRestore.map(node =>
          convertToReactFlowNode(
            node,
            handleCategoryChange,
            (nodeId) => handleRemoveNode(nodeId),
            handleSetInitial,
            statusCategories,
          )
        );
        setReactFlowNodes(prevNodes => {
          const existingIds = new Set(prevNodes.map(n => n.id));
          const newNodes = reactNodesToRestore.filter(n => !existingIds.has(n.id));
          return [...prevNodes, ...newNodes];
        });
      }

      return {
        ...prev,
        edges: [...prev.edges, ...edgesToRestore],
        nodes: [...prev.nodes, ...nodesToRestore],
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
  }, [handleCategoryChange, handleRemoveEdge, handleRemoveNode, handleSetInitial, saveWorkflowResolverRef, setReactFlowEdges, setReactFlowNodes, setState, state.ui.pendingSave, statusCategories]);

  return {
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
  };
}


