import { useCallback } from "react";
import api from "../api/api";
import type { FieldSetCreateDto } from "../types/field.types";

interface UseFieldSetSaveParams {
	fieldSetId: string;
	scope: "tenant" | "project";
	projectId?: string;
	authToken: string | null | undefined;
	selectedConfigurations: number[];
	fieldSet: { name: string; description?: string | null } | null;
	onError?: (message: string) => void;
	onSavingChange?: (saving: boolean) => void;
	onSuccessNavigate: (path: string) => void;
	showToast: (message: string, type?: "success" | "error" | "info") => void;
	// hooks with impact modal
	resetImpactModal?: () => void;
}

export function useFieldSetSave({
	fieldSetId,
	scope,
	projectId,
	authToken,
	selectedConfigurations,
	fieldSet,
	onError,
	onSavingChange,
	onSuccessNavigate,
	showToast,
	resetImpactModal,
}: UseFieldSetSaveParams) {
	const performSave = useCallback(
		async (skipNavigation: boolean = false) => {
			if (!fieldSet) return;
			onSavingChange?.(true);
			onError?.("");
			try {
				const dto: FieldSetCreateDto = {
					name: fieldSet.name.trim(),
					description: fieldSet.description?.trim() || undefined,
					entries: selectedConfigurations.map((configId, index) => ({
						fieldConfigurationId: configId,
						orderIndex: index,
					})),
				};
				await api.put(`/field-sets/${fieldSetId}`, dto, {
					headers: { Authorization: `Bearer ${authToken}` },
				});
				if (!skipNavigation) {
					showToast("FieldSet aggiornato con successo.", "success");
					setTimeout(() => {
						if (scope === "tenant") {
							onSuccessNavigate("/tenant/field-sets");
						} else if (scope === "project" && projectId) {
							onSuccessNavigate(`/projects/${projectId}/field-sets`);
						}
					}, 500);
				}
			} catch (err: any) {
				const message = err?.response?.data?.message || "Errore nel salvataggio";
				if (typeof message === "string" && message.includes("FIELDSET_REMOVAL_IMPACT")) {
					onError?.(
						"Sono presenti permission con assegnazioni per i field rimossi. Genera e conferma il report d'impatto prima di salvare."
					);
				} else {
					onError?.(message);
				}
			} finally {
				onSavingChange?.(false);
			}
		},
		[fieldSet, selectedConfigurations, fieldSetId, authToken, scope, projectId, onError, onSavingChange, onSuccessNavigate, showToast]
	);

	const handleConfirmSave = useCallback(
		async (originalConfigIds: number[], preservedPermissionIds?: number[]) => {
			if (!fieldSet) return;
			onSavingChange?.(true);
			onError?.("");
			try {
				const removedConfigIds = originalConfigIds.filter(
					(id): id is number => id !== undefined && !selectedConfigurations.includes(id)
				);
				const hasRemovals = removedConfigIds.length > 0;
				if (hasRemovals) {
					const addedConfigIds = selectedConfigurations.filter((id) => !originalConfigIds.includes(id));
					const request = {
						removedFieldConfigIds: removedConfigIds,
						addedFieldConfigIds: addedConfigIds,
						preservedPermissionIds: preservedPermissionIds || [],
					};
					await api.post(`/field-sets/${fieldSetId}/remove-orphaned-permissions`, request, {
						headers: { Authorization: `Bearer ${authToken}` },
					});
				}

				// Save after orphan removal
				const dto: FieldSetCreateDto = {
					name: fieldSet.name.trim(),
					description: fieldSet.description?.trim() || undefined,
					entries: selectedConfigurations.map((configId, index) => ({
						fieldConfigurationId: configId,
						orderIndex: index,
					})),
				};
				await api.put(`/field-sets/${fieldSetId}`, dto, {
					headers: { Authorization: `Bearer ${authToken}` },
				});

				// reset impact modal and navigate
				resetImpactModal?.();
				showToast("FieldSet aggiornato con successo.", "success");
				setTimeout(() => {
					if (scope === "tenant") {
						onSuccessNavigate("/tenant/field-sets");
					} else if (scope === "project" && projectId) {
						onSuccessNavigate(`/projects/${projectId}/field-sets`);
					}
				}, 500);
			} catch (err: any) {
				onError?.(err?.response?.data?.message || "Errore durante la rimozione delle permission");
			} finally {
				onSavingChange?.(false);
			}
		},
		[fieldSet, selectedConfigurations, fieldSetId, authToken, scope, projectId, onError, onSavingChange, onSuccessNavigate, showToast, resetImpactModal]
	);

	return {
		performSave,
		handleConfirmSave,
	};
}









