import { useEffect, useState, FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import { FieldConfigurationViewDto, FieldSetViewDto } from "../../types/field.types";
import { FieldSetEnhancedImpactReportModal } from "../../components/FieldSetEnhancedImpactReportModal";
import { useToast } from "../../context/ToastContext";
import { PageContainer } from "../../components/shared/layout";
import { useFieldSetConfigurations } from "../../hooks/useFieldSetConfigurations";
import { useFieldSetRemovalImpact } from "../../hooks/useFieldSetRemovalImpact";
import { useFieldSetSave } from "../../hooks/useFieldSetSave";
import { FieldSetEditForm } from "./components/FieldSetEditForm";

interface FieldSetEditUniversalProps {
  scope: 'tenant' | 'project';
  projectId?: string;
}

export default function FieldSetEditUniversal({ scope, projectId }: FieldSetEditUniversalProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const auth = useAuth() as any;
  const token = auth?.token;
  const isAuthenticated = auth?.isAuthenticated;

  const [fieldSet, setFieldSet] = useState<FieldSetViewDto | null>(null);
  const [fields, setFields] = useState<Array<{ id: number; name: string; defaultField?: boolean }>>([]);
  const [fieldConfigurations, setFieldConfigurations] = useState<FieldConfigurationViewDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { showToast } = useToast();

  // configurations hook (selected, dnd, selection)
  const {
    selectedConfigurations,
    setSelectedConfigurations,
    sensors,
    handleDragEnd,
    handleConfigurationSelect,
    removeConfiguration,
    configurationsByField,
  } = useFieldSetConfigurations({
    fields,
    fieldConfigurations,
  });

  // impact analysis hook (modal state + analysis)
  const {
    showImpactReport,
    impactReport,
    analyzingImpact,
    setShowImpactReport,
    setImpactReport,
    analyzeRemovalImpact,
    handleCancelImpact,
  } = useFieldSetRemovalImpact();

  useEffect(() => {
    if (!id || !token) return;

    const fetchData = async () => {
      try {
        const [fieldSetRes, fieldsRes, configsRes] = await Promise.all([
          api.get(`/field-sets/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          api.get("/fields", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          api.get(scope === 'project' && projectId 
            ? `/fieldconfigurations/project/${projectId}`
            : "/fieldconfigurations", {
            headers: { Authorization: `Bearer ${token}` },
          })
        ]);

        const fieldSetData = fieldSetRes.data;
        setFieldSet(fieldSetData);
        setFields(fieldsRes.data);
        setFieldConfigurations(configsRes.data);
        
        // Set selected configurations from field set
        const configIds = (fieldSetData.fieldSetEntries?.map((entry: any) => 
          entry.fieldConfiguration?.id || entry.fieldConfigurationId
        ).filter((id: number | undefined): id is number => id !== undefined)) || [];
        
        setSelectedConfigurations(configIds);
      } catch (err: any) {
        setError(err.response?.data?.message || "Errore nel caricamento dei dati");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, token, scope, projectId]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!fieldSet) return;

    setError(null);

    if (!fieldSet.name.trim()) {
      setError("Il nome del field set è obbligatorio");
      return;
    }

    if (selectedConfigurations.length === 0) {
      setError("Devi selezionare almeno una configurazione");
      return;
    }

    const originalConfigIds = (fieldSet.fieldSetEntries?.map((entry: any) => 
      entry.fieldConfiguration?.id || entry.fieldConfigurationId
    ).filter((id: number | undefined): id is number => id !== undefined)) || [];
    
    // Calcola tutte le configurazioni rimosse (quelle originali che non sono più selezionate)
    const allRemovedConfigIds = originalConfigIds.filter((id: number | undefined): id is number => 
      id !== undefined && !selectedConfigurations.includes(id)
    );

    if (allRemovedConfigIds.length > 0) {
      await analyzeRemovalImpact({
        fieldSetId: id!,
        authToken: token,
        selectedConfigurations,
        originalConfigIds,
        onNoImpact: async () => {
          await performSave(true);
          showToast('FieldSet aggiornato con successo. Nessun impatto rilevato sulle permission.', 'success');
          setTimeout(() => {
            if (scope === 'tenant') {
              navigate("/tenant/field-sets");
            } else if (scope === 'project' && projectId) {
              navigate(`/projects/${projectId}/field-sets`);
            }
          }, 500);
        },
        onImpactDetected: (impact) => {
          setImpactReport(impact);
          setShowImpactReport(true);
        },
        onError: (message) => setError(message),
      });
    } else {
      // Nessuna rimozione: salva direttamente e naviga
      setSaving(true);
      setError(null);
      
      try {
        await performSave(false);
      } catch (err: any) {
        setError(err.response?.data?.message || "Errore nel salvataggio");
      } finally {
        setSaving(false);
      }
    }
  };

  const { performSave, handleConfirmSave } = useFieldSetSave({
    fieldSetId: id || "",
    scope,
    projectId,
    authToken: token,
    selectedConfigurations,
    fieldSet: fieldSet ? { name: fieldSet.name, description: fieldSet.description } : null,
    onError: (m) => setError(m),
    onSavingChange: (s) => setSaving(s),
    onSuccessNavigate: (path) => navigate(path),
    showToast,
    resetImpactModal: () => {
      setShowImpactReport(false);
      setImpactReport(null);
    },
  });

  const handleInputChange = (field: keyof FieldSetViewDto, value: any) => {
    if (fieldSet) {
      setFieldSet({
        ...fieldSet,
        [field]: value
      });
    }
  };

  if (!isAuthenticated) {
    return <p className="list-loading">Non sei autenticato.</p>;
  }

  if (loading) {
    return <p className="list-loading">Caricamento field set...</p>;
  }

  if (!fieldSet) {
    return <p className="list-loading">Field set non trovato.</p>;
  }

  const getTitle = () => {
    return scope === 'tenant'
      ? "Modifica Field Set"
      : "Modifica Field Set del Progetto";
  };

  const getDescription = () => {
    return scope === 'tenant'
      ? "Modifica un field set a livello tenant."
      : "Modifica un field set specifico per questo progetto.";
  };

  return (
    <PageContainer
      maxWidth="1600px"
      style={{ padding: "0 1rem", width: "100%", boxSizing: "border-box" }}
    >
      <FieldSetEditForm
        title={getTitle()}
        description={getDescription()}
        error={error}
        saving={saving}
        analyzingImpact={analyzingImpact}
        fieldSetName={fieldSet.name}
        fieldSetDescription={fieldSet.description}
        onChangeName={(v) => handleInputChange('name', v)}
        onChangeDescription={(v) => handleInputChange('description', v)}
        onSubmit={handleSubmit}
        onCancel={() => {
          if (scope === 'tenant') {
            navigate("/tenant/field-sets");
          } else if (scope === 'project' && projectId) {
            navigate(`/projects/${projectId}/field-sets`);
          }
        }}
        selectedConfigurations={selectedConfigurations}
        sensors={sensors}
        handleDragEnd={handleDragEnd}
        fieldConfigurations={fieldConfigurations}
        fields={fields}
        removeConfiguration={removeConfiguration}
        configurationsByField={configurationsByField}
        handleConfigurationSelect={handleConfigurationSelect}
      />

      {/* Summary Impact Report Modal (before saving) */}
      <FieldSetEnhancedImpactReportModal
        isOpen={showImpactReport}
        onClose={handleCancelImpact}
        onConfirm={(preservedIds?: number[]) => {
          const originalConfigIds =
            fieldSet.fieldSetEntries?.map((entry) => entry.fieldConfiguration?.id || entry.fieldConfigurationId) || [];
          return handleConfirmSave(originalConfigIds as number[], preservedIds);
        }}
        impact={impactReport}
        loading={analyzingImpact || saving}
        isProvisional={false}
      />
    </PageContainer>
  );
}
