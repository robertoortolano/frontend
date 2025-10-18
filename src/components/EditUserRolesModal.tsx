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

const TENANT_ROLES = [
  { name: "ADMIN", label: "Tenant Admin", description: "Gestione completa della tenant: configurazioni globali, utenti, ruoli" },
  { name: "USER", label: "Tenant User", description: "Accesso base alla tenant" }
];

export default function EditUserRolesModal({
  userId,
  username,
  currentRoles,
  onSave,
  onClose
}: EditUserRolesModalProps) {
  const [selectedTenantRole, setSelectedTenantRole] = useState<string>(
    currentRoles.find(r => r === "ADMIN" || r === "USER") || "USER"
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tenantRole = currentRoles.find(r => r === "ADMIN" || r === "USER") || "USER";
    setSelectedTenantRole(tenantRole);
  }, [currentRoles]);

  const handleSave = async () => {
    if (!selectedTenantRole) {
      setError("Seleziona un ruolo tenant");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      
      // Salva solo il ruolo tenant
      await onSave(userId, [selectedTenantRole]);
      
      onClose();
    } catch (err: any) {
      setError(err.message || err.response?.data?.message || "Errore nel salvataggio del ruolo");
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
            Seleziona il ruolo tenant per questo utente. Per assegnare ruoli a livello progetto, 
            vai nelle impostazioni del progetto specifico.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Tenant Level Roles */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Ruolo Tenant
            </h3>
            <div className="space-y-2">
              {TENANT_ROLES.map(role => (
                <label
                  key={role.name}
                  htmlFor={`tenant-role-${role.name}`}
                  className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedTenantRole === role.name
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    id={`tenant-role-${role.name}`}
                    type="radio"
                    name="tenantRole"
                    checked={selectedTenantRole === role.name}
                    onChange={() => setSelectedTenantRole(role.name)}
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
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>💡 Nota:</strong> I ruoli progetto (Admin/User di singoli progetti) si gestiscono 
              direttamente dalle impostazioni di ciascun progetto.
            </p>
          </div>

          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Attenzione:</strong> Se questo è l'ultimo ADMIN della tenant, non potrai cambiare il ruolo da ADMIN a USER.
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
            disabled={saving || !selectedTenantRole}
            className={`${buttons.button} ${buttons.buttonPrimary}`}
          >
            {saving ? "Salvataggio..." : "Salva Modifiche"}
          </button>
        </div>
      </div>
    </div>
  );
}

