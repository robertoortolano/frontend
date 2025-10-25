import { useEffect, useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import { ItemTypeDto } from "../../types/itemtype.types";
import { FieldSetViewDto } from "../../types/field.types";
import { WorkflowSimpleDto } from "../../types/workflow.types";
import { ItemTypeSetCreateDto, ItemTypeConfigurationDto } from "../../types/itemtypeset.types";

import layout from "../../styles/common/Layout.module.css";
import form from "../../styles/common/Forms.module.css";
import buttons from "../../styles/common/Buttons.module.css";
import alert from "../../styles/common/Alerts.module.css";
import utilities from "../../styles/common/Utilities.module.css";

export default function ItemTypeSetCreate() {
  const navigate = useNavigate();
  const auth = useAuth() as any;
  const token = auth?.token;
  const isAuthenticated = auth?.isAuthenticated;

  const [name, setName] = useState("");
  const [itemTypeConfigurations, setItemTypeConfigurations] = useState<ItemTypeConfigurationDto[]>([]);
  const [itemTypes, setItemTypes] = useState<ItemTypeDto[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedItemTypeId, setSelectedItemTypeId] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [fieldSets, setFieldSets] = useState<FieldSetViewDto[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowSimpleDto[]>([]);
  const [selectedFieldSetId, setSelectedFieldSetId] = useState("");
  const [selectedWorkflowId, setSelectedWorkflowId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        const [itemTypesRes, categoriesRes, fieldSetsRes, workflowsRes] = await Promise.all([
          api.get("/item-types", { headers: { Authorization: `Bearer ${token}` } }),
          api.get("/item-types/categories", { headers: { Authorization: `Bearer ${token}` } }),
          api.get("/field-sets", { headers: { Authorization: `Bearer ${token}` } }),
          api.get("/workflows", { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        setItemTypes(itemTypesRes.data);
        setCategories(categoriesRes.data);
        setFieldSets(fieldSetsRes.data);
        setWorkflows(workflowsRes.data);
      } catch (err: any) {
        console.error("Errore nel caricamento dati", err);
        setError(err.response?.data?.message || "Errore nel caricamento dati");
      }
    };

    fetchData();
  }, [token]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;

  const availableItemTypes = itemTypes.filter(
    (it) => !itemTypeConfigurations.some((entry) => entry.itemTypeId === it.id)
  );

  const handleAddEntry = () => {
    if (!selectedItemTypeId || !selectedCategory || !selectedFieldSetId || !selectedWorkflowId) return;

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

  const handleRemoveEntry = (index: number) => {
    setItemTypeConfigurations((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const dto: ItemTypeSetCreateDto = {
        name,
        itemTypeConfigurations: itemTypeConfigurations.map((conf) => ({
          itemTypeId: conf.itemTypeId,
          category: conf.category,
          fieldSetId: conf.fieldSetId || null,
          workflowId: conf.workflowId || null,
        })),
      };

      const response = await api.post("/item-type-sets", dto, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Crea automaticamente i ruoli per il nuovo ItemTypeSet
      const itemTypeSetId = response.data.id;
      try {
        await api.post(`/itemtypeset-roles/create-for-itemtypeset/${itemTypeSetId}`);
      } catch (roleError) {
        console.warn("Errore nella creazione automatica dei ruoli:", roleError);
      }

      navigate("../item-type-sets");
    } catch (err: any) {
      console.error("Errore durante la creazione", err);
      setError(err.response?.data?.message || "Errore durante la creazione");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate("../item-type-sets");
  };

  return (
    <div className={layout.container} style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Header Section */}
      <div className={layout.headerSection}>
        <h1 className={layout.title}>Crea nuovo Item Type Set</h1>
        <p className={layout.paragraphMuted}>
          Crea un nuovo item type set con le configurazioni necessarie.
        </p>
      </div>

      {error && (
        <div className={alert.errorContainer}>
          <p className={alert.error}>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className={form.form}>
        {/* Basic Information Section */}
        <div className={layout.section}>
          <h2 className={layout.sectionTitle}>Informazioni Base</h2>
        <div className={form.formGroup}>
          <label htmlFor="name" className={form.label}>
            Name
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
              disabled={saving || !selectedItemTypeId || !selectedCategory}
            >
              Add Entry
            </button>
          </div>

          {itemTypeConfigurations.map((entry, index) => {
            const itemType = itemTypes.find((it) => it.id === entry.itemTypeId);
            return (
              <div key={entry.itemTypeId} className={form.inlineGroup}>
                <input
                  type="text"
                  value={itemType?.name || ""}
                  disabled
                  className={form.input}
                  aria-label="Item Type name"
                />
                <input type="text" value={entry.category} disabled className={form.input} aria-label="Category" />
                <input
                  type="text"
                  value={fieldSets.find((fs) => fs.id === entry.fieldSetId)?.name || ""}
                  disabled
                  className={form.input}
                  aria-label="Field Set"
                />

                <input
                  type="text"
                  value={workflows.find((wf) => wf.id === entry.workflowId)?.name || ""}
                  disabled
                  className={form.input}
                  aria-label="Workflow"
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
        </div>

        {/* Action Buttons */}
        <div className={layout.buttonRow}>
          <button type="submit" disabled={saving} className={buttons.button}>
            {saving ? "Salvataggio..." : "Crea Item Type Set"}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className={buttons.button}
            disabled={saving}
          >
            Annulla
          </button>
        </div>
      </form>
    </div>
  );
}

