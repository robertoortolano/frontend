import React from "react";
import { useParams } from "react-router-dom";
import FieldConfigurationEditUniversal from "../fieldconfigurations/FieldConfigurationEditUniversal";

export default function ProjectFieldConfigurationEdit() {
  const { projectId } = useParams<{ projectId: string }>();
  
  return (
    <FieldConfigurationEditUniversal 
      scope="project" 
      projectId={projectId} 
    />
  );
}





















