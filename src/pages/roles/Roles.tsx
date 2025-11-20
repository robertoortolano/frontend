import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import { RoleDto } from "../../types/role.types";
import ActionsMenu from "../../components/shared/ActionsMenu";

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
    if (!isAuthenticated) {
      navigate("/");
      return;
    }

    if (!canManageRoles) {
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

  // Scope badge rimosso - i Role custom sono sempre a livello TENANT

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
    <div className={layout.container} style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header Section */}
      <div className={layout.headerSection}>
        <h1 className={layout.title}>Gestione Ruoli</h1>
        <p className={layout.paragraphMuted}>
          Gestisci i ruoli personalizzati del tenant. Questi ruoli possono essere associati alle permissions degli
          ItemTypeSet. Le permissions di sistema (WORKERS, STATUS_OWNERS, FIELD_OWNERS, CREATORS, EXECUTORS, FIELD_EDITORS,
          FIELD_VIEWERS) sono predefinite e non modificabili.
        </p>
        <div className={layout.buttonRow}>
          <button
            className={buttons.button}
            onClick={() => navigate("/tenant/roles/create")}
          >
            <Plus size={20} className="mr-2" />
            Crea Nuovo Ruolo
          </button>
        </div>
      </div>

      {error && (
        <div className={alert.errorContainer}>
          <p className={alert.error}>{error}</p>
        </div>
      )}

      {/* Content Section */}
      <div className={layout.section}>
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
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rolesList.map((role) => (
                  <tr key={role.id}>
                    <td>
                      <div className="flex items-center">
                        <Shield size={16} className="text-blue-600" />
                        <span className="font-medium" style={{ marginLeft: '20px' }}>{role.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="text-sm text-gray-600">{role.description || "-"}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <ActionsMenu
                        actions={[
                          {
                            label: "Modifica",
                            onClick: () => navigate(`/tenant/roles/edit/${role.id}`),
                            icon: <Edit size={16} />,
                          },
                          {
                            label: "Elimina",
                            onClick: () => handleDelete(role.id),
                            icon: <Trash2 size={16} />,
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        )}
      </div>
    </div>
  );
}

