import { useState, ChangeEvent, FormEvent } from "react";
import { X, Save } from "lucide-react";
import api from "../api/api";

import layout from "../styles/common/Layout.module.css";
import buttons from "../styles/common/Buttons.module.css";
import alert from "../styles/common/Alerts.module.css";

const ROLE_TYPES = [
  { value: "WORKER", label: "Worker", description: "Per ogni ItemType" },
  { value: "OWNER", label: "Owner", description: "Per ogni WorkflowStatus" },
  { value: "FIELD_EDITOR", label: "Field Editor", description: "Per ogni FieldConfiguration (sempre)" },
  { value: "CREATOR", label: "Creator", description: "Per ogni Workflow" },
  { value: "EXECUTOR", label: "Executor", description: "Per ogni Transition" },
  { value: "EDITOR", label: "Editor", description: "Per coppia (Field + Status)" },
  { value: "VIEWER", label: "Viewer", description: "Per coppia (Field + Status)" },
];

const ENTITY_TYPES = ["ItemType", "WorkflowStatus", "FieldConfiguration", "Workflow", "Transition", "ItemTypeConfiguration"];

interface CreateRoleFormProps {
  itemTypeSetId: number;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateRoleForm({ itemTypeSetId, onClose, onSuccess }: CreateRoleFormProps) {
  const [formData, setFormData] = useState({
    roleType: "WORKER",
    name: "",
    description: "",
    relatedEntityType: "ItemType",
    relatedEntityId: "",
    secondaryEntityType: "",
    secondaryEntityId: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "roleType" || name === "relatedEntityId" || name === "secondaryEntityId") {
      generateRoleName();
    }
  };

  const generateRoleName = () => {
    const roleType = ROLE_TYPES.find((r) => r.value === formData.roleType);
    if (!roleType) return;

    let name = roleType.label;

    if (formData.relatedEntityId) {
      name += ` for ${formData.relatedEntityType} ${formData.relatedEntityId}`;
    }

    if (formData.secondaryEntityId && (formData.roleType === "EDITOR" || formData.roleType === "VIEWER")) {
      name += ` in ${formData.secondaryEntityType} ${formData.secondaryEntityId}`;
    }

    setFormData((prev) => ({
      ...prev,
      name: name,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const roleData = {
        ...formData,
        itemTypeSetId: itemTypeSetId,
        relatedEntityId: formData.relatedEntityId ? parseInt(formData.relatedEntityId) : null,
        secondaryEntityId: formData.secondaryEntityId ? parseInt(formData.secondaryEntityId) : null,
      };

      await api.post("/itemtypeset-roles", roleData);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError("Errore nella creazione del ruolo");
      console.error("Error creating role:", err);
    } finally {
      setLoading(false);
    }
  };

  const isPairRole = formData.roleType === "EDITOR" || formData.roleType === "VIEWER";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className={layout.title}>Crea Nuovo Ruolo</h2>
          <button onClick={onClose} className={`${buttons.button} ${buttons.buttonSecondary}`}>
            <X size={20} />
          </button>
        </div>

        {error && <div className={`${alert.error} mb-4`}>{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo Ruolo *</label>
            <select
              name="roleType"
              value={formData.roleType}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              {ROLE_TYPES.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label} - {role.description}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nome Ruolo *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Descrizione</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo Entità Correlata *</label>
            <select
              name="relatedEntityType"
              value={formData.relatedEntityType}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              {ENTITY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ID Entità Correlata *</label>
            <input
              type="number"
              name="relatedEntityId"
              value={formData.relatedEntityId}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {isPairRole && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo Entità Secondaria *</label>
                <select
                  name="secondaryEntityType"
                  value={formData.secondaryEntityType}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Seleziona tipo</option>
                  <option value="FieldConfiguration">FieldConfiguration</option>
                  <option value="WorkflowStatus">WorkflowStatus</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ID Entità Secondaria *</label>
                <input
                  type="number"
                  name="secondaryEntityId"
                  value={formData.secondaryEntityId}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={onClose} className={`${buttons.button} ${buttons.buttonSecondary}`}>
              Annulla
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`${buttons.button} ${buttons.buttonPrimary} ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {loading ? (
                "Creazione..."
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  Crea Ruolo
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

