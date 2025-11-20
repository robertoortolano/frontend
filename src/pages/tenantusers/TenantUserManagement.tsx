import { useState, useEffect } from "react";
import { Search, UserPlus, UserMinus, AlertCircle, Users, Edit } from "lucide-react";
import api from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import EditUserRolesModal from "../../components/EditUserRolesModal";
import ActionsMenu from "../../components/shared/ActionsMenu";

import layout from "../../styles/common/Layout.module.css";
import buttons from "../../styles/common/Buttons.module.css";
import alert from "../../styles/common/Alerts.module.css";
import table from "../../styles/common/Tables.module.css";

interface TenantUser {
  id: number;
  username: string;
  fullName: string | null;
  roles: string[];
  projectAdminOf?: Array<{ id: number; name: string; key: string; }>;
}

interface UserAccessStatus {
  userId: number;
  username: string;
  fullName: string | null;
  hasAccess: boolean;
  roles: string[];
}

const ROLE_BADGE_META: Record<string, { className: string; label: string }> = {
  ADMIN: { className: "bg-red-100 text-red-800", label: "Tenant Admin" },
  USER: { className: "bg-blue-100 text-blue-800", label: "Tenant User" },
};

const getRoleBadgeMeta = (role: string) =>
  ROLE_BADGE_META[role] ?? { className: "bg-gray-100 text-gray-800", label: role };

