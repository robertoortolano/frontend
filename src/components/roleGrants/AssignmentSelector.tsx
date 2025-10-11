import { Plus } from 'lucide-react';
import layout from '../../styles/common/Layout.module.css';
import buttons from '../../styles/common/Buttons.module.css';
import utilities from '../../styles/common/Utilities.module.css';

interface GrantData {
  id: number;
  name?: string;
  description?: string;
}

interface RoleData {
  id: number;
  name: string;
  scope?: string;
}

interface AssignmentSelectorProps {
  mode: 'GRANT' | 'ROLE';
  availableGrants: GrantData[];
  availableRoles: RoleData[];
  onAssignGrant: (grantId: number) => void;
  onAssignRole: (roleId: number) => void;
}

export default function AssignmentSelector({
  mode,
  availableGrants,
  availableRoles,
  onAssignGrant,
  onAssignRole
}: AssignmentSelectorProps) {
  return (
    <div className={layout.block}>
      <h3 className={layout.blockTitleBlue}>
        {mode === 'GRANT' ? 'Assegna Grant Diretto' : 'Assegna Role Template'}
      </h3>
      <div className={utilities.mt4}>
        <p className={layout.paragraphMuted}>
          {mode === 'GRANT' 
            ? 'Seleziona un grant da assegnare direttamente a questo ruolo.'
            : 'Seleziona un ruolo template da assegnare a questo ruolo.'
          }
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {mode === 'GRANT' ? (
            availableGrants.map((grant) => (
              <div key={grant.id} className="p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">{grant.name || `Grant ${grant.id}`}</h4>
                    <p className="text-sm text-gray-600">{grant.description || 'Nessuna descrizione'}</p>
                  </div>
                  <button
                    onClick={() => onAssignGrant(grant.id)}
                    className={`${buttons.button} ${buttons.buttonSmall} ${buttons.buttonPrimary}`}
                  >
                    <Plus size={16} className="mr-1" />
                    Assegna
                  </button>
                </div>
              </div>
            ))
          ) : (
            availableRoles.map((role) => (
              <div key={role.id} className="p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">{role.name}</h4>
                    <p className="text-sm text-gray-600">Scope: {role.scope}</p>
                  </div>
                  <button
                    onClick={() => onAssignRole(role.id)}
                    className={`${buttons.button} ${buttons.buttonSmall} ${buttons.buttonPrimary}`}
                  >
                    <Plus size={16} className="mr-1" />
                    Assegna
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}


