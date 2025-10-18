import layout from "../styles/common/Layout.module.css";

interface HomeTenantProps {
  token?: string;
}

export default function HomeTenant(_props: HomeTenantProps) {
  return (
    <div className={layout.container}>
      <h1 className={layout.title}>Welcome</h1>
    </div>
  );
}

