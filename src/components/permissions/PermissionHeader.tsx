interface Permission {
  name: string;
  workflowStatus?: { name: string };
  workflow?: { name: string };
  itemType?: { name: string };
  fieldConfiguration?: { name: string; fieldType: string };
  fromStatus?: { name: string };
  toStatus?: { name: string };
  transition?: any;
}

interface PermissionHeaderProps {
  permission: Permission;
}

export default function PermissionHeader({ permission }: PermissionHeaderProps) {
  return (
    <div className="mb-6" style={{ 
      backgroundColor: 'white', 
      padding: '1rem',
      borderRadius: '0.5rem',
      border: '1px solid #e5e7eb'
    }}>
      <div>
        <h2 style={{ 
          fontSize: '1.25rem', 
          fontWeight: '600', 
          marginBottom: '0.5rem',
          color: '#1e3a8a',
          backgroundColor: 'white'
        }}>Gestione Permission: {permission.name}</h2>
        
        {permission.workflowStatus && (
          <p style={{ 
            fontSize: '0.875rem', 
            marginTop: '0.25rem',
            color: '#1e3a8a',
            backgroundColor: 'white'
          }}>
            Stato: {permission.workflowStatus.name} - Workflow: {permission.workflow?.name} - ItemType: {permission.itemType?.name}
          </p>
        )}
        
        {permission.fieldConfiguration && (
          <p style={{ 
            fontSize: '0.875rem', 
            marginTop: '0.25rem',
            color: '#1e3a8a',
            backgroundColor: 'white'
          }}>
            Field: {permission.fieldConfiguration.name} - Tipologia: {permission.fieldConfiguration.fieldType} - ItemType: {permission.itemType?.name}
          </p>
        )}
        
        {permission.workflow && !permission.workflowStatus && !permission.fieldConfiguration && (
          <p style={{ 
            fontSize: '0.875rem', 
            marginTop: '0.25rem',
            color: '#1e3a8a',
            backgroundColor: 'white'
          }}>
            Workflow: {permission.workflow.name} - ItemType: {permission.itemType?.name}
          </p>
        )}
        
        {permission.transition && (
          <p style={{ 
            fontSize: '0.875rem', 
            marginTop: '0.25rem',
            color: '#1e3a8a',
            backgroundColor: 'white'
          }}>
            Transizione: {permission.fromStatus?.name} → {permission.toStatus?.name} - Workflow: {permission.workflow?.name} - ItemType: {permission.itemType?.name}
          </p>
        )}
      </div>
    </div>
  );
}


