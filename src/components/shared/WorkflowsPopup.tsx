import { WorkflowSimpleDto } from "../../types/workflow.types";
import CardListModal, { CardListModalItem } from "./CardListModal";
import ProjectBadges from "./ProjectBadges";
import CardItemWrapper from "./CardItemWrapper";
import DefaultBadge from "./DefaultBadge";
import { formatCountLabel } from "../../utils/formatUtils";

interface WorkflowsPopupProps {
  workflows?: WorkflowSimpleDto[];
}

export default function WorkflowsPopup({ workflows = [] }: WorkflowsPopupProps) {
  const renderWorkflow = (workflow: WorkflowSimpleDto & CardListModalItem) => {
    const projects = workflow.projects || [];
    const badges = [];
    
    if (workflow.defaultWorkflow) {
      badges.push(<DefaultBadge key="default" />);
    }
    badges.push(<ProjectBadges key="projects" projects={projects} />);
    
    return (
      <CardItemWrapper
        key={workflow.id}
        title={workflow.name}
        badges={badges}
      />
    );
  };

  return (
    <CardListModal<WorkflowSimpleDto & CardListModalItem>
      triggerLabel={formatCountLabel(workflows.length, 'workflow')}
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
