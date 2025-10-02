import React from "react";
import PropTypes from "prop-types";
import layout from "../styles/common/Layout.module.css";

export default function HomeTenant({ token }) {
  return (
    <div className={layout.container}>
      <h1 className={layout.title}>Welcome</h1>
    </div>
  );
}

HomeTenant.propTypes = {
  token: PropTypes.string.isRequired, // o PropTypes.string se opzionale
};
