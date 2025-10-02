import React from "react";
import PropTypes from "prop-types";
import layout from "../../styles/common/Layout.module.css";

export default function HomeProject({ token }) {
  return (
    <div className={layout.container}>
      <h1 className={layout.title}>Welcome</h1>
    </div>
  );
}

HomeProject.propTypes = {
  token: PropTypes.string,
};
