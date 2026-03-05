import React, { useState } from "react";
import { useField } from "formik";
import FieldWrapper from "./FieldWrapper";
import PasswordStrengthMeter from "./PasswordStrengthMeter";

export default function PasswordInput({
  name,
  label,
  showStrength = false,
  onStrengthChange,
  ...props
}) {
  const [field, , helpers] = useField(name);
  const [show, setShow] = useState(false);

  return (
    <FieldWrapper name={name} label={label}>
      <div className="password-input-wrapper">
        <input
          id={name}
          className="input"
          type={show ? "text" : "password"}
          {...field}
          {...props}
          onChange={(e) => {
            field.onChange(e);
            onStrengthChange?.(e.target.value);
          }}
        />
      </div>
      {showStrength && <PasswordStrengthMeter value={field.value} />}
    </FieldWrapper>
  );
}