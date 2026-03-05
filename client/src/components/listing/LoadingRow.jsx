import React from "react";

export default function LoadingRow({ colSpan = 1, text = "Loading..." }) {
  return (
    <tr>
      <td colSpan={colSpan} className="row-center">
        {text}
      </td>
    </tr>
  );
}