import { FormEvent } from "react";
import layout from "../../../styles/common/Layout.module.css";
import form from "../../../styles/common/Forms.module.css";
import buttons from "../../../styles/common/Buttons.module.css";
import alert from "../../../styles/common/Alerts.module.css";
import sidebarStyles from "../../../styles/common/FieldSetSidebar.module.css";
import {
	DndContext,
	closestCenter,
	type DragEndEvent,
} from "@dnd-kit/core";
import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { FieldConfigurationViewDto } from "../../../types/field.types";

export interface Field {
	id: number;
	name: string;
	defaultField?: boolean;
}

interface SortableSidebarConfigProps {
	configId: number;
	config: FieldConfigurationViewDto;
	field: Field | undefined;
	onRemove: () => void;
}

function SortableSidebarConfig({
	configId,
	config,
	field,
	onRemove,
}: SortableSidebarConfigProps) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: configId,
	});
	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};
	return (
		<div
			ref={setNodeRef}
			style={style}
			className={`${sidebarStyles.sidebarConfigCard} ${isDragging ? sidebarStyles.dragging : ""}`}
		>
			<div className={sidebarStyles.sidebarConfigDragHandle} title="Trascina per riordinare" {...attributes} {...listeners}>
				⋮⋮
			</div>
			<div className={sidebarStyles.sidebarConfigFieldLabel}>{field?.name || "Field sconosciuto"}</div>
			<div className={sidebarStyles.sidebarConfigName}>{config.name || "Senza nome"}</div>
			<div className={sidebarStyles.sidebarConfigDetails}>Tipo: {config.fieldType?.displayName || "Sconosciuto"}</div>
			<button
				type="button"
				onClick={(e) => {
					e.preventDefault();
					e.stopPropagation();
					onRemove();
				}}
				className={sidebarStyles.sidebarConfigRemove}
				title="Rimuovi"
			>
				✕
			</button>
		</div>
	);
}

interface FieldSetConfigurationsPanelProps {
	selectedConfigurations: number[];
	sensors: any;
	handleDragEnd: (event: DragEndEvent) => void;
	fieldConfigurations: FieldConfigurationViewDto[];
	fields: Field[];
	removeConfiguration: (configId: number) => void;
	configurationsByField: Array<{ field: Field; configurations: FieldConfigurationViewDto[] }>;
	saving: boolean;
	handleConfigurationSelect: (configId: number) => void;
}

