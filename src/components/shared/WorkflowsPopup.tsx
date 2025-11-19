import { WorkflowSimpleDto } from "../../types/workflow.types";
import CardListModal, { CardListModalItem } from "./CardListModal";
import ProjectBadges from "./ProjectBadges";

interface WorkflowsPopupProps {
  workflows?: WorkflowSimpleDto[];
}

export default function WorkflowsPopup({ workflows = [] }: WorkflowsPopupProps) {
  const renderWorkflow = (workflow: WorkflowSimpleDto & CardListModalItem) => {
    const projects = workflow.projects || [];
    
    return (
      <div
        key={workflow.id}
        style={{
          padding: "0.75rem",
          borderBottom: "1px solid #e5e7eb",
          backgroundColor: "#f9fafb",
          borderRadius: "0.375rem",
          marginBottom: "0.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
          <strong style={{ color: "#1e3a8a", fontSize: "0.875rem" }}>
            {workflow.name}
          </strong>
          {workflow.defaultWorkflow && (
            <span
              style={{
                fontSize: "0.625rem",
                padding: "0.125rem 0.375rem",
                backgroundColor: "#dbeafe",
                color: "#1e40af",
                borderRadius: "0.25rem",
                fontWeight: "500",
              }}
            >
              Default
            </span>
          )}
          <ProjectBadges projects={projects} />
        </div>
      </div>
    );
  };

  return (
    <CardListModal<WorkflowSimpleDto & CardListModalItem>
      triggerLabel={`${workflows.length} workflow${workflows.length !== 1 ? 's' : ''}`}
      triggerDisabled={workflows.length === 0}
      triggerTitle={
        workflows.length === 0
          ? "Nessun workflow"
          : "Visualizza dettagli workflow"
      }
      title="Workflow associati"
      items={workflows as (WorkflowSimpleDto & CardListModalItem)[]}
      summary={{
        label: "Totale workflow",
        value: workflows.length,
      }}
      renderCard={renderWorkflow}
    />
  );
}
