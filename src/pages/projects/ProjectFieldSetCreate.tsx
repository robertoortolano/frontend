import React from "react";
import { useParams } from "react-router-dom";
import FieldSetCreateUniversal from "../fieldsets/FieldSetCreateUniversal";

export default function ProjectFieldSetCreate() {
  const { projectId } = useParams<{ projectId: string }>();
  
  return (
    <FieldSetCreateUniversal 
      scope="project" 
      projectId={projectId} 
    />
  );
}




















