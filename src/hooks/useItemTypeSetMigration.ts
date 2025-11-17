import { useState } from "react";
import api from "../api/api";
import { ItemTypeConfigurationDto } from "../types/itemtypeset.types";
import { ItemTypeConfigurationMigrationImpactDto } from "../types/item-type-configuration-migration.types";
import { extractErrorMessage } from "../utils/errorUtils";
import { useToast } from "../context/ToastContext";

interface UseItemTypeSetMigrationProps {
  token: string | null;
  itemTypeConfigurations: ItemTypeConfigurationDto[];
  originalConfigurationsRef: React.MutableRefObject<ItemTypeConfigurationDto[]>;
  performSave: (forceRemoval?: boolean) => Promise<void>;
  performSaveWithRemoval?: (
    removedConfigIds: number[],
    preservedPermissionIds?: number[],
    forceRemoval?: boolean
  ) => Promise<void>;
  setError: (error: string | null) => void;
  onAfterMigration?: (removedConfigIds: number[]) => Promise<void>;
}

export function useItemTypeSetMigration({
  token,
  itemTypeConfigurations,
  originalConfigurationsRef,
  performSave,
  performSaveWithRemoval,
  setError,
  onAfterMigration,
}: UseItemTypeSetMigrationProps) {
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [migrationImpacts, setMigrationImpacts] = useState<ItemTypeConfigurationMigrationImpactDto[]>([]);
  const [migrationLoading, setMigrationLoading] = useState(false);
  const { showToast } = useToast();

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

  // Analizza l'impatto della migrazione
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
          setError(extractErrorMessage(err, "Errore nell'analisi dell'impatto della migrazione"));
          setMigrationLoading(false);
          return;
        }
      }
      
      // Verifica se ci sono permission con assegnazioni in almeno un impatto
      const hasPopulatedPermissions = impacts.some(impact => {
        const allPermissions = [
          ...(impact.fieldOwnerPermissions || []),
          ...(impact.statusOwnerPermissions || []),
          ...(impact.fieldStatusPermissions || []),
          ...(impact.executorPermissions || []),
          ...(impact.workerPermissions || []),
          ...(impact.creatorPermissions || [])
        ];
        return allPermissions.some((p: any) => p.hasAssignments);
      });
      
      if (hasPopulatedPermissions) {
        setMigrationImpacts(impacts);
        setShowMigrationModal(true);
      } else {
        // Nessuna permission con assegnazioni: salva direttamente senza mostrare il modal
        await performSave();
        showToast('ItemTypeSet aggiornato con successo. Nessun impatto rilevato sulle permission.', 'success');
      }
    } catch (err: any) {
      console.error("Errore durante l'analisi della migrazione", err);
      setError(extractErrorMessage(err, "Errore durante l'analisi della migrazione"));
    } finally {
      setMigrationLoading(false);
    }
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
      
      // IMPORTANTE: NON aggiornare originalConfigurationsRef.current qui,
      // perché performSave ha bisogno di rilevare i cambiamenti per chiamare il cleanup automatico
      // originalConfigurationsRef.current verrà aggiornato in performSave dopo il salvataggio riuscito
      
      setShowMigrationModal(false);
      setMigrationImpacts([]);
      
      // Se ci sono configurazioni rimosse e c'è un callback per gestirle, chiamalo
      // (ad esempio, per mostrare il modal di rimozione)
      if (removedConfigIds.length > 0 && onAfterMigration) {
        await onAfterMigration(removedConfigIds);
      } else if (removedConfigIds.length > 0 && performSaveWithRemoval) {
        // Se non c'è callback ma ci sono rimozioni, rimuovi le permission orfane direttamente
        await performSaveWithRemoval(removedConfigIds, undefined);
      } else {
        // Nessuna rimozione, salva direttamente
        await performSave();
      }
    } catch (err: any) {
      console.error("Errore nell'applicazione della migrazione:", err);
      setError(extractErrorMessage(err, "Errore nell'applicazione della migrazione"));
    } finally {
      setMigrationLoading(false);
    }
  };
  
  const handleMigrationCancel = () => {
    setShowMigrationModal(false);
    setMigrationImpacts([]);
  };
  
  const handleMigrationsThenSave = async (
    preservedRemovalPermissionIds?: number[],
    preservePermissionIdsMap?: Map<number, number[]>
  ) => {
    // Prima gestisci le migrazioni (se ci sono configurazioni modificate)
    const configurationsWithChanges = getConfigurationsWithChanges();
    
    if (configurationsWithChanges.length > 0 && preservePermissionIdsMap) {
      // Applica la migrazione per ogni configurazione modificata
      for (const [configId, preservePermissionIds] of preservePermissionIdsMap) {
        const config = itemTypeConfigurations.find(c => c.id === configId);
        if (!config) {
          console.error(`Configurazione ${configId} non trovata`);
          continue;
        }
        
        const permissionIdsToPreserve = preservePermissionIds || [];
        
        await api.post(
          `/item-type-configurations/${configId}/migrate-permissions`,
          {
            itemTypeConfigurationId: configId,
            newFieldSetId: config.fieldSetId || null,
            newWorkflowId: config.workflowId || null,
            preservePermissionIds: permissionIdsToPreserve,
            preserveAllPreservable: null,
            removeAll: null,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }
    }
    
    // Poi gestisci le rimozioni e il salvataggio finale
    const removedConfigIds = originalConfigurationsRef.current
      .map(c => c.id)
      .filter((id): id is number => id !== undefined && id !== null)
      .filter(id => !itemTypeConfigurations.some(c => c.id === id));
    
    // Passa forceRemoval: true perché l'utente ha confermato la rimozione nonostante le assegnazioni
    if (removedConfigIds.length > 0 && performSaveWithRemoval) {
      await performSaveWithRemoval(removedConfigIds, preservedRemovalPermissionIds, true);
    } else {
      await performSave();
    }
  };

  return {
    showMigrationModal,
    migrationImpacts,
    migrationLoading,
    analyzeMigrationImpact,
    handleMigrationConfirm,
    handleMigrationCancel,
    handleMigrationsThenSave,
    getConfigurationsWithChanges,
  };
}

