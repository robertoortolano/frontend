import React, { useEffect } from 'react';
import alert from '../styles/common/Alerts.module.css';

interface ToastProps {
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error';
  duration?: number;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ 
  message, 
  type = 'info', 
  duration = 3000,
  onClose 
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: '#ecfdf5',
          borderColor: '#10b981',
          color: '#047857',
        };
      case 'warning':
        return {
          backgroundColor: '#fffbeb',
          borderColor: '#f59e0b',
          color: '#d97706',
        };
      case 'error':
        return {
          backgroundColor: '#fef2f2',
          borderColor: '#ef4444',
          color: '#dc2626',
        };
      default: // info
        return {
          backgroundColor: '#eff6ff',
          borderColor: '#3b82f6',
          color: '#1e40af',
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '1rem 1.5rem',
        borderRadius: '0.5rem',
        border: `2px solid ${styles.borderColor}`,
        backgroundColor: styles.backgroundColor,
        color: styles.color,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: 10000,
        minWidth: '300px',
        maxWidth: '500px',
        animation: 'slideIn 0.3s ease-out',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ margin: 0, fontWeight: 500 }}>{message}</p>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: styles.color,
            cursor: 'pointer',
            fontSize: '1.25rem',
            lineHeight: 1,
            padding: '0',
            marginLeft: '1rem',
            opacity: 0.7,
          }}
          aria-label="Chiudi"
        >
          ×
        </button>
      </div>
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};





