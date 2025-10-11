import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const auth = useAuth() as any;
  const isAuthenticated = auth?.isAuthenticated;
  const logout = auth?.logout;
  const tenantId = auth?.tenantId;
  const roles = auth?.roles;
  const navigate = useNavigate();

  const canManageRoles = roles?.some((role: any) => role.name === "ADMIN");

  console.log("User roles:", roles);
  console.log("Can manage roles:", canManageRoles);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="bg-blue-600 text-white px-4 py-3 shadow-md flex justify-between items-center">
      <div className="font-bold text-xl">MyApp</div>

      <div className="flex items-center gap-4">
        {isAuthenticated && (
          <>
            <Link to="/tenant" className="hover:underline">
              Home
            </Link>
            <Link to="/projects" className="hover:underline">
              Progetti
            </Link>
            <Link to="/tenant/roles" className="hover:underline">
              Gestione Ruoli
            </Link>
            <Link to="/tenant/groups" className="hover:underline">
              Gestione Gruppi
            </Link>
            {canManageRoles && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">ADMIN</span>}
            {tenantId && <span className="text-sm bg-white text-blue-600 px-2 py-1 rounded">Tenant: {tenantId}</span>}
            <button onClick={handleLogout} className="hover:underline">
              Logout
            </button>
          </>
        )}

        {!isAuthenticated && (
          <Link to="/" className="hover:underline">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}

