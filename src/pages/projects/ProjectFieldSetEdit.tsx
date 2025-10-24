import React from "react";
import { useParams } from "react-router-dom";
import FieldSetEditUniversal from "../fieldsets/FieldSetEditUniversal";

export default function ProjectFieldSetEdit() {
  const { projectId } = useParams<{ projectId: string }>();
  
  return (
    <FieldSetEditUniversal 
      scope="project" 
      projectId={projectId} 
    />
  );
}
