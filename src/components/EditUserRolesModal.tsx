import { useState, useEffect } from "react";
import { X } from "lucide-react";
import buttons from "../styles/common/Buttons.module.css";

interface EditUserRolesModalProps {
  userId: number;
  username: string;
  currentRoles: string[];
  onSave: (userId: number, selectedRoles: string[]) => Promise<void>;
  onClose: () => void;
}

const AVAILABLE_ROLES = [
  { name: "ADMIN", label: "Admin", description: "Accesso completo alla tenant" },
  { name: "USER", label: "User", description: "Accesso base alla tenant" }
];

export default function EditUserRolesModal({
  userId,
  username,
  currentRoles,
  onSave,
  onClose
}: EditUserRolesModalProps) {
  const [selectedRole, setSelectedRole] = useState<string>(currentRoles[0] || "USER");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedRole(currentRoles[0] || "USER");
  }, [currentRoles]);

  const handleRoleChange = (roleName: string) => {
    setSelectedRole(roleName);
    setError(null);
  };

  const handleSave = async () => {
    if (!selectedRole) {
      setError("Seleziona un ruolo");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await onSave(userId, [selectedRole]);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Errore nel salvataggio del ruolo");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-xl font-semibold">Modifica Ruoli Utente</h2>
            <p className="text-sm text-gray-600">{username}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={saving}
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          <p className="text-sm text-gray-600 mb-4">
            Seleziona il ruolo da assegnare a questo utente. I ruoli ADMIN e USER sono mutualmente esclusivi.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-3">
            {AVAILABLE_ROLES.map(role => (
              <label
                key={role.name}
                htmlFor={`role-${role.name}`}
                aria-label={`Select role ${role.label}`}
                className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedRole === role.name
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  id={`role-${role.name}`}
                  type="radio"
                  name="userRole"
                  checked={selectedRole === role.name}
                  onChange={() => handleRoleChange(role.name)}
                  disabled={saving}
                  className="mt-1 mr-3"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{role.label}</div>
                  <div className="text-sm text-gray-600">{role.description}</div>
                </div>
              </label>
            ))}
          </div>

          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Nota:</strong> Se questo è l'ultimo ADMIN della tenant, non potrai cambiare il ruolo da ADMIN a USER.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            disabled={saving}
            className={`${buttons.button} ${buttons.buttonSecondary}`}
          >
            Annulla
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !selectedRole}
            className={`${buttons.button} ${buttons.buttonPrimary}`}
          >
            {saving ? "Salvataggio..." : "Salva Modifiche"}
          </button>
        </div>
      </div>
    </div>
  );
}

