import { useState } from "react";
import api from "../api/api";
import type { FieldSetRemovalImpactDto } from "../types/fieldset-impact.types";

interface AnalyzeRemovalImpactRequest {
	removedFieldConfigIds: number[];
	addedFieldConfigIds: number[];
}

interface UseFieldSetRemovalImpactParams {
	fieldSetId: string;
	authToken: string | null | undefined;
	selectedConfigurations: number[];
	originalConfigIds: number[];
	onNoImpact: () => Promise<void>;
	onImpactDetected?: (impact: FieldSetRemovalImpactDto) => void;
	onError?: (message: string) => void;
}

export function useFieldSetRemovalImpact() {
	const [showImpactReport, setShowImpactReport] = useState(false);
	const [impactReport, setImpactReport] = useState<FieldSetRemovalImpactDto | null>(null);
	const [analyzingImpact, setAnalyzingImpact] = useState(false);

	const analyzeRemovalImpact = async ({
		fieldSetId,
		authToken,
		selectedConfigurations,
		originalConfigIds,
		onNoImpact,
		onImpactDetected,
		onError,
	}: UseFieldSetRemovalImpactParams) => {
		setAnalyzingImpact(true);
		onError?.("");
		try {
			const addedConfigIds = selectedConfigurations.filter((id) => !originalConfigIds.includes(id));
			const request: AnalyzeRemovalImpactRequest = {
				removedFieldConfigIds: originalConfigIds.filter(
					(id): id is number => id !== undefined && !selectedConfigurations.includes(id)
				),
				addedFieldConfigIds: addedConfigIds,
			};
			const response = await api.post(`/field-sets/${fieldSetId}/analyze-removal-impact`, request, {
				headers: { Authorization: `Bearer ${authToken}` },
			});
			const impact: FieldSetRemovalImpactDto = response.data;
			const hasPopulatedPermissions =
				impact.fieldOwnerPermissions?.some((p) => p.hasAssignments) ||
				impact.fieldStatusPermissions?.some((p) => p.hasAssignments);

			if (hasPopulatedPermissions) {
				setImpactReport(impact);
				setShowImpactReport(true);
				onImpactDetected?.(impact);
			} else {
				// Clean orphaned without assignments BEFORE save
				try {
					await api.post(`/field-sets/${fieldSetId}/remove-orphaned-permissions-without-assignments`, request, {
						headers: { Authorization: `Bearer ${authToken}` },
					});
				} catch {
					// proceed anyway
				}
				await onNoImpact();
			}
		} catch (err: any) {
			onError?.(err?.response?.data?.message || "Errore durante l'analisi degli impatti");
		} finally {
			setAnalyzingImpact(false);
		}
	};

	const handleCancelImpact = () => {
		setShowImpactReport(false);
		setImpactReport(null);
	};

	return {
		showImpactReport,
		impactReport,
		analyzingImpact,
		setShowImpactReport,
		setImpactReport,
		analyzeRemovalImpact,
		handleCancelImpact,
	};
}





