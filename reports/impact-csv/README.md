# Sample CSV Export - Enhanced Impact Reports

Questa cartella contiene i sample di export CSV generati dai modali Enhanced Impact Report.

## Modali che supportano l'export CSV

1. **Status Enhanced Impact Report** (`StatusEnhancedImpactReportModal`)
   - Configurazione: `statusImpactConfig`
   - Nome file: `status_impact_report_{workflowId}_{timestamp}.csv`

2. **Transition Enhanced Impact Report** (`TransitionEnhancedImpactReportModal`)
   - Configurazione: `transitionImpactConfig`
   - Nome file: `transition_impact_report_{workflowId}_{timestamp}.csv`

3. **Field Set Enhanced Impact Report** (`FieldSetEnhancedImpactReportModal`)
   - Configurazione: `fieldSetImpactConfig`
   - Nome file: `fieldset_impact_report_{fieldSetId}_{timestamp}.csv`

4. **ItemType Configuration Enhanced Impact Report** (`ItemTypeConfigurationEnhancedImpactReportModal`)
   - Configurazione: `itemTypeConfigurationImpactConfig`
   - Nome file: `itemtypeconfiguration_impact_report_{itemTypeSetId}_{timestamp}.csv`

## Struttura CSV

Tutti i CSV esportati utilizzano lo stesso formato standardizzato con i seguenti header:

```
Permission, Item Type Set, Azione, Field, Status, Transition, Ruolo, Grant, Utente, Utente negato, Gruppo, Gruppo negato
```

### Dettagli colonne

- **Permission**: Tipo di permission (STATUS_OWNERS, EXECUTORS, FIELD_OWNERS, etc.)
- **Item Type Set**: Nome dell'ItemTypeSet interessato
- **Azione**: "Mantenuta" o "Rimossa" (basato sulla selezione dell'utente)
- **Field**: Nome del campo (se applicabile)
- **Status**: Nome dello status (se applicabile)
- **Transition**: Formato "Da Status -> A Status (Nome Transition)" (se applicabile)
- **Ruolo**: Nome del ruolo assegnato
- **Grant**: "Global" per grant globali, nome del progetto per grant di progetto
- **Utente**: Username dell'utente assegnato
- **Utente negato**: Username dell'utente negato
- **Gruppo**: Nome del gruppo assegnato
- **Gruppo negato**: Nome del gruppo negato

## Note

- I file CSV includono il BOM (Byte Order Mark) per una corretta apertura in Excel
- I valori contenenti virgole, virgolette o newline vengono automaticamente escaped
- Le righe vengono duplicate per ogni combinazione di permission/ruolo/grant/utente/gruppo
- I grant globali vengono esportati con Grant = "Global"
- I grant di progetto vengono esportati con Grant = nome del progetto

## Contratto PermissionData

Tutti i modali utilizzano il contratto `PermissionData` definito in `frontend/src/utils/csvExportUtils.ts`:

```typescript
export interface PermissionData {
  permissionId: number | null;
  permissionType: string;
  itemTypeSetName: string;
  fieldName?: string | null;
  workflowStatusName?: string | null;
  statusName?: string | null;
  transitionName?: string | null;
  fromStatusName?: string | null;
  toStatusName?: string | null;
  assignedRoles?: string[];
  projectAssignedRoles?: ProjectRoleInfo[];
  grantId?: number | null;
  roleId?: number | null;
  projectGrants?: ProjectGrantInfo[];
  canBePreserved?: boolean;
}

export interface ProjectGrantInfo {
  projectId: number;
  projectName: string;
  assignedRoles?: string[]; // Ruoli assegnati a questa permission per questo progetto
  grantId?: number | null; // Grant assegnato a questa permission per questo progetto (se presente)
  grantName?: string | null; // Nome del grant (se presente)
}
```

## Allineamento tipi

Tutti i tipi `ProjectGrantInfo` sono stati allineati per includere `assignedRoles`, `grantId` e `grantName`:

- ✅ `frontend/src/utils/csvExportUtils.ts`: include `assignedRoles`, `grantId`, `grantName`
- ✅ `frontend/src/types/transition-impact.types.ts`: include `assignedRoles`, `grantId`, `grantName`
- ✅ `frontend/src/types/status-impact.types.ts`: include `assignedRoles`, `grantId`, `grantName`
- ✅ `frontend/src/types/fieldset-impact.types.ts`: include `assignedRoles`, `grantId`, `grantName`
- ✅ `frontend/src/types/itemtypeconfiguration-impact.types.ts`: include `assignedRoles`, `grantId`, `grantName`
- ✅ `frontend/src/types/item-type-configuration-migration.types.ts`: include `assignedRoles`, `grantId`, `grantName`

**Nota**: I grant di progetto ora includono sia i ruoli assegnati (`assignedRoles`) che i grant (`grantId`, `grantName`), permettendo una rappresentazione completa delle assegnazioni a livello di progetto.

## Configurazioni

Le configurazioni sono disponibili in `frontend/src/components/enhancedImpact/configs/`:

- `statusImpactConfig.ts`: Configurazione per Status Impact Report
- `transitionImpactConfig.ts`: Configurazione per Transition Impact Report
- `fieldSetImpactConfig.ts`: Configurazione per Field Set Impact Report
- `itemTypeConfigurationImpactConfig.ts`: Configurazione per ItemType Configuration Impact Report

Ogni configurazione implementa `EnhancedImpactReportConfig<T>` e fornisce:
- `title`: Titolo del report
- `getSubtitle`: Funzione per ottenere il sottotitolo
- `buildPermissionRows`: Funzione per costruire le righe della tabella
- `prepareExportPermissions`: Funzione per preparare i dati per l'export CSV
- `getFieldName`, `getStatusName`, `getTransitionName`: Funzioni per estrarre i nomi
- `exportFileName`: Funzione per generare il nome del file CSV


