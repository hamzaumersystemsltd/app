import React from "react";
import { FiCalendar } from "react-icons/fi";

export default function DateRangePicker({
  from,
  to,
  onFromChange,
  onToChange,
  minWidth = 180,
}) {
  return (
    <div style={{ display: "flex", gap: 10 }}>
      <div className="input-with-icon" style={{ minWidth }}>
        <FiCalendar size={16} style={{ position: "absolute", left: 10, top: 12, opacity: 0.7 }} />
        <input
          type="date"
          className="input"
          value={from || ""}
          onChange={(e) => onFromChange?.(e.target.value)}
        />
      </div>

      <div className="input-with-icon" style={{ minWidth }}>
        <FiCalendar size={16} style={{ position: "absolute", left: 10, top: 12, opacity: 0.7 }} />
        <input
          type="date"
          className="input"
          value={to || ""}
          onChange={(e) => onToChange?.(e.target.value)}
        />
      </div>
    </div>
  );
}