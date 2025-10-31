import { useEffect, useState, FormEvent, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import { ItemTypeDto } from "../../types/itemtype.types";
import { FieldSetViewDto } from "../../types/field.types";
import { WorkflowSimpleDto } from "../../types/workflow.types";
import { ItemTypeConfigurationDto, ItemTypeSetUpdateDto } from "../../types/itemtypeset.types";
import { ItemTypeConfigurationMigrationImpactDto } from "../../types/item-type-configuration-migration.types";
import { ItemTypeConfigurationMigrationModal } from "../../components/ItemTypeConfigurationMigrationModal";

import layout from "../../styles/common/Layout.module.css";
import buttons from "../../styles/common/Buttons.module.css";
import form from "../../styles/common/Forms.module.css";
import alert from "../../styles/common/Alerts.module.css";
import utilities from "../../styles/common/Utilities.module.css";

export default function EditItemTypeSet() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const auth = useAuth() as any;
  const token = auth?.token;
  const isAuthenticated = auth?.isAuthenticated;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [itemTypeConfigurations, setItemTypeConfigurations] = useState<ItemTypeConfigurationDto[]>([]);
  const [itemTypes, setItemTypes] = useState<ItemTypeDto[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [fieldSets, setFieldSets] = useState<FieldSetViewDto[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowSimpleDto[]>([]);

  const [selectedItemTypeId, setSelectedItemTypeId] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedFieldSetId, setSelectedFieldSetId] = useState("");
  const [selectedWorkflowId, setSelectedWorkflowId] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State per il modal di migrazione
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [migrationImpacts, setMigrationImpacts] = useState<ItemTypeConfigurationMigrationImpactDto[]>([]);
  const [migrationLoading, setMigrationLoading] = useState(false);
  const [pendingSave, setPendingSave] = useState(false);
  
  // Store delle configurazioni originali per il confronto
  const originalConfigurationsRef = useRef<ItemTypeConfigurationDto[]>([]);

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [setRes, typesRes, categoriesRes, fieldSetsRes, workflowsRes] = await Promise.all([
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
        const configs = (setData.itemTypeConfigurations || []).map((conf: any) => ({
          id: conf.id,
          itemTypeId: conf.itemType.id,
          category: conf.category,
          fieldSetId: conf.fieldSet?.id,
          workflowId: conf.workflow?.id,
        }));
        setItemTypeConfigurations(configs);
        originalConfigurationsRef.current = [...configs]; // Salva copia delle originali

        setItemTypes(typesRes.data);
        setCategories(categoriesRes.data);
        setFieldSets(fieldSetsRes.data);
        setWorkflows(workflowsRes.data);
      } catch (e: any) {
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

  const updateEntry = (index: number, updatedFields: Partial<ItemTypeConfigurationDto>) => {
    // Applica sempre la modifica direttamente (senza analisi immediata)
    setItemTypeConfigurations((prev) =>
      prev.map((e, i) => (i === index ? { ...e, ...updatedFields } : e))
    );
  };
  
  // Identifica le configurazioni con cambiamenti
  const getConfigurationsWithChanges = (): Array<{
    config: ItemTypeConfigurationDto;
    originalConfig: ItemTypeConfigurationDto;
    index: number;
  }> => {
    return itemTypeConfigurations
      .map((config, index) => {
        const originalConfig = originalConfigurationsRef.current.find(c => c.id === config.id);
        if (!originalConfig || !config.id) return null;
        
        const fieldSetChanged = originalConfig.fieldSetId !== config.fieldSetId;
        const workflowChanged = originalConfig.workflowId !== config.workflowId;
        
        if (fieldSetChanged || workflowChanged) {
          return { config, originalConfig, index };
        }
        return null;
      })
      .filter((item): item is { config: ItemTypeConfigurationDto; originalConfig: ItemTypeConfigurationDto; index: number } => item !== null);
  };

  // Gestisce la conferma della migrazione (una per ogni configurazione modificata)
  const handleMigrationConfirm = async (preservePermissionIdsMap: Map<number, number[]>) => {
    try {
      setMigrationLoading(true);
      
      // Applica la migrazione per ogni configurazione
      // IMPORTANTE: preservePermissionIds può essere un array vuoto [] se l'utente ha deselezionato tutto
      for (const [configId, preservePermissionIds] of preservePermissionIdsMap) {
        // Trova la configurazione corrispondente per ottenere i nuovi FieldSetId e WorkflowId
        const config = itemTypeConfigurations.find(c => c.id === configId);
        if (!config) {
          console.error(`Configurazione ${configId} non trovata`);
          continue;
        }
        
        // Se preservePermissionIds è undefined o null, usa array vuoto
        // Questo significa che l'utente non ha selezionato nulla intenzionalmente
        const permissionIdsToPreserve = preservePermissionIds || [];
        
        await api.post(
          `/item-type-configurations/${configId}/migrate-permissions`,
          {
            itemTypeConfigurationId: configId,
            newFieldSetId: config.fieldSetId || null,
            newWorkflowId: config.workflowId || null,
            preservePermissionIds: permissionIdsToPreserve, // Può essere [] se l'utente ha deselezionato tutto
            preserveAllPreservable: null,
            removeAll: null,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }
      
      // Aggiorna le originali con le nuove versioni
      originalConfigurationsRef.current = [...itemTypeConfigurations];
      
      // Procedi con il salvataggio
      await performSave();
      
      setShowMigrationModal(false);
      setMigrationImpacts([]);
      setPendingSave(false);
    } catch (err: any) {
      console.error("Errore nell'applicazione della migrazione:", err);
      setError(err.response?.data?.message || "Errore nell'applicazione della migrazione");
    } finally {
      setMigrationLoading(false);
    }
  };
  
  const handleMigrationCancel = () => {
    setShowMigrationModal(false);
    setMigrationImpacts([]);
    setPendingSave(false);
  };
  
  // Gestisce l'export CSV del report di migrazione
  const handleExportMigrationCsv = async () => {
    if (migrationImpacts.length === 0) return;
    
    try {
      // Esporta il CSV per la prima configurazione (o tutte se necessario)
      // Per semplicità, esportiamo il primo. In futuro si può fare un export aggregato
      const firstImpact = migrationImpacts[0];
      
      const response = await api.get(
        `/item-type-configurations/${firstImpact.itemTypeConfigurationId}/export-migration-impact-csv`,
        {
          params: {
            newFieldSetId: firstImpact.newFieldSet?.fieldSetId || undefined,
            newWorkflowId: firstImpact.newWorkflow?.workflowId || undefined,
          },
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob',
        }
      );
      
      // Crea un blob URL e scarica il file
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      link.download = `itemtypeconfiguration_migration_${firstImpact.itemTypeConfigurationId}_${timestamp}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Errore nell'export CSV:", err);
      setError(err.response?.data?.message || "Errore nell'export CSV");
    }
  };
  
  // Esegue il salvataggio effettivo
  const performSave = async () => {
    const dto: ItemTypeSetUpdateDto = {
      name,
      description,
      itemTypeConfigurations: itemTypeConfigurations.map((conf) => ({
        id: conf.id,
        itemTypeId: conf.itemTypeId,
        category: conf.category,
        fieldSetId: conf.fieldSetId || null,
        workflowId: conf.workflowId || null,
      })),
    };

    await api.put(`/item-type-sets/${id}`, dto, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Aggiorna automaticamente i ruoli per l'ItemTypeSet modificato
    try {
      await api.delete(`/itemtypeset-roles/itemtypeset/${id}/all`);
      await api.post(`/itemtypeset-roles/create-for-itemtypeset/${id}`);
    } catch (roleError) {
      console.warn("Errore nell'aggiornamento automatico dei ruoli:", roleError);
    }

    navigate("/tenant/item-type-sets");
  };

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
      // Identifica le configurazioni con cambiamenti
      const configurationsWithChanges = getConfigurationsWithChanges();
      
      if (configurationsWithChanges.length === 0) {
        // Nessun cambiamento di FieldSet/Workflow, salva direttamente
        await performSave();
        setSaving(false);
        return;
      }
      
      // Analizza l'impatto per tutte le configurazioni modificate
      setMigrationLoading(true);
      const impacts: ItemTypeConfigurationMigrationImpactDto[] = [];
      
      for (const { config } of configurationsWithChanges) {
        try {
          const response = await api.get(
            `/item-type-configurations/${config.id}/migration-impact`,
            {
              params: {
                newFieldSetId: config.fieldSetId || undefined,
                newWorkflowId: config.workflowId || undefined,
              },
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          impacts.push(response.data);
        } catch (err: any) {
          console.error(`Errore nell'analisi dell'impatto per configurazione ${config.id}:`, err);
          setError(err.response?.data?.message || "Errore nell'analisi dell'impatto della migrazione");
          setMigrationLoading(false);
          setSaving(false);
          return;
        }
      }
      
      setMigrationImpacts(impacts);
      setPendingSave(true);
      setShowMigrationModal(true);
      setSaving(false);
      setMigrationLoading(false);
    } catch (err: any) {
      console.error("Errore durante l'aggiornamento", err);
      setError(err.response?.data?.message || "Errore durante l'aggiornamento");
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
    <div className={layout.container} style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Header Section */}
      <div className={layout.headerSection}>
        <h1 className={layout.title}>Modifica Item Type Set</h1>
        <p className={layout.paragraphMuted}>
          Modifica le informazioni dell'item type set e le sue configurazioni.
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
                saving || !selectedItemTypeId || !selectedCategory || !selectedFieldSetId || !selectedWorkflowId
              }
            >
              Add Entry
            </button>
          </div>

          {itemTypeConfigurations.map((entry, index) => {
            const itemType = itemTypes.find((it) => it.id === entry.itemTypeId);

            return (
              <div key={entry.id || `new-${index}`} className={form.inlineGroup}>
                <input
                  type="text"
                  value={itemType?.name || ""}
                  disabled
                  className={form.input}
                  aria-label="Item Type"
                />

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

                <select
                  value={entry.fieldSetId || ""}
                  onChange={(e) => updateEntry(index, { fieldSetId: Number.parseInt(e.target.value, 10) })}
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
                  value={entry.workflowId || ""}
                  onChange={(e) => updateEntry(index, { workflowId: Number.parseInt(e.target.value, 10) })}
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
        </div>

        {/* Action Buttons */}
        <div className={layout.buttonRow}>
          <button type="submit" disabled={saving} className={buttons.button}>
            {saving ? "Salvataggio..." : "Salva Modifiche"}
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
      
      {/* Modal di migrazione */}
      <ItemTypeConfigurationMigrationModal
        isOpen={showMigrationModal}
        onClose={handleMigrationCancel}
        onConfirm={handleMigrationConfirm}
        onExport={handleExportMigrationCsv}
        impacts={migrationImpacts}
        loading={migrationLoading}
      />
    </div>
  );
}

