import { ItemTypeDto } from "../../types/itemtype.types";
import { FieldSetViewDto } from "../../types/field.types";
import { WorkflowSimpleDto } from "../../types/workflow.types";
import { ItemTypeConfigurationDto } from "../../types/itemtypeset.types";
import form from "../../styles/common/Forms.module.css";
import buttons from "../../styles/common/Buttons.module.css";
import utilities from "../../styles/common/Utilities.module.css";

interface ItemTypeConfigurationsFormProps {
  scope: "tenant" | "project";
  saving: boolean;
  availableItemTypes: ItemTypeDto[];
  categories: string[];
  fieldSets: FieldSetViewDto[];
  workflows: WorkflowSimpleDto[];
  itemTypeConfigurations: ItemTypeConfigurationDto[];
  selectedItemTypeId: string;
  selectedCategory: string;
  selectedFieldSetId: string;
  selectedWorkflowId: string;
  onChangeItemType: (value: string) => void;
  onChangeCategory: (value: string) => void;
  onChangeFieldSet: (value: string) => void;
  onChangeWorkflow: (value: string) => void;
  onAddEntry: () => void;
  onRemoveEntry: (index: number) => void;
  onUpdateEntry: (index: number, updatedFields: Partial<ItemTypeConfigurationDto>) => void;
  itemTypes: ItemTypeDto[];
}

export function ItemTypeConfigurationsForm({
  scope,
  saving,
  availableItemTypes,
  categories,
  fieldSets,
  workflows,
  itemTypeConfigurations,
  selectedItemTypeId,
  selectedCategory,
  selectedFieldSetId,
  selectedWorkflowId,
  onChangeItemType,
  onChangeCategory,
  onChangeFieldSet,
  onChangeWorkflow,
  onAddEntry,
  onRemoveEntry,
  onUpdateEntry,
  itemTypes,
}: ItemTypeConfigurationsFormProps) {
  return (
    <fieldset className={form.formGroup}>
      <legend className={form.label}>ItemTypeConfigurations</legend>

      <div className={`${form.inlineGroup} ${utilities.mb4}`}>
        <select
          value={selectedItemTypeId}
          onChange={(event) => onChangeItemType(event.target.value)}
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
          onChange={(event) => onChangeCategory(event.target.value)}
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
          onChange={(event) => onChangeFieldSet(event.target.value)}
          className={form.select}
          disabled={saving}
        >
          <option value="">
            -- Seleziona un field set {scope === "project" && "(del progetto)"} --
          </option>
          {fieldSets.map((fs) => (
            <option key={fs.id} value={fs.id}>
              {fs.name}
            </option>
          ))}
        </select>

        <select
          value={selectedWorkflowId}
          onChange={(event) => onChangeWorkflow(event.target.value)}
          className={form.select}
          disabled={saving}
        >
          <option value="">
            -- Seleziona un workflow {scope === "project" && "(del progetto)"} --
          </option>
          {workflows.map((wf) => (
            <option key={wf.id} value={wf.id}>
              {wf.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={onAddEntry}
          className={buttons.button}
          disabled={
            saving ||
            !selectedItemTypeId ||
            !selectedCategory ||
            !selectedFieldSetId ||
            !selectedWorkflowId
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
              onChange={(event) => onUpdateEntry(index, { category: event.target.value })}
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
              onChange={(event) =>
                onUpdateEntry(index, {
                  fieldSetId: Number.parseInt(event.target.value, 10),
                })
              }
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
              onChange={(event) =>
                onUpdateEntry(index, {
                  workflowId: Number.parseInt(event.target.value, 10),
                })
              }
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
              onClick={() => onRemoveEntry(index)}
              className={buttons.button}
              disabled={saving || itemTypeConfigurations.length === 1}
              title={
                itemTypeConfigurations.length === 1
                  ? "Non è possibile rimuovere l'ultima ItemTypeConfiguration"
                  : "Rimuovi configurazione"
              }
            >
              Remove
            </button>
          </div>
        );
      })}
    </fieldset>
  );
}


