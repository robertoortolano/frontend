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
import { ItemTypeConfigurationRemovalImpactDto } from "../../types/itemtypeconfiguration-impact.types";
import { ItemTypeConfigurationImpactReportModal } from "../../components/ItemTypeConfigurationImpactReportModal";
import { Toast } from "../../components/Toast";

import layout from "../../styles/common/Layout.module.css";
import buttons from "../../styles/common/Buttons.module.css";
import form from "../../styles/common/Forms.module.css";
import alert from "../../styles/common/Alerts.module.css";
import utilities from "../../styles/common/Utilities.module.css";

interface EditItemTypeSetProps {
  scope?: 'tenant' | 'project';
  projectId?: string;
}

export default function EditItemTypeSet({ scope: scopeProp, projectId: projectIdProp }: EditItemTypeSetProps = {}) {
  const { id, projectId: projectIdFromParams } = useParams<{ id: string; projectId?: string }>();
  const scope = scopeProp || (projectIdFromParams ? 'project' : 'tenant');
  const projectId = projectIdProp || projectIdFromParams;
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
  
  // State per il modal di rimozione impatto
  const [showRemovalImpactModal, setShowRemovalImpactModal] = useState(false);
  const [removalImpact, setRemovalImpact] = useState<ItemTypeConfigurationRemovalImpactDto | null>(null);
  const [removalImpactLoading, setRemovalImpactLoading] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<{ index: number; configId: number | undefined } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' | 'error' } | null>(null);
  
  // Store delle configurazioni originali per il confronto
  const originalConfigurationsRef = useRef<ItemTypeConfigurationDto[]>([]);

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const itemTypeSetEndpoint = scope === 'project' && projectId
          ? `/item-type-sets/project/${projectId}/${id}`
          : `/item-type-sets/${id}`;

        const [setRes, typesRes, categoriesRes, fieldSetsRes, workflowsRes] = await Promise.all([
          api.get(itemTypeSetEndpoint, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          api.get("/item-types", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          api.get("/item-types/categories", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          api.get(scope === 'project' && projectId 
            ? `/field-sets/project/${projectId}` 
            : "/field-sets", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          api.get(scope === 'project' && projectId 
            ? `/workflows/project/${projectId}` 
            : "/workflows", {
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
  }, [id, token, scope, projectId]);

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

    const updateEndpoint = scope === 'project' && projectId
      ? `/item-type-sets/project/${projectId}/${id}`
      : `/item-type-sets/${id}`;

    await api.put(updateEndpoint, dto, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Aggiorna automaticamente i ruoli per l'ItemTypeSet modificato
    try {
      await api.delete(`/itemtypeset-roles/itemtypeset/${id}/all`);
      await api.post(`/itemtypeset-roles/create-for-itemtypeset/${id}`);
    } catch (roleError) {
      console.warn("Errore nell'aggiornamento automatico dei ruoli:", roleError);
    }

    if (scope === 'tenant') {
      navigate("/tenant/item-type-sets");
    } else if (scope === 'project' && projectId) {
      navigate(`/projects/${projectId}/item-type-sets`);
    }
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

  const handleRemoveEntry = async (index: number) => {
    const configToRemove = itemTypeConfigurations[index];
    
    // Verifica che non sia l'ultima configurazione
    if (itemTypeConfigurations.length === 1) {
      setError("Non è possibile rimuovere l'ultima ItemTypeConfiguration. Un ItemTypeSet deve avere almeno una configurazione.");
      return;
    }
    
    // Se la configurazione non ha ID (è nuova, non ancora salvata), rimuovila direttamente (solo se non è l'ultima)
    if (!configToRemove.id) {
      if (itemTypeConfigurations.length <= 1) {
        setError("Non è possibile rimuovere l'ultima ItemTypeConfiguration. Un ItemTypeSet deve avere almeno una configurazione.");
        return;
      }
      setItemTypeConfigurations((prev) => prev.filter((_, i) => i !== index));
      return;
    }
    
    // Analizza l'impatto prima di rimuovere
    try {
      setRemovalImpactLoading(true);
      const response = await api.post(
        `/item-type-sets/${id}/analyze-itemtypeconfiguration-removal-impact`,
        [configToRemove.id], // Passa come array per JSON serialization
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      const impact = response.data;
      
      // Verifica se ci sono permission con assegnazioni
      const hasPopulatedPermissions = 
        impact.fieldOwnerPermissions?.some((p: any) => p.hasAssignments) ||
        impact.statusOwnerPermissions?.some((p: any) => p.hasAssignments) ||
        impact.fieldStatusPermissions?.some((p: any) => p.hasAssignments) ||
        impact.executorPermissions?.some((p: any) => p.hasAssignments) ||
        impact.itemTypeSetRoles?.some((p: any) => p.hasAssignments);
      
      if (hasPopulatedPermissions) {
        setRemovalImpact(impact);
        setPendingRemoval({ index, configId: configToRemove.id });
        setShowRemovalImpactModal(true);
      } else {
        // Se non ci sono assegnazioni, rimuovi direttamente e mostra toast
        setItemTypeConfigurations((prev) => prev.filter((_, i) => i !== index));
        setToast({ 
          message: 'ItemTypeConfiguration rimossa con successo. Nessun impatto rilevato sulle permission.', 
          type: 'success' 
        });
      }
    } catch (err: any) {
      console.error("Errore nell'analisi dell'impatto:", err);
      setError(err.response?.data?.message || "Errore nell'analisi dell'impatto della rimozione");
    } finally {
      setRemovalImpactLoading(false);
    }
  };
  
  const handleRemovalImpactConfirm = () => {
    // Verifica che non sia l'ultima configurazione prima di rimuovere
    if (itemTypeConfigurations.length <= 1) {
      setError("Non è possibile rimuovere l'ultima ItemTypeConfiguration. Un ItemTypeSet deve avere almeno una configurazione.");
      setShowRemovalImpactModal(false);
      setRemovalImpact(null);
      setPendingRemoval(null);
      return;
    }
    
    // Rimuovi la configurazione dopo la conferma
    if (pendingRemoval) {
      setItemTypeConfigurations((prev) => prev.filter((_, i) => i !== pendingRemoval.index));
      setPendingRemoval(null);
    }
    setShowRemovalImpactModal(false);
    setRemovalImpact(null);
  };
  
  const handleRemovalImpactCancel = () => {
    setShowRemovalImpactModal(false);
    setRemovalImpact(null);
    setPendingRemoval(null);
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
    if (scope === 'tenant') {
      navigate("/tenant/item-type-sets");
    } else if (scope === 'project' && projectId) {
      navigate(`/projects/${projectId}/item-type-sets`);
    }
  };

  if (loading) {
    return <p className={layout.loading}>Caricamento...</p>;
  }

  return (
    <div className={layout.container} style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Header Section */}
      <div className={layout.headerSection}>
        <h1 className={layout.title}>
          {scope === 'tenant' ? "Modifica Item Type Set" : "Modifica Item Type Set di Progetto"}
        </h1>
        <p className={layout.paragraphMuted}>
          {scope === 'tenant'
            ? "Modifica le informazioni dell'item type set e le sue configurazioni."
            : "Modifica le informazioni dell'item type set del progetto. Gli ItemType sono sempre globali, mentre FieldSet e Workflow sono del progetto."}
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
              <option value="">-- Seleziona un field set {scope === 'project' && "(del progetto)"} --</option>
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
              <option value="">-- Seleziona un workflow {scope === 'project' && "(del progetto)"} --</option>
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
                  disabled={saving || itemTypeConfigurations.length === 1}
                  title={itemTypeConfigurations.length === 1 ? "Non è possibile rimuovere l'ultima ItemTypeConfiguration" : "Rimuovi configurazione"}
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
      
      {/* Modal di rimozione impatto */}
      <ItemTypeConfigurationImpactReportModal
        isOpen={showRemovalImpactModal}
        onClose={handleRemovalImpactCancel}
        onConfirm={handleRemovalImpactConfirm}
        impact={removalImpact}
        loading={removalImpactLoading}
      />
      
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

