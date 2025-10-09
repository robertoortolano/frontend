import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";

import { useAuth } from "../../context/AuthContext";

import layout from "../../styles/common/Layout.module.css";
import buttons from "../../styles/common/Buttons.module.css";
import form from "../../styles/common/Forms.module.css";
import alert from "../../styles/common/Alerts.module.css";
import table from "../../styles/common/Tables.module.css";

export default function ItemTypes() {
  const navigate = useNavigate();
  const { token, roles = [], isAuthenticated } = useAuth();

  const [itemTypes, setItemTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const hasRole = (name, scope = null) => {
      return roles && Array.isArray(roles) && roles.some(r => r.name === name && (scope === null || r.scope === scope));
  };

  const isTenantAdmin = hasRole("ADMIN", "TENANT");
  const isProjectAdmin = hasRole("ADMIN", "PROJECT");

  // Load item types
  useEffect(() => {
    if (!token) return;

    const fetchItemTypes = async () => {
      try {
        const response = await api.get("/item-types", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setItemTypes(response.data);
      } catch (err) {
        console.error("Error loading item types", err);
        setError(err.response?.data?.message || "Error loading item types");
      } finally {
        setLoading(false);
      }
    };

    fetchItemTypes();
  }, [token]);

  if (!isAuthenticated || (!isTenantAdmin && (!isProjectContext || !isProjectAdmin))) {
      return <p className={alert.error}>Accesso negato</p>;
    }

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const response = await api.post(
        "/item-types",
        { name, description },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setItemTypes((prev) => [...prev, response.data]);
      setName("");
      setDescription("");
    } catch (err) {
      console.error("Error creating item type", err);
      const backendMessage = err.response?.data?.message;
      setError(backendMessage || "Error creating item type. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (itemTypeId) => {
    navigate(`${itemTypeId}`);
  };

  const handleDelete = async (itemTypeId) => {
    if (!window.confirm("Sei sicuro di voler eliminare questo Item Type?")) return;

    try {
      await api.delete(`/item-types/${itemTypeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Aggiorna la lista locale rimuovendo quello eliminato
      setItemTypes((prev) => prev.filter((item) => item.id !== itemTypeId));
    } catch (err) {
      console.error("Errore durante la rimozione", err);
      alert(err.response?.data?.message || "Errore durante la rimozione");
    }
  };


  let content;
  if (loading) {
    content = <p className="list-loading">Loading item types...</p>;
  } else if (itemTypes.length === 0) {
    content = <p className="list-loading">No item types found.</p>;
  } else {
    content = (
      <table className={table.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Edit</th>
            <th></th> {/* nuova colonna */}
          </tr>
        </thead>
        <tbody>
          {itemTypes.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>
                <button
                  className={buttons.button}
                  onClick={() => handleEdit(item.id)}
                  disabled={item.defaultItemType}
                  title={item.defaultItemType ? "ItemType di default non modificabile" : ""}
                >
                  ✎ Edit
                </button>
              </td>
              <td>
                {!item.defaultItemType && (
                  <button
                    className={`${buttons.button} ${buttons.button}`}
                    onClick={() => handleDelete(item.id)}
                    title="Rimuovi Item Type"
                  >
                    Delete
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

    );
  }

  if (!isAuthenticated) {
    return <p className="list-loading">Non sei autenticato.</p>;
  }

  return (
    <div className={layout.container}>
      <h1 className={layout.title}>Item Types</h1>

      <form onSubmit={handleSubmit}>
        <div className={form.formGroup}>
          <label className={form.label} htmlFor="name">Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={form.input}
            disabled={saving}
          />
        </div>

        {error && <p className={alert.error}>{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className={buttons.button}
        >
          {saving ? "Saving..." : "Create Item Type"}
        </button>
      </form>

      {content}
    </div>
  );
}
