import { useState, useEffect, useCallback, type Dispatch, type SetStateAction } from 'react';
import api from '../api/api';
import { WorkflowViewDto, StatusViewDto } from '../types/workflow.types';
import { StatusCategory } from '../types/common.types';
import { convertToUnifiedNodes, convertToUnifiedEdges } from '../utils/workflow-converters';
import { WorkflowState } from '../types/workflow-unified.types';

interface WorkflowDataLoaderParams {
  mode: 'create' | 'edit';
  workflowId?: number;
  scope: 'tenant' | 'project';
  projectId?: string;
  setState: Dispatch<SetStateAction<WorkflowState>>;
}

interface UseWorkflowDataLoaderReturn {
  availableStatuses: StatusViewDto[];
  statusCategories: StatusCategory[];
  loading: boolean;
  error: string | null;
}

export function useWorkflowDataLoader({
  mode,
  workflowId,
  scope,
  projectId,
  setState,
}: WorkflowDataLoaderParams): UseWorkflowDataLoaderReturn {
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
        const baseEndpoint = scope === 'project' && projectId
          ? `/workflows/project/${projectId}/${workflowId}`
          : `/workflows/${workflowId}`;
        const workflowRes = await api.get(baseEndpoint);
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













