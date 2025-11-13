import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import { ItemTypeDto } from "../../types/itemtype.types";
import { FieldSetViewDto } from "../../types/field.types";
import { WorkflowSimpleDto } from "../../types/workflow.types";
import { ItemTypeConfigurationDto } from "../../types/itemtypeset.types";
import { ItemTypeConfigurationMigrationModal } from "../../components/ItemTypeConfigurationMigrationModal";
import { ItemTypeConfigurationEnhancedImpactReportModal } from "../../components/ItemTypeConfigurationEnhancedImpactReportModal";
import { useItemTypeSetMigration } from "../../hooks/useItemTypeSetMigration";
import { useItemTypeSetRemoval } from "../../hooks/useItemTypeSetRemoval";
import { useItemTypeSetSave } from "../../hooks/useItemTypeSetSave";
import { ItemTypeConfigurationsForm } from "../../components/itemtypesets/ItemTypeConfigurationsForm";

import layout from "../../styles/common/Layout.module.css";
import buttons from "../../styles/common/Buttons.module.css";
import form from "../../styles/common/Forms.module.css";
import alert from "../../styles/common/Alerts.module.css";
import { PageContainer, PageHeader, PageSection } from "../../components/shared/layout";

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

  // Hook per il salvataggio
  const { performSave, handleSubmit: handleSaveSubmit, getConfigurationsWithChanges } = useItemTypeSetSave({
    token,
    id,
    scope,
    projectId,
    name,
    description,
    itemTypeConfigurations,
    originalConfigurationsRef,
    setError,
  });

  // Hook per la migrazione (prima, senza performSaveWithRemoval - sarà aggiornato dopo)
  const migrationHookResult = useItemTypeSetMigration({
    token,
    id,
    itemTypeConfigurations,
    originalConfigurationsRef,
    performSave,
    setError,
  });

  // Hook per la rimozione (dopo, con accesso alle funzioni di migrazione)
  const {
    showRemovalImpactModal,
    removalImpact,
    removalImpactLoading,
    analyzeRemovalImpact,
    performSaveWithRemoval,
    handleRemovalImpactConfirm,
    handleRemovalImpactCancel,
  } = useItemTypeSetRemoval({
    token,
    id,
    itemTypeConfigurations,
    originalConfigurationsRef,
    performSave,
    analyzeMigrationImpact: migrationHookResult.analyzeMigrationImpact,
    handleMigrationsThenSave: migrationHookResult.handleMigrationsThenSave,
    setError,
    setSaving,
  });

  // Usa il risultato del hook di migrazione (performSaveWithRemoval sarà undefined inizialmente ma gestito nell'hook)
  const {
    showMigrationModal,
    migrationImpacts,
    migrationLoading,
    analyzeMigrationImpact,
    handleMigrationConfirm,
    handleMigrationCancel,
    handleMigrationsThenSave,
  } = migrationHookResult;

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
    
    // Verifica che non sia l'ultima configurazione
    if (itemTypeConfigurations.length === 1) {
      setError("Non è possibile rimuovere l'ultima ItemTypeConfiguration. Un ItemTypeSet deve avere almeno una configurazione.");
      return;
    }
    
    // Rimuovi visivamente la configurazione
    setItemTypeConfigurations((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    handleSaveSubmit(e, setSaving, analyzeRemovalImpact, analyzeMigrationImpact);
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
    <PageContainer maxWidth="800px">
      <PageHeader
        title={
          scope === "tenant"
            ? "Modifica Item Type Set"
            : "Modifica Item Type Set di Progetto"
        }
        description={
          scope === "tenant"
            ? "Modifica le informazioni dell'item type set e le sue configurazioni."
            : "Modifica le informazioni dell'item type set del progetto. Gli ItemType sono sempre globali, mentre FieldSet e Workflow sono del progetto."
        }
      />

      {error && (
        <div className={alert.errorContainer}>
          <p className={alert.error}>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className={form.form}>
        <PageSection title="Informazioni Base" bodyClassName="space-y-6">
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

          <ItemTypeConfigurationsForm
            scope={scope}
            saving={saving}
            availableItemTypes={availableItemTypes}
            categories={categories}
            fieldSets={fieldSets}
            workflows={workflows}
            itemTypeConfigurations={itemTypeConfigurations}
            selectedItemTypeId={selectedItemTypeId}
            selectedCategory={selectedCategory}
            selectedFieldSetId={selectedFieldSetId}
            selectedWorkflowId={selectedWorkflowId}
            onChangeItemType={setSelectedItemTypeId}
            onChangeCategory={setSelectedCategory}
            onChangeFieldSet={setSelectedFieldSetId}
            onChangeWorkflow={setSelectedWorkflowId}
            onAddEntry={handleAddEntry}
            onRemoveEntry={handleRemoveEntry}
            onUpdateEntry={updateEntry}
            itemTypes={itemTypes}
          />
        </PageSection>

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

      <ItemTypeConfigurationMigrationModal
        isOpen={showMigrationModal}
        onClose={handleMigrationCancel}
        onConfirm={handleMigrationConfirm}
        impacts={migrationImpacts}
        loading={migrationLoading}
      />

      <ItemTypeConfigurationEnhancedImpactReportModal
        isOpen={showRemovalImpactModal}
        onClose={handleRemovalImpactCancel}
        onConfirm={(preservedPermissionIds) =>
          handleRemovalImpactConfirm(preservedPermissionIds)
        }
        impact={removalImpact}
        loading={removalImpactLoading}
      />
    </PageContainer>
  );
}

