import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./ViewVendor.css";

const API_BASE = "http://localhost:5000";

export default function ViewVendor() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

        const res = await axios.get(`${API_BASE}/api/vendors/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!mounted) return;
        setVendor(res.data);
      } catch (err) {
        if (!mounted) return;

        const msg =
          err?.response?.data?.message ||
          (err?.response?.status === 401
            ? "Not authorized. Please log in."
            : "Failed to load vendor details");

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
    () => (vendor?.createdAt ? new Date(vendor.createdAt).toLocaleString() : ""),
    [vendor]
  );

  const updatedAt = useMemo(
    () => (vendor?.updatedAt ? new Date(vendor.updatedAt).toLocaleString() : ""),
    [vendor]
  );

  /* ---------------------------- LOADING STATE ---------------------------- */
  if (loading) {
    return (
      <div className="viewvendor-page">
        <div className="viewvendor-card">
          <h3 className="viewvendor-title">Loading vendor details...</h3>
        </div>
      </div>
    );
  }

  /* ----------------------------- ERROR STATE ----------------------------- */
  if (errMsg) {
    return (
      <div className="viewvendor-page">
        <div className="viewvendor-card">
          <h3 className="viewvendor-title">Vendor Details</h3>
          <p className="viewvendor-subtitle">Something went wrong</p>

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
              onClick={() => navigate("/vendor/vendor-list")}
            >
              Back to List
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------------------- NOT FOUND STATE --------------------------- */
  if (!vendor) {
    return (
      <div className="viewvendor-page">
        <div className="viewvendor-card">
          <h3 className="viewvendor-title">Vendor not found</h3>
          <div className="view-actions" style={{ marginTop: 16 }}>
            <button
              className="button-secondary"
              onClick={() => navigate("/vendor/vendor-list")}
            >
              Back to List
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------ MAIN VIEW ------------------------------- */
  return (
    <div className="viewvendor-page">
      <div className="viewvendor-card">
        {/* Header */}
        <h3 className="viewvendor-title">Vendor Details</h3>
        <p className="viewvendor-subtitle">Here are the full vendor details</p>

        {/* Actions */}
        <div className="view-actions">
          <button
            className="button-secondary"
            onClick={() => navigate("/vendor/vendor-list")}
          >
            Back
          </button>

          <button
            className="button-view"
            onClick={() => navigate(`/vendor/edit/${vendor._id}`)}
          >
            Edit Vendor
          </button>
        </div>

        {/* A) Vendor ID + Name */}
        <div className="view-grid two" style={{ marginTop: 8 }}>
          <div>
            <div className="view-label">Vendor ID</div>
            <div className="view-value">{vendor.vendorId}</div>
          </div>

          <div>
            <div className="view-label">Name</div>
            <div className="view-value">{vendor.name}</div>
          </div>
        </div>

        {/* B) Company + Contact Person + Status */}
        <div className="view-grid" style={{ marginTop: 8 }}>
          <div>
            <div className="view-label">Company Name</div>
            <div className="view-value">{vendor.companyName || "—"}</div>
          </div>

          <div>
            <div className="view-label">Contact Person</div>
            <div className="view-value">{vendor.contactPerson || "—"}</div>
          </div>

          <div>
            <div className="view-label">Status</div>
            <div className="view-value">{vendor.status}</div>
          </div>
        </div>

        {/* C) Contact Info */}
        <div className="view-grid" style={{ marginTop: 8 }}>
          <div>
            <div className="view-label">Email</div>
            <div className="view-value">{vendor.email || "—"}</div>
          </div>

          <div>
            <div className="view-label">Phone</div>
            <div className="view-value">{vendor.phone || "—"}</div>
          </div>

          <div>
            <div className="view-label">City</div>
            <div className="view-value">{vendor.city || "—"}</div>
          </div>
        </div>

        {/* D) Address + Country */}
        <div className="view-grid two" style={{ marginTop: 8 }}>
          <div>
            <div className="view-label">Address</div>
            <div className="view-value">
              {vendor.address || "No address provided"}
            </div>
          </div>

          <div>
            <div className="view-label">Country</div>
            <div className="view-value">{vendor.country || "—"}</div>
          </div>
        </div>

        {/* E) Footer meta */}
        <div className="view-footer">
          <div>
            <strong>Created:</strong> {createdAt || "—"}
          </div>
          <div>
            <strong>Updated:</strong> {updatedAt || "—"}
          </div>
        </div>
      </div>
    </div>
  );
}