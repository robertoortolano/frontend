import { useEffect, useState, FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

interface ItemTypeSetCreateUniversalProps {
  scope: 'tenant' | 'project';
  projectId?: string;
}

export default function ItemTypeSetCreateUniversal({ scope, projectId: projectIdProp }: ItemTypeSetCreateUniversalProps) {
  const { projectId: projectIdFromParams } = useParams<{ projectId?: string }>();
  const projectId = projectIdProp || projectIdFromParams;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // ItemType sono sempre globali
        // FieldSet e Workflow devono essere filtrati per progetto quando scope='project'
        const [itemTypesRes, categoriesRes, fieldSetsRes, workflowsRes] = await Promise.all([
          api.get("/item-types", { headers: { Authorization: `Bearer ${token}` } }),
          api.get("/item-types/categories", { headers: { Authorization: `Bearer ${token}` } }),
          api.get(scope === 'project' && projectId 
            ? `/field-sets/project/${projectId}` 
            : "/field-sets", { 
            headers: { Authorization: `Bearer ${token}` } 
          }),
          api.get(scope === 'project' && projectId 
            ? `/workflows/project/${projectId}` 
            : "/workflows", { 
            headers: { Authorization: `Bearer ${token}` } 
          }),
        ]);

        setItemTypes(itemTypesRes.data);
        setCategories(categoriesRes.data);
        setFieldSets(fieldSetsRes.data);
        setWorkflows(workflowsRes.data);
      } catch (err: any) {
        console.error("Errore nel caricamento dati", err);
        setError(err.response?.data?.message || "Errore nel caricamento dati");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, scope, projectId]);

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

    // Validazione: verifica che esistano tutti gli elementi necessari
    if (itemTypeConfigurations.length === 0) {
      setError("Aggiungi almeno una configurazione");
      setSaving(false);
      return;
    }

    // Verifica che per ogni configurazione esista almeno un FieldSet e un Workflow
    const missingElements: string[] = [];
    itemTypeConfigurations.forEach((conf, index) => {
      if (!fieldSets.find(fs => fs.id === conf.fieldSetId)) {
        missingElements.push(`Configurazione ${index + 1}: Field Set non valido`);
      }
      if (!workflows.find(wf => wf.id === conf.workflowId)) {
        missingElements.push(`Configurazione ${index + 1}: Workflow non valido`);
      }
    });

    if (missingElements.length > 0) {
      setError("Alcuni elementi selezionati non sono più disponibili. " + missingElements.join("; "));
      setSaving(false);
      return;
    }

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

      const endpoint = scope === 'project' && projectId 
        ? `/item-type-sets/project/${projectId}` 
        : "/item-type-sets";

      const response = await api.post(endpoint, dto, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Crea automaticamente le permissions per il nuovo ItemTypeSet
      const itemTypeSetId = response.data.id;
      try {
        await api.post(`/itemtypeset-permissions/create-for-itemtypeset/${itemTypeSetId}`);
      } catch (roleError) {
        console.warn("Errore nella creazione automatica delle permissions:", roleError);
      }

      if (scope === 'tenant') {
        navigate("/tenant/item-type-sets");
      } else if (scope === 'project' && projectId) {
        navigate(`/projects/${projectId}/item-type-sets`);
      }
    } catch (err: any) {
      console.error("Errore durante la creazione", err);
      setError(err.response?.data?.message || "Errore durante la creazione");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (scope === 'tenant') {
      navigate("/tenant/item-type-sets");
    } else if (scope === 'project' && projectId) {
      navigate(`/projects/${projectId}/item-type-sets`);
    }
  };

  if (loading) {
    return <p className={layout.loading}>Caricamento dati...</p>;
  }

  return (
    <div className={layout.container} style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Header Section */}
      <div className={layout.headerSection}>
        <h1 className={layout.title}>
          {scope === 'tenant' ? "Crea nuovo Item Type Set" : "Crea nuovo Item Type Set di Progetto"}
        </h1>
        <p className={layout.paragraphMuted}>
          {scope === 'tenant' 
            ? "Crea un nuovo item type set con le configurazioni necessarie."
            : "Crea un nuovo item type set specifico per questo progetto. Gli ItemType sono sempre globali, mentre FieldSet e Workflow sono del progetto."}
        </p>
      </div>

      {error && (
        <div className={alert.errorContainer}>
          <p className={alert.error}>{error}</p>
        </div>
      )}

      {scope === 'project' && (fieldSets.length === 0 || workflows.length === 0) && (
        <div className={alert.errorContainer}>
          <p className={alert.error}>
            {fieldSets.length === 0 && workflows.length === 0 
              ? "Devi creare almeno un Field Set e un Workflow del progetto prima di poter creare un Item Type Set."
              : fieldSets.length === 0
              ? "Devi creare almeno un Field Set del progetto prima di poter creare un Item Type Set."
              : "Devi creare almeno un Workflow del progetto prima di poter creare un Item Type Set."}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className={form.form}>
        {/* Basic Information Section */}
        <div className={layout.section}>
          <h2 className={layout.sectionTitle}>Informazioni Base</h2>
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

          <fieldset className={form.formGroup}>
            <legend className={form.label}>ItemTypeConfigurations</legend>

            {/* Form per aggiungere nuove configurazioni */}
            <div className={utilities.mb4} style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '1rem',
              padding: '1rem',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              backgroundColor: '#f9fafb'
            }}>
              <div className={form.formGroup}>
                <label className={form.label} style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                  Item Type {scope === 'project' && "(sempre globale)"}
                </label>
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
              </div>

              <div className={form.formGroup}>
                <label className={form.label} style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                  Categoria
                </label>
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
              </div>

              <div className={form.formGroup}>
                <label className={form.label} style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                  Field Set {scope === 'project' && "(del progetto)"}
                </label>
                <select
                  value={selectedFieldSetId}
                  onChange={(e) => setSelectedFieldSetId(e.target.value)}
                  className={form.select}
                  disabled={saving || fieldSets.length === 0}
                >
                  <option value="">-- Seleziona un field set --</option>
                  {fieldSets.map((fs) => (
                    <option key={fs.id} value={fs.id}>
                      {fs.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={form.formGroup}>
                <label className={form.label} style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                  Workflow {scope === 'project' && "(del progetto)"}
                </label>
                <select
                  value={selectedWorkflowId}
                  onChange={(e) => setSelectedWorkflowId(e.target.value)}
                  className={form.select}
                  disabled={saving || workflows.length === 0}
                >
                  <option value="">-- Seleziona un workflow --</option>
                  {workflows.map((wf) => (
                    <option key={wf.id} value={wf.id}>
                      {wf.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={form.formGroup} style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={handleAddEntry}
                  className={buttons.button}
                  disabled={saving || !selectedItemTypeId || !selectedCategory || !selectedFieldSetId || !selectedWorkflowId}
                  style={{ padding: '0.5rem 1rem' }}
                >
                  Aggiungi Configurazione
                </button>
              </div>
            </div>

            {/* Tabella delle configurazioni esistenti */}
            {itemTypeConfigurations.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                  Configurazioni Aggiunte
                </h3>
                <div style={{ 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '0.5rem', 
                  overflow: 'hidden',
                  backgroundColor: 'white'
                }}>
                  {/* Header della tabella */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr 1fr 1fr auto', 
                    gap: '1rem',
                    padding: '0.75rem',
                    backgroundColor: '#f3f4f6',
                    borderBottom: '1px solid #e5e7eb',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    color: '#374151'
                  }}>
                    <div>Item Type</div>
                    <div>Categoria</div>
                    <div>Field Set</div>
                    <div>Workflow</div>
                    <div style={{ textAlign: 'center' }}>Azioni</div>
                  </div>

                  {/* Righe delle configurazioni */}
                  {itemTypeConfigurations.map((entry, index) => {
                    const itemType = itemTypes.find((it) => it.id === entry.itemTypeId);
                    return (
                      <div key={`${entry.itemTypeId}-${index}`} style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '1fr 1fr 1fr 1fr auto', 
                        gap: '1rem',
                        padding: '0.75rem',
                        borderBottom: index < itemTypeConfigurations.length - 1 ? '1px solid #f3f4f6' : 'none',
                        alignItems: 'center'
                      }}>
                        <div style={{ fontSize: '0.875rem', color: '#374151' }}>
                          {itemType?.name || "N/A"}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#374151' }}>
                          {entry.category}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#374151' }}>
                          {fieldSets.find((fs) => fs.id === entry.fieldSetId)?.name || "N/A"}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#374151' }}>
                          {workflows.find((wf) => wf.id === entry.workflowId)?.name || "N/A"}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveEntry(index)}
                            className={buttons.button}
                            disabled={saving}
                            style={{ 
                              padding: '0.25rem 0.5rem', 
                              fontSize: '0.75rem',
                              backgroundColor: '#dc2626',
                              color: 'white'
                            }}
                            title="Rimuovi configurazione"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </fieldset>
        </div>

        {/* Action Buttons */}
        <div className={layout.buttonRow}>
          <button 
            type="submit" 
            disabled={saving || itemTypeConfigurations.length === 0 || (scope === 'project' && (fieldSets.length === 0 || workflows.length === 0))} 
            className={buttons.button}
          >
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

