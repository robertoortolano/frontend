import React from 'react';
import buttons from '../styles/common/Buttons.module.css';
import layout from '../styles/common/Layout.module.css';
import form from '../styles/common/Forms.module.css';

export interface ImpactReportSummaryItem {
  label: string;
  value: string | number;
}

export interface ImpactReportTableColumn {
  header: string;
  key: string;
  render?: (value: any, row: any) => React.ReactNode;
  tdStyle?: React.CSSProperties;
}

export interface ImpactReportTableSection {
  title: string;
  icon: string;
  columns: ImpactReportTableColumn[];
  data: any[];
  showIfEmpty?: boolean;
}

export interface ImpactReportData {
  title: string;
  summaryItems: ImpactReportSummaryItem[];
  tableSections: ImpactReportTableSection[];
  hasPopulatedPermissions: boolean;
  warningMessage?: string;
}

interface GenericImpactReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onExport: () => void;
  data: ImpactReportData | null;
  loading?: boolean;
  confirmButtonColor?: string;
  confirmButtonText?: string;
}

export const GenericImpactReportModal: React.FC<GenericImpactReportModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onExport,
  data,
  loading = false,
  confirmButtonColor = '#059669',
  confirmButtonText = '✅ Conferma Rimozione'
}) => {
  if (!isOpen || !data) return null;

  const renderTableSection = (section: ImpactReportTableSection) => {
    if (!section.showIfEmpty && section.data.length === 0) {
      return null;
    }

    return (
      <div key={section.title} className={layout.section}>
        <h3 className={layout.sectionTitle}>{section.icon} {section.title}</h3>
        <div className={form.tableContainer}>
          <table className={form.table}>
            <thead>
              <tr>
                {section.columns.map((column) => (
                  <th key={column.key}>{column.header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {section.data.map((row, index) => (
                <tr key={index}>
                  {section.columns.map((column) => (
                    <td key={column.key} style={column.tdStyle}>
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className={form.modalOverlay}>
      <div className={form.modal} style={{ maxWidth: '900px', maxHeight: '80vh', overflow: 'auto' }}>
        <div className={form.modalHeader}>
          <h2 className={form.modalTitle}>
            {data.title}
          </h2>
          <button
            type="button"
            className={form.closeButton}
            onClick={onClose}
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <div className={form.modalBody}>
          {/* Summary Section (render only if not empty) */}
          {data.summaryItems && data.summaryItems.length > 0 && (
            <div className={layout.section}>
              <h3 className={layout.sectionTitle}>📋 Riepilogo</h3>
              <div className={form.infoGrid}>
                {data.summaryItems.map((item, index) => (
                  <div key={index} className={form.infoItem}>
                    <strong>{item.label}:</strong> {item.value}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Table Sections */}
          {data.tableSections.map(renderTableSection)}

          {/* Warning Section */}
          {data.hasPopulatedPermissions && data.warningMessage && (
            <div className={form.alertWarning}>
              <h4>⚠️ Attenzione!</h4>
              <p>
                {data.warningMessage}
              </p>
            </div>
          )}
        </div>

        <div className={form.modalFooter}>
          <button
            className={`${buttons.button} ${buttons.buttonSecondary}`}
            onClick={onExport}
            disabled={loading}
          >
            📥 Esporta CSV
          </button>
          <button
            className={`${buttons.button} ${buttons.buttonDanger}`}
            onClick={onClose}
            disabled={loading}
          >
            ❌ Annulla
          </button>
          <button
            className={`${buttons.button} ${buttons.buttonPrimary}`}
            onClick={onConfirm}
            disabled={loading}
            style={{ backgroundColor: confirmButtonColor }}
          >
            {confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};