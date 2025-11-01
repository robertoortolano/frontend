import { useEffect, useState } from "react";
import api from "../../api/api";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { ProjectDto } from "../../types/project.types";
import { CheckCircle, Loader2, AlertCircle, Check, Home, Settings, Users, Shield, Eye } from "lucide-react";
import ProjectMembersPanel from "../../components/ProjectMembersPanel";
import ItemTypeSetRoleManager from "../../components/ItemTypeSetRoleManager";
import PermissionGrantManager from "../../components/PermissionGrantManager";
import { createPortal } from "react-dom";

import layout from "../../styles/common/Layout.module.css";
import buttons from "../../styles/common/Buttons.module.css";
import table from "../../styles/common/Tables.module.css";
import alert from "../../styles/common/Alerts.module.css";
import utilities from "../../styles/common/Utilities.module.css";
import form from "../../styles/common/Forms.module.css";

// Stili per i tab - usando classi Tailwind più specifiche
const tabStyles = {
  tabContainer: "bg-white rounded-lg shadow-lg border border-gray-200 mb-8 p-2",
  tabList: "flex space-x-2",
  tab: "flex-1 py-4 px-6 rounded-md font-semibold text-sm transition-all duration-300 ease-in-out flex items-center justify-center gap-3 cursor-pointer",
  tabActive: "!bg-cyan-400 !text-white shadow-lg transform scale-105 border-2 border-cyan-500",
  tabInactive: "!text-gray-700 hover:!text-gray-900 hover:!bg-gray-100 border-2 border-transparent",
  tabContent: "mt-8"
};

