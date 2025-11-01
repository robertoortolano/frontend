import { useParams } from "react-router-dom";
import FieldSetsUniversal from "../fieldsets/FieldSetsUniversal";

export default function ProjectFieldSets() {
  const { projectId } = useParams<{ projectId: string }>();
  
  return (
    <FieldSetsUniversal 
      scope="project" 
      projectId={projectId} 
    />
  );
}

















