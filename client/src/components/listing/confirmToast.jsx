import { toast } from "react-toastify";

export function confirmToast({
  title,
  body = "",
  confirmText = "Delete",
  cancelText = "Cancel",
  onConfirm,
  variant = "danger",
}) {
  toast.info(
    ({ closeToast }) => (
      <div>
        <strong>{title}</strong>
        {body ? <div style={{ marginTop: 6 }}>{body}</div> : null}

        <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
          <button
            className={`btn ${variant}`}
            onClick={async () => {
              try {
                await onConfirm?.();
              } finally {
                closeToast();
              }
            }}
          >
            {confirmText}
          </button>
          <button className="btn secondary" onClick={closeToast}>
            {cancelText}
          </button>
        </div>
      </div>
    ),
    { autoClose: false, closeOnClick: false }
  );
}