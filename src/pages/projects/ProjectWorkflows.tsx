import { useParams } from "react-router-dom";
import WorkflowsUniversal from "../workflows/WorkflowsUniversal";

export default function ProjectWorkflows() {
  const { projectId } = useParams<{ projectId: string }>();
  
  return (
    <WorkflowsUniversal 
      scope="project" 
      projectId={projectId} 
    />
  );
}



