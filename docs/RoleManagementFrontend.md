# Gestione Ruoli ItemTypeSet - Frontend

## Panoramica

Il frontend è stato aggiornato per supportare la nuova struttura di ruoli con 7 tipologie specifiche per ItemTypeSet.

## Componenti Principali

### 1. ItemTypeSetRoleManager
**File**: `frontend/src/components/ItemTypeSetRoleManager.jsx`

**Funzionalità**:
- Visualizzazione di tutti i ruoli per un ItemTypeSet
- Creazione automatica di ruoli
- Creazione manuale di ruoli
- Gestione grants per ogni ruolo
- Statistiche dei ruoli

**Caratteristiche**:
- Raggruppamento per tipo di ruolo
- Icone specifiche per ogni tipo
- Colori distintivi per ogni categoria
- Espansione/collasso per dettagli

### 2. RoleGrantManager
**File**: `frontend/src/components/RoleGrantManager.jsx`

**Funzionalità**:
- Visualizzazione grants assegnati a un ruolo
- Assegnazione nuovi grants
- Rimozione grants esistenti
- Visualizzazione utenti e gruppi assegnati/negati

### 3. FieldStatusPairViewer
**File**: `frontend/src/components/FieldStatusPairViewer.jsx`

**Funzionalità**:
- Visualizzazione coppie (FieldConfiguration, WorkflowStatus)
- Ruoli EDITOR e VIEWER per ogni coppia
- Dettagli specifici per ogni combinazione

### 4. CreateRoleForm
**File**: `frontend/src/components/CreateRoleForm.jsx`

**Funzionalità**:
- Form per creazione manuale ruoli
- Auto-generazione nomi ruoli
- Supporto per entità secondarie (EDITOR/VIEWER)
- Validazione campi obbligatori

### 5. RoleStatistics
**File**: `frontend/src/components/RoleStatistics.jsx`

**Funzionalità**:
- Statistiche generali (totale ruoli, grants, etc.)
- Dettaglio per tipo di ruolo
- Grafici e percentuali
- Informazioni sui tipi di ruolo

## Tipologie Ruoli Supportate

### 1. WORKER
- **Icona**: Users
- **Colore**: Blue
- **Descrizione**: Per ogni ItemType nell'ItemTypeSet
- **Entità**: ItemType

### 2. OWNER
- **Icona**: Shield
- **Colore**: Green
- **Descrizione**: Per ogni WorkflowStatus di ogni Workflow
- **Entità**: WorkflowStatus

### 3. FIELD_EDITOR
- **Icona**: Edit
- **Colore**: Purple
- **Descrizione**: Per ogni FieldConfiguration (editing sempre)
- **Entità**: FieldConfiguration

### 4. CREATOR
- **Icona**: Plus
- **Colore**: Orange
- **Descrizione**: Per ogni Workflow associato
- **Entità**: Workflow

### 5. EXECUTOR
- **Icona**: Settings
- **Colore**: Red
- **Descrizione**: Per ogni Transition di ogni Workflow
- **Entità**: Transition

### 6. EDITOR
- **Icona**: Edit
- **Colore**: Indigo
- **Descrizione**: Per coppia (FieldConfiguration + WorkflowStatus)
- **Entità**: ItemTypeConfiguration + FieldConfiguration (secondary)

### 7. VIEWER
- **Icona**: Eye
- **Colore**: Gray
- **Descrizione**: Per coppia (FieldConfiguration + WorkflowStatus)
- **Entità**: ItemTypeConfiguration + FieldConfiguration (secondary)

## Integrazione con ItemTypeSets

La pagina `ItemTypeSets.jsx` è stata aggiornata per includere:

1. **Pulsante "Ruoli"**: Apre il gestore ruoli per l'ItemTypeSet selezionato
2. **Pulsante "Coppie"**: Visualizza le coppie Field-Status per ruoli EDITOR/VIEWER
3. **Modal per gestione ruoli**: Overlay per gestione completa ruoli
4. **Modal per coppie**: Overlay per visualizzazione coppie specifiche

## API Integration

### Endpoints Utilizzati

