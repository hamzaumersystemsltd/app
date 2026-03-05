import React from "react";

export default function PaginationBar({
  page,
  totalPages,
  loading = false,
  onPrev,
  onNext,
}) {
  return (
    <div className="pagination-bar">
      <button
        className="button outline"
        onClick={onPrev}
        disabled={page <= 1 || loading}
      >
        ‹ Prev
      </button>

      <div className="pagination-info">
        Page <strong>{page}</strong> of <strong>{Math.max(1, totalPages)}</strong>
      </div>

      <button
        className="button outline"
        onClick={onNext}
        disabled={page >= totalPages || loading}
      >
        Next ›
      </button>
    </div>
  );
}