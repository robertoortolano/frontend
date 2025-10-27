import board from "../../../styles/common/WorkflowBoard.module.css";
import { WorkflowControlsProps } from "../../../types/reactflow.types";

export default function WorkflowControls({
  workflowName,
  setWorkflowName,
  selectedStatusId,
  setSelectedStatusId,
  availableStatuses,
  nodes,
  statusCategories,
  addState,
}: WorkflowControlsProps) {
  return (
    <div className={board.controls}>
      <input
        type="text"
        placeholder="Nome del workflow"
        className={board.titleInput}
        value={workflowName}
        onChange={(e) => setWorkflowName(e.target.value)}
      />

      <label htmlFor="statusSelect">Stato</label>
      <select
        id="statusSelect"
        value={selectedStatusId}
        onChange={(e) => setSelectedStatusId(e.target.value)}
        className={board.titleInput}
      >
        <option value="">-- Seleziona stato --</option>
        {availableStatuses
          .filter((status) => !nodes.some((n) => n.data.statusId === status.id))
          .map((status) => (
            <option key={status.id} value={status.id}>
              {status.name}
            </option>
          ))}
      </select>

      <button
        onClick={addState}
        className={board.button}
        disabled={!selectedStatusId || statusCategories.length === 0}
      >
        Aggiungi stato
      </button>
    </div>
  );
}

