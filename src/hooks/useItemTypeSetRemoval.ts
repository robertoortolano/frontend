import { useState } from "react";
import api from "../api/api";
import { ItemTypeConfigurationDto } from "../types/itemtypeset.types";
import { ItemTypeConfigurationRemovalImpactDto } from "../types/itemtypeconfiguration-impact.types";
import { extractErrorMessage } from "../utils/errorUtils";
import { useToast } from "../context/ToastContext";

interface UseItemTypeSetRemovalProps {
  token: string | null;
  id: string | undefined;
  itemTypeConfigurations: ItemTypeConfigurationDto[];
  originalConfigurationsRef: React.MutableRefObject<ItemTypeConfigurationDto[]>;
  performSave: (forceRemoval?: boolean) => Promise<void>;
  analyzeMigrationImpact?: (
    configurationsWithChanges: Array<{ config: ItemTypeConfigurationDto; originalConfig: ItemTypeConfigurationDto; index: number }>
  ) => Promise<void>;
  setError: (error: string | null) => void;
  setSaving: (saving: boolean) => void;
}

export function useItemTypeSetRemoval({
  token,
  id,
  itemTypeConfigurations,
  originalConfigurationsRef,
  performSave,
  analyzeMigrationImpact,
  setError,
  setSaving,
}: UseItemTypeSetRemovalProps) {
  const [showRemovalImpactModal, setShowRemovalImpactModal] = useState(false);
  const [removalImpact, setRemovalImpact] = useState<ItemTypeConfigurationRemovalImpactDto | null>(null);
  const [removalImpactLoading, setRemovalImpactLoading] = useState(false);
  const [pendingSave, setPendingSave] = useState<((preservedPermissionIds?: number[]) => Promise<void>) | null>(null);
  const { showToast } = useToast();

  // Analizza l'impatto della rimozione
  const analyzeRemovalImpact = async (
    removedConfigIds: number[],
    configurationsWithChanges: Array<{ config: ItemTypeConfigurationDto; originalConfig: ItemTypeConfigurationDto; index: number }>
  ) => {
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
        impact.workerPermissions?.some((p: any) => p.hasAssignments) ||
        impact.creatorPermissions?.some((p: any) => p.hasAssignments);
      
      if (hasPopulatedPermissions) {
        setRemovalImpact(impact);
        setPendingSave(() => async (preservedPermissionIds?: number[]) => {
          // Se ci sono anche migrazioni, devono essere gestite prima delle rimozioni
          // In questo caso, le migrazioni dovrebbero essere già state completate
          // perché il flusso corretto è: migrazioni -> rimozioni -> salvataggio
          // Passa forceRemoval: true perché l'utente ha confermato la rimozione nonostante le assegnazioni
          await performSaveWithRemoval(removedConfigIds, preservedPermissionIds, true);
        });
        
        // Se ci sono anche migrazioni, mostra prima il modal di migrazione
        // Il modal di rimozione verrà mostrato dopo che l'utente ha confermato la migrazione
        if (configurationsWithChanges.length > 0 && analyzeMigrationImpact) {
          // Salva le informazioni per la rimozione e mostra prima il modal di migrazione
          // Il modal di rimozione verrà mostrato dopo la conferma della migrazione
          // Passa un callback che mostra il modal di rimozione dopo le migrazioni
          // Nota: questo richiede che analyzeMigrationImpact supporti un callback onAfterMigration
          // Per ora, mostriamo il modal di rimozione direttamente dopo le migrazioni
          // Il flusso corretto sarà gestito in EditItemTypeSet.tsx
          await analyzeMigrationImpact(configurationsWithChanges);
        } else {
          setShowRemovalImpactModal(true);
        }
      } else {
        // Se non ci sono assegnazioni per le rimozioni, controlla se ci sono migrazioni
        if (configurationsWithChanges.length > 0 && analyzeMigrationImpact) {
          await analyzeMigrationImpact(configurationsWithChanges);
        } else {
          await performSaveWithRemoval(removedConfigIds, undefined);
          showToast('ItemTypeSet aggiornato con successo. Nessun impatto rilevato sulle permission.', 'success');
        }
      }
    } catch (err: any) {
      console.error("Errore nell'analisi dell'impatto della rimozione:", err);
      setError(extractErrorMessage(err, "Errore nell'analisi dell'impatto della rimozione"));
    } finally {
      setRemovalImpactLoading(false);
      setSaving(false);
    }
  };

  // Esegue il salvataggio con rimozione
  const performSaveWithRemoval = async (
    removedConfigIds: number[],
    preservedPermissionIds?: number[],
    forceRemoval: boolean = false
  ) => {
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
    
    // Aggiorna originalConfigurationsRef prima di chiamare performSave
    // per riflettere le configurazioni dopo la rimozione
    originalConfigurationsRef.current = [...itemTypeConfigurations];
    
    // Passa forceRemoval: true quando l'utente ha confermato la rimozione nonostante le assegnazioni
    await performSave(forceRemoval);
  };

  // Gestisce la conferma dell'impatto di rimozione
  const handleRemovalImpactConfirm = async (preservedPermissionIds?: number[]) => {
    if (pendingSave) {
      await pendingSave(preservedPermissionIds);
    }
    setShowRemovalImpactModal(false);
    setRemovalImpact(null);
    setPendingSave(null);
  };
  
  // Gestisce l'annullamento dell'impatto di rimozione
  const handleRemovalImpactCancel = () => {
    setShowRemovalImpactModal(false);
    setRemovalImpact(null);
    setPendingSave(null);
    setSaving(false);
  };

  // Funzione helper per mostrare il modal di rimozione per configurazioni specifiche
  const showRemovalModalForConfigIds = async (removedConfigIds: number[]) => {
    if (removedConfigIds.length === 0) return;
    
    const configurationsWithChanges: Array<{ config: ItemTypeConfigurationDto; originalConfig: ItemTypeConfigurationDto; index: number }> = [];
    await analyzeRemovalImpact(removedConfigIds, configurationsWithChanges);
  };

  return {
    showRemovalImpactModal,
    removalImpact,
    removalImpactLoading,
    pendingSave,
    analyzeRemovalImpact,
    performSaveWithRemoval,
    handleRemovalImpactConfirm,
    handleRemovalImpactCancel,
    showRemovalModalForConfigIds,
  };
}

