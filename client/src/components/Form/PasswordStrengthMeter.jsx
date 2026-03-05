import React, { useMemo } from "react";
import { evaluatePasswordStrength } from "../../utils/validation";

export default function PasswordStrengthMeter({ value }) {
  const s = useMemo(() => evaluatePasswordStrength(value), [value]);
  return (
    <>
      <div className="pwd-strength">
        <div className="pwd-strength-bar" style={{ width: s.width, backgroundColor: s.color }} />
      </div>
      <div className="pwd-strength-label" style={{ color: s.color }}>{s.label}</div>
    </>
  );
}