import React, { useEffect, useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import axios from "axios";

import layout from "../../styles/common/Layout.module.css";
import form from "../../styles/common/Forms.module.css";
import buttons from "../../styles/common/Buttons.module.css";
import alert from "../../styles/common/Alerts.module.css";
import utilities from "../../styles/common/Utilities.module.css";

export default function ItemTypeSetEdit() {
  const { itemTypeSetId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const token = location.state?.token || localStorage.getItem("token");

  const [name, setName] = useState("");
  const [entries, setEntries] = useState([]);
  const [itemTypes, setItemTypes] = useState([]); // ✅ mancava
  const [categories, setCategories] = useState([]);
  const [selectedItemTypeId, setSelectedItemTypeId] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };

        const itemTypeSetRes = await axios.get(`http://localhost:8080/api/item-type-sets/${itemTypeSetId}`, { headers });
        const itemTypeSet = itemTypeSetRes.data;

        setName(itemTypeSet.name);
        setEntries(itemTypeSet.entries);

        const [itemTypesRes, categoriesRes] = await Promise.all([
          axios.get("http://localhost:8080/api/item-types", { headers }),
          axios.get("http://localhost:8080/api/item-types/categories", { headers })
        ]);

        setItemTypes(itemTypesRes.data);
        setCategories(categoriesRes.data);
      } catch (err) {
        console.error("Errore nel caricamento dati", err);
        setError(err.response?.data?.message || "Errore nel caricamento dati");
      } finally {
        setLoading(false);
      }
    };

    if (token && itemTypeSetId) fetchData();
  }, [token, itemTypeSetId]);

  const availableItemTypes = itemTypes.filter((it) => {
    return !entries.some((entry) => {
      const entryId = entry.itemTypeId ?? entry.itemTypeSetEntryRequestDto?.itemTypeId;
      return entryId === it.id;
    });
  });

  const handleAddEntry = () => {
    if (!selectedItemTypeId || !selectedCategory) return;

    setEntries([
      ...entries,
      { itemTypeId: parseInt(selectedItemTypeId, 10), category: selectedCategory },
    ]);
    setSelectedItemTypeId("");
    setSelectedCategory("");
  };

  const handleRemoveEntry = (index) => {
    setEntries(entries.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await axios.put(
        `http://localhost:8080/api/item-type-sets/${itemTypeSetId}`,
        { name, entries },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate(-1);
    } catch (err) {
      console.error("Errore durante il salvataggio", err);
      setError(err.response?.data?.message || "Errore durante il salvataggio");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(-1, { state: { token } });
  };

  if (loading) return <p className={layout.loading}>Loading...</p>;

  return (
    <div className={layout.container}>
      <h1 className={layout.title}>Modifica Item Type Set</h1>

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

        <fieldset className={form.formGroup}>
          <legend className={form.label}>Entries</legend>

          <div className={`${form.inlineGroup} ${utilities.mb4}`}>
            <select
              value={selectedItemTypeId}
              onChange={(e) => setSelectedItemTypeId(e.target.value)}
              className={form.select}
              disabled={saving}
            >
              <option value="">-- Seleziona un item type --</option>
              {availableItemTypes.map((it) => (
                <option key={it.id} value={it.id}>
                  {it.name}
                </option>
              ))}
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={form.select}
              disabled={saving || categories.length === 0}
            >
              <option value="">-- Seleziona una categoria --</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleAddEntry}
              className={buttons.button}
              disabled={saving || !selectedItemTypeId || !selectedCategory}
            >
              Add Entry
            </button>
          </div>

          {entries.map((entry, index) => {
            const itemTypeId = entry.itemTypeId ?? entry.itemTypeSetEntryRequestDto?.itemTypeId;
            const category = entry.category ?? entry.itemTypeSetEntryRequestDto?.category;
            const itemType = itemTypes.find((it) => it.id === itemTypeId);

            return (
              <div key={itemTypeId} className={form.inlineGroup}>
                <input
                  type="text"
                  value={itemType?.name || entry.itemTypeName || ""}
                  disabled
                  className={form.input}
                />
                <input
                  type="text"
                  value={category || ""}
                  disabled
                  className={form.input}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveEntry(index)}
                  className={buttons.button}
                  disabled={saving}
                >
                  Remove
                </button>
              </div>
            );
          })}
        </fieldset>

        {error && <p className={alert.error}>{error}</p>}

        <div className={form.buttonGroup}>
          <button type="submit" disabled={saving} className={buttons.button}>
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className={`${buttons.button} ${buttons.secondary}`}
            disabled={saving}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
