import React from "react";
import { FiRefreshCw, FiLoader } from "react-icons/fi";
import Tippy from "@tippyjs/react";

export default function RefreshButton({ loading, onClick, title = "Refresh" }) {
  return (
    <Tippy content={title} theme="material" delay={[150, 0]} placement="bottom">
      <button
        type="button"
        onClick={onClick}
        className="icon-button"
        aria-label={title}
        disabled={loading}
      >
        {loading ? <FiLoader size={18} className="spin" /> : <FiRefreshCw size={18} />}
      </button>
    </Tippy>
  );
}