import React from "react";

export default function EmptyRow({ colSpan = 1, text = "No records found." }) {
  return (
    <tr>
      <td colSpan={colSpan} className="row-center">
        {text}
      </td>
    </tr>
  );
}