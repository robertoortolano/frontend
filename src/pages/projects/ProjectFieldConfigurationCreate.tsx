import React from "react";
import { useParams } from "react-router-dom";
import FieldConfigurationCreateUniversal from "../fieldconfigurations/FieldConfigurationCreateUniversal";

export default function ProjectFieldConfigurationCreate() {
  const { projectId } = useParams<{ projectId: string }>();
  
  return (
    <FieldConfigurationCreateUniversal 
      scope="project" 
      projectId={projectId} 
    />
  );
}














