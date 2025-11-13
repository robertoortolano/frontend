import { useParams } from "react-router-dom";
import FieldConfigurationsUniversal from "../fieldconfigurations/FieldConfigurationsUniversal";

export default function ProjectFieldConfigurations() {
  const { projectId } = useParams<{ projectId: string }>();
  
  return <FieldConfigurationsUniversal scope="project" projectId={projectId} />;
}
