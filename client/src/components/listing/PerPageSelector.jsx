import React from "react";

export default function PerPageSelector({ value, onChange, label = "Per page " }) {
  return (
    <div className="perpage-selector">
      <label>{label}</label>
      <select
        className="input"
        style={{ width: 70 }}
        value={value}
        onChange={(e) => onChange?.(Number(e.target.value))}
      >
        <option value={10}>10</option>
        <option value={20}>20</option>
        <option value={50}>50</option>
      </select>
    </div>
  );
}