```javascript
// Ottenere ruoli per ItemTypeSet
GET /api/itemtypeset-roles/itemtypeset/{itemTypeSetId}?tenantId={tenantId}

// Creare ruoli automatici
POST /api/itemtypeset-roles/create-for-itemtypeset/{itemTypeSetId}?tenantId={tenantId}

// Creare ruolo manuale
POST /api/itemtypeset-roles

// Ottenere ruoli per tipo
GET /api/itemtypeset-roles/type/{roleType}?itemTypeSetId={itemTypeSetId}&tenantId={tenantId}

// Assegnare grant a ruolo
POST /api/itemtypeset-roles/assign-grant

// Rimuovere grant da ruolo
DELETE /api/itemtypeset-roles/remove-grant?roleId={roleId}&grantId={grantId}
```

### DTO Structure

```javascript
// ItemTypeSetRoleDTO
{
  id: number,
  roleType: string, // WORKER, OWNER, FIELD_EDITOR, etc.
  name: string,
  description: string,
  itemTypeSetId: number,
  relatedEntityType: string,
  relatedEntityId: number,
  secondaryEntityType: string, // Per EDITOR/VIEWER
  secondaryEntityId: number,   // Per EDITOR/VIEWER
  tenantId: number,
  grants: ItemTypeSetRoleGrantDTO[]
}

// ItemTypeSetRoleGrantDTO
{
  id: number,
  itemTypeSetRoleId: number,
  grantId: number,
  tenantId: number,
  grantedUserIds: number[],
  grantedGroupIds: number[],
  negatedUserIds: number[],
  negatedGroupIds: number[]
}
```

## Styling

I componenti utilizzano il sistema di styling esistente:

- **Layout**: `Layout.module.css`
- **Buttons**: `Buttons.module.css`
- **Alerts**: `Alerts.module.css`
- **Utilities**: `Utilities.module.css`
- **Tables**: `Tables.module.css`

### Classi CSS Personalizzate

```css
/* Colori per tipi di ruolo */
.bg-blue-50, .text-blue-800    /* WORKER */
.bg-green-50, .text-green-800  /* OWNER */
.bg-purple-50, .text-purple-800 /* FIELD_EDITOR */
.bg-orange-50, .text-orange-800 /* CREATOR */
.bg-red-50, .text-red-800      /* EXECUTOR */
.bg-indigo-50, .text-indigo-800 /* EDITOR */
.bg-gray-50, .text-gray-800    /* VIEWER */
```

## Funzionalità Avanzate

### 1. Auto-generazione Nomi Ruoli
Il form di creazione genera automaticamente nomi descrittivi:
- `"Worker for ItemType 1"`
- `"Editor for Priority in In Progress"`
- `"Field Editor for Description"`

### 2. Raggruppamento Intelligente
I ruoli vengono raggruppati per tipo con:
- Contatori per ogni categoria
- Icone distintive
- Colori specifici

### 3. Gestione Coppie Field-Status
Visualizzazione specializzata per ruoli EDITOR/VIEWER:
- Coppie (FieldConfiguration, WorkflowStatus)
- Ruoli specifici per ogni combinazione
- Dettagli granulari

### 4. Statistiche Avanzate
Dashboard con:
- Totale ruoli e grants
- Percentuali per tipo
- Grafici di distribuzione
- Informazioni dettagliate

## Note di Implementazione

1. **Responsive Design**: Tutti i componenti sono responsive e funzionano su mobile
2. **Error Handling**: Gestione errori completa con messaggi user-friendly
3. **Loading States**: Indicatori di caricamento per tutte le operazioni async
4. **Accessibility**: Supporto per screen reader e navigazione da tastiera
5. **Performance**: Lazy loading e ottimizzazioni per grandi dataset

## Prossimi Sviluppi

1. **Filtri Avanzati**: Filtri per tipo, entità, grants
2. **Bulk Operations**: Operazioni multiple su ruoli
3. **Export/Import**: Esportazione configurazioni ruoli
4. **Audit Trail**: Tracciamento modifiche ruoli
5. **Templates**: Template predefiniti per configurazioni comuni



