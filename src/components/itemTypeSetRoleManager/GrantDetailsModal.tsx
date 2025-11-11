import { MouseEvent } from "react";

interface GrantDetailsState {
  projectId: number;
  projectName: string;
  roleId: number;
  details: {
    users?: any[];
    groups?: any[];
    negatedUsers?: any[];
    negatedGroups?: any[];
  } | null;
  isProjectGrant: boolean;
}

interface GrantDetailsModalProps {
  details: GrantDetailsState | null;
  loading: boolean;
  onClose: () => void;
}

const renderBadgeList = (
  items: any[] | undefined,
  emptyLabel: string,
  color: string
) => {
  if (!items || items.length === 0) {
    return (
      <span style={{ color: "#9ca3af", fontSize: "0.875rem" }}>
        {emptyLabel}
      </span>
    );
  }

  return items.map((item, index) => (
    <span
      key={`${item?.id ?? index}-${index}`}
      style={{
        padding: "4px 8px",
        backgroundColor: color,
        borderRadius: "4px",
        fontSize: "0.875rem",
      }}
    >
      {item?.fullName ||
        item?.username ||
        item?.email ||
        item?.name ||
        `#${item?.id ?? index}`}
    </span>
  ));
};

export const GrantDetailsModal = ({
  details,
  loading,
  onClose,
}: GrantDetailsModalProps) => {
  if (!details) {
    return null;
  }

  const handleOverlayClick = () => {
    onClose();
  };

  const handleContentClick = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  return (
    <div
      onClick={handleOverlayClick}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10001,
      }}
    >
      <div
        onClick={handleContentClick}
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "24px",
          maxWidth: "600px",
          width: "90%",
          maxHeight: "80vh",
          overflowY: "auto",
        }}
      >
        <h2
          style={{
            fontSize: "1.25rem",
            fontWeight: "600",
            marginBottom: "16px",
          }}
        >
          Dettagli Grant - {details.projectName}
        </h2>

        {loading ? (
          <div style={{ textAlign: "center", padding: "20px" }}>
            Caricamento...
          </div>
        ) : details.details ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "20px",
            }}
          >
            <div>
              <h3
                style={{
                  fontSize: "1rem",
                  fontWeight: "600",
                  marginBottom: "8px",
                  color: "#374151",
                }}
              >
                Utenti ({details.details.users?.length || 0})
              </h3>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                  minHeight: "40px",
                }}
              >
                {renderBadgeList(details.details.users, "Nessuno", "#dbeafe")}
              </div>
            </div>

            <div>
              <h3
                style={{
                  fontSize: "1rem",
                  fontWeight: "600",
                  marginBottom: "8px",
                  color: "#374151",
                }}
              >
                Gruppi ({details.details.groups?.length || 0})
              </h3>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                  minHeight: "40px",
                }}
              >
                {renderBadgeList(details.details.groups, "Nessuno", "#d1fae5")}
              </div>
            </div>

            <div>
              <h3
                style={{
                  fontSize: "1rem",
                  fontWeight: "600",
                  marginBottom: "8px",
                  color: "#dc2626",
                }}
              >
                Utenti negati ({details.details.negatedUsers?.length || 0})
              </h3>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                  minHeight: "40px",
                }}
              >
                {renderBadgeList(
                  details.details.negatedUsers,
                  "Nessuno",
                  "#fee2e2"
                )}
              </div>
            </div>

            <div>
              <h3
                style={{
                  fontSize: "1rem",
                  fontWeight: "600",
                  marginBottom: "8px",
                  color: "#dc2626",
                }}
              >
                Gruppi negati ({details.details.negatedGroups?.length || 0})
              </h3>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                  minHeight: "40px",
                }}
              >
                {renderBadgeList(
                  details.details.negatedGroups,
                  "Nessuno",
                  "#fee2e2"
                )}
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "20px",
              color: "#dc2626",
            }}
          >
            Errore nel caricamento dei dettagli
          </div>
        )}

        <div
          style={{
            marginTop: "24px",
            textAlign: "right",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 16px",
              backgroundColor: "#6b7280",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: "600",
            }}
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};


