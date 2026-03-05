import React from "react";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";
import "tippy.js/themes/material.css";

export default function ActionButton({
  title,
  onClick,
  disabled = false,
  variant,
  children,
  ariaLabel,
}) {
  const cls = ["icon-button", variant].filter(Boolean).join(" ");
  return (
    <Tippy content={title} theme="material">
      <button
        type="button"
        className={cls}
        aria-label={ariaLabel || title}
        onClick={onClick}
        disabled={disabled}
      >
        {children}
      </button>
    </Tippy>
  );
}