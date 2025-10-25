import { useState, useEffect, FormEvent } from "react";
import { Users, Plus, Edit, Trash2, X, Save } from "lucide-react";
import groupService from "../../services/groupService";
import { GroupDto, GroupCreateDto } from "../../types/group.types";
import UserAutocomplete, { UserOption } from "../../components/UserAutocomplete";

import layout from "../../styles/common/Layout.module.css";
import buttons from "../../styles/common/Buttons.module.css";
import alert from "../../styles/common/Alerts.module.css";
import form from "../../styles/common/Forms.module.css";
import table from "../../styles/common/Tables.module.css";

export default function Groups() {
  const [groups, setGroups] = useState<GroupDto[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GroupDto | null>(null);

  const [formData, setFormData] = useState<GroupCreateDto>({
    name: "",
    description: "",
    userIds: [],
  });

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const data = await groupService.getAll();
      setGroups(data);
    } catch (err) {
      setError("Errore nel caricamento dei gruppi");
      console.error("Error fetching groups:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      if (editingGroup) {
        await groupService.update(editingGroup.id, formData);
        setSuccess("Gruppo aggiornato con successo");
        resetForm();
        fetchGroups();
      } else {
        await groupService.create(formData);
        setSuccess("Gruppo creato con successo");
        resetForm();
        fetchGroups();
      }
    } catch (err: any) {
      let errorMessage = "Errore durante il salvataggio del gruppo";

      if (err.response?.data) {
        if (typeof err.response.data === "string") {
          errorMessage = err.response.data;
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        }
      }

      setError(errorMessage);
      console.error("Error saving group:", err);
    }
  };

  const handleEdit = (group: GroupDto) => {
    setEditingGroup(group);
    const users = group.users || [];
    setSelectedUsers(users.map(u => ({
      id: u.id,
      username: u.username,
      fullName: u.fullName
    })));
    setFormData({
      name: group.name,
      description: group.description || "",
      userIds: users.map((u) => u.id),
    });
    setShowForm(true);
    setError(null);
    setSuccess(null);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Sei sicuro di voler eliminare questo gruppo?")) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      await groupService.delete(id);
      setSuccess("Gruppo eliminato con successo");
      fetchGroups();
    } catch (err: any) {
      let errorMessage = "Errore durante l'eliminazione del gruppo";

      if (err.response?.data) {
        if (typeof err.response.data === "string") {
          errorMessage = err.response.data;
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        }
      }

      setError(errorMessage);
      console.error("Error deleting group:", err);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      userIds: [],
    });
    setSelectedUsers([]);
    setEditingGroup(null);
    setShowForm(false);
  };

  const handleAddUser = (user: UserOption) => {
    setSelectedUsers(prev => [...prev, user]);
    setFormData(prev => ({
      ...prev,
      userIds: [...prev.userIds, user.id]
    }));
  };

  const handleRemoveUser = (userId: number) => {
    setSelectedUsers(prev => prev.filter(u => u.id !== userId));
    setFormData(prev => ({
      ...prev,
      userIds: prev.userIds.filter(id => id !== userId)
    }));
  };

  if (loading) {
    return <div className={layout.loading}>Caricamento gruppi...</div>;
  }

  return (
    <div className={layout.container} style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header Section */}
      <div className={layout.headerSection}>
        <h1 className={layout.title}>Gestione Gruppi</h1>
        <p className={layout.paragraphMuted}>
          Gestisci i gruppi di utenti e le loro appartenenze.
        </p>
        {!showForm && (
          <div className={layout.buttonRow}>
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
                setError(null);
                setSuccess(null);
              }}
              className={buttons.button}
            >
              <Plus size={20} />
              Nuovo Gruppo
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className={alert.errorContainer}>
          <p className={alert.error}>{error}</p>
        </div>
      )}

      {success && (
        <div className={alert.successContainer}>
          <p className={alert.success}>{success}</p>
        </div>
      )}

      {showForm ? (
        <div className={layout.section}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={layout.sectionTitle}>{editingGroup ? "Modifica Gruppo" : "Nuovo Gruppo"}</h2>
            <button onClick={resetForm} className={buttons.button}>
              <X size={18} />
              Annulla
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className={form.formGroup}>
              <label htmlFor="group-name" className={form.label}>Nome *</label>
              <input
                id="group-name"
                type="text"
                className={form.input}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className={form.formGroup}>
              <label htmlFor="group-description" className={form.label}>Descrizione</label>
              <textarea
                id="group-description"
                className={form.textarea}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <UserAutocomplete
              selectedUsers={selectedUsers}
              onAddUser={handleAddUser}
              onRemoveUser={handleRemoveUser}
              label="Utenti del Gruppo"
              placeholder="Cerca utente per nome o email..."
            />

            <div className={form.formActions}>
              <button type="submit" className={buttons.button}>
                <Save size={18} />
                {editingGroup ? "Aggiorna" : "Crea"} Gruppo
              </button>
              <button type="button" onClick={resetForm} className={buttons.button}>
                <X size={18} />
                Annulla
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className={layout.section}>
          <h2 className={layout.sectionTitle}>Gruppi ({groups.length})</h2>

          {groups.length === 0 ? (
            <div className={alert.info}>
              <p>Nessun gruppo creato. Clicca su &quot;Nuovo Gruppo&quot; per iniziare.</p>
            </div>
          ) : (
            <table className={table.table}>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Descrizione</th>
                  <th>Utenti</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => (
                  <tr key={group.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-blue-600" />
                        <span className="font-medium">{group.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="text-sm text-gray-600">{group.description || "-"}</span>
                    </td>
                    <td>
                      <span className="text-sm text-gray-600">
                        {group.users && group.users.length > 0
                          ? `${group.users.length} utente${group.users.length !== 1 ? "i" : ""}`
                          : "Nessun utente"}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(group)}
                          className={buttons.button}
                          title="Modifica gruppo"
                          style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(group.id)}
                          className={buttons.button}
                          title="Elimina gruppo"
                          style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

