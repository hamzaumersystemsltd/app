import React from "react";

export function Table({ children }) {
  return (
    <div className="table-wrap">
      <table className="table">{children}</table>
    </div>
  );
}
export function THead({ children }) {
  return <thead>{children}</thead>;
}
export function TBody({ children }) {
  return <tbody>{children}</tbody>;
}
export function TRow({ children, ...props }) {
  return <tr {...props}>{children}</tr>;
}
export function TCell({ align = "center", children, style, ...props }) {
  const cls = align === "center" ? "pi-text-center" : "";
  return (
    <td className={cls} style={style} {...props}>
      {children}
    </td>
  );
}
export function TH({ children, style, ...props }) {
  return (
    <th style={style} {...props}>
      {children}
    </th>
  );
}