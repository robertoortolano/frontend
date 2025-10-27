/**
 * WorkflowEditorControls Component
 * 
 * Extracted from WorkflowEdit.tsx to reduce complexity
 * Handles all workflow control operations
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UseWorkflowEditorReturn } from '../../types/workflow-unified.types';
import { StatusViewDto } from '../../types/workflow.types';
import { StatusCategory } from '../../types/common.types';
import form from '../../../styles/common/Forms.module.css';
import buttons from '../../../styles/common/Buttons.module.css';
import alert from '../../../styles/common/Alerts.module.css';

interface WorkflowEditorControlsProps {
  mode: 'create' | 'edit';
  workflowEditor: UseWorkflowEditorReturn;
  availableStatuses: StatusViewDto[];
  statusCategories: StatusCategory[];
  onAddNode: (statusId: number, position: { x: number; y: number }) => void;
}

export const WorkflowEditorControls: React.FC<WorkflowEditorControlsProps> = ({
  mode,
  workflowEditor,
  availableStatuses,
  statusCategories,
  onAddNode,
}) => {
  const navigate = useNavigate();
  const { state, actions } = workflowEditor;

  // Filter out statuses that are already in the workflow
  const alreadyAddedStatusIds = new Set(state.nodes.map(n => n.statusId));
  const availableStatusesToAdd = availableStatuses.filter(
    status => !alreadyAddedStatusIds.has(status.id)
  );

  const handleSave = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    // Validate workflow name (same as Statuses pattern)
    if (!state.workflow?.name || state.workflow.name.trim() === '') {
      return; // HTML5 validation will show the error message
    }

    // Validate that workflow has at least one status
    if (state.nodes.length === 0) {
      console.error('Cannot save workflow without statuses');
      // TODO: Show error message to user
      return;
    }

    try {
      await actions.saveWorkflow();
      navigate('/tenant/workflows');
    } catch (err: any) {
      console.error('Error saving workflow:', err);
      // TODO: Show error message to user
    }
  };

  const handleCancel = () => {
    actions.cancelChanges();
    navigate('/tenant/workflows');
  };

  const handleAddNode = (statusId: number) => {
    // Add node at center of canvas
    onAddNode(statusId, { x: 300, y: 200 });
  };

  return (
    <form onSubmit={handleSave} className={form.form} style={{ padding: '1rem' }}>
      {/* Workflow Name */}
      <div className={form.formGroup}>
        <label htmlFor="workflow-name" className={form.label}>
          Nome Workflow *
        </label>
        <input
          id="workflow-name"
          type="text"
          value={state.workflow?.name || ''}
          onChange={(e) => {
            actions.updateWorkflowName(e.target.value);
          }}
          placeholder="Inserisci nome workflow"
          disabled={workflowEditor.loading}
          required
          className={form.input}
        />
      </div>

      {/* Add Status Dropdown */}
      <div className={form.formGroup}>
        <label htmlFor="add-status" className={form.label}>
          Aggiungi Stato
        </label>
        <select
          id="add-status"
          onChange={(e) => {
            const statusId = Number(e.target.value);
            if (statusId) {
              handleAddNode(statusId);
              e.target.value = ''; // Reset selection
            }
          }}
          disabled={workflowEditor.loading || availableStatusesToAdd.length === 0}
          className={form.input}
        >
          <option value="">
            {availableStatusesToAdd.length === 0 
              ? 'Tutti gli stati sono stati aggiunti' 
              : 'Seleziona stato da aggiungere'}
          </option>
          {availableStatusesToAdd.map((status) => (
            <option key={status.id} value={status.id}>
              {status.name}
            </option>
          ))}
        </select>
      </div>

      {/* Action Buttons */}
      <div className={form.formGroup}>
        <div className={form.buttonGroup}>
          <button
            type="submit"
            disabled={workflowEditor.loading || state.ui.saving || state.nodes.length === 0}
            className={`${buttons.button} ${buttons.buttonPrimary}`}
            title={state.nodes.length === 0 ? 'Aggiungi almeno uno stato al workflow' : ''}
          >
            {state.ui.saving ? 'Salvataggio...' : 'Salva'}
          </button>
          
          <button
            type="button"
            onClick={handleCancel}
            disabled={workflowEditor.loading || state.ui.saving}
            className={`${buttons.button} ${buttons.buttonSecondary}`}
          >
            Annulla
          </button>
        </div>
      </div>

      {/* Status Info */}
      {state.workflow && (
        <div className={form.formGroup}>
          <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem' }}>
              <strong>Workflow:</strong> {state.workflow.name}
            </p>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem' }}>
              <strong>Stati:</strong> {state.nodes.length}
            </p>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem' }}>
              <strong>Transizioni:</strong> {state.edges.length}
            </p>
            {state.workflow.initialStatusId && (
              <p style={{ margin: 0, fontSize: '0.875rem' }}>
                <strong>Stato Iniziale:</strong> {
                  state.nodes.find(n => n.statusId === state.workflow?.initialStatusId)?.statusName || 'Non definito'
                }
              </p>
            )}
          </div>
        </div>
      )}

      {/* Error Display */}
      {workflowEditor.error && (
        <div className={alert.errorContainer}>
          <p className={alert.error}>
            <strong>Errore:</strong> {workflowEditor.error}
          </p>
        </div>
      )}
    </form>
  );
};
