import table from "../../../styles/common/Tables.module.css";
import alert from "../../../styles/common/Alerts.module.css";
import utilities from "../../../styles/common/Utilities.module.css";

interface ProjectMember {
  userId: number;
  username: string;
  fullName: string | null;
  roleName: string;
  isTenantAdmin: boolean;
}

interface ProjectMembersTableProps {
  members: ProjectMember[];
}

export function ProjectMembersTable({ members }: ProjectMembersTableProps) {
  if (members.length === 0) {
    return (
      <p className={`${alert.muted} ${utilities.mt4}`}>
        Nessun membro assegnato a questo progetto.
      </p>
    );
  }

  return (
    <>
      <table className={`${table.table} ${utilities.mt4}`}>
        <thead>
          <tr>
            <th>Email</th>
            <th>Nome Completo</th>
            <th>Ruolo</th>
          </tr>
        </thead>
        <tbody>
          {members.slice(0, 5).map((member) => (
            <tr key={member.userId} className={member.isTenantAdmin ? "bg-gray-50" : ""}>
              <td>
                {member.username}
                {member.isTenantAdmin && (
                  <span className="ml-2 text-xs text-gray-500">(Tenant Admin)</span>
                )}
              </td>
              <td>
                {member.fullName || <span className="italic text-gray-400">-</span>}
              </td>
              <td>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    member.roleName === "ADMIN"
                      ? "bg-purple-100 text-purple-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {member.roleName === "ADMIN" ? "Admin" : "User"}
                  {member.isTenantAdmin && " (fisso)"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {members.length > 5 && (
        <p className="mt-2 text-sm text-gray-500">... e altri {members.length - 5} membri</p>
      )}
    </>
  );
}











