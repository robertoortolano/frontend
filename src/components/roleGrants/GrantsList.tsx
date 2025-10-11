import { User, Users, ShieldOff, Edit, Trash2 } from 'lucide-react';
import layout from '../../styles/common/Layout.module.css';
import buttons from '../../styles/common/Buttons.module.css';
import utilities from '../../styles/common/Utilities.module.css';
import table from '../../styles/common/Tables.module.css';

interface UserData {
  id: number;
  username?: string;
}

interface GroupData {
  id: number;
  name: string;
}

interface GrantData {
  id: number;
  grantId: number;
  grantedUserIds?: number[];
  grantedGroupIds?: number[];
  negatedUserIds?: number[];
  negatedGroupIds?: number[];
}

interface GrantsListProps {
  grants: GrantData[];
  users: UserData[];
  groups: GroupData[];
  onEdit: (grant: GrantData) => void;
  onRemove: (grantId: number) => void;
}

export default function GrantsList({
  grants,
  users,
  groups,
  onEdit,
  onRemove
}: GrantsListProps) {
  return (
    <div className={layout.block}>
      <h3 className={layout.blockTitleBlue}>Grants Assegnati</h3>
      <div className={utilities.mt4}>
        {grants.length === 0 ? (
          <p className={layout.paragraphMuted}>Nessun grant assegnato a questo ruolo.</p>
        ) : (
          <table className={table.table}>
            <thead>
              <tr>
                <th>Grant ID</th>
                <th>Utenti Assegnati</th>
                <th>Gruppi Assegnati</th>
                <th>Utenti Negati</th>
                <th>Gruppi Negati</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {grants.map((grant) => (
                <tr key={grant.id}>
                  <td>
                    <span className="font-mono text-sm">{grant.grantId}</span>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {grant.grantedUserIds?.map(userId => {
                        const user = users.find(u => u.id === userId);
                        return (
                          <span key={userId} className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                            <User size={12} className="inline mr-1" />
                            {user?.username || userId}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {grant.grantedGroupIds?.map(groupId => {
                        const group = groups.find(g => g.id === groupId);
                        return (
                          <span key={groupId} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            <Users size={12} className="inline mr-1" />
                            {group?.name || groupId}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {grant.negatedUserIds?.map(userId => {
                        const user = users.find(u => u.id === userId);
                        return (
                          <span key={userId} className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                            <ShieldOff size={12} className="inline mr-1" />
                            {user?.username || userId}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {grant.negatedGroupIds?.map(groupId => {
                        const group = groups.find(g => g.id === groupId);
                        return (
                          <span key={groupId} className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                            <ShieldOff size={12} className="inline mr-1" />
                            {group?.name || groupId}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button
                        onClick={() => onEdit(grant)}
                        className={`${buttons.button} ${buttons.buttonSmall} ${buttons.buttonSecondary}`}
                        title="Modifica Grant"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => onRemove(grant.grantId)}
                        className={`${buttons.button} ${buttons.buttonSmall} ${buttons.buttonDanger}`}
                        title="Rimuovi Grant"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}


