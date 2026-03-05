import React from "react";
import { ErrorMessage } from "formik";

export default function FieldWrapper({ name, label, children, hint, className = "" }) {
  return (
    <div className={`form-group ${className}`}>
      {label && <label className="label" htmlFor={name}>{label}</label>}
      {children}
      <ErrorMessage name={name} component="div" className="message" />
      {hint && <div className="hint">{hint}</div>}
    </div>
  );
}