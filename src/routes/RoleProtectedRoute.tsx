import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface RoleProtectedRouteProps {
  children: ReactNode;
  requiredRoles: Array<{
    name: string;
    scope: string;
    projectId?: number;
  }>;
  fallbackPath?: string;
}

const RoleProtectedRoute = ({ 
  children, 
  requiredRoles, 
  fallbackPath = "/tenant" 
}: RoleProtectedRouteProps) => {
  const auth = useAuth() as any;
  const token = auth?.token;
  const userRoles = auth?.roles || [];

  // Se non è autenticato, reindirizza al login
  if (!token) {
    return <Navigate to="/" />;
  }

  // Verifica se l'utente ha almeno uno dei ruoli richiesti
  const hasRequiredRole = requiredRoles.some(requiredRole => 
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



















