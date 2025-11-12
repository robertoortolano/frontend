import { useCallback, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import api from '../api/api';
import {
  WorkflowState,
  ImpactReportData,
  RemovalOperation,
} from '../types/workflow-unified.types';
import { convertToWorkflowUpdateDto } from '../utils/workflow-converters';
import { StatusRemovalImpactDto } from '../types/status-impact.types';
import { TransitionRemovalImpactDto } from '../types/transition-impact.types';

interface UseWorkflowSaveManagerParams {
  state: WorkflowState;
  setState: Dispatch<SetStateAction<WorkflowState>>;
  mode: 'create' | 'edit';
  scope: 'tenant' | 'project';
  projectId?: string;
  onSave?: (workflow: WorkflowState['workflow']) => void;
  analyzeImpact: (operations: RemovalOperation[], tempState?: WorkflowState) => Promise<ImpactReportData>;
  setImpactReport: Dispatch<SetStateAction<ImpactReportData | null>>;
  setEnhancedImpactDto: Dispatch<SetStateAction<StatusRemovalImpactDto | TransitionRemovalImpactDto | null>>;
  enhancedImpactDto: StatusRemovalImpactDto | TransitionRemovalImpactDto | null;
  saveWorkflowResolverRef: MutableRefObject<{
    resolve: () => void;
    reject: (error: any) => void;
  } | null>;
}

interface UseWorkflowSaveManagerReturn {
  saveWorkflow: (skipImpactAnalysis?: boolean) => Promise<void>;
}

export function useWorkflowSaveManager({
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
}: UseWorkflowSaveManagerParams): UseWorkflowSaveManagerReturn {
  const saveWorkflow = useCallback(async (skipImpactAnalysis: boolean = false) => {
    if (!state.workflow) {
      throw new Error('No workflow data to save');
    }

    const hasRemovedTransitions = state.pendingChanges.removedEdges.length > 0;
    const hasRemovedStatuses = state.pendingChanges.removedNodes.length > 0;

    const workflowIdForEndpoint = state.workflow?.id || 0;
    // Gli endpoint di analisi impatto funzionano per entrambi i workflow globali e di progetto
    // Il controllo viene fatto tramite workflowId e tenant, non tramite il path
    const baseEndpoint = `/workflows/${workflowIdForEndpoint}`;

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

      let combinedDto: StatusRemovalImpactDto | TransitionRemovalImpactDto | null = null;
      if (statusDto) {
        combinedDto = statusDto;
      } else if (transitionDto) {
        combinedDto = transitionDto;
      }

      if (combinedDto) {
        setEnhancedImpactDto(combinedDto);
      }

      // Calcola hasRoleAssignments controllando sia combinedImpact che i DTO direttamente
      // Questo è necessario per workflow globali che potrebbero non avere ItemTypeSet associati
      // ma hanno comunque assegnazioni definite
      const hasRoleAssignmentsFromImpact = combinedImpact?.permissions?.some(perm =>
        perm.items?.some(item => item.hasAssignments)
      ) || combinedImpact?.totals?.totalRoleAssignments > 0;
      
      const hasRoleAssignmentsFromDto = (combinedDto?.totalRoleAssignments || 0) > 0 ||
        (statusDto && (
          (statusDto.statusOwnerPermissions || []).some((p: any) => p.hasAssignments) ||
          (statusDto.executorPermissions || []).some((p: any) => p.hasAssignments) ||
          (statusDto.fieldStatusPermissions || []).some((p: any) => p.hasAssignments)
        )) ||
        (transitionDto && (
          (transitionDto.executorPermissions || []).some((p: any) => p.hasAssignments)
        ));
      
      const hasRoleAssignments = hasRoleAssignmentsFromImpact || hasRoleAssignmentsFromDto;
      const shouldShowReport = hasRoleAssignments && (combinedImpact || combinedDto);

      if (shouldShowReport) {
        // Se combinedImpact è null ma combinedDto ha assegnazioni, costruisci un impactReport minimo
        const impactReportToShow = combinedImpact || (combinedDto ? {
          type: statusDto ? 'status' as const : 'transition' as const,
          workflowId: combinedDto.workflowId,
          workflowName: combinedDto.workflowName,
          removedItems: {
            ids: statusDto ? statusDto.removedStatusIds || [] : [],
            names: statusDto ? statusDto.removedStatusNames || [] : [],
          },
          affectedItemTypeSets: (combinedDto.affectedItemTypeSets || []).map((its: any) => ({
            id: its.itemTypeSetId || its.id,
            name: its.itemTypeSetName || its.name,
            projectName: its.projectName || null,
          })),
          permissions: [],
          totals: {
            affectedItemTypeSets: combinedDto.totalAffectedItemTypeSets || 0,
            totalPermissions: (statusDto ? statusDto.totalStatusOwnerPermissions || 0 : 0) + 
                             (statusDto ? statusDto.totalExecutorPermissions || 0 : 0) + 
                             (statusDto ? statusDto.totalFieldStatusPermissions || 0 : 0) +
                             (transitionDto ? transitionDto.totalExecutorPermissions || 0 : 0),
            totalRoleAssignments: combinedDto.totalRoleAssignments || 0,
          },
        } : null);
        
        setImpactReport(impactReportToShow);
        setState(prev => ({
          ...prev,
          ui: {
            ...prev.ui,
            showImpactReport: true,
            impactReportType: impactReportToShow?.type || (statusDto ? 'status' : 'transition'),
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
        // Per create/update workflow, usiamo il path specifico per progetto se necessario
        const updateBaseEndpoint = scope === 'project' && projectId
          ? `/workflows/project/${projectId}/${state.workflow.id}`
          : `/workflows/${state.workflow.id}`;
        
        // Gli endpoint di conferma rimozione funzionano per entrambi i workflow globali e di progetto
        // Il controllo viene fatto tramite workflowId e tenant, non tramite il path
          const confirmBaseEndpoint = `/workflows/${state.workflow.id}`;
          
          try {
            if (hasRemovedStatuses && hasRemovedTransitions) {
              response = await api.post(`${confirmBaseEndpoint}/confirm-status-removal`, dto);
            } else if (hasRemovedStatuses) {
              response = await api.post(`${confirmBaseEndpoint}/confirm-status-removal`, dto);
            } else if (hasRemovedTransitions) {
              response = await api.post(`${confirmBaseEndpoint}/confirm-transition-removal`, dto);
            } else {
              response = await api.put(updateBaseEndpoint, dto);
            }
        } catch (err: any) {
          if (err.response?.data?.message?.includes('TRANSITION_REMOVAL_IMPACT')) {
            response = await api.post(`${confirmBaseEndpoint}/confirm-transition-removal`, dto);
          } else if (err.response?.data?.message?.includes('STATUS_REMOVAL_IMPACT')) {
            response = await api.post(`${confirmBaseEndpoint}/confirm-status-removal`, dto);
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
  }, [analyzeImpact, enhancedImpactDto, mode, onSave, projectId, scope, setEnhancedImpactDto, setImpactReport, setState, state, saveWorkflowResolverRef]);

  return {
    saveWorkflow,
  };
}



