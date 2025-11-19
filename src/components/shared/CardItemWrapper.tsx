import React from "react";
import styles from "../../styles/shared/CardItem.module.css";

interface CardItemWrapperProps {
  title: string;
  badges?: React.ReactNode[];
  children?: React.ReactNode;
  additionalContent?: React.ReactNode;
}

/**
 * Componente wrapper per standardizzare il rendering delle card nei popup.
 * Elimina la duplicazione di stili inline e centralizza la struttura delle card.
 * 
 * @param title - Titolo della card (mostrato in bold blu)
 * @param badges - Array di badge da mostrare nell'header (es. DefaultBadge, DisabledBadge, ProjectBadges)
 * @param children - Contenuto principale della card (es. lista opzioni annidate)
 * @param additionalContent - Contenuto aggiuntivo dopo l'header ma prima dei children (es. tipo di campo)
 */
export default function CardItemWrapper({
  title,
  badges = [],
  children,
  additionalContent,
}: CardItemWrapperProps) {
  const hasContentAfterHeader = additionalContent || children;

  return (
    <div className={styles.cardItem}>
      <div
        className={`${styles.cardHeader} ${
          hasContentAfterHeader ? styles.cardHeaderWithSpacing : ""
        }`}
      >
        <strong className={styles.cardTitle}>{title}</strong>
        {badges.length > 0 && (
          <div className={styles.badgesContainer}>
            {badges.map((badge, index) => (
              <React.Fragment key={index}>{badge}</React.Fragment>
            ))}
          </div>
        )}
      </div>
      {additionalContent && (
        <div
          className={`${styles.additionalContent} ${
            children ? styles.additionalContentWithSpacing : ""
          }`}
        >
          {additionalContent}
        </div>
      )}
      {children && <div className={styles.children}>{children}</div>}
    </div>
  );
}

