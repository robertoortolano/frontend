import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Save } from 'lucide-react';
import api from '../api/api';
import groupService from '../services/groupService';
import UserAutocomplete, { UserOption } from './UserAutocomplete';

import buttons from '../styles/common/Buttons.module.css';
import alert from '../styles/common/Alerts.module.css';

import PermissionHeader from './permissions/PermissionHeader';
import RoleAssignmentSection from './permissions/RoleAssignmentSection';


interface Role {
  id: number;
  name: string;
  description?: string;
}

// User è già definito in UserAutocomplete come UserOption

interface Group {
  id: number;
  name: string;
}

interface Permission {
  id: number | string;
  name: string;
  workflowStatus?: { id?: number; name: string };
  workflow?: { id?: number; name: string };
  itemType?: { id?: number; name: string };
  fieldConfiguration?: { id?: number; name: string; fieldType: string };
  fromStatus?: { id?: number; name: string };
  toStatus?: { id?: number; name: string };
  transition?: { id?: number; [key: string]: any };
  assignedRoles?: Role[];
  // Nuovi campi per Grant diretto
  grantId?: number;
  grantName?: string;
  roleTemplateId?: number;
  roleTemplateName?: string;
  assignmentType?: string; // "GRANT", "ROLE", "GRANTS", "NONE"
  itemTypeSetRoleId?: number;
  hasProjectGrant?: boolean;
  projectGrantId?: number;
}

interface PermissionGrantManagerProps {
  permission: Permission;
  onClose: () => void;
  onSave: () => void;
  itemTypeSetId?: number; // Per contesto ITS
  scope?: 'tenant' | 'project'; // Per sapere se siamo in un contesto progetto
  projectId?: string; // Per GrantRoleAssignment PROJECT-level
}

// Mappatura dei nomi delle permissions ai tipi che il backend si aspetta
const getPermissionType = (permissionName: string): string => {
  const mapping: { [key: string]: string } = {
    'Workers': 'WORKERS',
    'Creators': 'CREATORS', 
    'Status Owners': 'STATUS_OWNERS',
    'Executors': 'EXECUTORS',
    'Field Owners': 'FIELD_OWNERS',
    'Editors': 'EDITORS',
    'Viewers': 'VIEWERS'
  };
  
  return mapping[permissionName] || permissionName?.toUpperCase();
};

