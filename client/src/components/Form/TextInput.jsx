import React from "react";
import { useField } from "formik";
import FieldWrapper from "./FieldWrapper";

export default function TextInput({ name, label, type = "text", ...props }) {
  const [field] = useField(name);
  return (
    <FieldWrapper name={name} label={label}>
      <input id={name} className="input" type={type} {...field} {...props} />
    </FieldWrapper>
  );
}