// src/components/TenantModal.jsx
import React from 'react';

const modalStyle = {
  overlay: {
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
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '2rem',
    width: '100%',
    maxWidth: '500px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  title: {
    marginTop: 0,
    marginBottom: '1.5rem',
    color: '#1f2937',
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: '1.25rem',
    textAlign: 'left',
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '1rem',
    marginTop: '0.25rem',
  },
  buttonGroup: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1.5rem',
  },
  cancelButton: {
    flex: 1,
    padding: '0.75rem',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  submitButton: {
    flex: 1,
    padding: '0.75rem',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 500,
    transition: 'all 0.2s ease',
  },
};

const TenantModal = ({ show, onClose, formData, handleChange, handleSubmit, isLoading }) => {
  if (!show) return null;

  return (
    <div style={modalStyle.overlay} onClick={onClose}>
      <div style={modalStyle.modal} onClick={e => e.stopPropagation()}>
        <h3 style={modalStyle.title}>Crea un nuovo Tenant</h3>
        <form onSubmit={handleSubmit}>
          <div style={modalStyle.formGroup}>
            <label>Nome Azienda</label>
            <input
              type="text"
              name="name"
              value={formData.name || ''}
              onChange={handleChange}
              required
              style={modalStyle.input}
              disabled={isLoading}
            />
          </div>
          <div style={modalStyle.formGroup}>
            <label>Subdomain</label>
            <input
              type="text"
              name="subdomain"
              value={formData.subdomain || ''}
              onChange={handleChange}
              required
              style={modalStyle.input}
              disabled={isLoading}
            />
          </div>
          <div style={modalStyle.formGroup}>
            <label>Chiave di Licenza</label>
            <input
              type="text"
              name="licenseKey"
              value={formData.licenseKey || ''}
              onChange={handleChange}
              required
              style={modalStyle.input}
              disabled={isLoading}
            />
          </div>
          <div style={modalStyle.buttonGroup}>
            <button
              type="button"
              onClick={onClose}
              style={modalStyle.cancelButton}
              disabled={isLoading}
            >
              Annulla
            </button>
            <button
              type="submit"
              style={{
                ...modalStyle.submitButton,
                backgroundColor: isLoading ? '#93c5fd' : '#3b82f6',
                cursor: isLoading ? 'not-allowed' : 'pointer'
              }}
              disabled={isLoading}
            >
              {isLoading ? 'Creazione in corso...' : 'Crea Tenant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TenantModal;