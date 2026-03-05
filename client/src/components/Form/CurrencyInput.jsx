import React from "react";
import { useField } from "formik";
import FieldWrapper from "./FieldWrapper";
import { currencyRegex } from "../../utils/validation";

export default function CurrencyInput({ name, label, ...props }) {
  const [field, , helpers] = useField(name);
  return (
    <FieldWrapper name={name} label={label}>
      <input
        id={name}
        className="input"
        inputMode="decimal"
        placeholder="0.00"
        {...field}
        {...props}
        onChange={(e) => {
          const v = e.target.value.replace(/[^\d.]/g, "");
          helpers.setValue(v);
        }}
        onBlur={(e) => {
          field.onBlur(e);
          const v = (e.target.value || "").trim();
          if (!v) return;
          if (currencyRegex.test(v)) {
            const n = Number(v);
            helpers.setValue(n.toFixed(2));
          }
        }}
      />
    </FieldWrapper>
  );
}