import { ReactNode, useMemo } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface RoleProtectedRouteProps {
  children: ReactNode;
  requiredRoles: Array<{
    name: string;
    scope: string;
    projectId?: number;
  }>;
  fallbackPath?: string;
  projectParam?: string;
}

const RoleProtectedRoute = ({ 
  children, 
  requiredRoles, 
  fallbackPath = "/tenant",
  projectParam
}: RoleProtectedRouteProps) => {
  const auth = useAuth() as any;
  const token = auth?.token;
  const userRoles = auth?.roles || [];
  const params = useParams();

  const effectiveRequiredRoles = useMemo(() => {
    if (!projectParam) {
      return requiredRoles;
    }

    const paramValue = params[projectParam];
    if (!paramValue) {
      return requiredRoles;
    }

    const projectId = Number(paramValue);
    if (Number.isNaN(projectId)) {
      return requiredRoles;
    }

    return requiredRoles.map((role) => {
      if (role.scope === "PROJECT" && role.projectId == null) {
        return { ...role, projectId };
      }
      return role;
    });
  }, [requiredRoles, params, projectParam]);

  // Se non è autenticato, reindirizza al login
  if (!token) {
    return <Navigate to="/" />;
  }

  // Verifica se l'utente ha almeno uno dei ruoli richiesti
  const hasRequiredRole = effectiveRequiredRoles.some(requiredRole => 
    userRoles.some((userRole: any) => {
      const nameMatch = userRole.name === requiredRole.name;
      const scopeMatch = userRole.scope === requiredRole.scope;
      const projectMatch = !requiredRole.projectId || userRole.projectId === requiredRole.projectId;
      
      return nameMatch && scopeMatch && projectMatch;
    })
  );

  if (!hasRequiredRole) {
    return <Navigate to={fallbackPath} />;
  }

  return <>{children}</>;
};

export default RoleProtectedRoute;

