function Loading() {
  return <p className={layout.loading}>Loading project...</p>;
}

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home, description: 'Dettagli progetto' },
    { id: 'itemtypeset', label: 'ItemTypeSet', icon: Settings, description: 'Configurazione tipi' },
    { id: 'members', label: 'Membri', icon: Users, description: 'Gestione utenti' }
  ];

  return (
    <div className={tabStyles.tabContainer}>
      <nav className={tabStyles.tabList}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`${tabStyles.tab} ${
                isActive ? tabStyles.tabActive : tabStyles.tabInactive
              }`}
              title={tab.description}
              style={{
                backgroundColor: isActive ? '#00ddd4' : 'transparent',
                color: isActive ? 'white' : '#374151',
                border: isActive ? '2px solid #00b8b0' : '2px solid transparent',
                borderRadius: '6px',
                transform: isActive ? 'scale(1.05)' : 'scale(1)',
                boxShadow: isActive ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = '#f0f0f0';
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              <Icon 
                size={20} 
                style={{ 
                  color: isActive ? 'white' : '#374151' 
                }} 
              />
              <span className="font-bold text-base">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

interface ErrorMessageProps {
  message: string;
}

function ErrorMessage({ message }: ErrorMessageProps) {
  return <p className={alert.error}>{message}</p>;
}

interface ProjectDetailsProps {
  project: ProjectDto;
  onEdit: () => void;
}

function ProjectDetails({ project, onEdit }: ProjectDetailsProps) {
  return (
    <div>
      <h2 className={layout.sectionTitle}>Dettagli Progetto</h2>
      <div className={layout.block}>
        <div className={form.formGroup}>
          <label className={form.label}>Nome</label>
          <p className="text-lg font-medium">{project.name}</p>
        </div>
        <div className={form.formGroup}>
          <label className={form.label}>Chiave</label>
          <p className={utilities.monospace}>{project.key}</p>
        </div>
        <div className={form.formGroup}>
          <label className={form.label}>Descrizione</label>
          <p>{project.description || <em>Nessuna descrizione</em>}</p>
        </div>
        <div className={layout.buttonRow}>
          <button className={buttons.button} onClick={onEdit}>
            Modifica
          </button>
        </div>
      </div>
    </div>
  );
}

interface ItemTypeSetDetailsProps {
  itemTypeSet: any;
  onItemTypeSetChange: (itemTypeSetId: number) => void;
  isUpdatingItemTypeSet: boolean;
  successMessage: string | null;
  error: string | null;
  projectId: string;
}

function ItemTypeSetDetails({ 
  itemTypeSet, 
  onItemTypeSetChange, 
  isUpdatingItemTypeSet,
  successMessage,
  error,
  projectId
}: ItemTypeSetDetailsProps) {
  const [isChanging, setIsChanging] = useState(false);
  const [availableItemTypeSets, setAvailableItemTypeSets] = useState<any[]>([]);
  const [selectedItemTypeSet, setSelectedItemTypeSet] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [globalPermissions, setGlobalPermissions] = useState<any>(null);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [selectedPermissionForProjectGrant, setSelectedPermissionForProjectGrant] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const hasEntries = itemTypeSet.itemTypeConfigurations?.length > 0;
  const isGlobal = itemTypeSet.scope === 'TENANT';
  
  // Controlla se ci sono altri ItemTypeSet disponibili oltre a quello attuale
  const hasOtherItemTypeSets = availableItemTypeSets.length > 1 || 
    (availableItemTypeSets.length === 1 && availableItemTypeSets[0].id !== itemTypeSet.id);

  // Carica gli ItemTypeSet disponibili e le permission globali al mount del componente
  useEffect(() => {
    fetchAvailableItemTypeSets();
    if (itemTypeSet?.id) {
      fetchGlobalPermissions();
    }
  }, [itemTypeSet?.id]);

  // Ricarica le permission quando cambia il trigger
  useEffect(() => {
    if (itemTypeSet?.id) {
      fetchGlobalPermissions();
    }
  }, [refreshTrigger]);

  const fetchAvailableItemTypeSets = async () => {
    try {
      setLoading(true);
      const response = await api.get('/projects/available-item-type-sets');
      setAvailableItemTypeSets(response.data);
    } catch (err: any) {
      console.error("Error fetching ItemTypeSets:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGlobalPermissions = async () => {
    if (!itemTypeSet?.id) return;
    
    try {
      setLoadingPermissions(true);
      // Carica le permission globali SENZA projectId per vedere solo quelle globali nella visualizzazione
      // Poi le ricarichiamo CON projectId per la selezione (così abbiamo anche hasProjectGrant)
      const response = await api.get(`/itemtypeset-permissions/itemtypeset/${itemTypeSet.id}`);
      setGlobalPermissions(response.data);
      
      // Carica anche con projectId per avere le informazioni sulle grant di progetto per la selezione
      try {
        const responseWithProject = await api.get(`/itemtypeset-permissions/itemtypeset/${itemTypeSet.id}?projectId=${projectId}`);
        // Aggiorna le permission con le informazioni sulle grant di progetto
        const permissionsWithProjectInfo = { ...responseWithProject.data };
        setGlobalPermissions(permissionsWithProjectInfo);
      } catch (projectErr) {
        // Se fallisce, usa comunque le permission globali
        console.warn("Could not load project grant info:", projectErr);
      }
    } catch (err: any) {
      console.error("Error fetching global permissions:", err);
      // Se fallisce con 500, prova a creare le permission
      if (err.response?.status === 500) {
        try {
          await api.post(`/itemtypeset-permissions/create-for-itemtypeset/${itemTypeSet.id}`);
          const retryResponse = await api.get(`/itemtypeset-permissions/itemtypeset/${itemTypeSet.id}`);
          setGlobalPermissions(retryResponse.data);
          
          // Prova anche con projectId
          try {
            const responseWithProject = await api.get(`/itemtypeset-permissions/itemtypeset/${itemTypeSet.id}?projectId=${projectId}`);
            setGlobalPermissions(responseWithProject.data);
          } catch (projectErr) {
            console.warn("Could not load project grant info:", projectErr);
          }
        } catch (createErr) {
          console.error("Error creating permissions:", createErr);
        }
      }
    } finally {
      setLoadingPermissions(false);
    }
  };


  const handleStartChange = () => {
    setIsChanging(true);
    fetchAvailableItemTypeSets();
  };

  const handleCancelChange = () => {
    setIsChanging(false);
    setSelectedItemTypeSet(null);
  };

  const handleItemTypeSetSelect = (itemTypeSet: any) => {
    setSelectedItemTypeSet(itemTypeSet);
  };

  const handleApplyChange = () => {
    if (selectedItemTypeSet) {
      onItemTypeSetChange(selectedItemTypeSet.id);
      setIsChanging(false);
      setSelectedItemTypeSet(null);
    }
  };

  const renderItemTypeSetInfo = (itemTypeSet: any, title: string) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className={layout.sectionTitle}>{title}</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p><strong>Name:</strong> {itemTypeSet.name}</p>
          <p><strong>Global:</strong> {itemTypeSet.scope === 'TENANT' ? "Yes" : "No"}</p>
        </div>
        <div>
          <p><strong>Configurazioni:</strong> {itemTypeSet.itemTypeConfigurations?.length || 0}</p>
          {itemTypeSet.defaultItemTypeSet && (
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
              Default
            </span>
          )}
        </div>
      </div>

      {hasEntries ? (
        <table className={`${table.table} ${layout.mt4}`}>
          <thead>
            <tr>
              <th>Item Type</th>
              <th>Categoria</th>
              <th>Workflow</th>
              <th>Field Set</th>
            </tr>
          </thead>
          <tbody>
            {itemTypeSet.itemTypeConfigurations.map((config: any) => (
              <tr key={config.id}>
                <td>{config.itemType?.name || 'N/A'}</td>
                <td>{config.category}</td>
                <td>{config.workflow?.name || "-"}</td>
                <td>{config.fieldSet?.name || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className={alert.muted}>No entries in this set.</p>
      )}
    </div>
  );

  return (
    <>
      <h1 className={layout.title}>Item Type Set</h1>
      <div className={layout.block}>
        {/* ItemTypeSet Attualmente Applicato - sempre visibile */}
        {renderItemTypeSetInfo(itemTypeSet, "ItemTypeSet Attualmente Applicato")}
        
        {/* Sezione Permission Globali (sola lettura) */}
        {itemTypeSet.scope === 'TENANT' && (
          <div className="mt-8" style={{ 
            border: '2px solid #3b82f6', 
            borderRadius: '0.75rem', 
            padding: '1.5rem', 
            backgroundColor: '#f0f9ff'
          }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Shield size={20} color="#1e40af" />
                <h3 className={layout.sectionTitle} style={{ color: '#1e40af' }}>
                  Permission Globali (Sola Lettura)
                </h3>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Queste sono le permission configurate a livello globale per questo ItemTypeSet. 
              Si applicano a tutti i progetti che usano questo ITS. Per modificarle, vai alla sezione ItemTypeSets globale.
            </p>
            
            {loadingPermissions ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 size={16} className="animate-spin" />
                <span>Caricamento permission globali...</span>
              </div>
            ) : globalPermissions ? (
              <div style={{ 
                backgroundColor: 'white', 
                borderRadius: '0.5rem', 
                padding: '1rem',
                border: '1px solid #e5e7eb'
              }}>
                <ItemTypeSetRoleManager
                  itemTypeSetId={itemTypeSet.id}
                  refreshTrigger={refreshTrigger}
                  projectId={projectId}
                  // Non passiamo onPermissionGrantClick così non è possibile modificare (sola lettura)
                />
              </div>
            ) : (
              <p className={alert.muted}>Nessuna permission configurata.</p>
            )}
          </div>
        )}

        {/* Sezione Grant di Progetto (gestione) */}
        <div className="mt-8" style={{ 
          border: '2px solid #10b981', 
          borderRadius: '0.75rem', 
          padding: '1.5rem', 
          backgroundColor: '#ecfdf5'
        }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Eye size={20} color="#047857" />
              <h3 className={layout.sectionTitle} style={{ color: '#047857' }}>
                Grant Specifiche del Progetto
              </h3>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Gestisci le grant aggiuntive specifiche per questo progetto. 
            Queste grant si aggiungono alle permission globali sopra.
          </p>
          
          <button
            className={`${buttons.button} ${utilities.mt4}`}
            onClick={() => {
              // Apri il modal per selezionare una permission e gestire la sua grant di progetto
              // Per ora usiamo un approccio semplice: mostra tutte le permission e permetti di cliccare
              setSelectedPermissionForProjectGrant({ itemTypeSetId: itemTypeSet.id });
            }}
            disabled={loadingPermissions}
          >
            <Shield size={16} className="mr-2" />
            Gestisci Grant di Progetto
          </button>

          {selectedPermissionForProjectGrant && (
            <>
              {createPortal(
                <div
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                  }}
                  onClick={(e) => {
                    if (e.target === e.currentTarget) {
                      setSelectedPermissionForProjectGrant(null);
                    }
                  }}
                >
                  <div
                    style={{
                      backgroundColor: 'white',
                      borderRadius: '0.5rem',
                      padding: '2rem',
                      maxWidth: '90vw',
                      maxHeight: '90vh',
                      overflowY: 'auto',
                      width: '800px',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h2 className={layout.sectionTitle} style={{ marginBottom: '1rem' }}>
                      Seleziona Permission per Gestire Grant di Progetto
                    </h2>
                    <p className="text-sm text-gray-600 mb-4">
                      Seleziona una permission dalla lista per gestire le sue grant specifiche di progetto.
                    </p>
                    
                    {globalPermissions && Object.keys(globalPermissions).length > 0 ? (
                      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {Object.entries(globalPermissions).map(([permissionType, permissions]: [string, any]) => {
                          if (!Array.isArray(permissions) || permissions.length === 0) return null;
                          
                          return (
                            <div key={permissionType} style={{ marginBottom: '1rem' }}>
                              <h4 style={{ 
                                fontSize: '0.875rem', 
                                fontWeight: '600', 
                                color: '#374151',
                                marginBottom: '0.5rem'
                              }}>
                                {permissionType}
                              </h4>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                {permissions.map((perm: any) => (
                                  <button
                                    key={perm.id}
                                    className={buttons.button}
                                    style={{ 
                                      textAlign: 'left',
                                      justifyContent: 'flex-start',
                                      padding: '0.5rem 1rem'
                                    }}
                                    onClick={() => {
                                      // Passa la permission completa con projectId al PermissionGrantManager
                                      setSelectedPermissionForProjectGrant({
                                        ...perm,
                                        itemTypeSetId: itemTypeSet.id,
                                      });
                                    }}
                                  >
                                    {perm.name}
                                    {perm.itemType && ` - ${perm.itemType.name}`}
                                    {perm.workflowStatus && ` - ${perm.workflowStatus.name}`}
                                    {perm.fieldConfiguration && ` - ${perm.fieldConfiguration.name}`}
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className={alert.muted}>Nessuna permission disponibile.</p>
                    )}
                    
                    <div className={layout.buttonRow} style={{ marginTop: '1.5rem' }}>
                      <button
                        className={buttons.button}
                        onClick={() => setSelectedPermissionForProjectGrant(null)}
                      >
                        Chiudi
                      </button>
                    </div>
                  </div>
                </div>,
                document.body
              )}
              {selectedPermissionForProjectGrant?.itemTypeSetRoleId && createPortal(
                <div
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1001,
                  }}
                  onClick={(e) => {
                    if (e.target === e.currentTarget) {
                      setSelectedPermissionForProjectGrant(null);
                    }
                  }}
                >
                  <div
                    style={{
                      backgroundColor: 'white',
                      borderRadius: '0.5rem',
                      padding: '2rem',
                      maxWidth: '90vw',
                      maxHeight: '90vh',
                      overflowY: 'auto',
                      width: '900px',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <PermissionGrantManager
                      permission={selectedPermissionForProjectGrant}
                      onClose={() => setSelectedPermissionForProjectGrant(null)}
                      onSave={() => {
                        setSelectedPermissionForProjectGrant(null);
                        setRefreshTrigger((prev) => prev + 1);
                      }}
                      itemTypeSetId={itemTypeSet.id}
                      scope="project"
                      projectId={projectId}
                    />
                  </div>
                </div>,
                document.body
              )}
            </>
          )}
        </div>
        
        {/* Sezione Cambio ItemTypeSet */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cambia ItemTypeSet</h3>
          
          {!hasOtherItemTypeSets && !loading ? (
            <div className="text-gray-500 text-sm">
              Non ci sono altri ItemTypeSet disponibili per il cambio.
            </div>
          ) : !isChanging ? (
            <button
              className={`${buttons.button} ${utilities.mt4}`}
              onClick={handleStartChange}
              disabled={isUpdatingItemTypeSet || !hasOtherItemTypeSets}
              title={!hasOtherItemTypeSets ? "Non ci sono altri ItemTypeSet disponibili" : "Cambia ItemTypeSet"}
            >
              Cambia ItemTypeSet
            </button>
          ) : (
            <div className="space-y-4">
              {/* Combo selezione */}
              <div>
                <label className={form.label}>Seleziona nuovo ItemTypeSet</label>
                <select
                  className={form.select}
                  value={selectedItemTypeSet?.id || ''}
                  onChange={(e) => {
                    const selectedId = parseInt(e.target.value);
                    const selected = availableItemTypeSets.find(its => its.id === selectedId);
                    setSelectedItemTypeSet(selected || null);
                  }}
                  disabled={loading || isUpdatingItemTypeSet}
                >
                  <option value="">-- Seleziona un ItemTypeSet --</option>
                  {availableItemTypeSets
                    .filter(its => its.id !== itemTypeSet.id) // Esclude l'ItemTypeSet attualmente applicato
                    .map((its) => (
                      <option key={its.id} value={its.id}>
                        {its.name} {its.defaultItemTypeSet ? '(Default)' : ''}
                      </option>
                    ))}
                </select>
                {loading && (
                  <div className="mt-2 text-sm text-gray-500 flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    Caricamento ItemTypeSet...
                  </div>
                )}
              </div>

              {/* Anteprima caratteristiche del nuovo ItemTypeSet */}
              {selectedItemTypeSet && (
                <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                  {renderItemTypeSetInfo(selectedItemTypeSet, "Anteprima nuovo ItemTypeSet")}
                </div>
              )}

              {/* Pulsanti azione */}
              <div className={layout.buttonRow}>
                <button
                  onClick={handleCancelChange}
                  className={buttons.button}
                  disabled={isUpdatingItemTypeSet}
                >
                  Annulla
                </button>
                <button
                  onClick={handleApplyChange}
                  className={`${buttons.button} flex items-center gap-2`}
                  disabled={!selectedItemTypeSet || isUpdatingItemTypeSet}
                >
                  {isUpdatingItemTypeSet ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Applicazione...
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      Applica al Progetto
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Messaggi di stato */}
        {isUpdatingItemTypeSet && (
          <div className={alert.infoContainer}>
            <p className={alert.info}>
              <Loader2 size={16} className="animate-spin" />
              Aggiornamento ItemTypeSet in corso...
            </p>
          </div>
        )}

        {successMessage && (
          <div className={alert.successContainer}>
            <p className={alert.success}>
              <CheckCircle size={16} />
              {successMessage}
            </p>
          </div>
        )}

        {error && (
          <div className={alert.errorContainer}>
            <p className={alert.error}>
              <AlertCircle size={16} />
              {error}
            </p>
          </div>
        )}
      </div>
    </>
  );
}

interface ProjectMember {
  userId: number;
  username: string;
  fullName: string | null;
  roleName: string;
  isTenantAdmin: boolean;
}

export default function ProjectSettings() {
  const { projectId } = useParams<{ projectId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const token = (location.state as any)?.token || localStorage.getItem("token");

  const [project, setProject] = useState<ProjectDto | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingItemTypeSet, setIsUpdatingItemTypeSet] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [projectRes, membersRes] = await Promise.all([
          api.get(`/projects/${projectId}`, { headers }),
          api.get(`/projects/${projectId}/members`, { headers })
        ]);
        setProject(projectRes.data);
        setMembers(membersRes.data);
      } catch (err: any) {
        console.error("Errore nel caricamento del progetto:", err);
        setError(err.response?.data?.message || "Error loading project. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (token && projectId) {
      fetchData();
    }
  }, [projectId, token]);

  const handleEditDetails = () => {
    navigate("details", { state: { token, from: location.pathname } });
  };

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} />;
  if (!project) return <ErrorMessage message="Project not found or loading error." />;


  const handleItemTypeSetChange = async (itemTypeSetId: number) => {
    if (!project) return;
    
    try {
      setIsUpdatingItemTypeSet(true);
      const headers = { Authorization: `Bearer ${token}` };
      
      await api.put(`/projects/${project.id}/item-type-set?itemTypeSetId=${itemTypeSetId}`, {}, { headers });
      
      // Ricarica i dati del progetto per aggiornare l'ItemTypeSet
      const projectRes = await api.get(`/projects/${project.id}`, { headers });
      setProject(projectRes.data);
      
      setSuccessMessage("ItemTypeSet aggiornato con successo!");
      setError(null);
      
      // Rimuovi il messaggio di successo dopo 3 secondi
      setTimeout(() => setSuccessMessage(null), 3000);
      
    } catch (err: any) {
      console.error("Errore nell'aggiornamento dell'ItemTypeSet:", err);
      setError(err.response?.data?.message || "Errore nell'aggiornamento dell'ItemTypeSet");
      setSuccessMessage(null);
    } finally {
      setIsUpdatingItemTypeSet(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className={tabStyles.tabContent}>
            <h1 className={layout.title}>Dettagli Progetto</h1>
            <ProjectDetails project={project} onEdit={handleEditDetails} />
          </div>
        );
      
      case 'itemtypeset':
        return (
          <div className={tabStyles.tabContent}>
            {project.itemTypeSet ? (
              <ItemTypeSetDetails 
                itemTypeSet={project.itemTypeSet} 
                onItemTypeSetChange={handleItemTypeSetChange}
                isUpdatingItemTypeSet={isUpdatingItemTypeSet}
                successMessage={successMessage}
                error={error}
                projectId={projectId!}
              />
            ) : (
              <div className={layout.block}>
                <h1 className={layout.title}>ItemTypeSet</h1>
                <p className={alert.muted}>Nessun ItemTypeSet assegnato a questo progetto.</p>
              </div>
            )}
          </div>
        );
      
      case 'members':
        return (
          <div className={tabStyles.tabContent}>
            <div className={layout.block}>
              <h1 className={layout.title}>Membri del Progetto</h1>
              <p className={layout.paragraphMuted}>
                Gestisci gli utenti che possono accedere a questo progetto e i loro ruoli.
                <br />
                <em className="text-sm">Nota: Gli utenti con ruolo Tenant Admin hanno accesso automatico a tutti i progetti.</em>
              </p>
              
              {members.length > 0 ? (
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
                          <td>{member.fullName || <span className="text-gray-400 italic">-</span>}</td>
                          <td>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              member.roleName === 'ADMIN' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {member.roleName === 'ADMIN' ? 'Admin' : 'User'}
                              {member.isTenantAdmin && ' (fisso)'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {members.length > 5 && (
                    <p className="text-sm text-gray-500 mt-2">
                      ... e altri {members.length - 5} membri
                    </p>
                  )}
                </>
              ) : (
                <p className={`${alert.muted} ${utilities.mt4}`}>
                  Nessun membro assegnato a questo progetto.
                </p>
              )}
              
              <ProjectMembersPanel 
                projectId={projectId!}
                token={token}
                members={members}
                onMembersUpdate={setMembers}
              />
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={layout.container} style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header Section */}
      <div className={layout.headerSection}>
        <h1 className={layout.title}>Impostazioni Progetto</h1>
        <p className={layout.paragraphMuted}>
          Gestisci le configurazioni e le impostazioni del tuo progetto.
        </p>
      </div>
      
      {/* Tab Navigation */}
      <div className={layout.section}>
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
      
      {/* Tab Content */}
      <div className={layout.section}>
        {renderTabContent()}
      </div>
    </div>
  );
}

