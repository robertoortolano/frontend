/**
 * Componente riutilizzabile per il badge "Disabilitato"
 * Utilizzato nei popup per indicare opzioni o elementi disabilitati
 */
export default function DisabledBadge() {
  return (
    <span
      style={{
        fontSize: "0.625rem",
        padding: "0.125rem 0.375rem",
        backgroundColor: "#fee2e2",
        color: "#991b1b",
        borderRadius: "0.25rem",
        fontWeight: "500",
      }}
    >
      Disabilitato
    </span>
  );
}




