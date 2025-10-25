import layout from "../../styles/common/Layout.module.css";

interface HomeProjectProps {
  token?: string;
}

export default function HomeProject(_props: HomeProjectProps) {
  return (
    <div className={layout.container} style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header Section */}
      <div className={layout.headerSection}>
        <h1 className={layout.title}>Benvenuto nel Progetto</h1>
        <p className={layout.paragraphMuted}>
          Gestisci le configurazioni e le impostazioni del tuo progetto.
        </p>
      </div>
    </div>
  );
}

