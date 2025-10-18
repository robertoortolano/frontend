import layout from "../../styles/common/Layout.module.css";

interface HomeProjectProps {
  token?: string;
}

export default function HomeProject(_props: HomeProjectProps) {
  return (
    <div className={layout.container}>
      <h1 className={layout.title}>Welcome</h1>
    </div>
  );
}

