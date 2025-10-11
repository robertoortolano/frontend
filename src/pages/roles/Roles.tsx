import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import { RoleDto } from "../../types/role.types";
import { ScopeType } from "../../types/common.types";

import layout from "../../styles/common/Layout.module.css";
import buttons from "../../styles/common/Buttons.module.css";
import alert from "../../styles/common/Alerts.module.css";
import table from "../../styles/common/Tables.module.css";

export default function Roles() {
  const navigate = useNavigate();
  const auth = useAuth() as any;
  const token = auth?.token;
  const isAuthenticated = auth?.isAuthenticated;
  const roles = auth?.roles;

  const [rolesList, setRolesList] = useState<RoleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canManageRoles = roles?.some((role: any) => role.name === "ADMIN");

  useEffect(() => {
    console.log("Roles page - isAuthenticated:", isAuthenticated);
    console.log("Roles page - canManageRoles:", canManageRoles);
    console.log("Roles page - roles:", roles);

    if (!isAuthenticated) {
      console.log("User not authenticated, redirecting to login");
      navigate("/");
      return;
    }

    if (!canManageRoles) {
      console.log("User cannot manage roles, redirecting to home");
      navigate("/tenant");
      return;
    }

    fetchRoles();
  }, [isAuthenticated, canManageRoles, navigate, roles]);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await api.get("/roles", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRolesList(response.data);
    } catch (err) {
      setError("Errore nel caricamento dei ruoli");
      console.error("Error fetching roles:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (roleId: number) => {
    if (!window.confirm("Sei sicuro di voler eliminare questo ruolo?")) {
      return;
    }

    try {
      await api.delete(`/roles/${roleId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchRoles();
    } catch (err) {
      setError("Errore nell'eliminazione del ruolo");
      console.error("Error deleting role:", err);
    }
  };

  const getScopeBadge = (scope: ScopeType) => {
    const scopeColors = {
      TENANT: "bg-green-100 text-green-800",
      PROJECT: "bg-purple-100 text-purple-800",
    };
    return scopeColors[scope] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return <div className={layout.loading}>Caricamento ruoli...</div>;
  }

  if (!canManageRoles) {
    return (
      <div className={layout.container}>
        <div className={alert.error}>
          <p>Non hai i permessi per gestire i ruoli.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={layout.container}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className={layout.title}>Gestione Ruoli</h1>
          <p className={layout.paragraphMuted}>
            Gestisci i ruoli personalizzati del tenant. Questi ruoli possono essere associati alle permissions degli
            ItemTypeSet. Le permissions di sistema (Workers, StatusOwner, FieldEditors, Creators, Executors, Editors,
            Viewers) sono predefinite e non modificabili.
          </p>
        </div>
        <button
          className={`${buttons.button} ${buttons.buttonPrimary}`}
          onClick={() => navigate("/tenant/roles/create")}
        >
          <Plus size={20} className="mr-2" />
          Crea Nuovo Ruolo
        </button>
      </div>

      {error && (
        <div className={`${alert.error} mb-4`}>
          <p>{error}</p>
        </div>
      )}

      {rolesList.length === 0 ? (
        <div className={alert.info}>
          <p>Nessun ruolo personalizzato configurato.</p>
          <p className="mt-2">Clicca su &quot;Crea Nuovo Ruolo&quot; per iniziare.</p>
        </div>
      ) : (
        <div className={layout.block}>
          <div className="overflow-x-auto">
            <table className={table.table}>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Descrizione</th>
                  <th>Scope</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {rolesList.map((role) => (
                  <tr key={role.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <Shield size={20} className="text-blue-600" />
                        <div>
                          <p className="font-medium">{role.name}</p>
                          <p className="text-sm text-gray-600">ID: {role.id}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="max-w-xs">
                        <p className="text-sm text-gray-700 truncate" title={role.description}>
                          {role.description || <span className="text-gray-400 italic">Nessuna descrizione</span>}
                        </p>
                      </div>
                    </td>
                    <td>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScopeBadge(role.scope)}`}>
                        {role.scope}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          className={`${buttons.button} ${buttons.buttonSmall} ${buttons.buttonSecondary}`}
                          onClick={() => navigate(`/tenant/roles/edit/${role.id}`)}
                          title="Modifica Ruolo"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className={`${buttons.button} ${buttons.buttonSmall} ${buttons.buttonDanger}`}
                          onClick={() => handleDelete(role.id)}
                          title="Elimina Ruolo"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

