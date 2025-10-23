import { useEffect, useState } from "react";
import api from "../../api/api";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { ProjectDto } from "../../types/project.types";
import { CheckCircle, Loader2, AlertCircle, Check, Home, Settings, Users } from "lucide-react";

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
    <div className={layout.block}>
      <p>
        <strong>Name:</strong> {project.name}
      </p>
      <p>
        <strong>Key:</strong> <span className={utilities.monospace}>{project.key}</span>
      </p>
      <p>
        <strong>Description:</strong> {project.description || <em>No description</em>}
      </p>
      <button className={`${buttons.button} ${layout.mt4}`} onClick={onEdit}>
        Edit
      </button>
    </div>
  );
}

interface ItemTypeSetDetailsProps {
  itemTypeSet: any;
  onEdit: () => void;
  onItemTypeSetChange: (itemTypeSetId: number) => void;
  isUpdatingItemTypeSet: boolean;
  successMessage: string | null;
  error: string | null;
}

function ItemTypeSetDetails({ 
  itemTypeSet, 
  onEdit, 
  onItemTypeSetChange, 
  isUpdatingItemTypeSet,
  successMessage,
  error
}: ItemTypeSetDetailsProps) {
  const [isChanging, setIsChanging] = useState(false);
  const [availableItemTypeSets, setAvailableItemTypeSets] = useState<any[]>([]);
  const [selectedItemTypeSet, setSelectedItemTypeSet] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const hasEntries = itemTypeSet.itemTypeConfigurations?.length > 0;
  const isGlobal = itemTypeSet.scope === 'TENANT';

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

  const renderItemTypeSetInfo = (itemTypeSet: any, title: string, showEditButton = false) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {showEditButton && (
          <button
            className={`${buttons.button} ${utilities.mt4}`}
            onClick={onEdit}
            disabled={isGlobal}
            title={isGlobal ? "Global sets cannot be edited" : "Edit item type set"}
          >
            Edit
          </button>
        )}
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
        {renderItemTypeSetInfo(itemTypeSet, "ItemTypeSet Attualmente Applicato", true)}
        
        {/* Sezione Cambio ItemTypeSet */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cambia ItemTypeSet</h3>
          
          {!isChanging ? (
            <button
              className={`${buttons.button} ${utilities.mt4}`}
              onClick={handleStartChange}
              disabled={isUpdatingItemTypeSet}
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
              <div className="flex gap-2">
                <button
                  onClick={handleCancelChange}
                  className={`${buttons.button} ${utilities.mt4}`}
                  disabled={isUpdatingItemTypeSet}
                >
                  Annulla
                </button>
                <button
                  onClick={handleApplyChange}
                  className={`${buttons.button} ${utilities.mt4} flex items-center gap-2`}
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
          <div className={`${alert.info} ${utilities.mt4} flex items-center gap-2`}>
            <Loader2 size={16} className="animate-spin" />
            Aggiornamento ItemTypeSet in corso...
          </div>
        )}

        {successMessage && (
          <div className={`${alert.success} ${utilities.mt4} flex items-center gap-2`}>
            <CheckCircle size={16} />
            {successMessage}
          </div>
        )}

        {error && (
          <div className={`${alert.error} ${utilities.mt4} flex items-center gap-2`}>
            <AlertCircle size={16} />
            {error}
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

  const handleEditItemTypeSet = () => {
    if (project?.itemTypeSet) {
      navigate(`item-type-set/${project.itemTypeSet.id}`, { state: { token } });
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} />;
  if (!project) return <ErrorMessage message="Project not found or loading error." />;

  const handleManageMembers = () => {
    navigate("members", { state: { token } });
  };

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
                onEdit={handleEditItemTypeSet}
                onItemTypeSetChange={handleItemTypeSetChange}
                isUpdatingItemTypeSet={isUpdatingItemTypeSet}
                successMessage={successMessage}
                error={error}
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
              
              <button
                className={`${buttons.button} ${utilities.mt4}`}
                onClick={handleManageMembers}
              >
                Gestisci Membri
              </button>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={layout.container}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Impostazioni Progetto</h1>
        <p className="text-gray-600">Gestisci le configurazioni e le impostazioni del tuo progetto</p>
      </div>
      
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {renderTabContent()}
      </div>
    </div>
  );
}