export default function TenantUserManagement() {
  const auth = useAuth() as any;
  const token = auth?.token;

  const [searchEmail, setSearchEmail] = useState("");
  const [searchResult, setSearchResult] = useState<UserAccessStatus | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("USER");

  const [usersWithAccess, setUsersWithAccess] = useState<TenantUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Modal state
  const [editingUser, setEditingUser] = useState<TenantUser | null>(null);

  useEffect(() => {
    fetchUsersWithAccess();
  }, []);

  const fetchUsersWithAccess = async () => {
    try {
      setLoading(true);
      const response = await api.get("/tenant/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsersWithAccess(response.data);
    } catch (err: any) {
      console.error("Error fetching users:", err);
      setError(err.response?.data?.message || "Errore nel caricamento degli utenti");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchEmail.trim()) {
      setSearchError("Inserisci un'email valida");
      return;
    }

    setSearchError(null);
    setSearchResult(null);
    setSuccessMessage(null);

    try {
      setSearching(true);
      const response = await api.get(`/tenant/users/check`, {
        params: { username: searchEmail },
        headers: { Authorization: `Bearer ${token}` },
      });
      setSearchResult(response.data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setSearchError("Utente non trovato. Verifica che l'email sia registrata nel sistema.");
      } else {
        setSearchError(err.response?.data?.message || "Errore nella ricerca");
      }
    } finally {
      setSearching(false);
    }
  };

  const handleGrantAccess = async () => {
    if (!searchResult) return;

    try {
      await api.post(
        "/tenant/users/assign-role",
        { username: searchResult.username, roleName: selectedRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccessMessage(`Ruolo ${selectedRole} assegnato a ${searchResult.username}`);
      setSearchResult(null);
      setSearchEmail("");
      setSelectedRole("USER");
      await fetchUsersWithAccess();
    } catch (err: any) {
      setSearchError(err.response?.data?.message || "Errore nell'assegnazione del ruolo");
    }
  };

  const handleEditRoles = (user: TenantUser) => {
    setEditingUser(user);
    setError(null);
    setSuccessMessage(null);
  };

  const handleSaveRoles = async (userId: number, selectedRoles: string[]) => {
    try {
      await api.put(
        `/tenant/users/${userId}/roles`,
        { userId, roleNames: selectedRoles },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccessMessage(`Ruoli aggiornati con successo`);
      await fetchUsersWithAccess();
    } catch (err: any) {
      if (err.response?.data?.message?.includes("last ADMIN")) {
        throw new Error("Impossibile rimuovere il ruolo ADMIN dall'ultimo ADMIN della tenant");
      }
      throw err;
    }
  };

  const handleRevokeAccess = async (userId: number, username: string) => {
    if (!window.confirm(`Sei sicuro di voler revocare l'accesso a ${username}?`)) {
      return;
    }

    try {
      await api.delete("/tenant/users/revoke", {
        data: { userId },
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccessMessage(`Accesso revocato per ${username}`);
      await fetchUsersWithAccess();
    } catch (err: any) {
      if (err.response?.data?.message?.includes("last ADMIN")) {
        setError("Impossibile rimuovere l'ultimo ADMIN della tenant");
      } else {
        setError(err.response?.data?.message || "Errore nella revoca dell'accesso");
      }
    }
  };

  const getRoleBadges = (user: TenantUser) => {
    return user.roles.map((role) => {
      const { className, label } = getRoleBadgeMeta(role);
      return (
        <span key={role} className={`px-2 py-1 rounded-full text-xs font-medium ${className}`}>
          {label}
        </span>
      );
    });
  };

  if (loading) {
    return <div className={layout.loading}>Caricamento...</div>;
  }

  return (
    <div className={layout.container} style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header Section */}
      <div className={layout.headerSection}>
        <h1 className={layout.title}>Gestione Utenti Tenant</h1>
        <p className={layout.paragraphMuted}>
          Concedi o revoca l'accesso alla tenant corrente per gli utenti registrati. Solo gli utenti con ruolo ADMIN
          possono gestire gli accessi.
        </p>
      </div>

      {/* Search Section */}
      <div className={layout.section}>
        <h2 className={layout.sectionTitle}>
          <Search size={20} />
          Aggiungi Utente alla Tenant
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Cerca un utente registrato e assegnagli l'accesso alla tenant. Per assegnare ruoli a livello progetto, 
          vai nelle impostazioni del progetto specifico.
        </p>

        <div className="flex gap-3 mb-4">
          <input
            type="email"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            placeholder="email@example.com"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleSearch}
            disabled={searching}
            className={buttons.button}
          >
            {searching ? "Ricerca..." : "Cerca"}
          </button>
        </div>

        {searchError && (
          <div className={`${alert.error} flex items-start gap-2`}>
            <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
            <p>{searchError}</p>
          </div>
        )}

        {searchResult && (
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-semibold text-lg">{searchResult.username}</p>
                {searchResult.fullName && <p className="text-sm text-gray-600">{searchResult.fullName}</p>}
                <div className="mt-2 flex items-center gap-2">
                  {searchResult.hasAccess ? (
                    <>
                      <span className="text-green-600 font-medium">✓ Ha già accesso</span>
                      <div className="flex flex-wrap gap-1">
                        {searchResult.roles.map(role => {
                          const { className, label } = getRoleBadgeMeta(role);
                          return (
                            <span key={role} className={`px-2 py-1 rounded-full text-xs font-medium ${className}`}>
                              {label}
                            </span>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <span className="text-gray-600">Non ha accesso</span>
                  )}
                </div>
              </div>
              {!searchResult.hasAccess && (
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <label htmlFor="role-selector" className="text-sm font-medium text-gray-700 mb-1">Ruolo iniziale:</label>
                      <select
                        id="role-selector"
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="USER">Tenant User</option>
                        <option value="ADMIN">Tenant Admin</option>
                      </select>
                    </div>
                    <button
                      onClick={handleGrantAccess}
                      className={`${buttons.button} self-end`}
                    >
                      <UserPlus size={18} className="mr-2" />
                      Assegna Accesso
                    </button>
                  </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className={alert.successContainer}>
          <p className={alert.success}>{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className={alert.errorContainer}>
          <p className={alert.error}>{error}</p>
        </div>
      )}

      {/* Users List */}
      <div className={layout.section}>
        <h2 className={layout.sectionTitle}>
          <Users size={20} />
          Utenti con Accesso ({usersWithAccess.length})
        </h2>

        {usersWithAccess.length === 0 ? (
          <div className={alert.info}>
            <p>Nessun utente con accesso alla tenant (oltre a te).</p>
          </div>
        ) : (
          <div className={layout.block}>
            <div className="overflow-x-auto">
              <table className={table.table}>
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Nome Completo</th>
                    <th>Ruoli</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {usersWithAccess.map((user) => (
                    <tr key={user.id}>
                      <td>{user.username}</td>
                      <td><span className="text-sm text-gray-600">{user.fullName || "-"}</span></td>
                      <td>
                        <div className="flex flex-wrap gap-1">{getRoleBadges(user)}</div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <ActionsMenu
                          actions={[
                            {
                              label: "Modifica Ruoli",
                              onClick: () => handleEditRoles(user),
                              icon: <Edit size={16} />,
                            },
                            {
                              label: "Revoca",
                              onClick: () => handleRevokeAccess(user.id, user.username),
                              icon: <UserMinus size={16} />,
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

      {/* Edit User Roles Modal */}
      {editingUser && (
        <EditUserRolesModal
          userId={editingUser.id}
          username={editingUser.username}
          currentRoles={editingUser.roles}
          onSave={handleSaveRoles}
          onClose={() => setEditingUser(null)}
        />
      )}
    </div>
  );
}