export default function PermissionGrantManager({ 
  permission, 
  onClose, 
  onSave,
  itemTypeSetId,
  scope = 'tenant',
  projectId
}: PermissionGrantManagerProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Stati per ruoli (Role template)
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  
  // Stati per Grant diretto globale - selezione utenti/gruppi
  const [grantUsers, setGrantUsers] = useState<UserOption[]>([]);
  const [grantGroups, setGrantGroups] = useState<Group[]>([]);
  const [grantNegatedUsers, setGrantNegatedUsers] = useState<UserOption[]>([]);
  const [grantNegatedGroups, setGrantNegatedGroups] = useState<Group[]>([]);
  
  // Stati per Grant diretto di progetto - selezione utenti/gruppi
  const [projectGrantUsers, setProjectGrantUsers] = useState<UserOption[]>([]);
  const [projectGrantGroups, setProjectGrantGroups] = useState<Group[]>([]);
  const [projectGrantNegatedUsers, setProjectGrantNegatedUsers] = useState<UserOption[]>([]);
  const [projectGrantNegatedGroups, setProjectGrantNegatedGroups] = useState<Group[]>([]);
  
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  
  // Flag per distinguere se stiamo modificando grant globale o di progetto
  const [editingProjectGrant, setEditingProjectGrant] = useState(false);

  useEffect(() => {
    if (permission) {
      fetchAvailableRoles();
      fetchAvailableGroups();
      
      // Inizializza con i dati esistenti
      setSelectedRoles(permission.assignedRoles || []);
      
      // Se c'è già un Grant globale assegnato, carica i suoi dettagli
      // MA solo se NON siamo in modalità progetto (dove le globali sono già visibili in sola lettura)
      const itemTypeSetRoleId = (permission as any).itemTypeSetRoleId || permission.id;
      if (scope !== 'project' && permission.grantId && itemTypeSetRoleId && typeof itemTypeSetRoleId === 'number') {
        fetchGrantDetails(itemTypeSetRoleId);
      } else {
        // Reset se non c'è grant globale o siamo in modalità progetto
        setGrantUsers([]);
        setGrantGroups([]);
        setGrantNegatedUsers([]);
        setGrantNegatedGroups([]);
      }
      
      // Se siamo in un progetto e c'è una grant di progetto, carica i suoi dettagli
      if (scope === 'project' && projectId && itemTypeSetRoleId && typeof itemTypeSetRoleId === 'number') {
        const hasProjectGrant = (permission as any).hasProjectGrant;
        if (hasProjectGrant) {
          fetchProjectGrantDetails(itemTypeSetRoleId, Number(projectId));
        } else {
          setProjectGrantUsers([]);
          setProjectGrantGroups([]);
          setProjectGrantNegatedUsers([]);
          setProjectGrantNegatedGroups([]);
        }
      }
    }
  }, [permission]);
  
  const fetchGrantDetails = async (roleId: number) => {
    try {
      const response = await api.get(`/itemtypeset-roles/${roleId}/grant-details`);
      const grantDetails = response.data;
      
      // Converte i dati del backend al formato UserOption
      // UserSimpleDto ha: id, username, fullName
      const mappedUsers = grantDetails.users?.map((u: any) => ({
        id: u.id,
        username: u.username || '',
        fullName: u.fullName || u.username || 'Utente'
      })) || [];
      
      setGrantUsers(mappedUsers);
      
      setGrantGroups(grantDetails.groups?.map((g: any) => ({
        id: g.id,
        name: g.name
      })) || []);
      
      setGrantNegatedUsers(grantDetails.negatedUsers?.map((u: any) => ({
        id: u.id,
        username: u.username || '',
        fullName: u.fullName || u.username || 'Utente'
      })) || []);
      
      setGrantNegatedGroups(grantDetails.negatedGroups?.map((g: any) => ({
        id: g.id,
        name: g.name
      })) || []);
    } catch (err) {
      console.error('Error fetching grant details:', err);
      // Se non riesce a caricare, resetta i campi
      setGrantUsers([]);
      setGrantGroups([]);
      setGrantNegatedUsers([]);
      setGrantNegatedGroups([]);
    }
  };
  
  const fetchProjectGrantDetails = async (roleId: number, projectId: number) => {
    try {
      const response = await api.get(`/project-itemtypeset-role-grants/project/${projectId}/role/${roleId}`);
      const grantDetails = response.data;
      
      const mappedUsers = grantDetails.users?.map((u: any) => ({
        id: u.id,
        username: u.username || '',
        fullName: u.fullName || u.username || 'Utente'
      })) || [];
      
      setProjectGrantUsers(mappedUsers);
      
      setProjectGrantGroups(grantDetails.groups?.map((g: any) => ({
        id: g.id,
        name: g.name
      })) || []);
      
      setProjectGrantNegatedUsers(grantDetails.negatedUsers?.map((u: any) => ({
        id: u.id,
        username: u.username || '',
        fullName: u.fullName || u.username || 'Utente'
      })) || []);
      
      setProjectGrantNegatedGroups(grantDetails.negatedGroups?.map((g: any) => ({
        id: g.id,
        name: g.name
      })) || []);
    } catch (err: any) {
      // Se la grant di progetto non esiste, è normale
      if (err.response?.status !== 404) {
        console.error('Error fetching project grant details:', err);
      }
      setProjectGrantUsers([]);
      setProjectGrantGroups([]);
      setProjectGrantNegatedUsers([]);
      setProjectGrantNegatedGroups([]);
    }
  };

  const fetchAvailableRoles = async () => {
    try {
      const response = await api.get('/itemtypeset-permissions/roles');
      setAvailableRoles(response.data);
    } catch (err) {
      console.error('Error fetching roles:', err);
    }
  };

  // Non serve fetchAvailableUsers - UserAutocomplete fa ricerca on-demand

  const fetchAvailableGroups = async () => {
    try {
      const groups = await groupService.getAll();
      setAvailableGroups(groups.map(g => ({ id: g.id, name: g.name })));
    } catch (err) {
      console.error('Error fetching groups:', err);
      setAvailableGroups([]);
    }
  };


  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      // Usa itemTypeSetRoleId se disponibile, altrimenti usa permission.id
      const itemTypeSetRoleId = (permission as any).itemTypeSetRoleId || 
                               (typeof permission.id === 'string' && permission.id.startsWith('worker-') 
        ? null 
                                 : permission.id);

      if (!itemTypeSetRoleId || typeof itemTypeSetRoleId === 'string') {
        setError(
          `ID ItemTypeSetRole non valido. Il valore ricevuto è: ${itemTypeSetRoleId}. ` +
          `Per risolvere il problema, chiudi questa finestra e ricarica la pagina delle permissions ` +
          `per assicurarti che tutti gli ItemTypeSetRole siano stati creati correttamente.`
        );
        setLoading(false);
        return;
      }

      // Gestione Grant diretto GLOBALE - solo se NON siamo in scope 'project'
      // In scope 'project', le grant globali sono solo di lettura e non possono essere modificate
      if (scope !== 'project') {
        const hasGrantDirect = grantUsers.length > 0 || grantGroups.length > 0 || 
                               grantNegatedUsers.length > 0 || grantNegatedGroups.length > 0;
        
        if (hasGrantDirect) {
          // Prepara il payload - includi solo campi non vuoti
          const payload: any = {
            itemTypeSetRoleId: itemTypeSetRoleId
          };
          
          // Aggiungi informazioni sulla permission per permettere la creazione automatica dell'ItemTypeSetRole se non esiste
          if (itemTypeSetId) {
            payload.itemTypeSetId = itemTypeSetId;
          }
          
          const permissionType = getPermissionType(permission.name);
          if (permissionType) {
            payload.permissionType = permissionType;
          }
          
          // Aggiungi informazioni sulle entità correlate in base al tipo di permission
          if (permission.itemType?.id) {
            payload.itemTypeId = permission.itemType.id;
          }
          if (permission.workflow?.id) {
            payload.workflowId = permission.workflow.id;
          }
          if (permission.workflowStatus?.id) {
            payload.workflowStatusId = permission.workflowStatus.id;
          }
          if (permission.fieldConfiguration?.id) {
            payload.fieldConfigurationId = permission.fieldConfiguration.id;
          }
          if (permission.transition?.id) {
            payload.transitionId = permission.transition.id;
          }
          
          if (grantUsers.length > 0) {
            payload.userIds = grantUsers.map(u => u.id);
          }
          
          if (grantGroups.length > 0) {
            payload.groupIds = grantGroups.map(g => g.id);
          }
          
          if (grantNegatedUsers.length > 0) {
            payload.negatedUserIds = grantNegatedUsers.map(u => u.id);
          }
          
          if (grantNegatedGroups.length > 0) {
            payload.negatedGroupIds = grantNegatedGroups.map(g => g.id);
          }
          
          try {
            // Se c'è già un Grant, aggiornalo invece di crearne uno nuovo
            if (permission.grantId) {
              await api.put('/itemtypeset-roles/update-grant', payload);
            } else {
              // Crea nuovo Grant e assegnalo
              await api.post('/itemtypeset-roles/create-and-assign-grant', payload);
            }
          } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.response?.data || err.message || 'Errore sconosciuto';
            console.error('Full error response:', err.response); // Debug
            throw new Error(`Errore nella ${permission.grantId ? 'modifica' : 'creazione'} e assegnazione Grant: ${errorMessage}`);
          }
        } else if (permission.grantId) {
          // Se prima c'era un Grant ma ora non c'è, rimuovilo
          // IMPORTANTE: Questo viene eseguito solo se NON siamo in scope 'project'
          try {
            await api.delete('/itemtypeset-roles/remove-assignment', {
              params: { roleId: itemTypeSetRoleId }
            });
          } catch (err: any) {
            // Non bloccare se la rimozione fallisce (potrebbe essere già rimosso)
            console.warn('Warning removing grant assignment:', err);
          }
        }
      }
      
      // Gestione Grant diretto di progetto (solo se siamo in un contesto progetto)
      if (scope === 'project' && projectId) {
        const hasProjectGrantDirect = projectGrantUsers.length > 0 || projectGrantGroups.length > 0 || 
                                     projectGrantNegatedUsers.length > 0 || projectGrantNegatedGroups.length > 0;
        
        if (hasProjectGrantDirect) {
          const projectPayload: any = {
            itemTypeSetRoleId: itemTypeSetRoleId
          };
          
          if (projectGrantUsers.length > 0) {
            projectPayload.userIds = projectGrantUsers.map(u => u.id);
          }
          
          if (projectGrantGroups.length > 0) {
            projectPayload.groupIds = projectGrantGroups.map(g => g.id);
          }
          
          if (projectGrantNegatedUsers.length > 0) {
            projectPayload.negatedUserIds = projectGrantNegatedUsers.map(u => u.id);
          }
          
          if (projectGrantNegatedGroups.length > 0) {
            projectPayload.negatedGroupIds = projectGrantNegatedGroups.map(g => g.id);
          }
          
          try {
            // Crea o aggiorna Grant di progetto
            await api.post(`/project-itemtypeset-role-grants/project/${projectId}`, projectPayload);
          } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.response?.data || err.message || 'Errore sconosciuto';
            throw new Error(`Errore nella creazione/modifica Grant di progetto: ${errorMessage}`);
          }
        } else if ((permission as any).hasProjectGrant) {
          // Se prima c'era una Grant di progetto ma ora non c'è, rimuovila
          try {
            await api.delete(`/project-itemtypeset-role-grants/project/${projectId}/role/${itemTypeSetRoleId}`);
          } catch (err: any) {
            // Non bloccare se la rimozione fallisce (potrebbe essere già rimossa)
            console.warn('Warning removing project grant assignment:', err);
          }
        }
      }

      // Gestione Role template (ora compatibile con Grant diretto)
      // Determina il tipo di permission dal nome
      const permissionType = getPermissionType(permission.name);

      // Per le operazioni su Role template, usa l'ID originale della permission
      const permissionId = permission.id;

      // Gestione ruoli (Role template)
      const originalRoles: Role[] = permission.assignedRoles || [];
      
      for (const originalRole of originalRoles) {
        if (!selectedRoles.find((role: Role) => role.id === originalRole.id)) {
          await api.delete('/itemtypeset-permissions/remove-role', {
            params: { permissionId, roleId: originalRole.id, permissionType }
          });
        }
      }

      for (const role of selectedRoles) {
        const isAlreadyAssigned = originalRoles.find((originalRole: Role) => originalRole.id === role.id);
        if (!isAlreadyAssigned) {
          await api.post('/itemtypeset-permissions/assign-role', null, {
            params: { permissionId, roleId: role.id, permissionType }
          });
        }
      }

      // Chiama onSave prima di chiudere per permettere il refresh
      onSave();
      
      // Chiudi il modal dopo un breve delay per dare tempo al refresh
      setTimeout(() => {
        onClose();
      }, 100);
    } catch (err: any) {
      setError(err.message || 'Errore durante il salvataggio');
      console.error('Error saving permission assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  // Funzioni per gestire ruoli
  const addRole = (role: Role) => {
    if (!selectedRoles.find(r => r.id === role.id)) {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  const removeRole = (roleId: number) => {
    setSelectedRoles(selectedRoles.filter(r => r.id !== roleId));
  };

  // Funzioni per gestire Grant diretto
  const handleAddUser = (user: UserOption) => {
    if (!grantUsers.find(u => u.id === user.id)) {
      setGrantUsers([...grantUsers, user]);
    }
  };

  const handleRemoveUser = (userId: number) => {
    setGrantUsers(grantUsers.filter(u => u.id !== userId));
  };

  const handleAddGroup = (group: Group) => {
    if (!grantGroups.find(g => g.id === group.id)) {
      setGrantGroups([...grantGroups, group]);
    }
  };

  const handleRemoveGroup = (groupId: number) => {
    setGrantGroups(grantGroups.filter(g => g.id !== groupId));
  };

  const handleAddNegatedUser = (user: UserOption) => {
    if (!grantNegatedUsers.find(u => u.id === user.id)) {
      setGrantNegatedUsers([...grantNegatedUsers, user]);
    }
  };

  const handleRemoveNegatedUser = (userId: number) => {
    setGrantNegatedUsers(grantNegatedUsers.filter(u => u.id !== userId));
  };

  const handleAddNegatedGroup = (group: Group) => {
    if (!grantNegatedGroups.find(g => g.id === group.id)) {
      setGrantNegatedGroups([...grantNegatedGroups, group]);
    }
  };

  const handleRemoveNegatedGroup = (groupId: number) => {
    setGrantNegatedGroups(grantNegatedGroups.filter(g => g.id !== groupId));
  };

  // Handler per Grant di progetto
  const handleAddProjectUser = (user: UserOption) => {
    if (!projectGrantUsers.find(u => u.id === user.id)) {
      setProjectGrantUsers([...projectGrantUsers, user]);
    }
  };

  const handleRemoveProjectUser = (userId: number) => {
    setProjectGrantUsers(projectGrantUsers.filter(u => u.id !== userId));
  };

  const handleAddProjectGroup = (group: Group) => {
    if (!projectGrantGroups.find(g => g.id === group.id)) {
      setProjectGrantGroups([...projectGrantGroups, group]);
    }
  };

  const handleRemoveProjectGroup = (groupId: number) => {
    setProjectGrantGroups(projectGrantGroups.filter(g => g.id !== groupId));
  };

  const handleAddProjectNegatedUser = (user: UserOption) => {
    if (!projectGrantNegatedUsers.find(u => u.id === user.id)) {
      setProjectGrantNegatedUsers([...projectGrantNegatedUsers, user]);
    }
  };

  const handleRemoveProjectNegatedUser = (userId: number) => {
    setProjectGrantNegatedUsers(projectGrantNegatedUsers.filter(u => u.id !== userId));
  };

  const handleAddProjectNegatedGroup = (group: Group) => {
    if (!projectGrantNegatedGroups.find(g => g.id === group.id)) {
      setProjectGrantNegatedGroups([...projectGrantNegatedGroups, group]);
    }
  };

  const handleRemoveProjectNegatedGroup = (groupId: number) => {
    setProjectGrantNegatedGroups(projectGrantNegatedGroups.filter(g => g.id !== groupId));
  };

  if (!permission) return null;

  const hasGrantDirect = grantUsers.length > 0 || grantGroups.length > 0 || 
                         grantNegatedUsers.length > 0 || grantNegatedGroups.length > 0 || 
                         permission.grantId !== undefined;
  const hasRoleTemplate = selectedRoles.length > 0 || (permission.assignedRoles && permission.assignedRoles.length > 0);

  return (
    <div className="w-full">
      <PermissionHeader permission={permission} />
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Gestione Assegnazioni per Permission</h2>
        <p className="text-sm text-gray-600">
          Puoi assegnare un Grant diretto e/o uno o più Role template. Entrambi possono essere assegnati contemporaneamente.
        </p>
      </div>

      {error && (
        <div className={`${alert.error} mb-4`}>
          <p>{error}</p>
        </div>
      )}

      {typeof permission.id === 'string' && permission.id.startsWith('worker-') && (
        <div className={`${alert.info} mb-4`}>
          <p><strong>Nota:</strong> I WORKER sono gestiti automaticamente dal sistema e non possono avere ruoli assegnati direttamente.</p>
        </div>
      )}

      {scope === 'project' && projectId ? (
        <>
          {/* SEZIONE PERMISSION SPECIFICHE DEL PROGETTO */}
          <div style={{ 
            border: '2px solid #10b981', 
            borderRadius: '0.75rem', 
            padding: '1.5rem', 
            backgroundColor: '#ecfdf5',
            marginBottom: '2rem'
          }}>
            <h3 style={{ 
              fontSize: '1.25rem', 
              fontWeight: '700', 
              color: '#047857',
              marginBottom: '1rem'
            }}>
              Permission Specifiche del Progetto
            </h3>
            <p style={{ 
              fontSize: '0.875rem', 
              color: '#475569',
              marginBottom: '1.5rem'
            }}>
              Queste assegnazioni si applicano solo a questo progetto e vengono aggiunte alle permission globali.
            </p>
            
            <div className="grid grid-cols-1 gap-6">
              {/* Sezione Grant di Progetto - Utenti Autorizzati */}
              <div style={{ 
                border: '1px solid #e5e7eb', 
                borderRadius: '0.5rem', 
                padding: '1rem', 
                backgroundColor: 'white' 
              }}>
                <h4 style={{ 
                  fontSize: '1rem', 
                  fontWeight: '600', 
                  color: '#1e3a8a',
                  marginBottom: '1rem'
                }}>
                  Utenti Autorizzati
                </h4>
                <UserAutocomplete
                  selectedUsers={projectGrantUsers}
                  onAddUser={handleAddProjectUser}
                  onRemoveUser={handleRemoveProjectUser}
                  label="Aggiungi Utente Autorizzato"
                  placeholder="Cerca utente per nome o email..."
                />
              </div>

              {/* Sezione Grant di Progetto - Utenti Negati */}
              <div style={{ 
                border: '1px solid #e5e7eb', 
                borderRadius: '0.5rem', 
                padding: '1rem', 
                backgroundColor: 'white' 
              }}>
                <h4 style={{ 
                  fontSize: '1rem', 
                  fontWeight: '600', 
                  color: '#1e3a8a',
                  marginBottom: '1rem'
                }}>
                  Utenti Negati
                </h4>
                <UserAutocomplete
                  selectedUsers={projectGrantNegatedUsers}
                  onAddUser={handleAddProjectNegatedUser}
                  onRemoveUser={handleRemoveProjectNegatedUser}
                  label="Aggiungi Utente Negato"
                  placeholder="Cerca utente per nome o email..."
                  variant="negated"
                />
              </div>

              {/* Sezione Grant di Progetto - Gruppi Autorizzati */}
              <div style={{ 
                border: '1px solid #e5e7eb', 
                borderRadius: '0.5rem', 
                padding: '1rem', 
                backgroundColor: 'white' 
              }}>
                <h4 style={{ 
                  fontSize: '1rem', 
                  fontWeight: '600', 
                  color: '#1e3a8a',
                  marginBottom: '1rem'
                }}>
                  Gruppi Autorizzati
                </h4>
                <div style={{ marginBottom: '0.5rem' }}>
                  <label htmlFor="project-group-select" className="block text-sm font-medium text-gray-700 mb-1">
                    Aggiungi Gruppo
                  </label>
                  <select
                    id="project-group-select"
                    onChange={(e) => {
                      const groupId = e.target.value;
                      if (groupId) {
                        const group = availableGroups.find(g => g.id === Number(groupId));
                        if (group) handleAddProjectGroup(group);
                        e.target.value = '';
                      }
                    }}
                    className="w-full p-2 border border-gray-300 rounded"
                  >
                    <option value="">Seleziona un gruppo...</option>
                    {availableGroups
                      .filter(group => !projectGrantGroups.find(g => g.id === group.id))
                      .map(group => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                  </select>
                </div>
                {projectGrantGroups.length > 0 && (
                  <div style={{ marginTop: '28px', marginBottom: '28px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                      {projectGrantGroups.map(group => (
                        <div
                          key={group.id}
                          style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: '8px',
                            paddingLeft: '12px',
                            paddingRight: '4px',
                            paddingTop: '8px',
                            paddingBottom: '8px',
                            borderRadius: '9999px',
                            maxWidth: 'fit-content',
                          }}
                          className="bg-green-50 hover:bg-green-100 border border-green-200 transition-colors group"
                        >
                          <span className="text-sm font-medium text-green-900">
                            {group.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveProjectGroup(group.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              border: 'none',
                              cursor: 'pointer',
                              backgroundColor: '#fecaca',
                              color: '#991b1b',
                              transition: 'background-color 150ms, color 150ms',
                            }}
                            title={`Rimuovi ${group.name}`}
                            aria-label={`Rimuovi ${group.name}`}
                            onMouseEnter={(e) => {
                              const btn = e.currentTarget;
                              btn.style.backgroundColor = '#ef4444';
                              btn.style.color = 'white';
                              const icon = btn.querySelector('svg');
                              if (icon) {
                                icon.style.color = 'white';
                                icon.style.stroke = 'white';
                              }
                            }}
                            onMouseLeave={(e) => {
                              const btn = e.currentTarget;
                              btn.style.backgroundColor = '#fecaca';
                              btn.style.color = '#991b1b';
                              const icon = btn.querySelector('svg');
                              if (icon) {
                                icon.style.color = '#991b1b';
                                icon.style.stroke = '#991b1b';
                              }
                            }}
                          >
                            <X size={12} strokeWidth={2.5} style={{ color: 'inherit', stroke: 'currentColor' }} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sezione Grant di Progetto - Gruppi Negati */}
              <div style={{ 
                border: '1px solid #e5e7eb', 
                borderRadius: '0.5rem', 
                padding: '1rem', 
                backgroundColor: 'white' 
              }}>
                <h4 style={{ 
                  fontSize: '1rem', 
                  fontWeight: '600', 
                  color: '#1e3a8a',
                  marginBottom: '1rem'
                }}>
                  Gruppi Negati
                </h4>
                <div style={{ marginBottom: '0.5rem' }}>
                  <label htmlFor="project-negated-group-select" className="block text-sm font-medium text-gray-700 mb-1">
                    Aggiungi Gruppo Negato
                  </label>
                  <select
                    id="project-negated-group-select"
                    onChange={(e) => {
                      const groupId = e.target.value;
                      if (groupId) {
                        const group = availableGroups.find(g => g.id === Number(groupId));
                        if (group) handleAddProjectNegatedGroup(group);
                        e.target.value = '';
                      }
                    }}
                    className="w-full p-2 border border-gray-300 rounded"
                  >
                    <option value="">Seleziona un gruppo...</option>
                    {availableGroups
                      .filter(group => !projectGrantNegatedGroups.find(g => g.id === group.id))
                      .map(group => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                  </select>
                </div>
                {projectGrantNegatedGroups.length > 0 && (
                  <div style={{ marginTop: '28px', marginBottom: '28px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                      {projectGrantNegatedGroups.map(group => (
                        <div
                          key={group.id}
                          style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: '8px',
                            paddingLeft: '12px',
                            paddingRight: '4px',
                            paddingTop: '8px',
                            paddingBottom: '8px',
                            borderRadius: '9999px',
                            maxWidth: 'fit-content',
                          }}
                          className="bg-red-50 hover:bg-red-100 border border-red-200 transition-colors group"
                        >
                          <span className="text-sm font-medium text-red-900">
                            {group.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveProjectNegatedGroup(group.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              border: 'none',
                              cursor: 'pointer',
                              backgroundColor: '#fecaca',
                              color: '#991b1b',
                              transition: 'background-color 150ms, color 150ms',
                            }}
                            title={`Rimuovi ${group.name}`}
                            aria-label={`Rimuovi ${group.name}`}
                            onMouseEnter={(e) => {
                              const btn = e.currentTarget;
                              btn.style.backgroundColor = '#ef4444';
                              btn.style.color = 'white';
                              const icon = btn.querySelector('svg');
                              if (icon) {
                                icon.style.color = 'white';
                                icon.style.stroke = 'white';
                              }
                            }}
                            onMouseLeave={(e) => {
                              const btn = e.currentTarget;
                              btn.style.backgroundColor = '#fecaca';
                              btn.style.color = '#991b1b';
                              const icon = btn.querySelector('svg');
                              if (icon) {
                                icon.style.color = '#991b1b';
                                icon.style.stroke = '#991b1b';
                              }
                            }}
                          >
                            <X size={12} strokeWidth={2.5} style={{ color: 'inherit', stroke: 'currentColor' }} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* SEZIONE SINGOLA PER TENANT */}
          <div className="grid grid-cols-1 gap-6">
            {/* 1. Sezione Ruoli (Role template) */}
            <RoleAssignmentSection
              selectedRoles={selectedRoles}
              availableRoles={availableRoles}
              onAddRole={addRole}
              onRemoveRole={removeRole}
            />

            {/* 2. Sezione Grant - Utenti Autorizzati */}
            <div style={{ 
              border: '1px solid #e5e7eb', 
              borderRadius: '0.5rem', 
              padding: '1rem', 
              backgroundColor: 'white' 
            }}>
              <h3 style={{ 
                fontSize: '1rem', 
                fontWeight: '600', 
                color: '#1e3a8a',
                marginBottom: '1rem'
              }}>
                Utenti Autorizzati
              </h3>
              <UserAutocomplete
                selectedUsers={grantUsers}
                onAddUser={handleAddUser}
                onRemoveUser={handleRemoveUser}
                label="Aggiungi Utente Autorizzato"
                placeholder="Cerca utente per nome o email..."
              />
            </div>

            {/* 3. Sezione Grant - Utenti Negati */}
            <div style={{ 
              border: '1px solid #e5e7eb', 
              borderRadius: '0.5rem', 
              padding: '1rem', 
              backgroundColor: 'white' 
            }}>
              <h3 style={{ 
                fontSize: '1rem', 
                fontWeight: '600', 
                color: '#1e3a8a',
                marginBottom: '1rem'
              }}>
                Utenti Negati
              </h3>
              <UserAutocomplete
                selectedUsers={grantNegatedUsers}
                onAddUser={handleAddNegatedUser}
                onRemoveUser={handleRemoveNegatedUser}
                label="Aggiungi Utente Negato"
                placeholder="Cerca utente per nome o email..."
                variant="negated"
              />
            </div>

            {/* 4. Sezione Grant - Gruppi Autorizzati */}
            <div style={{ 
              border: '1px solid #e5e7eb', 
              borderRadius: '0.5rem', 
              padding: '1rem', 
              backgroundColor: 'white' 
            }}>
              <h3 style={{ 
                fontSize: '1rem', 
                fontWeight: '600', 
                color: '#1e3a8a',
                marginBottom: '1rem'
              }}>
                Gruppi Autorizzati
              </h3>
              <div style={{ marginBottom: '0.5rem' }}>
                <label htmlFor="group-select" className="block text-sm font-medium text-gray-700 mb-1">
                  Aggiungi Gruppo
                </label>
                <select
                  id="group-select"
                  onChange={(e) => {
                    const groupId = e.target.value;
                    if (groupId) {
                      const group = availableGroups.find(g => g.id === Number(groupId));
                      if (group) handleAddGroup(group);
                      e.target.value = '';
                    }
                  }}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value="">Seleziona un gruppo...</option>
                  {availableGroups
                    .filter(group => !grantGroups.find(g => g.id === group.id))
                    .map(group => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                </select>
              </div>
              {grantGroups.length > 0 && (
                <div style={{ marginTop: '28px', marginBottom: '28px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                    {grantGroups.map(group => (
                      <div
                        key={group.id}
                        style={{
                          display: 'flex',
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: '8px',
                          paddingLeft: '12px',
                          paddingRight: '4px',
                          paddingTop: '8px',
                          paddingBottom: '8px',
                          borderRadius: '9999px',
                          maxWidth: 'fit-content',
                        }}
                        className="bg-green-50 hover:bg-green-100 border border-green-200 transition-colors group"
                      >
                        <span className="text-sm font-medium text-green-900">
                          {group.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveGroup(group.id)}
                          className="group-remove-btn"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            border: 'none',
                            cursor: 'pointer',
                            backgroundColor: '#fecaca',
                            color: '#991b1b',
                            transition: 'background-color 150ms, color 150ms',
                          }}
                          title={`Rimuovi ${group.name}`}
                          aria-label={`Rimuovi ${group.name}`}
                          onMouseEnter={(e) => {
                            const btn = e.currentTarget;
                            btn.style.backgroundColor = '#ef4444';
                            btn.style.color = 'white';
                            const icon = btn.querySelector('svg');
                            if (icon) {
                              icon.style.color = 'white';
                              icon.style.stroke = 'white';
                            }
                          }}
                          onMouseLeave={(e) => {
                            const btn = e.currentTarget;
                            btn.style.backgroundColor = '#fecaca';
                            btn.style.color = '#991b1b';
                            const icon = btn.querySelector('svg');
                            if (icon) {
                              icon.style.color = '#991b1b';
                              icon.style.stroke = '#991b1b';
                            }
                          }}
                        >
                          <X size={12} strokeWidth={2.5} style={{ color: 'inherit', stroke: 'currentColor' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 5. Sezione Grant - Gruppi Negati */}
            <div style={{ 
              border: '1px solid #e5e7eb', 
              borderRadius: '0.5rem', 
              padding: '1rem', 
              backgroundColor: 'white' 
            }}>
              <h3 style={{ 
                fontSize: '1rem', 
                fontWeight: '600', 
                color: '#1e3a8a',
                marginBottom: '1rem'
              }}>
                Gruppi Negati
              </h3>
              <div style={{ marginBottom: '0.5rem' }}>
                <label htmlFor="negated-group-select" className="block text-sm font-medium text-gray-700 mb-1">
                  Aggiungi Gruppo Negato
                </label>
                <select
                  id="negated-group-select"
                  onChange={(e) => {
                    const groupId = e.target.value;
                    if (groupId) {
                      const group = availableGroups.find(g => g.id === Number(groupId));
                      if (group) handleAddNegatedGroup(group);
                      e.target.value = '';
                    }
                  }}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value="">Seleziona un gruppo...</option>
                  {availableGroups
                    .filter(group => !grantNegatedGroups.find(g => g.id === group.id))
                    .map(group => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                </select>
              </div>
              {grantNegatedGroups.length > 0 && (
                <div style={{ marginTop: '28px', marginBottom: '28px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                    {grantNegatedGroups.map(group => (
                      <div
                        key={group.id}
                        style={{
                          display: 'flex',
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: '8px',
                          paddingLeft: '12px',
                          paddingRight: '4px',
                          paddingTop: '8px',
                          paddingBottom: '8px',
                          borderRadius: '9999px',
                          maxWidth: 'fit-content',
                        }}
                        className="bg-red-50 hover:bg-red-100 border border-red-200 transition-colors group"
                      >
                        <span className="text-sm font-medium text-red-900">
                          {group.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveNegatedGroup(group.id)}
                          className="group-remove-btn"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            border: 'none',
                            cursor: 'pointer',
                            backgroundColor: '#fecaca',
                            color: '#991b1b',
                            transition: 'background-color 150ms, color 150ms',
                          }}
                          title={`Rimuovi ${group.name}`}
                          aria-label={`Rimuovi ${group.name}`}
                          onMouseEnter={(e) => {
                            const btn = e.currentTarget;
                            btn.style.backgroundColor = '#ef4444';
                            btn.style.color = 'white';
                            const icon = btn.querySelector('svg');
                            if (icon) {
                              icon.style.color = 'white';
                              icon.style.stroke = 'white';
                            }
                          }}
                          onMouseLeave={(e) => {
                            const btn = e.currentTarget;
                            btn.style.backgroundColor = '#fecaca';
                            btn.style.color = '#991b1b';
                            const icon = btn.querySelector('svg');
                            if (icon) {
                              icon.style.color = '#991b1b';
                              icon.style.stroke = '#991b1b';
                            }
                          }}
                        >
                          <X size={12} strokeWidth={2.5} style={{ color: 'inherit', stroke: 'currentColor' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Pulsanti di azione */}
      <div className="flex justify-end gap-4 mt-6 pt-4 border-t">
        <button
          onClick={onClose}
          className={buttons.button}
          disabled={loading}
        >
          Annulla
        </button>
        <button
          onClick={handleSave}
          className={buttons.button}
          disabled={loading}
        >
          {loading ? 'Salvataggio...' : 'Salva Assegnazioni'}
          <Save size={16} className="ml-2" />
        </button>
      </div>
    </div>
  );
}
