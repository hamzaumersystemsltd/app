import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./ViewInventory.css";

const API_BASE = "http://localhost:5000";

const formatMoney = (n) =>
  typeof n === "number"
    ? new Intl.NumberFormat("en-PK", {
        style: "currency",
        currency: "PKR",
        maximumFractionDigits: 2,
      }).format(n)
    : n;

// Tiny inline placeholder when no image is available
const PLACEHOLDER_DATA_URL =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='320' height='240'>
      <rect width='100%' height='100%' fill='#f7f7f7'/>
      <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#bdbdbd' font-size='16' font-family='sans-serif'>No Image</text>
    </svg>`
  );

export default function ViewInventory() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const res = await axios.get(`${API_BASE}/api/inventory/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!mounted) return;
        setItem(res.data);
      } catch (err) {
        if (!mounted) return;
        const msg =
          err?.response?.data?.message ||
          (err?.response?.status === 401
            ? "Not authorized. Please log in."
            : "Failed to load item");
        setErrMsg(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const createdAt = useMemo(
    () => (item?.createdAt ? new Date(item.createdAt).toLocaleString() : ""),
    [item]
  );
  const updatedAt = useMemo(
    () => (item?.updatedAt ? new Date(item.updatedAt).toLocaleString() : ""),
    [item]
  );

  if (loading) {
    return (
      // <div className="viewinventory-page">
      <div className="viewinventory-card">
        <h3 className="viewinventory-title">Loading item details...</h3>
      </div>
      // </div>
    );
  }

  if (errMsg) {
    return (
      // <div className="viewinventory-page">
      <div className="viewinventory-card">
        <h3 className="viewinventory-title">Inventory Details</h3>
        <p className="viewinventory-subtitle">Something went wrong</p>

        <div
          className="view-value"
          style={{
            borderColor: "#fecaca",
            background: "#fef2f2",
            color: "#991b1b",
          }}
        >
          {errMsg}
        </div>

        <div className="view-actions" style={{ marginTop: 16 }}>
          <button
            className="button-secondary"
            onClick={() => navigate("/inventory/inventory-list")}
          >
            Back to List
          </button>
        </div>
      </div>
      // </div>
    );
  }

  if (!item) {
    return (
      // <div className="viewinventory-page">
      <div className="viewinventory-card">
        <h3 className="viewinventory-title">Item not found</h3>
        <div className="view-actions" style={{ marginTop: 16 }}>
          <button
            className="button-secondary"
            onClick={() => navigate("/inventory/inventory-list")}
          >
            Back to List
          </button>
        </div>
      </div>
      // </div>
    );
  }

  // Determine safe image src
  const imgSrc = item?.image || PLACEHOLDER_DATA_URL;
  const imgAlt = item?.name ? `${item.name} image` : "item image";

  return (
    // <div className="viewinventory-page">
    <div className="viewinventory-card">
      {/* Header */}
      <h3 className="viewinventory-title">Inventory Details</h3>
      <p className="viewinventory-subtitle">Here are the full item details</p>

      {/* Actions */}
      <div className="view-actions">
        <button
          className="button-secondary"
          onClick={() => navigate("/inventory/inventory-list")}
        >
          Back
        </button>

        <button
          className="button-view"
          onClick={() => navigate(`/inventory/edit/${item._id}`)}
        >
          Edit Item
        </button>
      </div>

      {/* IMAGE PREVIEW */}
      <div className="view-image-wrap" style={{ marginTop: 12 }}>
        <a
          href={item?.image || "#"}
          target="_blank"
          rel="noreferrer"
          aria-label="Open image in new tab"
          onClick={(e) => {
            if (!item?.image) e.preventDefault();
          }}
        >
          <img
            src={imgSrc}
            alt={imgAlt}
            className="view-image"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = PLACEHOLDER_DATA_URL;
            }}
            style={{
              width: "100%",
              maxWidth: 320,
              height: 320,
              objectFit: "cover",
              borderRadius: 10,
              border: "1px solid #e6e9ef",
              background: "#fff",
              display: "block",
            }}
          />
        </a>
        {item?.image ? (
          <div className="view-image-hint" style={{ marginTop: 6, fontSize: 12, color: "#6b7280" }}>
            Click the image to open the full-size version in a new tab.
          </div>
        ) : (
          <div className="view-image-hint" style={{ marginTop: 6, fontSize: 12, color: "#9ca3af" }}>
            No image uploaded for this item.
          </div>
        )}
      </div>

      {/* Top section: Name + Item Code + Category */}
      <div className="view-grid two" style={{ marginTop: 12 }}>
        <div>
          <div className="view-label">Name</div>
          <div className="view-value">{item.name}</div>
        </div>

        <div>
          <div className="view-label">Item Code</div>
          <div className="view-value">{item.itemCode}</div>
        </div>
      </div>

      <div className="view-grid" style={{ marginTop: 8 }}>
        <div>
          <div className="view-label">Category</div>
          <div className="view-value">{item.category}</div>
        </div>
        <div>
          <div className="view-label">Stock Quantity</div>
          <div className="view-value">{item.stockQuantity}</div>
        </div>
        <div>
          <div className="view-label">Wholesale (WS)</div>
          <div className="view-value">{formatMoney(item.wsPrice)}</div>
        </div>
      </div>

      <div className="view-grid" style={{ marginTop: 8 }}>
        <div>
          <div className="view-label">Retail (RT)</div>
          <div className="view-value">{formatMoney(item.rtPrice)}</div>
        </div>
        <div>
          <div className="view-label">Cost</div>
          <div className="view-value">{formatMoney(item.costPrice)}</div>
        </div>
        <div>
          <div className="view-label">Created/Updated By</div>
          <div className="view-value">
            {item.updatedBy || item.createdBy || "—"}
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="view-description">
        <div className="view-label">Description</div>
        <div className="view-value">{item.description || "No description"}</div>
      </div>

      {/* Footer Meta */}
      <div className="view-footer">
        <div>
          <strong>Created:</strong> {createdAt || "—"}
        </div>
        <div>
          <strong>Updated:</strong> {updatedAt || "—"}
        </div>
      </div>
    </div>
    // </div>
  );
}