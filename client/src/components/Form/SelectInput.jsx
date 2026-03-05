import React from "react";
import { useField } from "formik";
import FieldWrapper from "./FieldWrapper";

export default function SelectInput({ name, label, options = [], ...props }) {
  const [field] = useField(name);
  return (
    <FieldWrapper name={name} label={label}>
      <select id={name} className="input select" {...field} {...props}>
        <option value="">Select</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </FieldWrapper>
  );
}