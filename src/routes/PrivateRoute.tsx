import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface PrivateRouteProps {
  children: ReactNode;
}

const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const auth = useAuth() as any;
  const token = auth?.token;

  return token ? <>{children}</> : <Navigate to="/" />;
};

export default PrivateRoute;

