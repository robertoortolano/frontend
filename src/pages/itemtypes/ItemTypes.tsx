import { useEffect, useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import { ItemTypeDto, ItemTypeDetailDto } from "../../types/itemtype.types";

import layout from "../../styles/common/Layout.module.css";
import buttons from "../../styles/common/Buttons.module.css";
import form from "../../styles/common/Forms.module.css";
import alert from "../../styles/common/Alerts.module.css";
import table from "../../styles/common/Tables.module.css";

export default function ItemTypes() {
  const navigate = useNavigate();
  const auth = useAuth() as any;
  const token = auth?.token;
  const roles = auth?.roles || [];
  const isAuthenticated = auth?.isAuthenticated;

  const [itemTypes, setItemTypes] = useState<ItemTypeDetailDto[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const hasRole = (name: string, scope: string | null = null) => {
    return roles && Array.isArray(roles) && roles.some((r: any) => r.name === name && (scope === null || r.scope === scope));
  };

  const isTenantAdmin = hasRole("ADMIN", "TENANT");
  const isProjectAdmin = hasRole("ADMIN", "PROJECT");

  useEffect(() => {
    if (!token) return;

    const fetchItemTypes = async () => {
      try {
        const response = await api.get("/item-types", {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // Fetch details for each item type
        const itemTypesWithDetails = await Promise.all(
          response.data.map(async (itemType: ItemTypeDto) => {
            try {
              const detailResponse = await api.get(`/item-types/${itemType.id}/details`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              return detailResponse.data;
            } catch (err) {
              // If details fail, return basic item type
              return {
                ...itemType,
                itemTypeConfigurations: []
              };
            }
          })
        );
        
        setItemTypes(itemTypesWithDetails);
      } catch (err: any) {
        console.error("Error loading item types", err);
        setError(err.response?.data?.message || "Error loading item types");
      } finally {
        setLoading(false);
      }
    };

    fetchItemTypes();
  }, [token]);

  if (!isAuthenticated || (!isTenantAdmin && !isProjectAdmin)) {
    return <p className={alert.error}>Accesso negato</p>;
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
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
    } catch (err: any) {
      console.error("Error creating item type", err);
      const backendMessage = err.response?.data?.message;
      setError(backendMessage || "Error creating item type. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (itemTypeId: number) => {
    navigate(`${itemTypeId}`);
  };

  const handleDelete = async (itemTypeId: number) => {
    if (!window.confirm("Sei sicuro di voler eliminare questo Item Type?")) return;

    try {
      await api.delete(`/item-types/${itemTypeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setItemTypes((prev) => prev.filter((item) => item.id !== itemTypeId));
    } catch (err: any) {
      console.error("Errore durante la rimozione", err);
      window.alert(err.response?.data?.message || "Errore durante la rimozione");
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
            <th></th>
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
                    className={buttons.button}
                    onClick={() => handleDelete(item.id)}
                    disabled={item.itemTypeConfigurations && item.itemTypeConfigurations.length > 0}
                    title={
                      item.itemTypeConfigurations && item.itemTypeConfigurations.length > 0
                        ? "Item Type utilizzato in ItemTypeSet: non eliminabile"
                        : "Rimuovi Item Type"
                    }
                    style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
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
    <div className={layout.container} style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header Section */}
      <div className={layout.headerSection}>
        <h1 className={layout.title}>Item Types</h1>
        <p className={layout.paragraphMuted}>
          Gestisci i tipi di item disponibili nel sistema.
        </p>
      </div>

      {error && (
        <div className={alert.errorContainer}>
          <p className={alert.error}>{error}</p>
        </div>
      )}

      {/* Create Form Section */}
      <div className={layout.section}>
        <h2 className={layout.sectionTitle}>Crea Nuovo Item Type</h2>
        <form onSubmit={handleSubmit} className={form.form}>
          <div className={form.formGroup}>
            <label className={form.label} htmlFor="name">
              Nome *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className={form.input}
              disabled={saving}
              placeholder="Inserisci il nome dell'item type"
            />
            <p className={form.helpText}>
              Il nome dell'item type deve essere unico.
            </p>
          </div>

          <div className={layout.buttonRow}>
            <button type="submit" disabled={saving} className={buttons.button}>
              {saving ? "Salvataggio..." : "Crea Item Type"}
            </button>
          </div>
        </form>
      </div>

      {/* List Section */}
      <div className={layout.section}>
        <h2 className={layout.sectionTitle}>Item Types Esistenti</h2>
        {content}
      </div>
    </div>
  );
}

