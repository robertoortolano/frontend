interface Project {
  id: number;
  name: string;
  projectKey?: string;
  description?: string;
  itemTypeSetName?: string;
}

interface ItemTypeSet {
  id: number;
  name: string;
}

interface ProjectBadgesProps {
  projects?: Project[];
  usedInItemTypeSets?: ItemTypeSet[];
  className?: string;
}

/**
 * Componente condiviso per mostrare i badge dei progetti e degli ITS.
 * Regole:
 * - Se c'è un progetto (badge verde), deve esserci anche l'ITS (badge blu) sulla stessa riga
 * - Se c'è solo un ITS senza progetti, mostra solo il badge blu
 * - Una riga per ogni coppia distinta ITS/Progetto
 */
export default function ProjectBadges({ projects = [], usedInItemTypeSets = [], className }: ProjectBadgesProps) {
  // Raggruppa i progetti per ITS
  const projectsByITS = new Map<string, Project[]>();
  
  projects.forEach((project) => {
    if (project.itemTypeSetName) {
      const itsName = project.itemTypeSetName;
      if (!projectsByITS.has(itsName)) {
        projectsByITS.set(itsName, []);
      }
      projectsByITS.get(itsName)!.push(project);
    }
  });

  // Trova gli ITS senza progetti
  const itsWithoutProjects = usedInItemTypeSets.filter(
    (its) => !projectsByITS.has(its.name)
  );

  // Se non ci sono né progetti né ITS, non mostrare nulla
  if (projects.length === 0 && usedInItemTypeSets.length === 0) {
    return null;
  }

  return (
    <div 
      style={{ 
        display: "flex", 
        flexDirection: "column", 
        gap: "0.25rem"
      }}
      className={className}
    >
      {/* Mostra una riga per ogni coppia ITS/Progetto */}
      {Array.from(projectsByITS.entries()).map(([itsName, itsProjects]) =>
        itsProjects.map((project) => (
          <div
            key={`${itsName}-${project.id}`}
            style={{
              display: "flex",
              flexDirection: "row",
              gap: "0.25rem",
              alignItems: "center",
            }}
          >
            {/* Badge ITS (blu) - sempre presente se c'è un progetto */}
            <span
              style={{
                fontSize: "0.625rem",
                padding: "0.125rem 0.375rem",
                backgroundColor: "#2563eb",
                color: "white",
                borderRadius: "0.25rem",
                fontWeight: "500",
              }}
            >
              {itsName}
            </span>
            {/* Badge Progetto (verde) */}
            <span
              style={{
                fontSize: "0.625rem",
                padding: "0.125rem 0.375rem",
                backgroundColor: "#059669",
                color: "white",
                borderRadius: "0.25rem",
                fontWeight: "500",
              }}
            >
              {project.name}
            </span>
          </div>
        ))
      )}
      
      {/* Mostra gli ITS senza progetti (solo badge blu) */}
      {itsWithoutProjects.map((its) => (
        <div
          key={its.id}
          style={{
            display: "flex",
            flexDirection: "row",
            gap: "0.25rem",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: "0.625rem",
              padding: "0.125rem 0.375rem",
              backgroundColor: "#2563eb",
              color: "white",
              borderRadius: "0.25rem",
              fontWeight: "500",
            }}
          >
            {its.name}
          </span>
        </div>
      ))}
    </div>
  );
}

