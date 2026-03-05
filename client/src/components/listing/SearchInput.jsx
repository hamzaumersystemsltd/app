import React from "react";
import { FiSearch } from "react-icons/fi";

export default function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  minWidth = 260,
  ariaLabel = "Search",
}) {
  return (
    <div className="input-with-icon" style={{ minWidth }}>
      <FiSearch size={16} style={{ position: "absolute", left: 10, top: 12, opacity: 0.7 }} />
      <input
        className="input"
        placeholder={placeholder}
        value={value}
        aria-label={ariaLabel}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </div>
  );
}