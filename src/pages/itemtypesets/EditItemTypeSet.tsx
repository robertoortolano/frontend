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
import { ItemTypeConfigurationEnhancedImpactReportModal } from "../../components/ItemTypeConfigurationEnhancedImpactReportModal";
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
  
  // State per il modal di rimozione impatto (ora solo al salvataggio)
  const [showRemovalImpactModal, setShowRemovalImpactModal] = useState(false);
  const [removalImpact, setRemovalImpact] = useState<ItemTypeConfigurationRemovalImpactDto | null>(null);
  const [removalImpactLoading, setRemovalImpactLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' | 'error' } | null>(null);
  const [pendingSave, setPendingSave] = useState<(() => Promise<void>) | null>(null);
  
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
      
      // Identifica le configurazioni rimosse
      const removedConfigIds = originalConfigurationsRef.current
        .map(c => c.id)
        .filter((id): id is number => id !== undefined && id !== null)
        .filter(id => !itemTypeConfigurations.some(c => c.id === id));
      
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
      
      // Se ci sono configurazioni rimosse, rimuovi le permission orfane
      if (removedConfigIds.length > 0) {
        await performSaveWithRemoval(removedConfigIds, undefined);
      } else {
        await performSave();
      }
      
      setShowMigrationModal(false);
      setMigrationImpacts([]);
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

  const handleRemoveEntry = (index: number) => {
    // Rimuove solo visivamente la configurazione (rimozione "fittizia")
    // L'analisi dell'impatto avverrà solo al salvataggio, come in FieldSet e Workflow
    const configToRemove = itemTypeConfigurations[index];
    
    // Verifica che non sia l'ultima configurazione
    if (itemTypeConfigurations.length === 1) {
      setError("Non è possibile rimuovere l'ultima ItemTypeConfiguration. Un ItemTypeSet deve avere almeno una configurazione.");
      return;
    }
    
    // Rimuovi visivamente la configurazione
    setItemTypeConfigurations((prev) => prev.filter((_, i) => i !== index));
  };
  
  const handleRemovalImpactConfirm = async (preservedPermissionIds?: number[]) => {
    if (pendingSave) {
      await pendingSave(preservedPermissionIds);
    }
    setShowRemovalImpactModal(false);
    setRemovalImpact(null);
    setPendingSave(null);
  };
  
  const handleRemovalImpactCancel = () => {
    setShowRemovalImpactModal(false);
    setRemovalImpact(null);
    setPendingSave(null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!id) return;
    
    setSaving(true);
    setError(null);

    try {
      // Identifica le configurazioni rimosse (quelle originali che non sono più presenti)
      const originalConfigIds = originalConfigurationsRef.current
        .map(c => c.id)
        .filter((id): id is number => id !== undefined && id !== null);
      
      const currentConfigIds = itemTypeConfigurations
        .map(c => c.id)
        .filter((id): id is number => id !== undefined && id !== null);
      
      const removedConfigIds = originalConfigIds.filter(id => !currentConfigIds.includes(id));
      
      // Verifica che non sia l'ultima configurazione
      if (itemTypeConfigurations.length === 0) {
        setError("Un ItemTypeSet deve avere almeno una configurazione.");
        setSaving(false);
        return;
      }
      
      // Identifica le configurazioni con cambiamenti di FieldSet/Workflow
      const configurationsWithChanges = getConfigurationsWithChanges();
      
      // Se ci sono configurazioni rimosse, analizza l'impatto della rimozione
      if (removedConfigIds.length > 0) {
        await analyzeRemovalImpact(removedConfigIds, configurationsWithChanges);
        return; // L'analisi imposterà pendingSave e mostrerà il modal se necessario
      }
      
      // Se ci sono cambiamenti di FieldSet/Workflow, analizza la migrazione
      if (configurationsWithChanges.length > 0) {
        await analyzeMigrationImpact(configurationsWithChanges);
        return; // L'analisi mostrerà il modal se necessario
      }
      
      // Nessuna modifica che richieda analisi, salva direttamente
      await performSave();
      setSaving(false);
    } catch (err: any) {
      console.error("Errore durante l'aggiornamento", err);
      setError(err.response?.data?.message || "Errore durante l'aggiornamento");
      setSaving(false);
    }
  };
  
  const analyzeRemovalImpact = async (removedConfigIds: number[], configurationsWithChanges: Array<{ config: ItemTypeConfigurationDto; originalConfig: ItemTypeConfigurationDto; index: number }>) => {
    setRemovalImpactLoading(true);
    setError(null);
    
    try {
      const response = await api.post(
        `/item-type-sets/${id}/analyze-itemtypeconfiguration-removal-impact`,
        removedConfigIds,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      const impact: ItemTypeConfigurationRemovalImpactDto = response.data;
      
      // Verifica se ci sono permission con assegnazioni
      const hasPopulatedPermissions = 
        impact.fieldOwnerPermissions?.some((p: any) => p.hasAssignments) ||
        impact.statusOwnerPermissions?.some((p: any) => p.hasAssignments) ||
        impact.fieldStatusPermissions?.some((p: any) => p.hasAssignments) ||
        impact.executorPermissions?.some((p: any) => p.hasAssignments) ||
        impact.itemTypeSetRoles?.some((p: any) => p.hasAssignments);
      
      if (hasPopulatedPermissions) {
        setRemovalImpact(impact);
        setPendingSave(() => async (preservedPermissionIds?: number[]) => {
          // Se ci sono anche migrazioni, gestiscile prima del salvataggio finale
          if (configurationsWithChanges.length > 0) {
            await handleMigrationsThenSave(preservedPermissionIds);
          } else {
            await performSaveWithRemoval(removedConfigIds, preservedPermissionIds);
          }
        });
        setShowRemovalImpactModal(true);
      } else {
        // Se non ci sono assegnazioni per le rimozioni, controlla se ci sono migrazioni
        if (configurationsWithChanges.length > 0) {
          await analyzeMigrationImpact(configurationsWithChanges);
        } else {
          await performSaveWithRemoval(removedConfigIds, undefined);
          setToast({ 
            message: 'ItemTypeSet aggiornato con successo. Nessun impatto rilevato sulle permission.', 
            type: 'success' 
          });
        }
      }
    } catch (err: any) {
      console.error("Errore nell'analisi dell'impatto della rimozione:", err);
      setError(err.response?.data?.message || "Errore nell'analisi dell'impatto della rimozione");
    } finally {
      setRemovalImpactLoading(false);
      setSaving(false);
    }
  };
  
  const analyzeMigrationImpact = async (configurationsWithChanges: Array<{ config: ItemTypeConfigurationDto; originalConfig: ItemTypeConfigurationDto; index: number }>) => {
    setMigrationLoading(true);
    setError(null);
    
    try {
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
      setShowMigrationModal(true);
      setSaving(false);
    } catch (err: any) {
      console.error("Errore durante l'analisi della migrazione", err);
      setError(err.response?.data?.message || "Errore durante l'analisi della migrazione");
      setSaving(false);
    } finally {
      setMigrationLoading(false);
    }
  };
  
  const handleMigrationsThenSave = async (preservedRemovalPermissionIds?: number[]) => {
    // Prima gestisci le migrazioni, poi il salvataggio finale con rimozioni
    const removedConfigIds = originalConfigurationsRef.current
      .map(c => c.id)
      .filter((id): id is number => id !== undefined && id !== null)
      .filter(id => !itemTypeConfigurations.some(c => c.id === id));
    
    // Le migrazioni vengono gestite nel handleMigrationConfirm, che chiama performSave
    // Ma dobbiamo anche gestire le rimozioni
    // TODO: Integrare meglio questa logica
    await performSaveWithRemoval(removedConfigIds, preservedRemovalPermissionIds);
  };
  
  const performSaveWithRemoval = async (removedConfigIds: number[], preservedPermissionIds?: number[]) => {
    if (removedConfigIds.length > 0) {
      // Chiama il backend per rimuovere le permission orfane (tranne quelle preservate)
      try {
        await api.post(
          `/item-type-sets/${id}/remove-itemtypeconfiguration-permissions`,
          {
            removedItemTypeConfigurationIds: removedConfigIds,
            preservedPermissionIds: preservedPermissionIds ? Array.from(preservedPermissionIds) : []
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } catch (err: any) {
        console.error("Errore nella rimozione delle permission:", err);
        // Continua comunque con il salvataggio
      }
    }
    
    await performSave();
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
        impacts={migrationImpacts}
        loading={migrationLoading}
      />
      
      {/* Modal di rimozione impatto */}
      <ItemTypeConfigurationEnhancedImpactReportModal
        isOpen={showRemovalImpactModal}
        onClose={handleRemovalImpactCancel}
        onConfirm={(preservedPermissionIds) => handleRemovalImpactConfirm(preservedPermissionIds)}
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

