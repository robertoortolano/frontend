import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { createPortal } from 'react-dom';

import buttons from '../../../styles/common/Buttons.module.css';
import layout from '../../../styles/common/Layout.module.css';
import utilities from '../../../styles/common/Utilities.module.css';

import type { Role, Group } from './permissionGrantTypes';
import type { UserOption } from '../../UserAutocomplete';

interface GrantDetailsModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  roles?: Role[];
  users?: UserOption[];
  groups?: Group[];
  negatedUsers?: UserOption[];
  negatedGroups?: Group[];
  emptyMessage?: string;
}

const overlayStyle: CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(15, 23, 42, 0.35)',
  zIndex: 9999,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1.5rem',
};

const modalStyle: CSSProperties = {
  backgroundColor: 'white',
  borderRadius: '0.75rem',
  width: 'min(620px, 90vw)',
  maxHeight: '80vh',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  boxShadow: '0 20px 45px rgba(30, 64, 175, 0.18)',
};

const contentStyle: CSSProperties = {
  padding: '1.5rem',
  overflowY: 'auto',
};

const listStyle: CSSProperties = {
  margin: 0,
  paddingLeft: '1.25rem',
  listStyleType: 'disc',
};

export default function GrantDetailsModal({
  open,
  title,
  onClose,
  roles,
  users = [],
  groups = [],
  negatedUsers = [],
  negatedGroups = [],
  emptyMessage = 'Nessun elemento configurato.',
}: GrantDetailsModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!open || !mounted) {
    return null;
  }

  const hasRoles = (roles?.length ?? 0) > 0;
  const hasDirectAssignments = users.length + groups.length + negatedUsers.length + negatedGroups.length > 0;

  return createPortal(
    <div style={overlayStyle} role="dialog" aria-modal="true" aria-label={title}>
      <div style={modalStyle}>
        <div className={layout.blockHeader} style={{ padding: '1.25rem 1.5rem' }}>
          <h2 className={layout.blockTitleBlue} style={{ margin: 0 }}>
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={buttons.button}
            style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
          >
            Chiudi
          </button>
        </div>

        <div style={contentStyle} className={utilities.scrollY}>
          {hasRoles && (
            <section className={utilities.mb4}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem' }}>Ruoli associati</h3>
              <ul style={listStyle}>
                {roles!.map((role) => (
                  <li key={role.id} style={{ marginBottom: '0.25rem', color: '#1f2937' }}>
                    <strong>{role.name}</strong>
                    {role.description && <span style={{ color: '#6b7280' }}> – {role.description}</span>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {hasDirectAssignments && (
            <>
              <section className={utilities.mb4}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Utenti autorizzati ({users.length})
                </h3>
                {users.length > 0 ? (
                  <ul style={listStyle}>
                    {users.map((user) => (
                      <li key={user.id} style={{ marginBottom: '0.25rem', color: '#1f2937' }}>
                        <strong>{user.fullName || user.username}</strong>
                        {user.username && user.fullName && (
                          <span style={{ color: '#6b7280' }}> ({user.username})</span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={layout.paragraphMuted}>Nessun utente autorizzato.</p>
                )}
              </section>

              <section className={utilities.mb4}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Gruppi autorizzati ({groups.length})
                </h3>
                {groups.length > 0 ? (
                  <ul style={listStyle}>
                    {groups.map((group) => (
                      <li key={group.id} style={{ marginBottom: '0.25rem', color: '#1f2937' }}>
                        {group.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={layout.paragraphMuted}>Nessun gruppo autorizzato.</p>
                )}
              </section>

              <section className={utilities.mb4}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Utenti negati ({negatedUsers.length})
                </h3>
                {negatedUsers.length > 0 ? (
                  <ul style={listStyle}>
                    {negatedUsers.map((user) => (
                      <li key={user.id} style={{ marginBottom: '0.25rem', color: '#b91c1c' }}>
                        <strong>{user.fullName || user.username}</strong>
                        {user.username && user.fullName && (
                          <span style={{ color: '#ef4444' }}> ({user.username})</span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={layout.paragraphMuted}>Nessun utente negato.</p>
                )}
              </section>

              <section>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Gruppi negati ({negatedGroups.length})
                </h3>
                {negatedGroups.length > 0 ? (
                  <ul style={listStyle}>
                    {negatedGroups.map((group) => (
                      <li key={group.id} style={{ marginBottom: '0.25rem', color: '#b91c1c' }}>
                        {group.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={layout.paragraphMuted}>Nessun gruppo negato.</p>
                )}
              </section>
            </>
          )}

          {!hasRoles && !hasDirectAssignments && (
            <p className={layout.paragraphMuted} style={{ marginBottom: 0 }}>
              {emptyMessage}
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}


