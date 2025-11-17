import { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { ItemTypeConfigurationDto, ItemTypeSetUpdateDto } from "../types/itemtypeset.types";
import { extractErrorMessage } from "../utils/errorUtils";

interface UseItemTypeSetSaveProps {
  token: string | null;
  id: string | undefined;
  scope: "tenant" | "project";
  projectId?: string;
  name: string;
  description: string;
  itemTypeConfigurations: ItemTypeConfigurationDto[];
  originalConfigurationsRef: React.MutableRefObject<ItemTypeConfigurationDto[]>;
  setError: (error: string | null) => void;
}

export function useItemTypeSetSave({
  token,
  id,
  scope,
  projectId,
  name,
  description,
  itemTypeConfigurations,
  originalConfigurationsRef,
  setError,
}: UseItemTypeSetSaveProps) {
  const navigate = useNavigate();

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
        
        // Normalizza gli ID per confronto (tratta undefined/null come null)
        const originalFieldSetId = originalConfig.fieldSetId ?? null;
        const newFieldSetId = config.fieldSetId ?? null;
        const originalWorkflowId = originalConfig.workflowId ?? null;
        const newWorkflowId = config.workflowId ?? null;
        
        const fieldSetChanged = originalFieldSetId !== newFieldSetId;
        const workflowChanged = originalWorkflowId !== newWorkflowId;
        
        if (fieldSetChanged || workflowChanged) {
          console.log('Rilevato cambiamento in configurazione:', {
            configId: config.id,
            originalWorkflowId,
            newWorkflowId,
            workflowChanged,
            originalFieldSetId,
            newFieldSetId,
            fieldSetChanged
          });
          return { config, originalConfig, index };
        }
        return null;
      })
      .filter((item): item is { config: ItemTypeConfigurationDto; originalConfig: ItemTypeConfigurationDto; index: number } => item !== null);
  };

  // Esegue il salvataggio effettivo
  const performSave = async (forceRemoval: boolean = false) => {
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
      forceRemoval: forceRemoval || undefined,
    };

    const updateEndpoint = scope === 'project' && projectId
      ? `/item-type-sets/project/${projectId}/${id}`
      : `/item-type-sets/${id}`;

    try {
      const response = await api.put(updateEndpoint, dto, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Aggiorna automaticamente le permissions per l'ItemTypeSet modificato
      // Nota: Non c'è più bisogno di eliminare le vecchie permission perché vengono gestite automaticamente
      // Se necessario, le permission vengono ricreate quando si modifica l'ItemTypeSet
      try {
        await api.post(`/itemtypeset-permissions/create-for-itemtypeset/${id}`);
      } catch (roleError) {
        console.warn("Errore nell'aggiornamento automatico delle permissions:", roleError);
      }

      // Aggiorna originalConfigurationsRef con lo stato salvato dal backend
      // Questo è importante perché quando si modifica un FieldSet, le permission vengono ricreate
      // e dobbiamo riflettere lo stato aggiornato per rilevare correttamente le rimozioni successive
      const savedData = response.data;
      if (savedData && savedData.itemTypeConfigurations) {
        const configs = savedData.itemTypeConfigurations.map((conf: any) => ({
          id: conf.id,
          itemTypeId: conf.itemType?.id || conf.itemTypeId,
          category: conf.category,
          fieldSetId: conf.fieldSet?.id || conf.fieldSetId,
          workflowId: conf.workflow?.id || conf.workflowId,
        }));
        originalConfigurationsRef.current = [...configs];
      }

      if (scope === 'tenant') {
        navigate("/tenant/item-type-sets");
      } else if (scope === 'project' && projectId) {
        navigate(`/projects/${projectId}/item-type-sets`);
      }
    } catch (err: any) {
      const message = err.response?.data?.message || "Errore durante il salvataggio dell'ItemTypeSet";
      if (typeof message === 'string' && message.includes('ITEMTYPESET_REMOVAL_IMPACT')) {
        setError("Sono presenti permission con assegnazioni per le configurazioni rimosse. Genera e conferma il report d'impatto prima di salvare.");
      } else {
        setError(message);
      }
      throw err;
    }
  };

  // Gestisce il submit del form
  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>,
    setSaving: (saving: boolean) => void,
    analyzeRemovalImpact: (
      removedConfigIds: number[],
      configurationsWithChanges: Array<{ config: ItemTypeConfigurationDto; originalConfig: ItemTypeConfigurationDto; index: number }>
    ) => Promise<void>,
    analyzeMigrationImpact: (
      configurationsWithChanges: Array<{ config: ItemTypeConfigurationDto; originalConfig: ItemTypeConfigurationDto; index: number }>
    ) => Promise<void>
  ) => {
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
      setError(extractErrorMessage(err, "Errore durante l'aggiornamento"));
      setSaving(false);
    }
  };

  return {
    performSave,
    handleSubmit,
    getConfigurationsWithChanges,
  };
}








