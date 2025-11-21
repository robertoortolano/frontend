import { useMemo, useState } from "react";
import {
	useSensor,
	useSensors,
	PointerSensor,
	KeyboardSensor,
	type DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates, arrayMove } from "@dnd-kit/sortable";
import type { FieldConfigurationViewDto } from "../types/field.types";

export interface Field {
	id: number;
	name: string;
	defaultField?: boolean;
}

interface UseFieldSetConfigurationsParams {
	fields: Field[];
	fieldConfigurations: FieldConfigurationViewDto[];
	initialSelectedConfigurations?: number[];
}

export function useFieldSetConfigurations({
	fields,
	fieldConfigurations,
	initialSelectedConfigurations = [],
}: UseFieldSetConfigurationsParams) {
	const [selectedConfigurations, setSelectedConfigurations] = useState<number[]>(
		initialSelectedConfigurations
	);

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);

	const handleConfigurationSelect = (configId: number) => {
		const selectedConfig = fieldConfigurations.find((config) => config.id === configId);
		if (!selectedConfig) return;

		const existingConfigIndex = selectedConfigurations.findIndex((id) => {
			const config = fieldConfigurations.find((c) => c.id === id);
			return config && config.fieldId === selectedConfig.fieldId;
		});

		if (selectedConfigurations.includes(configId)) {
			const newConfigurations = selectedConfigurations.filter((id) => id !== configId);
			setSelectedConfigurations(newConfigurations);
		} else {
			const newConfigurations = [...selectedConfigurations];
			if (existingConfigIndex !== -1) {
				newConfigurations[existingConfigIndex] = configId;
			} else {
				newConfigurations.push(configId);
			}
			setSelectedConfigurations(newConfigurations);
		}
	};

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		if (over && active.id !== over.id) {
			const oldIndex = selectedConfigurations.indexOf(active.id as number);
			const newIndex = selectedConfigurations.indexOf(over.id as number);
			if (oldIndex !== -1 && newIndex !== -1) {
				setSelectedConfigurations(arrayMove(selectedConfigurations, oldIndex, newIndex));
			}
		}
	};

	const removeConfiguration = (configId: number) => {
		setSelectedConfigurations((prev) => prev.filter((id) => id !== configId));
	};

	const configurationsByField = useMemo(
		() =>
			fields
				.map((field) => ({
					field,
					configurations: fieldConfigurations.filter((config) => config.fieldId === field.id),
				}))
				.filter(({ configurations }) => configurations.length > 0),
		[fields, fieldConfigurations]
	);

	return {
		// state
		selectedConfigurations,
		setSelectedConfigurations,
		// dnd
		sensors,
		handleDragEnd,
		// selection helpers
		handleConfigurationSelect,
		removeConfiguration,
		// derived
		configurationsByField,
	};
}










