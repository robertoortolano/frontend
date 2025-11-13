import { useState, useEffect, useRef } from "react";
import { UserPlus, Trash2, Search, ChevronDown, ChevronUp } from "lucide-react";
import api from "../api/api";

import layout from "../styles/common/Layout.module.css";
import buttons from "../styles/common/Buttons.module.css";
import alert from "../styles/common/Alerts.module.css";
import table from "../styles/common/Tables.module.css";

interface UserOption {
  id: number;
  username: string;
  fullName?: string;
}

interface ProjectMember {
  userId: number;
  username: string;
  fullName: string | null;
  roleName: string;
  isTenantAdmin: boolean;
}

interface ProjectMembersPanelProps {
  projectId: string;
  token: string | null;
  members: ProjectMember[];
  onMembersUpdate: (members: ProjectMember[]) => void;
}

const PROJECT_ROLES = [
  { value: "ADMIN", label: "Admin", description: "Gestione completa del progetto" },
  { value: "USER", label: "User", description: "Accesso standard al progetto" }
];

export default function ProjectMembersPanel({
  projectId,
  token,
  members,
  onMembersUpdate
}: ProjectMembersPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<UserOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("USER");
  const [adding, setAdding] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Chiudi dropdown quando si clicca fuori
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Ricerca utenti con debounce
  useEffect(() => {
    const debounceTimer = setTimeout(async () => {
      if (searchTerm.length >= 2) {
        setIsSearching(true);
        try {
          const response = await api.get(`/users/search`, {
            params: { query: searchTerm },
            headers: { Authorization: `Bearer ${token}` },
          });
          
          // Filtra solo utenti già membri (i TENANT_ADMIN saranno bloccati dal backend)
          const filteredUsers = response.data.filter(
            (user: UserOption) => !members.some((m) => m.userId === user.id)
          );
          
          setSuggestions(filteredUsers);
          setShowSuggestions(true);
        } catch (err) {
          console.error("Error searching users:", err);
          setSuggestions([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, members, token]);

  const fetchMembers = async () => {
    try {
      setError(null);
      const response = await api.get(`/projects/${projectId}/members`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onMembersUpdate(response.data);
    } catch (err: any) {
      console.error("Errore nel caricamento membri:", err);
      setError(err.response?.data?.message || "Errore nel caricamento dei membri del progetto");
    } finally {
      // no state to update
    }
  };

  const handleSelectUser = (user: UserOption) => {
    setSelectedUser(user);
    setSearchTerm("");
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleAddMember = async () => {
    if (!selectedUser) {
      setError("Seleziona un utente");
      return;
    }

    try {
      setAdding(true);
      setError(null);
      setSuccessMessage(null);

      await api.post(
        `/projects/${projectId}/members`,
        { userId: selectedUser.id, roleName: selectedRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccessMessage(`${selectedUser.username} aggiunto come ${selectedRole}`);
      setSelectedUser(null);
      setSelectedRole("USER");
      await fetchMembers();
    } catch (err: any) {
      setError(err.response?.data?.message || "Errore nell'aggiunta del membro");
    } finally {
      setAdding(false);
    }
  };

  const handleChangeRole = async (userId: number, newRole: string) => {
    try {
      setError(null);
      setSuccessMessage(null);

      await api.put(
        `/projects/${projectId}/members/${userId}/role`,
        { roleName: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccessMessage("Ruolo aggiornato con successo");
      await fetchMembers();
    } catch (err: any) {
      setError(err.response?.data?.message || "Errore nell'aggiornamento del ruolo");
    }
  };

  const handleRemoveMember = async (userId: number, username: string) => {
    if (!window.confirm(`Rimuovere ${username} da questo progetto?`)) {
      return;
    }

    try {
      setError(null);
      setSuccessMessage(null);

      await api.delete(`/projects/${projectId}/members/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccessMessage(`${username} rimosso dal progetto`);
      await fetchMembers();
    } catch (err: any) {
      setError(err.response?.data?.message || "Errore nella rimozione del membro");
    }
  };

  const getRoleBadge = (roleName: string) => {
    const role = PROJECT_ROLES.find(r => r.value === roleName);
    const bgColor = roleName === "ADMIN" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800";
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor}`} title={role?.description}>
        {role?.label || roleName}
      </span>
    );
  };

  return (
    <div className="mt-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`${buttons.button} w-full flex items-center justify-between`}
      >
        <span className="flex items-center gap-2">
          <UserPlus size={20} />
          Gestisci Membri
        </span>
        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-6">
          {/* Add Member Section */}
          <div className={`${layout.block}`}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <UserPlus size={20} />
              Aggiungi Membro
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              💡 Gli utenti con ruolo <strong>Tenant Admin</strong> hanno automaticamente accesso come Admin a tutti i progetti e appaiono nella lista membri (ma non possono essere modificati o rimossi da qui).
            </p>

            <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem', alignItems: 'flex-end' }}>
              <div className="flex-1" ref={wrapperRef}>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Cerca Utente {selectedUser && `(Selezionato: ${selectedUser.username})`}
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => searchTerm.length >= 2 && setShowSuggestions(true)}
                    placeholder="Cerca per email o nome..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                </div>

                {/* Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-10 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto" style={{ width: '100%' }}>
                    {suggestions.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleSelectUser(user)}
                        className="w-full px-4 py-2 text-left hover:bg-blue-50 transition-colors border-b last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{user.fullName || user.username}</div>
                        {user.fullName && <div className="text-sm text-gray-500">{user.username}</div>}
                      </button>
                    ))}
                  </div>
                )}

                {/* Selected user badge */}
                {selectedUser && (
                  <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full">
                    <span className="text-sm font-medium text-blue-900">{selectedUser.username}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedUser(null)}
                      className="text-blue-700 hover:text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Ruolo
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={adding}
                >
                  {PROJECT_ROLES.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleAddMember}
                disabled={!selectedUser || adding}
                className={buttons.button}
              >
                {adding ? "Aggiunta..." : "Aggiungi"}
              </button>
            </div>

            {successMessage && (
              <div className={`${alert.success} mb-4`}>
                <p>{successMessage}</p>
              </div>
            )}

            {error && (
              <div className={`${alert.error} mb-4`}>
                <p>{error}</p>
              </div>
            )}
          </div>

          {/* Members List */}
          <div className={layout.block}>
            <h3 className="text-lg font-semibold mb-4">
              Membri Attuali ({members.length})
            </h3>

            {members.length === 0 ? (
              <div className={alert.info}>
                <p>Nessun membro assegnato a questo progetto.</p>
                <p className="mt-2 text-sm">Usa il form sopra per aggiungere membri.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className={table.table}>
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Nome Completo</th>
                      <th>Ruolo Progetto</th>
                      <th>Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => (
                      <tr key={member.userId} className={member.isTenantAdmin ? "bg-gray-50" : ""}>
                        <td>
                          {member.username}
                          {member.isTenantAdmin && (
                            <span className="ml-2 text-xs text-gray-500">(Tenant Admin)</span>
                          )}
                        </td>
                        <td>{member.fullName || <span className="text-gray-400 italic">-</span>}</td>
                        <td>
                          {member.isTenantAdmin ? (
                            // TENANT_ADMIN: ruolo fisso, non modificabile
                            <div>
                              <span className="px-3 py-1.5 text-sm text-gray-700 bg-gray-100 border border-gray-300 rounded-lg inline-block">
                                Admin (fisso)
                              </span>
                              <div className="mt-1">
                                {getRoleBadge(member.roleName)}
                              </div>
                            </div>
                          ) : (
                            // Membri normali: ruolo modificabile
                            <div>
                              <select
                                value={member.roleName}
                                onChange={(e) => handleChangeRole(member.userId, e.target.value)}
                                className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                              >
                                {PROJECT_ROLES.map(role => (
                                  <option key={role.value} value={role.value}>
                                    {role.label}
                                  </option>
                                ))}
                              </select>
                              <div className="mt-1">
                                {getRoleBadge(member.roleName)}
                              </div>
                            </div>
                          )}
                        </td>
                        <td>
                          {member.isTenantAdmin ? (
                            <span className="text-xs text-gray-500 italic">Non rimovibile</span>
                          ) : (
                            <button
                              onClick={() => handleRemoveMember(member.userId, member.username)}
                              className={`${buttons.button} ${buttons.buttonSmall} ${buttons.buttonDanger}`}
                              title="Rimuovi dal progetto"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


