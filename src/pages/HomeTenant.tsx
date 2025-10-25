import layout from "../styles/common/Layout.module.css";

interface HomeTenantProps {
  token?: string;
}

export default function HomeTenant(_props: HomeTenantProps) {
  return (
    <div className={layout.container} style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header Section */}
      <div className={layout.headerSection}>
        <h1 className={layout.title}>Benvenuto nel Tenant</h1>
        <p className={layout.paragraphMuted}>
          Gestisci le configurazioni e le impostazioni del tuo tenant.
        </p>
      </div>
    </div>
  );
}

