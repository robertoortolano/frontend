import { useParams } from "react-router-dom";
import { Wrench } from "lucide-react";
import FieldConfigurationsUniversal from "../fieldconfigurations/FieldConfigurationsUniversal";
import layout from "../../styles/common/Layout.module.css";

export default function ProjectFieldConfigurations() {
  const { projectId } = useParams<{ projectId: string }>();
  
  return <FieldConfigurationsUniversal scope="project" projectId={projectId} />;
}