function FieldSetConfigurationsPanel({
	selectedConfigurations,
	sensors,
	handleDragEnd,
	fieldConfigurations,
	fields,
	removeConfiguration,
	configurationsByField,
	saving,
	handleConfigurationSelect,
}: FieldSetConfigurationsPanelProps) {
	return (
		<div className={sidebarStyles.fieldSetSidebarContainer}>
			<div className={sidebarStyles.selectedSidebar}>
				<div className={sidebarStyles.selectedSidebarHeader}>
					<div className={sidebarStyles.selectedSidebarTitle}>
						<span>✅</span>
						<span>Configurazioni Selezionate</span>
					</div>
					<div className={sidebarStyles.selectedSidebarCount}>
						<span className={sidebarStyles.selectedSidebarCountBadge}>{selectedConfigurations.length}</span>
						<span>{selectedConfigurations.length === 1 ? "configurazione" : "configurazioni"}</span>
					</div>
				</div>
				<div className={sidebarStyles.selectedSidebarBody}>
					{selectedConfigurations.length === 0 ? (
						<div className={sidebarStyles.sidebarEmpty}>
							<div className={sidebarStyles.sidebarEmptyIcon}>📝</div>
							<div style={{ fontSize: "0.8125rem" }}>Nessuna configurazione selezionata</div>
						</div>
					) : (
						<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
							<SortableContext items={selectedConfigurations} strategy={verticalListSortingStrategy}>
								{selectedConfigurations.map((configId) => {
									const config = fieldConfigurations.find((c) => c.id === configId);
									const field = config ? fields.find((f) => f.id === config.fieldId) : undefined;
									return config ? (
										<SortableSidebarConfig
											key={configId}
											configId={configId}
											config={config}
											field={field}
											onRemove={() => removeConfiguration(configId)}
										/>
									) : null;
								})}
							</SortableContext>
						</DndContext>
					)}
				</div>
			</div>

			<div className={sidebarStyles.mainContentArea}>
				<div className={sidebarStyles.sidebarInfo}>
					<strong>💡 Come funziona:</strong>
					<div>
						Seleziona una configurazione per ogni Field. Se selezioni una nuova configurazione per un Field già
						presente, quella precedente verrà sostituita automaticamente. Puoi riordinare le configurazioni
						selezionate trascinandole nella sidebar.
					</div>
				</div>

				{fields.length === 0 ? (
					<div className={alert.infoContainer}>
						<p className={alert.info}>
							<strong>Nessun campo disponibile</strong>
							<br />
							Crea prima dei campi per poter modificare un field set.
						</p>
					</div>
				) : (
					configurationsByField.map(({ field, configurations }) => (
						<div key={field.id} className={sidebarStyles.sidebarFieldCard}>
							<div className={sidebarStyles.sidebarFieldHeader}>
								<div className={sidebarStyles.sidebarFieldHeaderContent}>
									<span className={sidebarStyles.sidebarFieldIcon}>📋</span>
									<span className={sidebarStyles.sidebarFieldName}>{field.name}</span>
									<span className={sidebarStyles.sidebarFieldBadge}>{configurations.length} disponibili</span>
								</div>
							</div>
							<div className={sidebarStyles.sidebarConfigurationsArea}>
								{configurations.length === 0 ? (
									<div
										style={{
											padding: "1rem",
											textAlign: "center",
											color: "#9ca3af",
											fontSize: "0.875rem",
										}}
									>
										Nessuna configurazione disponibile
									</div>
								) : (
									<div className={sidebarStyles.sidebarConfigurationsList}>
										{configurations.map((config) => {
											const isSelected = selectedConfigurations.includes(config.id);
											return (
												<label
													key={config.id}
													className={`${sidebarStyles.sidebarConfigItem} ${isSelected ? sidebarStyles.selected : ""}`}
												>
													<div className={sidebarStyles.sidebarConfigItemContent}>
														<div className={sidebarStyles.sidebarConfigItemName}>{config.name || "Senza nome"}</div>
														<div className={sidebarStyles.sidebarConfigItemDetails}>
															Tipo: {config.fieldType?.displayName || "Sconosciuto"}
															{config.description && ` • ${config.description}`}
														</div>
													</div>
													<input
														type="radio"
														name={`selectedConfiguration_${field.id}`}
														checked={isSelected}
														onChange={() => handleConfigurationSelect(config.id)}
														disabled={saving}
														className={sidebarStyles.sidebarConfigItemCheckbox}
													/>
												</label>
											);
										})}
									</div>
								)}
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
}

interface FieldSetEditFormProps {
	title: string;
	description: string;
	error: string | null;
	saving: boolean;
	analyzingImpact: boolean;
	fieldSetName: string;
	fieldSetDescription?: string | null;
	onChangeName: (value: string) => void;
	onChangeDescription: (value: string) => void;
	onSubmit: (e: FormEvent<HTMLFormElement>) => void;
	onCancel: () => void;

	// configurations panel
	selectedConfigurations: number[];
	sensors: any;
	handleDragEnd: (event: DragEndEvent) => void;
	fieldConfigurations: FieldConfigurationViewDto[];
	fields: Field[];
	removeConfiguration: (configId: number) => void;
	configurationsByField: Array<{ field: Field; configurations: FieldConfigurationViewDto[] }>;
	handleConfigurationSelect: (configId: number) => void;
}

export function FieldSetEditForm({
	title,
	description,
	error,
	saving,
	analyzingImpact,
	fieldSetName,
	fieldSetDescription,
	onChangeName,
	onChangeDescription,
	onSubmit,
	onCancel,
	selectedConfigurations,
	sensors,
	handleDragEnd,
	fieldConfigurations,
	fields,
	removeConfiguration,
	configurationsByField,
	handleConfigurationSelect,
}: FieldSetEditFormProps) {
	return (
		<>
			{error && (
				<div className={alert.errorContainer}>
					<p className={alert.error}>{error}</p>
				</div>
			)}
			<form onSubmit={onSubmit} className={form.form}>
				<div className={layout.pageHeader}>
					<h1 className={layout.pageTitle}>{title}</h1>
					<p className={layout.pageDescription}>{description}</p>
				</div>

				<div className={layout.pageSection}>
					<h2 className={layout.pageSectionTitle}>Informazioni Base</h2>
					<div className="space-y-6">
						<div className={form.formGroup}>
							<label htmlFor="name" className={form.label}>
								Nome del Field Set *
							</label>
							<input
								id="name"
								className={form.input}
								type="text"
								value={fieldSetName || ""}
								onChange={(e) => onChangeName(e.target.value)}
								placeholder="Es. Configurazione Utenti, Campi Progetto, etc."
								required
								disabled={saving}
							/>
							<p className={form.helpText}>Scegli un nome descrittivo per identificare facilmente questo field set.</p>
						</div>

						<div className={form.formGroup}>
							<label htmlFor="description" className={form.label}>
								Descrizione
							</label>
							<textarea
								id="description"
								className={form.textarea}
								value={fieldSetDescription || ""}
								onChange={(e) => onChangeDescription(e.target.value)}
								placeholder="Descrivi lo scopo e l'utilizzo di questo field set (opzionale)"
								rows={3}
								disabled={saving}
							/>
							<p className={form.helpText}>
								Aggiungi una descrizione per aiutare gli altri utenti a capire quando utilizzare questo field set.
							</p>
						</div>
					</div>
				</div>

				<FieldSetConfigurationsPanel
					selectedConfigurations={selectedConfigurations}
					sensors={sensors}
					handleDragEnd={handleDragEnd}
					fieldConfigurations={fieldConfigurations}
					fields={fields}
					removeConfiguration={removeConfiguration}
					configurationsByField={configurationsByField}
					saving={saving}
					handleConfigurationSelect={handleConfigurationSelect}
				/>

				<div className={layout.buttonRow} style={{ marginTop: "2rem" }}>
					<button
						type="submit"
						className={buttons.button}
						disabled={saving || analyzingImpact || !fieldSetName?.trim() || selectedConfigurations.length === 0}
					>
						{analyzingImpact ? "Analisi impatti..." : saving ? "Salvataggio..." : "Salva Modifiche"}
					</button>
					<button type="button" className={buttons.button} onClick={onCancel} disabled={saving}>
						Annulla
					</button>
				</div>
			</form>
		</>
	);
}


