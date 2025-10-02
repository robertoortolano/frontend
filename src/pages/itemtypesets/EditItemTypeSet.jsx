import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/api";

import { useAuth } from "../../context/AuthContext";

import layout from "../../styles/common/Layout.module.css";
import buttons from "../../styles/common/Buttons.module.css";
import form from "../../styles/common/Forms.module.css";
import alert from "../../styles/common/Alerts.module.css";
import utilities from "../../styles/common/Utilities.module.css";

export default function EditItemTypeSet() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [itemTypeConfigurations, setItemTypeConfigurations] = useState([]);
  const [itemTypes, setItemTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [fieldSets, setFieldSets] = useState([]);
  const [workflows, setWorkflows] = useState([]);

  const [selectedItemTypeId, setSelectedItemTypeId] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedFieldSetId, setSelectedFieldSetId] = useState("");
  const [selectedWorkflowId, setSelectedWorkflowId] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [setRes, typesRes, categoriesRes, fieldSetsRes, workflowsRes] =
          await Promise.all([
            api.get(`/item-type-sets/${id}`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
            api.get("/item-types", {
              headers: { Authorization: `Bearer ${token}` },
            }),
            api.get("/item-types/categories", {
              headers: { Authorization: `Bearer ${token}` },
            }),
            api.get("/field-sets", {
              headers: { Authorization: `Bearer ${token}` },
            }),
            api.get("/workflows", {
              headers: { Authorization: `Bearer ${token}` },
            }),
          ]);

        const setData = setRes.data;

        setName(setData.name || "");
        setDescription(setData.description || "");
        setItemTypeConfigurations(
          (setData.itemTypeConfigurations || []).map((conf) => ({
            id: conf.id,
            itemTypeId: conf.itemType.id,
            category: conf.category,
            fieldSetId: conf.fieldSet?.id,
            workflowId: conf.workflow?.id,
          }))
        );

        setItemTypes(typesRes.data);
        setCategories(categoriesRes.data);
        setFieldSets(fieldSetsRes.data);
        setWorkflows(workflowsRes.data);
      } catch (e) {
        setError(e.response?.data?.message || "Errore nel caricamento");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, token]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;

  const availableItemTypes = itemTypes.filter(
    (it) => !itemTypeConfigurations.some((entry) => entry.itemTypeId === it.id)
  );

  const updateEntry = (index, updatedFields) => {
    setItemTypeConfigurations((prev) =>
      prev.map((entry, i) =>
        i === index ? { ...entry, ...updatedFields } : entry
      )
    );
  };


  const handleAddEntry = () => {
    if (
      !selectedItemTypeId ||
      !selectedCategory ||
      !selectedFieldSetId ||
      !selectedWorkflowId
    )
      return;

    setItemTypeConfigurations([
      ...itemTypeConfigurations,
      {
        itemTypeId: Number.parseInt(selectedItemTypeId, 10),
        category: selectedCategory,
        fieldSetId: Number.parseInt(selectedFieldSetId, 10),
        workflowId: Number.parseInt(selectedWorkflowId, 10),
      },
    ]);
    setSelectedItemTypeId("");
    setSelectedCategory("");
    setSelectedFieldSetId("");
    setSelectedWorkflowId("");
  };

  const handleRemoveEntry = (index) => {
    setItemTypeConfigurations((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await api.put(
        `/item-type-sets/${id}`,
        { name, description, itemTypeConfigurations },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      navigate("/tenant/item-type-sets");
    } catch (err) {
      console.error("Errore durante l'aggiornamento", err);
      setError(err.response?.data?.message || "Errore durante l'aggiornamento");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate("/tenant/item-type-sets");
  };

  if (loading) {
    return <p className={layout.loading}>Caricamento...</p>;
  }

  return (
    <div className={layout.container}>
      <h1 className={layout.title}>Modifica Item Type Set</h1>

      <form onSubmit={handleSubmit} className="mb-8">
        <div className={form.formGroup}>
          <label htmlFor="name" className={form.label}>
            Nome
          </label>
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

        <div className={form.formGroup}>
          <label htmlFor="description" className={form.label}>
            Descrizione
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={form.textarea}
            disabled={saving}
          />
        </div>

        <fieldset className={form.formGroup}>
          <legend className={form.label}>ItemTypeConfigurations</legend>

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

            <select
              value={selectedFieldSetId}
              onChange={(e) => setSelectedFieldSetId(e.target.value)}
              className={form.select}
              disabled={saving}
            >
              <option value="">-- Seleziona un field set --</option>
              {fieldSets.map((fs) => (
                <option key={fs.id} value={fs.id}>
                  {fs.name}
                </option>
              ))}
            </select>

            <select
              value={selectedWorkflowId}
              onChange={(e) => setSelectedWorkflowId(e.target.value)}
              className={form.select}
              disabled={saving}
            >
              <option value="">-- Seleziona un workflow --</option>
              {workflows.map((wf) => (
                <option key={wf.id} value={wf.id}>
                  {wf.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleAddEntry}
              className={buttons.button}
              disabled={
                saving ||
                !selectedItemTypeId ||
                !selectedCategory ||
                !selectedFieldSetId ||
                !selectedWorkflowId
              }
            >
              Add Entry
            </button>
          </div>

          {itemTypeConfigurations.map((entry, index) => {
            const itemType = itemTypes.find((it) => it.id === entry.itemTypeId);

            return (
              <div key={entry.id || `new-${index}`} className={form.inlineGroup}>
                {/* ItemType non modificabile */}
                <input
                  type="text"
                  value={itemType?.name || ""}
                  disabled
                  className={form.input}
                  aria-label="Item Type"
                />

                {/* Categoria modificabile */}
                <select
                  value={entry.category}
                  onChange={(e) => updateEntry(index, { category: e.target.value })}
                  className={form.select}
                  disabled={saving}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                {/* FieldSet modificabile */}
                <select
                  value={entry.fieldSetId || ""}
                  onChange={(e) =>
                    updateEntry(index, { fieldSetId: Number.parseInt(e.target.value, 10) })
                  }
                  className={form.select}
                  disabled={saving}
                >
                  <option value="">-- Seleziona un field set --</option>
                  {fieldSets.map((fs) => (
                    <option key={fs.id} value={fs.id}>
                      {fs.name}
                    </option>
                  ))}
                </select>

                {/* Workflow modificabile */}
                <select
                  value={entry.workflowId || ""}
                  onChange={(e) =>
                    updateEntry(index, { workflowId: Number.parseInt(e.target.value, 10) })
                  }
                  className={form.select}
                  disabled={saving}
                >
                  <option value="">-- Seleziona un workflow --</option>
                  {workflows.map((wf) => (
                    <option key={wf.id} value={wf.id}>
                      {wf.name}
                    </option>
                  ))}
                </select>

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
