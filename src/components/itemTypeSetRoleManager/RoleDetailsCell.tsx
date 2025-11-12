interface RoleDetailsCellProps {
  role: any;
}

export const RoleDetailsCell = ({ role }: RoleDetailsCellProps) => {
  if (!role) {
    return null;
  }

  return (
    <div className="text-sm text-gray-600">
      {role.itemType && (
        <div>
          <strong>ItemType:</strong> {role.itemType.name}
        </div>
      )}
      {role.workflowStatus && (
        <div>
          <strong>Stato:</strong> {role.workflowStatus.name}
        </div>
      )}
      {role.transition && (
        <div>
          <strong>Transizione:</strong>{" "}
          {role.fromStatus?.name || "N/A"} → {role.toStatus?.name || "N/A"}
          {role.transition.name && role.transition.name !== "N/A" && (
            <span className="ml-1 text-xs text-gray-500">
              ({role.transition.name})
            </span>
          )}
        </div>
      )}
      {role.fieldConfiguration && (
        <div>
          <strong>Field:</strong> {role.fieldConfiguration.name}
        </div>
      )}
    </div>
  );
};



