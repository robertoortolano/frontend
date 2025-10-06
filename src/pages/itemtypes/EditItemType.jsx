import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/api";

import { useAuth } from "../../context/AuthContext";

import layout from "../../styles/common/Layout.module.css";
import buttons from "../../styles/common/Buttons.module.css";
import form from "../../styles/common/Forms.module.css";
import alert from "../../styles/common/Alerts.module.css";

export default function EditItemType() {
  const { itemTypeId } = useParams();
  const navigate = useNavigate();
  const { token, roles, isAuthenticated } = useAuth();

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const hasRole = (name, scope = null) => {
      return roles.some(r => r.name === name && (scope === null || r.scope === scope));
  };

  const isTenantAdmin = hasRole("ADMIN", "TENANT");
  const isProjectAdmin = hasRole("ADMIN", "PROJECT");

  useEffect(() => {
    const fetchItemType = async () => {
      try {
        const response = await api.get(`/item-types/${itemTypeId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { name } = response.data;
        setName(name);
      } catch (err) {
        console.error("Errore durante il caricamento dell'item type", err);
        setError(err.response?.data?.message || "Errore durante il caricamento dell'item type");
      } finally {
        setLoading(false);
      }
    };

    if (token && itemTypeId) {
      fetchItemType();
    }
  }, [itemTypeId, token]);

  if (!isAuthenticated || (!isTenantAdmin && (!isProjectContext || !isProjectAdmin))) {
        return <p className={alert.error}>Accesso negato</p>;
      }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await api.put(
        `/item-types/${itemTypeId}`,
        { name },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      navigate("../item-types");
    } catch (err) {
      console.error("Errore durante il salvataggio", err);
      setError(err.response?.data?.message || "Errore durante il salvataggio.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate("../item-types");
  };

  if (!isAuthenticated) return <p>Non sei autenticato.</p>;
  if (loading) return <p>Loading...</p>;

  return (
    <div className={layout.container}>
      <h1 className={layout.title}>Modifica Item Type</h1>

      <form onSubmit={handleSubmit} className="mb-8">
        <div className={form.formGroup}>
          <label htmlFor="name" className={form.label}>Name</label>
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

        <div className={form.buttonGroup}>
          <button
            type="submit"
            disabled={saving}
            className={`${buttons.button} ${buttons.buttonSmall}`}
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            className={`${buttons.button} ${buttons.buttonSmall}`}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
