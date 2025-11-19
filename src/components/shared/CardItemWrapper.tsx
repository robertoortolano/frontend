import React from "react";
import styles from "../../styles/shared/CardItem.module.css";

interface CardItemWrapperProps {
  title: string;
  badges?: React.ReactNode[];
  leftBadges?: React.ReactNode[];
  rightBadges?: React.ReactNode[];
  children?: React.ReactNode;
  additionalContent?: React.ReactNode;
}

/**
 * Componente wrapper per standardizzare il rendering delle card nei popup.
 * Elimina la duplicazione di stili inline e centralizza la struttura delle card.
 * 
 * @param title - Titolo della card (mostrato in bold blu)
 * @param badges - Array di badge da mostrare nell'header (DEPRECATO: usare leftBadges e rightBadges)
 * @param leftBadges - Array di badge da mostrare a sinistra dopo il titolo (es. DefaultBadge, DisabledBadge)
 * @param rightBadges - Array di badge da mostrare a destra (es. ProjectBadges)
 * @param children - Contenuto principale della card (es. lista opzioni annidate)
 * @param additionalContent - Contenuto aggiuntivo dopo l'header ma prima dei children (es. tipo di campo)
 */
export default function CardItemWrapper({
  title,
  badges = [],
  leftBadges,
  rightBadges,
  children,
  additionalContent,
}: CardItemWrapperProps) {
  const hasContentAfterHeader = additionalContent || children;
  
  // Supporto retrocompatibilità: se leftBadges/rightBadges non sono specificati, usa badges
  // e separa automaticamente ProjectBadges dagli altri
  const finalLeftBadges = leftBadges !== undefined 
    ? leftBadges 
    : badges.filter((badge) => {
        // Se è un React element, controlla se è ProjectBadges
        if (React.isValidElement(badge)) {
          // ProjectBadges ha projects prop, gli altri no
          return !badge.props?.projects && !badge.props?.usedInItemTypeSets;
        }
        return true;
      });
  
  const finalRightBadges = rightBadges !== undefined
    ? rightBadges
    : badges.filter((badge) => {
        // Se è un React element, controlla se è ProjectBadges
        if (React.isValidElement(badge)) {
          return badge.props?.projects || badge.props?.usedInItemTypeSets;
        }
        return false;
      });

  return (
    <div className={styles.cardItem}>
      <div
        className={`${styles.cardHeader} ${
          hasContentAfterHeader ? styles.cardHeaderWithSpacing : ""
        }`}
      >
        <div className={styles.leftSection}>
          <strong className={styles.cardTitle}>{title}</strong>
          {finalLeftBadges.length > 0 && (
            <div className={styles.leftBadgesContainer}>
              {finalLeftBadges.map((badge, index) => (
                <React.Fragment key={index}>{badge}</React.Fragment>
              ))}
            </div>
          )}
        </div>
        {finalRightBadges.length > 0 && (
          <div className={styles.rightBadgesContainer}>
            {finalRightBadges.map((badge, index) => (
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

